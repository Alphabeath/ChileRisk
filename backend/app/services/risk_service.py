"""
Risk scoring service.

For MVP this mostly orchestrates mock data.
Later this will call real data sources and ML models.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comuna import Comuna
from app.models.risk_score import RiskScore
from app.services.mock_service import (
    compute_composite_and_dominant,
    severity_from_score,
)


async def get_latest_risk_for_comuna(
    session: AsyncSession, cod_comuna: int
) -> RiskScore | None:
    stmt = (
        select(RiskScore)
        .where(RiskScore.cod_comuna == cod_comuna)
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )
    return (await session.execute(stmt)).scalar_one_or_none()


async def get_latest_risks_for_region(
    session: AsyncSession, codregion: int
) -> list[RiskScore]:
    """Return latest risk score for every comuna in the region."""
    comunas_stmt = select(Comuna.cod_comuna).where(Comuna.codregion == codregion)
    cods = [row[0] for row in (await session.execute(comunas_stmt)).all()]

    if not cods:
        return []

    # For each comuna get its most recent score (simple approach for MVP)
    scores: list[RiskScore] = []
    for cod in cods:
        s = await get_latest_risk_for_comuna(session, cod)
        if s:
            scores.append(s)
    return scores


def aggregate_region_scores(scores: list[RiskScore]) -> dict[str, float]:
    """Uniform average across comunas for each hazard (MVP)."""
    if not scores:
        return {h: 0.0 for h in ["sismo", "ola_calor", "ola_frio", "viento"]}

    totals = {"sismo": 0.0, "ola_calor": 0.0, "ola_frio": 0.0, "viento": 0.0}
    for s in scores:
        totals["sismo"] += s.sismo_score
        totals["ola_calor"] += s.ola_calor_score
        totals["ola_frio"] += s.ola_frio_score
        totals["viento"] += s.viento_score

    n = len(scores)
    agg = {k: round(v / n, 1) for k, v in totals.items()}
    return agg


async def recompute_all_scores(session: AsyncSession) -> int:
    """
    Lightweight evolution pass (used by scheduler).

    For every existing RiskScore, apply small random walk and recompute composite.
    In a real system this would pull fresh weather/seismic data.
    """
    from app.services.mock_service import generate_baseline_scores, HAZARDS
    import random

    result = await session.execute(select(RiskScore))
    all_scores = result.scalars().all()

    updated = 0
    for rs in all_scores:
        # Small drift per hazard
        drift = 2.8
        new_sismo = max(3.0, min(97.0, rs.sismo_score + random.uniform(-drift, drift)))
        new_calor = max(3.0, min(97.0, rs.ola_calor_score + random.uniform(-drift, drift)))
        new_frio = max(3.0, min(97.0, rs.ola_frio_score + random.uniform(-drift, drift)))
        new_viento = max(3.0, min(97.0, rs.viento_score + random.uniform(-drift, drift)))

        scores_dict = {
            "sismo": round(new_sismo, 1),
            "ola_calor": round(new_calor, 1),
            "ola_frio": round(new_frio, 1),
            "viento": round(new_viento, 1),
        }
        composite, dominant = compute_composite_and_dominant(scores_dict)
        sev = severity_from_score(composite)

        rs.sismo_score = scores_dict["sismo"]
        rs.ola_calor_score = scores_dict["ola_calor"]
        rs.ola_frio_score = scores_dict["ola_frio"]
        rs.viento_score = scores_dict["viento"]
        rs.composite_score = composite
        rs.dominant_hazard = dominant
        rs.severity = sev
        updated += 1

    await session.commit()
    return updated
