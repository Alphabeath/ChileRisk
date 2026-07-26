"""Region-level risk aggregation (v2 — with real climate regional average)."""

from datetime import datetime, timezone

from cachetools import TTLCache
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.climate_reading import ClimateReading
from app.models.comuna import Comuna
from app.models.region import Region
from app.models.risk_score import RiskScore
from app.services.risk_utils import compute_composite_and_dominant
from app.services.risk_service import aggregate_region_scores, get_latest_risks_for_region
from app.services.alert_evaluator import CLIMATE_SCORE_THRESHOLDS

_national_cache = TTLCache(maxsize=1, ttl=settings.cache_ttl_seconds)
_region_cache: TTLCache = TTLCache(maxsize=20, ttl=settings.cache_ttl_seconds)


async def get_region_climate_avg(session: AsyncSession, codregion: int) -> dict | None:
    """Compute real regional climate average from latest climate_readings."""
    subq = (
        select(
            ClimateReading.cod_comuna,
            func.max(ClimateReading.measured_at).label("max_time"),
        )
        .join(Comuna, Comuna.cod_comuna == ClimateReading.cod_comuna)
        .where(Comuna.codregion == codregion)
        .group_by(ClimateReading.cod_comuna)
        .subquery()
    )

    stmt = (
        select(
            func.avg(ClimateReading.temperature_c).label("avg_temp"),
            func.avg(ClimateReading.wind_speed_kmh).label("avg_wind"),
            func.count(ClimateReading.id).label("count"),
        )
        .join(
            subq,
            (ClimateReading.cod_comuna == subq.c.cod_comuna)
            & (ClimateReading.measured_at == subq.c.max_time),
        )
    )
    row = (await session.execute(stmt)).one()
    if not row or row.count == 0:
        return None

    return {
        "avg_temperature_c": round(float(row.avg_temp), 1),
        "avg_wind_speed_kmh": round(float(row.avg_wind), 1),
        "comuna_count": row.count,
    }


async def get_region_aggregated_risk(
    session: AsyncSession, codregion: int
) -> dict[str, float] | None:
    cache_key = f"region:{codregion}"
    if cache_key in _region_cache:
        return _region_cache[cache_key]

    region = await session.get(Region, codregion)
    if not region:
        return None

    scores = await get_latest_risks_for_region(session, codregion)
    if not scores:
        return None

    agg = aggregate_region_scores(scores)
    composite, dominant = compute_composite_and_dominant(agg)

    climate = await get_region_climate_avg(session, codregion)
    risk_computed_at = max(s.computed_at for s in scores)

    result = {
        "codregion": codregion,
        "name": region.name,
        "risk_computed_at": risk_computed_at,
        "sismo_score": agg["sismo"],
        "ola_calor_score": agg["ola_calor"],
        "ola_frio_score": agg["ola_frio"],
        "viento_score": agg["viento"],
        "inundacion_score": agg["inundacion"],
        "composite_score": round(composite, 1),
        "dominant_hazard": dominant,
        "severity": "critico" if composite >= 75 else ("alto" if composite >= 55 else ("moderado" if composite >= 35 else "bajo")),
        "comuna_count": len(scores),
        "avg_temperature_c": climate["avg_temperature_c"] if climate else None,
        "avg_wind_speed_kmh": climate["avg_wind_speed_kmh"] if climate else None,
    }
    _region_cache[cache_key] = result
    return result


async def get_all_regions_aggregated(session: AsyncSession) -> list[dict]:
    if "national" in _national_cache:
        return _national_cache["national"]

    regions = (await session.execute(select(Region).order_by(Region.codregion))).scalars().all()
    results = []
    for r in regions:
        data = await get_region_aggregated_risk(session, r.codregion)
        if data:
            results.append(data)

    _national_cache["national"] = results
    return results


async def get_all_regions_for_alerts(session: AsyncSession) -> list[dict]:
    """Region inputs for ChileRisk alerts — no TTL cache, includes max sismo per region."""
    regions = (await session.execute(select(Region).order_by(Region.codregion))).scalars().all()
    results: list[dict] = []
    for region in regions:
        data = await _build_region_alert_context(session, region.codregion, region.name)
        if data:
            results.append(data)
    return results


async def _build_region_alert_context(
    session: AsyncSession, codregion: int, name: str
) -> dict | None:
    scores = await get_latest_risks_for_region(session, codregion)
    if not scores:
        return None

    agg = aggregate_region_scores(scores)
    climate = await get_region_climate_avg(session, codregion)
    risk_computed_at = max(s.computed_at for s in scores)

    # Comunas with elevated flood risk (for alert detail text)
    flood_threshold = CLIMATE_SCORE_THRESHOLDS["moderado"]
    high_flood = sorted(
        [
            (s.cod_comuna, s.inundacion_score)
            for s in scores
            if s.inundacion_score >= flood_threshold
        ],
        key=lambda x: x[1],
        reverse=True,
    )[:3]
    flood_comunas: list[str] = []
    flood_comuna_codes: list[int] = []
    if high_flood:
        cod_list = [c for c, _ in high_flood]
        name_rows = (
            await session.execute(
                select(Comuna.cod_comuna, Comuna.name).where(
                    Comuna.cod_comuna.in_(cod_list)
                )
            )
        ).all()
        name_map = {row[0]: row[1] for row in name_rows}
        flood_comuna_codes = [c for c, _ in high_flood if c in name_map]
        flood_comunas = [name_map[c] for c in flood_comuna_codes]

    return {
        "codregion": codregion,
        "name": name,
        "risk_computed_at": risk_computed_at,
        "sismo_score": agg["sismo"],
        "ola_calor_score": agg["ola_calor"],
        "ola_frio_score": agg["ola_frio"],
        "viento_score": agg["viento"],
        "inundacion_score": agg["inundacion"],
        "flood_comunas": flood_comunas,
        "flood_comuna_codes": flood_comuna_codes,
        "max_sismo_score": round(max(s.sismo_score for s in scores), 1),
        "composite_score": round(
            compute_composite_and_dominant(agg)[0],
            1,
        ),
        "avg_temperature_c": climate["avg_temperature_c"] if climate else None,
        "avg_wind_speed_kmh": climate["avg_wind_speed_kmh"] if climate else None,
    }
