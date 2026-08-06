from datetime import datetime, timedelta, timezone

from cachetools import TTLCache
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.comuna import Comuna
from app.models.region import Region
from app.models.risk_score import RiskScore

_stats_cache = TTLCache(maxsize=5, ttl=settings.cache_ttl_seconds)


async def get_national_stats(session: AsyncSession) -> dict:
    if "national" in _stats_cache:
        return _stats_cache["national"]

    now = datetime.now(timezone.utc)

    avg_result = await session.execute(
        select(
            func.avg(RiskScore.composite_score),
            func.avg(RiskScore.sismo_score),
            func.avg(RiskScore.ola_calor_score),
            func.avg(RiskScore.ola_frio_score),
            func.avg(RiskScore.viento_score),
        )
    )
    avg_row = avg_result.one()

    sev_result = await session.execute(
        select(RiskScore.severity, func.count()).group_by(RiskScore.severity)
    )
    sev_counts = {row[0]: row[1] for row in sev_result.all()}

    region_score_stmt = (
        select(
            Region.codregion,
            Region.name,
            func.avg(RiskScore.composite_score).label("avg"),
        )
        .join(Comuna, Comuna.codregion == Region.codregion)
        .join(RiskScore, RiskScore.cod_comuna == Comuna.cod_comuna)
        .group_by(Region.codregion, Region.name)
    )

    top_stmt = region_score_stmt.order_by(func.avg(RiskScore.composite_score).desc()).limit(3)
    top_rows = (await session.execute(top_stmt)).all()

    bottom_stmt = region_score_stmt.order_by(func.avg(RiskScore.composite_score).asc()).limit(3)
    bottom_rows = (await session.execute(bottom_stmt)).all()

    result = {
        "timestamp": now.isoformat(),
        "national_avg": {
            "composite_score": round(float(avg_row[0] or 0), 1),
            "sismo": round(float(avg_row[1] or 0), 1),
            "ola_calor": round(float(avg_row[2] or 0), 1),
            "ola_frio": round(float(avg_row[3] or 0), 1),
            "viento": round(float(avg_row[4] or 0), 1),
        },
        "severity_distribution": {
            "bajo": sev_counts.get("bajo", 0),
            "moderado": sev_counts.get("moderado", 0),
            "alto": sev_counts.get("alto", 0),
            "critico": sev_counts.get("critico", 0),
        },
        "top_regions": [
            {"codregion": r[0], "name": r[1], "composite_score": round(float(r[2]), 1)}
            for r in top_rows
        ],
        "bottom_regions": [
            {"codregion": r[0], "name": r[1], "composite_score": round(float(r[2]), 1)}
            for r in bottom_rows
        ],
    }

    _stats_cache["national"] = result
    return result


async def get_region_stats(session: AsyncSession, codregion: int) -> dict | None:
    region = await session.get(Region, codregion)
    if not region:
        return None

    scores = (
        await session.execute(
            select(RiskScore)
            .join(Comuna, Comuna.cod_comuna == RiskScore.cod_comuna)
            .where(Comuna.codregion == codregion)
        )
    ).scalars().all()

    if not scores:
        return None

    n = len(scores)
    avg = {
        "composite": round(sum(s.composite_score for s in scores) / n, 1),
        "sismo": round(sum(s.sismo_score for s in scores) / n, 1),
        "ola_calor": round(sum(s.ola_calor_score for s in scores) / n, 1),
        "ola_frio": round(sum(s.ola_frio_score for s in scores) / n, 1),
        "viento": round(sum(s.viento_score for s in scores) / n, 1),
    }

    max_s = max(scores, key=lambda x: x.composite_score)
    min_s = min(scores, key=lambda x: x.composite_score)

    from collections import Counter
    sev_counts = Counter(s.severity for s in scores)

    dominant = max(
        ["sismo", "ola_calor", "ola_frio", "viento"],
        key=lambda h: avg[h] if h != "composite" else 0,
    )

    return {
        "codregion": codregion,
        "name": region.name,
        "comuna_count": n,
        "avg_scores": avg,
        "max_scores": {
            "composite": max_s.composite_score,
            "comuna_name": "Comuna",  # placeholder - can enhance later with join
        },
        "min_scores": {
            "composite": min_s.composite_score,
            "comuna_name": "Comuna",
        },
        "dominant_hazard": dominant,
        "severity_breakdown": {
            "bajo": sev_counts.get("bajo", 0),
            "moderado": sev_counts.get("moderado", 0),
            "alto": sev_counts.get("alto", 0),
            "critico": sev_counts.get("critico", 0),
        },
    }


async def get_trends(session: AsyncSession, days: int = 7) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    return {
        "period": {
            "start": since.date().isoformat(),
            "end": datetime.now(timezone.utc).date().isoformat(),
        },
        "message": "Historical trend storage not implemented in v0.2. Use current snapshots for now.",
    }


async def compare_regions(session: AsyncSession, codregions: list[int]) -> dict:
    results = []
    for cod in codregions:
        region = await session.get(Region, cod)
        if not region:
            continue
        scores = (
            await session.execute(
                select(RiskScore)
                .join(Comuna, Comuna.cod_comuna == RiskScore.cod_comuna)
                .where(Comuna.codregion == cod)
            )
        ).scalars().all()
        if not scores:
            continue
        n = len(scores)
        avg_comp = sum(s.composite_score for s in scores) / n
        dominant = max(
            ["sismo", "ola_calor", "ola_frio", "viento"],
            key=lambda h: sum(getattr(s, f"{h}_score") for s in scores) / n,
        )
        sev = "critico" if avg_comp >= 75 else ("alto" if avg_comp >= 55 else ("moderado" if avg_comp >= 35 else "bajo"))
        results.append({
            "codregion": cod,
            "name": region.name,
            "composite_score": round(avg_comp, 1),
            "dominant_hazard": dominant,
            "severity": sev,
        })
    return {"regiones": results}
