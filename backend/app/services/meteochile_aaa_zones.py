"""DMC AAA zone/region id → Chile CUT mapping + spatial comuna resolve.

Region prefixes cover fringe ids for fan-out. Comuna membership uses
comuna centroids from ``comunas.geojson`` + point-in-polygon against DMC
geometries (no shapely). Remote overrides: ``ip`` / ``jf``.
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

# (cod_comuna, codregion, lng, lat)
_comuna_centroids: list[tuple[int, int, float, float]] | None = None


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


def _ring_centroid(ring: list[list[float]]) -> tuple[float, float] | None:
    if len(ring) < 3:
        return None
    # Drop closing vertex if present
    pts = ring[:-1] if ring[0] == ring[-1] else ring
    if not pts:
        return None
    lng = sum(p[0] for p in pts) / len(pts)
    lat = sum(p[1] for p in pts) / len(pts)
    return lng, lat


def _geom_centroid(geom: dict[str, Any]) -> tuple[float, float] | None:
    gtype = geom.get("type")
    coords = geom.get("coordinates")
    if gtype == "Polygon" and coords:
        return _ring_centroid(coords[0])
    if gtype == "MultiPolygon" and coords:
        return _ring_centroid(coords[0][0])
    if gtype == "Point" and isinstance(coords, (list, tuple)) and len(coords) >= 2:
        return float(coords[0]), float(coords[1])
    return None


def _load_comuna_centroids() -> list[tuple[int, int, float, float]]:
    global _comuna_centroids
    if _comuna_centroids is not None:
        return _comuna_centroids
    raw = json.loads(_COMUNAS_GEOJSON.read_text(encoding="utf-8"))
    out: list[tuple[int, int, float, float]] = []
    for feat in raw.get("features") or []:
        props = feat.get("properties") or {}
        cod = props.get("cod_comuna")
        region = props.get("codregion")
        geom = feat.get("geometry") or {}
        if not isinstance(cod, int) or not isinstance(region, int):
            continue
        c = _geom_centroid(geom)
        if c is None:
            continue
        out.append((cod, region, c[0], c[1]))
    _comuna_centroids = out
    return out


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


def comunas_for_dmc_geometry(geom: dict[str, Any]) -> list[int]:
    """CUT comunas whose centroid intersects ``geom``."""
    hits: list[int] = []
    for cod, _region, lng, lat in _load_comuna_centroids():
        if point_in_dmc_geometry(lng, lat, geom):
            hits.append(cod)
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
    zone_geoms = zone_geoms or {}
    region_geoms = region_geoms or {}
    hit_set: set[int] = set()

    for zid in zone_ids:
        override = DMC_ID_COMUNA_OVERRIDES.get(zid)
        if override:
            for cod in override:
                row = next(
                    (c for c in _load_comuna_centroids() if c[0] == cod),
                    None,
                )
                if row is not None:
                    if row[1] == region_code:
                        hit_set.add(cod)
                elif region_code == 5:
                    hit_set.add(cod)
            continue

        geom = zone_geoms.get(zid) or region_geoms.get(zid)
        if geom:
            for cod, reg, lng, lat in _load_comuna_centroids():
                if reg != region_code:
                    continue
                if point_in_dmc_geometry(lng, lat, geom):
                    hit_set.add(cod)
            continue

        seed = DMC_ZONE_CUT_SEEDS.get(zid)
        if seed and seed.region_code == region_code:
            hit_set.update(seed.comuna_codes)

    ordered: list[int] = []
    seen: set[int] = set()
    for cod, reg, _lng, _lat in _load_comuna_centroids():
        if cod in hit_set and reg == region_code and cod not in seen:
            seen.add(cod)
            ordered.append(cod)
    for cod in sorted(hit_set):
        if cod not in seen:
            seen.add(cod)
            ordered.append(cod)
    return ordered
