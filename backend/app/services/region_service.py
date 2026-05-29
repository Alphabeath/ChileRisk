"""
Region-level risk aggregation.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.region import Region
from app.models.risk_score import RiskScore
from app.services.risk_service import aggregate_region_scores, get_latest_risks_for_region


async def get_region_aggregated_risk(
    session: AsyncSession, codregion: int
) -> dict[str, float] | None:
    """Return aggregated hazard scores for a whole region."""
    region = await session.get(Region, codregion)
    if not region:
        return None

    scores = await get_latest_risks_for_region(session, codregion)
    if not scores:
        return None

    agg = aggregate_region_scores(scores)
    composite = sum(agg.values()) / len(agg)
    dominant = max(agg, key=agg.get)

    return {
        "codregion": codregion,
        "name": region.name,
        "sismo_score": agg["sismo"],
        "ola_calor_score": agg["ola_calor"],
        "ola_frio_score": agg["ola_frio"],
        "viento_score": agg["viento"],
        "composite_score": round(composite, 1),
        "dominant_hazard": dominant,
        "severity": "critico" if composite >= 75 else ("alto" if composite >= 55 else ("moderado" if composite >= 35 else "bajo")),
        "comuna_count": len(scores),
    }


async def get_all_regions_aggregated(session: AsyncSession) -> list[dict]:
    """National overview: one aggregated entry per region."""
    regions = (await session.execute(select(Region).order_by(Region.codregion))).scalars().all()
    results = []
    for r in regions:
        data = await get_region_aggregated_risk(session, r.codregion)
        if data:
            results.append(data)
    return results
