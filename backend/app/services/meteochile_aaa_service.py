"""Fetch + sync MeteoChile DMC AAA (Avisos / Alertas / Alarmas).

Public JSON (no auth):
  https://archivos.meteochile.gob.cl/portaldmc/AAA/datos_AAA.json
"""

from __future__ import annotations

import asyncio
import logging
import math
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.data.region_name_to_code import official_name
from app.models.meteochile_aaa_alert import MeteoChileAaaAlert
from app.schemas.meteochile_aaa import MeteoChileAaaFeed, MeteoChileAaaItem
from app.services.meteochile_aaa_parsers import (
    geometries_for_item,
    parse_aaa_coordinate_js,
    parse_inline_area_polygon,
    zone_ids_from_data_zona,
)
from app.services.meteochile_aaa_zones import (
    comuna_codes_by_region,
    comunas_for_dmc_geometry,
    region_cuts_for_zone_ids,
    resolve_comuna_codes,
)

logger = logging.getLogger(__name__)

AAA_BASE = "https://archivos.meteochile.gob.cl/portaldmc/AAA"
AAA_JSON_URL = f"{AAA_BASE}/datos_AAA.json"
AAA_ZONAS_JS_URL = f"{AAA_BASE}/sistemaAAA_coordenadas_zonas_2026.js"
AAA_REGIONES_JS_URL = f"{AAA_BASE}/sistemaAAA_coordenadas_regiones_2024.js"
AAA_MAP_URL = f"{AAA_BASE}/aaa_mapa.php"

_LEVEL_MAP = {"Aviso": "amarilla", "Alerta": "naranja", "Alarma": "roja"}


def _headers() -> dict[str, str]:
    return {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 ChileRisk/1.0"
        ),
        "Accept": "application/json,text/javascript,*/*",
    }


async def fetch_aaa_feed(
    *,
    client: httpx.AsyncClient | None = None,
    url: str | None = None,
) -> MeteoChileAaaFeed:
    """GET + validate `datos_AAA.json`."""
    target = url or settings.meteochile_aaa_url
    owns = client is None
    timeout = settings.meteochile_request_timeout_seconds
    http = client or httpx.AsyncClient(timeout=timeout, headers=_headers())
    try:
        resp = await http.get(target)
        resp.raise_for_status()
        return MeteoChileAaaFeed.model_validate(resp.json())
    finally:
        if owns:
            await http.aclose()


async def fetch_coordinate_catalog(
    *,
    client: httpx.AsyncClient | None = None,
    zonas_url: str = AAA_ZONAS_JS_URL,
    regiones_url: str = AAA_REGIONES_JS_URL,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Download and parse zone + region coordinate JS files."""
    owns = client is None
    timeout = max(60, settings.meteochile_request_timeout_seconds)
    http = client or httpx.AsyncClient(timeout=timeout, headers=_headers())
    try:
        z_resp = await http.get(zonas_url)
        r_resp = await http.get(regiones_url)
        z_resp.raise_for_status()
        r_resp.raise_for_status()
        return (
            parse_aaa_coordinate_js(z_resp.text),
            parse_aaa_coordinate_js(r_resp.text),
        )
    finally:
        if owns:
            await http.aclose()


def normalize_aaa_item(
    item: MeteoChileAaaItem,
    *,
    zone_geoms: dict[str, Any] | None = None,
    region_geoms: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Normalize one AAA feed item (debug / spike helpers)."""
    zone_ids = zone_ids_from_data_zona(item.data_zona_afecta)
    tipo_zona = str(item.tipo_zona_afecta or "").strip().lower()
    geoms = geometries_for_item(
        tipo_zona_afecta=tipo_zona,
        data_zona_afecta=item.data_zona_afecta,
        zone_geoms=zone_geoms or {},
        region_geoms=region_geoms or {},
    )
    if tipo_zona == "area":
        resolved_comunas = [
            comuna_code
            for geometry in geoms
            for comuna_code in comunas_for_dmc_geometry(geometry)
        ]
    else:
        resolved_comunas = resolve_comuna_codes(
            zone_ids,
            zone_geoms=zone_geoms,
            region_geoms=region_geoms,
        )
    comunas_by_region = comuna_codes_by_region(resolved_comunas)
    declared_region_codes = region_cuts_for_zone_ids(zone_ids)
    region_codes = declared_region_codes or list(comunas_by_region)
    comuna_codes = [
        comuna_code
        for region_code in region_codes
        for comuna_code in comunas_by_region.get(region_code, [])
    ]

    return {
        "external_id": f"meteochile:{item.id}",
        "source": "meteochile",
        "tipo": item.tipo,
        "level_hint": _LEVEL_MAP.get(item.tipo, "amarilla"),
        "codigo_meteo": item.codigo_meteo,
        "title": item.titulo or item.fenomeno or item.codigo_meteo,
        "fenomeno": item.fenomeno,
        "observacion": item.observacion,
        "emision": item.emision,
        "desde": item.desde,
        "hasta": item.hasta,
        "texto_zona_afecta": item.texto_zona_afecta,
        "tipo_zona_afecta": item.tipo_zona_afecta,
        "zone_ids": zone_ids,
        "region_codes": region_codes,
        "comuna_codes": comuna_codes,
        "geometries": geoms,
        "external_url": AAA_MAP_URL,
        "tabla_titulo": item.tabla_titulo,
    }


def normalize_feed(
    feed: MeteoChileAaaFeed,
    *,
    zone_geoms: dict[str, Any] | None = None,
    region_geoms: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    return [
        normalize_aaa_item(item, zone_geoms=zone_geoms, region_geoms=region_geoms)
        for item in feed.items
    ]


def _content_for(item: MeteoChileAaaItem) -> str | None:
    parts: list[str] = []
    if item.observacion:
        parts.append(item.observacion)
    if item.desde or item.hasta:
        parts.append(
            f"Vigencia: {item.desde or '—'} → {item.hasta or '—'}"
        )
    if item.texto_zona_afecta:
        parts.append(item.texto_zona_afecta.replace("<br>", " ").strip())
    if item.condicion_sinoptica:
        parts.append(f"Condición: {item.condicion_sinoptica}")
    text = "\n".join(p for p in parts if p).strip()
    return text or None


def _rows_from_item(
    item: MeteoChileAaaItem,
    *,
    now: datetime,
    zone_geoms: dict[str, Any] | None = None,
    region_geoms: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Fan-out one AAA item to one DB row per CUT region.

    When DMC geometries (or overrides) resolve comunas, ``affected_scope`` is
    ``comuna`` so continental Valparaíso is not attributed to Isla de Pascua.
    """
    zone_ids = zone_ids_from_data_zona(item.data_zona_afecta)
    region_codes = region_cuts_for_zone_ids(zone_ids)
    level = _LEVEL_MAP.get(item.tipo, "amarilla")
    title = (item.titulo or item.fenomeno or item.codigo_meteo)[:500]
    content = _content_for(item)
    tipo_zona = str(item.tipo_zona_afecta or "").strip().lower()

    if tipo_zona == "area":
        polygon = parse_inline_area_polygon(item.data_zona_afecta)
        resolved_comunas = (
            comunas_for_dmc_geometry(polygon) if polygon is not None else []
        )
    else:
        resolved_comunas = resolve_comuna_codes(
            zone_ids,
            zone_geoms=zone_geoms,
            region_geoms=region_geoms,
        )
    comunas_by_region = comuna_codes_by_region(resolved_comunas)
    if tipo_zona == "area":
        region_codes = list(comunas_by_region)

    if not region_codes:
        # Malformed areas or unknown ids stay visible without invented coverage.
        comunas = resolved_comunas
        scope = "comuna" if comunas else (
            "unknown" if tipo_zona == "area" else "region"
        )
        return [
            {
                "row_key": f"{item.id}:na",
                "aaa_id": item.id,
                "codigo_meteo": item.codigo_meteo[:64],
                "tipo": item.tipo,
                "level": level,
                "fenomeno": (item.fenomeno or None),
                "title": title,
                "content": content,
                "region_code": None,
                "region_name": None,
                "affected_scope": scope,
                "comuna_codes": comunas,
                "zone_ids": zone_ids,
                "external_url": AAA_MAP_URL,
                "is_active": True,
                "issued_at": now,
                "valid_from": item.desde or None,
                "valid_until": item.hasta or None,
                "raw": item.model_dump(by_alias=True),
                "synced_at": now,
            }
        ]

    rows: list[dict[str, Any]] = []
    for code in region_codes:
        comunas = comunas_by_region.get(code, [])
        scope = "comuna" if comunas else "region"
        rows.append(
            {
                "row_key": f"{item.id}:{code}",
                "aaa_id": item.id,
                "codigo_meteo": item.codigo_meteo[:64],
                "tipo": item.tipo,
                "level": level,
                "fenomeno": (item.fenomeno or None),
                "title": title,
                "content": content,
                "region_code": code,
                "region_name": official_name(code),
                "affected_scope": scope,
                "comuna_codes": comunas,
                "zone_ids": zone_ids,
                "external_url": AAA_MAP_URL,
                "is_active": True,
                "issued_at": now,
                "valid_from": item.desde or None,
                "valid_until": item.hasta or None,
                "raw": item.model_dump(by_alias=True),
                "synced_at": now,
            }
        )
    return rows


async def _upsert_rows(session: AsyncSession, rows: list[dict[str, Any]]) -> int:
    if not rows:
        return 0
    dialect = session.bind.dialect.name if session.bind else "sqlite"
    insert_stmt = (
        pg_insert(MeteoChileAaaAlert)
        if dialect == "postgresql"
        else sqlite_insert(MeteoChileAaaAlert)
    )
    insert_stmt = insert_stmt.values(rows)
    update_cols = {
        c.name: insert_stmt.excluded[c.name]
        for c in MeteoChileAaaAlert.__table__.columns
        if c.name not in ("id", "row_key")
    }
    upsert = insert_stmt.on_conflict_do_update(
        index_elements=["row_key"],
        set_=update_cols,
    )
    await session.execute(upsert)
    await session.commit()
    return len(rows)


async def _deactivate_missing(session: AsyncSession, active_keys: set[str]) -> int:
    now = datetime.now(timezone.utc)
    if active_keys:
        stmt = (
            update(MeteoChileAaaAlert)
            .where(MeteoChileAaaAlert.is_active.is_(True))
            .where(MeteoChileAaaAlert.row_key.notin_(active_keys))
            .values(is_active=False, synced_at=now)
        )
    else:
        stmt = (
            update(MeteoChileAaaAlert)
            .where(MeteoChileAaaAlert.is_active.is_(True))
            .values(is_active=False, synced_at=now)
        )
    result = await session.execute(stmt)
    await session.commit()
    return int(result.rowcount or 0)


async def list_active_meteochile_aaa_rows(
    session: AsyncSession,
) -> list[MeteoChileAaaAlert]:
    result = await session.execute(
        select(MeteoChileAaaAlert)
        .where(MeteoChileAaaAlert.is_active.is_(True))
        .order_by(MeteoChileAaaAlert.level, MeteoChileAaaAlert.aaa_id)
    )
    return list(result.scalars().all())


# In-memory DMC fringe catalogs (zone + region coordinate JS).
_zone_geoms_cache: dict[str, Any] | None = None
_region_geoms_cache: dict[str, Any] | None = None
_geoms_lock = asyncio.Lock()

_LEVEL_RANK = {
    "roja": 0,
    "naranja": 1,
    "amarilla": 2,
    "preventiva": 3,
    "informativa": 4,
}


def _approx_circle_polygon(
    lng: float, lat: float, radius_m: float, *, steps: int = 32
) -> dict[str, Any]:
    """Approximate a metric circle as a GeoJSON Polygon (no shapely)."""
    lat_rad = math.radians(lat)
    dlat = radius_m / 111_320.0
    dlng = radius_m / (111_320.0 * max(0.2, math.cos(lat_rad)))
    ring: list[list[float]] = []
    for i in range(steps):
        ang = (2 * math.pi * i) / steps
        ring.append([lng + dlng * math.cos(ang), lat + dlat * math.sin(ang)])
    ring.append(ring[0])
    return {"type": "Polygon", "coordinates": [ring]}


def _geometry_for_map(geom: dict[str, Any]) -> dict[str, Any] | None:
    gtype = geom.get("type")
    if gtype == "Polygon":
        return {"type": "Polygon", "coordinates": geom["coordinates"]}
    if gtype == "MultiPolygon":
        return {"type": "MultiPolygon", "coordinates": geom["coordinates"]}
    if gtype == "Point":
        coords = geom.get("coordinates")
        if not isinstance(coords, (list, tuple)) or len(coords) < 2:
            return None
        radius = float(geom.get("radius_m") or 25_000)
        return _approx_circle_polygon(float(coords[0]), float(coords[1]), radius)
    return None


async def ensure_coordinate_catalogs() -> tuple[dict[str, Any], dict[str, Any]]:
    """Load (and cache) DMC zone/region coordinate JS catalogs."""
    global _zone_geoms_cache, _region_geoms_cache
    if _zone_geoms_cache is not None and _region_geoms_cache is not None:
        return _zone_geoms_cache, _region_geoms_cache
    async with _geoms_lock:
        if _zone_geoms_cache is not None and _region_geoms_cache is not None:
            return _zone_geoms_cache, _region_geoms_cache
        zones, regions = await fetch_coordinate_catalog()
        _zone_geoms_cache = zones
        _region_geoms_cache = regions
        logger.info(
            "Cached MeteoChile AAA geometries: %d zones, %d regions",
            len(zones),
            len(regions),
        )
        return zones, regions


async def sync_meteochile_aaa(session: AsyncSession) -> int:
    """Fetch AAA feed; upsert per-region rows; deactivate missing keys."""
    now = datetime.now(timezone.utc)
    try:
        feed = await fetch_aaa_feed()
    except Exception as e:
        logger.warning("meteochile AAA fetch failed: %s", e)
        return 0

    # Warm fringe catalogs for map overlay + comuna resolve (best-effort).
    zone_geoms: dict[str, Any] | None = None
    region_geoms: dict[str, Any] | None = None
    try:
        zone_geoms, region_geoms = await ensure_coordinate_catalogs()
    except Exception as e:
        logger.warning("meteochile AAA coordinate catalog warm failed: %s", e)

    rows: list[dict[str, Any]] = []
    for item in feed.items:
        rows.extend(
            _rows_from_item(
                item,
                now=now,
                zone_geoms=zone_geoms,
                region_geoms=region_geoms,
            )
        )
    active_keys = {r["row_key"] for r in rows}

    n = await _upsert_rows(session, rows)
    pruned = await _deactivate_missing(session, active_keys)
    logger.info(
        "Upserted %d MeteoChile AAA rows (deactivated %d) — feed %s",
        n,
        pruned,
        feed.fecha_actualizacion,
    )
    return n


async def build_active_zone_geojson(session: AsyncSession) -> dict[str, Any]:
    """GeoJSON FeatureCollection of DMC fringes covered by active AAA rows.

    One feature per zone/region id (worst alert level wins). Matches the
    official PortalDMC fringe shading rather than whole CUT regions.
    """
    rows = await list_active_meteochile_aaa_rows(session)
    empty: dict[str, Any] = {"type": "FeatureCollection", "features": []}
    if not rows:
        return empty

    try:
        zone_geoms, region_geoms = await ensure_coordinate_catalogs()
    except Exception as e:
        logger.warning("meteochile AAA geometries unavailable: %s", e)
        return empty

    # Deduplicate by aaa_id — fan-out rows share the same zone_ids/level.
    by_aaa: dict[str, MeteoChileAaaAlert] = {}
    for row in rows:
        prev = by_aaa.get(row.aaa_id)
        if prev is None or _LEVEL_RANK.get(row.level, 9) < _LEVEL_RANK.get(
            prev.level, 9
        ):
            by_aaa[row.aaa_id] = row

    # zone_id → (level, title, aaa_id, tipo)
    zone_best: dict[str, tuple[str, str, str, str]] = {}
    area_features: list[dict[str, Any]] = []

    for row in by_aaa.values():
        raw = row.raw or {}
        tipo_zona = str(
            raw.get("tipoZonaAfecta") or raw.get("tipo_zona_afecta") or ""
        ).strip().lower()
        data_zona = str(
            raw.get("dataZonaAfecta") or raw.get("data_zona_afecta") or ""
        )
        level = row.level
        title = row.title
        aaa_id = row.aaa_id
        tipo = row.tipo

        if tipo_zona == "area":
            poly = parse_inline_area_polygon(data_zona)
            if poly:
                area_features.append(
                    {
                        "type": "Feature",
                        "properties": {
                            "zone_id": f"area:{aaa_id}",
                            "alert_level": level,
                            "aaa_id": aaa_id,
                            "title": title,
                            "tipo": tipo,
                        },
                        "geometry": poly,
                    }
                )
            continue

        ids = list(row.zone_ids or []) or zone_ids_from_data_zona(data_zona)
        catalog = zone_geoms if tipo_zona == "zonas" else region_geoms
        # Fallback: try both catalogs
        for zid in ids:
            geom = catalog.get(zid) or zone_geoms.get(zid) or region_geoms.get(zid)
            if not geom:
                continue
            prev = zone_best.get(zid)
            if prev is None or _LEVEL_RANK.get(level, 9) < _LEVEL_RANK.get(
                prev[0], 9
            ):
                zone_best[zid] = (level, title, aaa_id, tipo)

    features: list[dict[str, Any]] = list(area_features)
    for zid, (level, title, aaa_id, tipo) in zone_best.items():
        geom = zone_geoms.get(zid) or region_geoms.get(zid)
        if not geom:
            continue
        mapped = _geometry_for_map(geom)
        if not mapped:
            continue
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "zone_id": zid,
                    "alert_level": level,
                    "aaa_id": aaa_id,
                    "title": title,
                    "tipo": tipo,
                },
                "geometry": mapped,
            }
        )

    return {"type": "FeatureCollection", "features": features}
