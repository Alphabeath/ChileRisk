"""Parse MeteoChile AAA coordinate JS → rings / GeoJSON-ready polygons.

The official map (`aaa_mapa.php`) loads globals like:

    coordenadas_08a_Litoral = [ { lat: …, lng: … }, … ];
    myCoordinates_08a = [ { lat: …, lng: … }, … ];
    myCoordinates_ip = { lat: …, lng: … };
    var myCoordinates_ip_radius = 253275;

Leaflet uses lat/lng; GeoJSON uses [lng, lat].
"""

from __future__ import annotations

import re
from typing import Any

# Lat/lng object literals inside DMC JS arrays.
_POINT_RE = re.compile(
    r"\{\s*lat\s*:\s*(-?\d+(?:\.\d+)?)\s*,\s*lng\s*:\s*(-?\d+(?:\.\d+)?)\s*\}",
    re.IGNORECASE,
)

_ARRAY_ASSIGN_RE = re.compile(
    r"(?:var\s+)?(?P<name>coordenadas_\w+|myCoordinates_\w+)\s*=\s*\[",
)

_POINT_ASSIGN_RE = re.compile(
    r"(?:var\s+)?(?P<name>myCoordinates_\w+)\s*=\s*"
    r"\{\s*lat\s*:\s*(?P<lat>-?\d+(?:\.\d+)?)\s*,\s*"
    r"lng\s*:\s*(?P<lng>-?\d+(?:\.\d+)?)\s*\}\s*;",
)

_RADIUS_ASSIGN_RE = re.compile(
    r"(?:var\s+)?(?P<name>myCoordinates_\w+_radius)\s*=\s*(?P<val>-?\d+(?:\.\d+)?)\s*;",
)

_MULTIPART_ZONE_RE = re.compile(
    r"^(?P<base>.+_[A-Za-z][A-Za-z0-9_]*?)(?P<part>\d+)$"
)


def _close_ring(ring: list[list[float]]) -> list[list[float]]:
    if not ring:
        return ring
    if ring[0] != ring[-1]:
        return [*ring, ring[0]]
    return ring


def parse_aaa_coordinate_js(source: str) -> dict[str, Any]:
    """Parse DMC coordinate JS into a dict of features.

    Numbered arrays such as ``coordenadas_02_Pampa1`` and
    ``coordenadas_02_Pampa2`` are one logical DMC zone and become a
    ``MultiPolygon`` under the feed id ``02_Pampa``.

    Returns keys without the `coordenadas_` / `myCoordinates_` prefix for
    zone/region ids (e.g. `08a_Litoral`, `08a`, `ip`). Values:

    - polygon: ``{"type": "Polygon", "coordinates": [[[lng, lat], …]]}``
    - multipolygon: ``{"type": "MultiPolygon", "coordinates": […]}``
    - point+radius: ``{"type": "Point", "coordinates": [lng, lat], "radius_m": N}``
    """
    out: dict[str, Any] = {}
    polygon_parts: dict[str, list[tuple[int | None, list[list[list[float]]]]]] = {}

    for m in _ARRAY_ASSIGN_RE.finditer(source):
        name = m.group("name")
        start = m.end() - 1
        depth = 0
        end = None
        for i in range(start, len(source)):
            ch = source[i]
            if ch == "[":
                depth += 1
            elif ch == "]":
                depth -= 1
                if depth == 0:
                    end = i
                    break
        if end is None:
            continue
        body = source[start : end + 1]
        ring_latlng = [
            [float(lng), float(lat)]
            for lat, lng in _POINT_RE.findall(body)
        ]
        if len(ring_latlng) < 3:
            continue
        raw_key = name.removeprefix("coordenadas_").removeprefix(
            "myCoordinates_"
        )
        multipart = _MULTIPART_ZONE_RE.fullmatch(raw_key)
        key = multipart.group("base") if multipart else raw_key
        part = int(multipart.group("part")) if multipart else None
        polygon_parts.setdefault(key, []).append((part, [_close_ring(ring_latlng)]))

    for key, parts in polygon_parts.items():
        parts.sort(key=lambda part: part[0] if part[0] is not None else -1)
        polygons = [coordinates for _part, coordinates in parts]
        if len(polygons) == 1:
            out[key] = {"type": "Polygon", "coordinates": polygons[0]}
        else:
            out[key] = {"type": "MultiPolygon", "coordinates": polygons}

    radii: dict[str, float] = {}
    for m in _RADIUS_ASSIGN_RE.finditer(source):
        name = m.group("name")
        key = name.removeprefix("myCoordinates_").removesuffix("_radius")
        radii[key] = float(m.group("val"))

    for m in _POINT_ASSIGN_RE.finditer(source):
        name = m.group("name")
        key = name.removeprefix("myCoordinates_")
        lng = float(m.group("lng"))
        lat = float(m.group("lat"))
        feat: dict[str, Any] = {
            "type": "Point",
            "coordinates": [lng, lat],
        }
        if key in radii:
            feat["radius_m"] = radii[key]
        out[key] = feat

    return out


def zone_ids_from_data_zona(data_zona_afecta: str) -> list[str]:
    """Split CSV `dataZonaAfecta` into zone/region ids."""
    if not data_zona_afecta or not data_zona_afecta.strip():
        return []
    # area polygons use pipe-separated lat,lng — not CSV ids
    if "|" in data_zona_afecta and "," in data_zona_afecta.split("|", 1)[0]:
        return []
    return [p.strip() for p in data_zona_afecta.split(",") if p.strip()]


def parse_inline_area_polygon(data_zona_afecta: str) -> dict[str, Any] | None:
    """Parse `tipoZonaAfecta=area` pipe-separated `lat,lng|…` into a Polygon."""
    parts = [p.strip() for p in data_zona_afecta.split("|") if p.strip()]
    ring: list[list[float]] = []
    for part in parts:
        bits = part.split(",")
        if len(bits) != 2:
            return None
        try:
            lat = float(bits[0].strip())
            lng = float(bits[1].strip())
        except ValueError:
            return None
        ring.append([lng, lat])
    if len(ring) < 3:
        return None
    return {"type": "Polygon", "coordinates": [_close_ring(ring)]}


def geometries_for_item(
    *,
    tipo_zona_afecta: str,
    data_zona_afecta: str,
    zone_geoms: dict[str, Any],
    region_geoms: dict[str, Any],
) -> list[dict[str, Any]]:
    """Resolve alert geography to a list of GeoJSON geometry dicts."""
    kind = (tipo_zona_afecta or "").strip().lower()
    if kind == "area":
        poly = parse_inline_area_polygon(data_zona_afecta)
        return [poly] if poly else []

    ids = zone_ids_from_data_zona(data_zona_afecta)
    catalog = zone_geoms if kind == "zonas" else region_geoms
    out: list[dict[str, Any]] = []
    for zid in ids:
        geom = catalog.get(zid)
        if geom:
            out.append(geom)
    return out
