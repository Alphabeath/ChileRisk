"""Risk scoring service (v2 — uses precomputed seismic impacts)."""

import random
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comuna import Comuna
from app.models.risk_score import RiskScore
from app.services.impact_service import get_max_risk_per_comuna_from_impacts
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
    comunas_stmt = select(Comuna.cod_comuna).where(Comuna.codregion == codregion)
    cods = [row[0] for row in (await session.execute(comunas_stmt)).all()]

    if not cods:
        return []

    scores: list[RiskScore] = []
    for cod in cods:
        s = await get_latest_risk_for_comuna(session, cod)
        if s:
            scores.append(s)
    return scores


def aggregate_region_scores(scores: list[RiskScore]) -> dict[str, float]:
    if not scores:
        return {h: 0.0 for h in ["sismo", "ola_calor", "ola_frio", "viento"]}

    hazards = ["sismo", "ola_calor", "ola_frio", "viento"]
    score_map = {
        "sismo": "sismo_score",
        "ola_calor": "ola_calor_score",
        "ola_frio": "ola_frio_score",
        "viento": "viento_score",
    }

    total_weight = 0.0
    weighted = {h: 0.0 for h in hazards}

    for s in scores:
        w = max(s.composite_score, 1.0)
        total_weight += w
        for h in hazards:
            weighted[h] += getattr(s, score_map[h]) * w

    if total_weight == 0:
        return {h: 0.0 for h in hazards}

    return {h: round(v / total_weight, 1) for h, v in weighted.items()}


async def get_comuna_map_scores(session: AsyncSession) -> list[dict]:
    """Minimal data for map choropleth coloring: only what is needed to paint comunas."""
    subq = (
        select(
            RiskScore.cod_comuna,
            func.max(RiskScore.computed_at).label("max_computed_at"),
        )
        .group_by(RiskScore.cod_comuna)
        .subquery()
    )
    stmt = (
        select(RiskScore.cod_comuna, RiskScore.composite_score)
        .join(
            subq,
            (RiskScore.cod_comuna == subq.c.cod_comuna)
            & (RiskScore.computed_at == subq.c.max_computed_at),
        )
    )
    rows = (await session.execute(stmt)).all()
    return [
        {"cod_comuna": row[0], "composite_score": float(row[1])}
        for row in rows
    ]


async def recompute_all_scores(session: AsyncSession) -> int:
    result = await session.execute(select(RiskScore))
    all_scores = result.scalars().all()

    impact_map = await get_max_risk_per_comuna_from_impacts(session, hours=24)

    now_utc = datetime.now(timezone.utc)
    updated = 0
    for rs in all_scores:
        drift = 2.8
        new_calor = max(3.0, min(97.0, rs.ola_calor_score + random.uniform(-drift, drift)))
        new_frio = max(3.0, min(97.0, rs.ola_frio_score + random.uniform(-drift, drift)))
        new_viento = max(3.0, min(97.0, rs.viento_score + random.uniform(-drift, drift)))

        sismo_from_impact = impact_map.get(rs.cod_comuna, 0.0)

        if sismo_from_impact > 0:
            new_sismo = max(rs.sismo_score * 0.7, sismo_from_impact * 1.2)
        else:
            new_sismo = max(3.0, min(97.0, rs.sismo_score + random.uniform(-drift, drift)))

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
        rs.computed_at = now_utc
        updated += 1

    await session.commit()
    return updated
