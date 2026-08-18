"""DMC AAA zone/region id → Chile CUT mapping + spatial comuna resolve.

Region prefixes cover fringe ids for fan-out. Comuna membership uses polygon
intersection between ``comunas.geojson`` and DMC geometries (no shapely).
Remote overrides: ``ip`` / ``jf``.
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class DmcZoneCutSeed:
    """Explicit CUT mapping for a DMC zone id (legacy samples / tests)."""

    zone_id: str
    region_code: int
    comuna_codes: tuple[int, ...]
    note: str = ""


# DMC region / sub-region prefix → official CUT region code.
DMC_PREFIX_TO_REGION_CUT: dict[str, int] = {
    "01a": 15,  # Arica y Parinacota
    "01b": 1,  # Tarapacá
    "02": 2,  # Antofagasta
    "03": 3,  # Atacama
    "04": 4,  # Coquimbo
    "05": 5,  # Valparaíso
    "05m": 13,  # Metropolitana
    "06": 6,  # O'Higgins
    "07": 7,  # Maule
    "08a": 16,  # Ñuble
    "08b": 8,  # Biobío
    "09": 9,  # La Araucanía
    "10a": 14,  # Los Ríos
    "10b": 10,  # Los Lagos
    "11": 11,  # Aysén
    "12": 12,  # Magallanes
    "ip": 5,  # Isla de Pascua (CUT under Valparaíso)
    "jf": 5,  # Juan Fernández
}

# Remote / non-continental DMC ids → exact CUT comunas (never whole region).
DMC_ID_COMUNA_OVERRIDES: dict[str, tuple[int, ...]] = {
    "ip": (5201,),  # Isla de Pascua
    "jf": (5104,),  # Juan Fernández
}

_COMUNAS_GEOJSON = Path(__file__).resolve().parent.parent / "data" / "comunas.geojson"

_BBox = tuple[float, float, float, float]
# (cod_comuna, codregion, geometry, bbox)
_comuna_geometries: list[tuple[int, int, dict[str, Any], _BBox]] | None = None
_comuna_region_by_code: dict[int, int] | None = None


def region_cut_for_dmc_id(dmc_id: str) -> int | None:
    """Best-effort CUT region from a DMC zone or region id."""
    key = dmc_id.strip()
    if key in DMC_PREFIX_TO_REGION_CUT:
        return DMC_PREFIX_TO_REGION_CUT[key]
    for prefix in sorted(DMC_PREFIX_TO_REGION_CUT, key=len, reverse=True):
        if key == prefix or key.startswith(prefix + "_"):
            return DMC_PREFIX_TO_REGION_CUT[prefix]
    return None


# Spike samples (tests / fallback when geometry catalogs unavailable).
DMC_ZONE_CUT_SEEDS: dict[str, DmcZoneCutSeed] = {
    "08a_Litoral": DmcZoneCutSeed(
        zone_id="08a_Litoral",
        region_code=16,
        comuna_codes=(16202, 16207, 16203, 16205),
        note="Ñuble litoral — sample CUT, not full fringe union",
    ),
    "03_Litoral": DmcZoneCutSeed(
        zone_id="03_Litoral",
        region_code=3,
        comuna_codes=(3102, 3201, 3302, 3304),
        note="Atacama litoral — sample CUT",
    ),
    "05m_Cordillera": DmcZoneCutSeed(
        zone_id="05m_Cordillera",
        region_code=13,
        comuna_codes=(13132, 13115, 13202),
        note="RM cordillera — sample CUT",
    ),
}


def cut_comunas_for_zone_ids(zone_ids: list[str]) -> list[int]:
    """Union of seeded CUT comunas for known zone ids (partial gazetteer)."""
    seen: set[int] = set()
    ordered: list[int] = []
    for zid in zone_ids:
        seed = DMC_ZONE_CUT_SEEDS.get(zid)
        if not seed:
            continue
        for cod in seed.comuna_codes:
            if cod not in seen:
                seen.add(cod)
                ordered.append(cod)
    return ordered


def cut_comunas_for_zone_ids_in_region(
    zone_ids: list[str], region_code: int
) -> list[int]:
    """Seeded CUT comunas for zone ids that belong to ``region_code``."""
    seen: set[int] = set()
    ordered: list[int] = []
    for zid in zone_ids:
        seed = DMC_ZONE_CUT_SEEDS.get(zid)
        if not seed or seed.region_code != region_code:
            continue
        for cod in seed.comuna_codes:
            if cod not in seen:
                seen.add(cod)
                ordered.append(cod)
    return ordered


def region_cuts_for_zone_ids(zone_ids: list[str]) -> list[int]:
    """Unique CUT region codes inferred from DMC ids."""
    seen: set[int] = set()
    ordered: list[int] = []
    for zid in zone_ids:
        seed = DMC_ZONE_CUT_SEEDS.get(zid)
        code = seed.region_code if seed else region_cut_for_dmc_id(zid)
        if code is None or code in seen:
            continue
        seen.add(code)
        ordered.append(code)
    return ordered


def _polygons_for_geometry(geom: dict[str, Any]) -> list[list]:
    coords = geom.get("coordinates")
    if geom.get("type") == "Polygon" and coords:
        return [coords]
    if geom.get("type") == "MultiPolygon" and coords:
        return list(coords)
    return []


def _geometry_bbox(geom: dict[str, Any]) -> _BBox | None:
    polygons = _polygons_for_geometry(geom)
    points = [
        point
        for polygon in polygons
        for ring in polygon
        for point in ring
        if isinstance(point, (list, tuple)) and len(point) >= 2
    ]
    if points:
        return (
            min(float(point[0]) for point in points),
            min(float(point[1]) for point in points),
            max(float(point[0]) for point in points),
            max(float(point[1]) for point in points),
        )

    coords = geom.get("coordinates")
    if (
        geom.get("type") == "Point"
        and isinstance(coords, (list, tuple))
        and len(coords) >= 2
    ):
        lng = float(coords[0])
        lat = float(coords[1])
        radius_m = float(geom.get("radius_m") or 25_000)
        dlat = radius_m / 111_320.0
        dlng = radius_m / (111_320.0 * max(0.2, math.cos(math.radians(lat))))
        return lng - dlng, lat - dlat, lng + dlng, lat + dlat
    return None


def _load_comuna_geometries() -> list[tuple[int, int, dict[str, Any], _BBox]]:
    global _comuna_geometries, _comuna_region_by_code
    if _comuna_geometries is not None:
        return _comuna_geometries

    raw = json.loads(_COMUNAS_GEOJSON.read_text(encoding="utf-8"))
    out: list[tuple[int, int, dict[str, Any], _BBox]] = []
    region_by_code: dict[int, int] = {}
    for feature in raw.get("features") or []:
        properties = feature.get("properties") or {}
        comuna_code = properties.get("cod_comuna")
        region_code = properties.get("codregion")
        geometry = feature.get("geometry") or {}
        if not isinstance(comuna_code, int) or not isinstance(region_code, int):
            continue
        bbox = _geometry_bbox(geometry)
        if bbox is None:
            continue
        out.append((comuna_code, region_code, geometry, bbox))
        region_by_code[comuna_code] = region_code

    _comuna_geometries = out
    _comuna_region_by_code = region_by_code
    return out


def comuna_codes_by_region(comuna_codes: list[int]) -> dict[int, list[int]]:
    """Group CUT comuna codes by their official CUT region."""
    _load_comuna_geometries()
    region_by_code = _comuna_region_by_code or {}
    grouped: dict[int, list[int]] = {}
    seen: set[int] = set()
    for comuna_code in comuna_codes:
        if comuna_code in seen:
            continue
        seen.add(comuna_code)
        region_code = region_by_code.get(comuna_code)
        if region_code is not None:
            grouped.setdefault(region_code, []).append(comuna_code)
    return grouped


def _point_in_ring(lng: float, lat: float, ring: list[list[float]]) -> bool:
    """Ray-casting point-in-polygon (lng/lat as x/y)."""
    inside = False
    n = len(ring)
    if n < 3:
        return False
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > lat) != (yj > lat)) and (
            lng < (xj - xi) * (lat - yi) / (yj - yi + 0.0) + xi
        ):
            inside = not inside
        j = i
    return inside


def _point_in_polygon_coords(lng: float, lat: float, coords: list) -> bool:
    if not coords:
        return False
    outer = coords[0]
    if not _point_in_ring(lng, lat, outer):
        return False
    for hole in coords[1:]:
        if _point_in_ring(lng, lat, hole):
            return False
    return True


def _haversine_m(lng1: float, lat1: float, lng2: float, lat2: float) -> float:
    r = 6_371_000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    )
    return 2 * r * math.asin(min(1.0, math.sqrt(a)))


def point_in_dmc_geometry(lng: float, lat: float, geom: dict[str, Any]) -> bool:
    """True if (lng, lat) falls inside a DMC GeoJSON-like geometry."""
    gtype = geom.get("type")
    coords = geom.get("coordinates")
    if gtype == "Polygon" and coords:
        return _point_in_polygon_coords(lng, lat, coords)
    if gtype == "MultiPolygon" and coords:
        return any(_point_in_polygon_coords(lng, lat, poly) for poly in coords)
    if gtype == "Point" and isinstance(coords, (list, tuple)) and len(coords) >= 2:
        radius = float(geom.get("radius_m") or 25_000)
        return (
            _haversine_m(lng, lat, float(coords[0]), float(coords[1])) <= radius
        )
    return False


def _bboxes_intersect(first: _BBox, second: _BBox) -> bool:
    return (
        first[0] <= second[2]
        and second[0] <= first[2]
        and first[1] <= second[3]
        and second[1] <= first[3]
    )


def _orientation(first: list[float], second: list[float], third: list[float]) -> float:
    return (second[0] - first[0]) * (third[1] - first[1]) - (
        second[1] - first[1]
    ) * (third[0] - first[0])


def _point_on_segment(
    first: list[float],
    second: list[float],
    point: list[float],
    *,
    epsilon: float = 1e-12,
) -> bool:
    return (
        abs(_orientation(first, second, point)) <= epsilon
        and min(first[0], second[0]) - epsilon
        <= point[0]
        <= max(first[0], second[0]) + epsilon
        and min(first[1], second[1]) - epsilon
        <= point[1]
        <= max(first[1], second[1]) + epsilon
    )


def _segments_intersect(
    first_start: list[float],
    first_end: list[float],
    second_start: list[float],
    second_end: list[float],
) -> bool:
    if (
        max(first_start[0], first_end[0]) < min(second_start[0], second_end[0])
        or max(second_start[0], second_end[0]) < min(first_start[0], first_end[0])
        or max(first_start[1], first_end[1]) < min(second_start[1], second_end[1])
        or max(second_start[1], second_end[1]) < min(first_start[1], first_end[1])
    ):
        return False

    first_orientation_start = _orientation(
        first_start, first_end, second_start
    )
    first_orientation_end = _orientation(first_start, first_end, second_end)
    second_orientation_start = _orientation(
        second_start, second_end, first_start
    )
    second_orientation_end = _orientation(second_start, second_end, first_end)
    if (
        (first_orientation_start > 0 > first_orientation_end)
        or (first_orientation_start < 0 < first_orientation_end)
    ) and (
        (second_orientation_start > 0 > second_orientation_end)
        or (second_orientation_start < 0 < second_orientation_end)
    ):
        return True
    return (
        _point_on_segment(first_start, first_end, second_start)
        or _point_on_segment(first_start, first_end, second_end)
        or _point_on_segment(second_start, second_end, first_start)
        or _point_on_segment(second_start, second_end, first_end)
    )


def _ring_segments(ring: list[list[float]]) -> list[tuple[list[float], list[float]]]:
    if len(ring) < 2:
        return []
    segments = [
        (ring[index], ring[index + 1]) for index in range(len(ring) - 1)
    ]
    if ring[0] != ring[-1]:
        segments.append((ring[-1], ring[0]))
    return segments


def _polygon_coords_intersect(first: list, second: list) -> bool:
    if not first or not second:
        return False
    first_point = first[0][0]
    if _point_in_polygon_coords(
        float(first_point[0]), float(first_point[1]), second
    ):
        return True
    second_point = second[0][0]
    if _point_in_polygon_coords(
        float(second_point[0]), float(second_point[1]), first
    ):
        return True

    first_segments = [
        segment for ring in first for segment in _ring_segments(ring)
    ]
    second_segments = [
        segment for ring in second for segment in _ring_segments(ring)
    ]
    return any(
        _segments_intersect(first_start, first_end, second_start, second_end)
        for first_start, first_end in first_segments
        for second_start, second_end in second_segments
    )


def _distance_to_segment_m(
    lng: float,
    lat: float,
    start: list[float],
    end: list[float],
) -> float:
    metres_per_degree = 111_320.0
    lng_scale = metres_per_degree * max(0.2, math.cos(math.radians(lat)))
    start_x = (float(start[0]) - lng) * lng_scale
    start_y = (float(start[1]) - lat) * metres_per_degree
    end_x = (float(end[0]) - lng) * lng_scale
    end_y = (float(end[1]) - lat) * metres_per_degree
    delta_x = end_x - start_x
    delta_y = end_y - start_y
    squared_length = delta_x * delta_x + delta_y * delta_y
    if squared_length == 0:
        return math.hypot(start_x, start_y)
    projection = max(
        0.0,
        min(
            1.0,
            -(start_x * delta_x + start_y * delta_y) / squared_length,
        ),
    )
    return math.hypot(
        start_x + projection * delta_x,
        start_y + projection * delta_y,
    )


def _polygon_geometry_intersects_circle(
    polygon_geometry: dict[str, Any],
    circle_geometry: dict[str, Any],
) -> bool:
    coords = circle_geometry.get("coordinates")
    if not isinstance(coords, (list, tuple)) or len(coords) < 2:
        return False
    lng = float(coords[0])
    lat = float(coords[1])
    radius_m = float(circle_geometry.get("radius_m") or 25_000)
    if point_in_dmc_geometry(lng, lat, polygon_geometry):
        return True
    return any(
        _distance_to_segment_m(lng, lat, start, end) <= radius_m
        for polygon in _polygons_for_geometry(polygon_geometry)
        for ring in polygon
        for start, end in _ring_segments(ring)
    )


def _geometries_intersect(
    first: dict[str, Any],
    second: dict[str, Any],
) -> bool:
    first_bbox = _geometry_bbox(first)
    second_bbox = _geometry_bbox(second)
    if (
        first_bbox is None
        or second_bbox is None
        or not _bboxes_intersect(first_bbox, second_bbox)
    ):
        return False
    if second.get("type") == "Point":
        return _polygon_geometry_intersects_circle(first, second)
    if first.get("type") == "Point":
        return _polygon_geometry_intersects_circle(second, first)

    for first_polygon in _polygons_for_geometry(first):
        first_polygon_bbox = _geometry_bbox(
            {"type": "Polygon", "coordinates": first_polygon}
        )
        if first_polygon_bbox is None:
            continue
        for second_polygon in _polygons_for_geometry(second):
            second_polygon_bbox = _geometry_bbox(
                {"type": "Polygon", "coordinates": second_polygon}
            )
            if (
                second_polygon_bbox is not None
                and _bboxes_intersect(first_polygon_bbox, second_polygon_bbox)
                and _polygon_coords_intersect(first_polygon, second_polygon)
            ):
                return True
    return False


def comunas_for_dmc_geometry(geom: dict[str, Any]) -> list[int]:
    """CUT comunas whose polygon intersects ``geom``."""
    geometry_bbox = _geometry_bbox(geom)
    if geometry_bbox is None:
        return []
    hits: list[int] = []
    for comuna_code, _region_code, comuna_geometry, comuna_bbox in (
        _load_comuna_geometries()
    ):
        if _bboxes_intersect(comuna_bbox, geometry_bbox) and _geometries_intersect(
            comuna_geometry, geom
        ):
            hits.append(comuna_code)
    return hits


def resolve_comuna_codes(
    zone_ids: list[str],
    zone_geoms: dict[str, Any] | None = None,
    region_geoms: dict[str, Any] | None = None,
) -> list[int]:
    """Resolve DMC zone/region ids → CUT comunas (overrides + spatial + seeds)."""
    zone_geoms = zone_geoms or {}
    region_geoms = region_geoms or {}
    seen: set[int] = set()
    ordered: list[int] = []

    def _add(codes: list[int] | tuple[int, ...]) -> None:
        for cod in codes:
            if cod not in seen:
                seen.add(cod)
                ordered.append(cod)

    for zid in zone_ids:
        override = DMC_ID_COMUNA_OVERRIDES.get(zid)
        if override:
            _add(override)
            continue
        geom = zone_geoms.get(zid) or region_geoms.get(zid)
        if geom:
            _add(comunas_for_dmc_geometry(geom))
            continue
        seed = DMC_ZONE_CUT_SEEDS.get(zid)
        if seed:
            _add(seed.comuna_codes)

    return ordered


def resolve_comuna_codes_in_region(
    zone_ids: list[str],
    region_code: int,
    zone_geoms: dict[str, Any] | None = None,
    region_geoms: dict[str, Any] | None = None,
) -> list[int]:
    """Comunas for ``zone_ids`` restricted to ``region_code``."""
    comuna_codes = resolve_comuna_codes(zone_ids, zone_geoms, region_geoms)
    return comuna_codes_by_region(comuna_codes).get(region_code, [])
