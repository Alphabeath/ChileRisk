"""Daily risk snapshots (compute-once per calendar day; feeds alert evaluator)."""

from __future__ import annotations

import asyncio
import hashlib
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.climate_reading import ClimateReading
from app.models.comuna import Comuna
from app.models.daily_risk_score import DailyRiskScore
from app.models.region import Region
from app.models.risk_score import RiskScore
from app.services.impact_service import get_max_risk_per_comuna_from_impacts
from app.services.risk_utils import compute_composite_and_dominant, severity_from_score
from app.services.query_date_window import clamp_query_date, day_bounds_utc, today_chile
from app.services.risk_service import aggregate_region_scores

_compute_locks: dict[date, asyncio.Lock] = {}


def _lock_for_date(query_date: date) -> asyncio.Lock:
    lock = _compute_locks.get(query_date)
    if lock is None:
        lock = asyncio.Lock()
        _compute_locks[query_date] = lock
    return lock


def _snapshots_complete(rows: list[DailyRiskScore], expected: int) -> bool:
    if expected <= 0:
        return bool(rows)
    return len(rows) >= max(1, int(expected * 0.95))


async def _pg_advisory_lock(session: AsyncSession, query_date: date) -> None:
    """Serialize compute per day across concurrent requests (PostgreSQL)."""
    bind = session.get_bind()
    if bind is None or bind.dialect.name != "postgresql":
        return
    key = int(hashlib.md5(query_date.isoformat().encode()).hexdigest()[:15], 16)
    await session.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": key})


async def _upsert_daily_rows(session: AsyncSession, rows: list[DailyRiskScore]) -> None:
    if not rows:
        return
    values = [
        {
            "score_date": r.score_date,
            "cod_comuna": r.cod_comuna,
            "sismo_score": r.sismo_score,
            "ola_calor_score": r.ola_calor_score,
            "ola_frio_score": r.ola_frio_score,
            "viento_score": r.viento_score,
            "composite_score": r.composite_score,
            "dominant_hazard": r.dominant_hazard,
            "severity": r.severity,
            "computed_at": r.computed_at,
        }
        for r in rows
    ]
    stmt = pg_insert(DailyRiskScore).values(values)
    stmt = stmt.on_conflict_do_update(
        index_elements=["score_date", "cod_comuna"],
        set_={
            "sismo_score": stmt.excluded.sismo_score,
            "ola_calor_score": stmt.excluded.ola_calor_score,
            "ola_frio_score": stmt.excluded.ola_frio_score,
            "viento_score": stmt.excluded.viento_score,
            "composite_score": stmt.excluded.composite_score,
            "dominant_hazard": stmt.excluded.dominant_hazard,
            "severity": stmt.excluded.severity,
            "computed_at": stmt.excluded.computed_at,
        },
    )
    await session.execute(stmt)


async def _latest_risk_by_comuna(session: AsyncSession) -> dict[int, RiskScore]:
    subq = (
        select(
            RiskScore.cod_comuna,
            func.max(RiskScore.computed_at).label("max_computed_at"),
        )
        .group_by(RiskScore.cod_comuna)
        .subquery()
    )
    stmt = select(RiskScore).join(
        subq,
        (RiskScore.cod_comuna == subq.c.cod_comuna)
        & (RiskScore.computed_at == subq.c.max_computed_at),
    )
    rows = (await session.execute(stmt)).scalars().all()
    return {r.cod_comuna: r for r in rows}


async def _comuna_count(session: AsyncSession) -> int:
    return int((await session.execute(select(func.count()).select_from(Comuna))).scalar_one())


async def _load_snapshots(
    session: AsyncSession, query_date: date
) -> list[DailyRiskScore]:
    return list(
        (
            await session.execute(
                select(DailyRiskScore).where(DailyRiskScore.score_date == query_date)
            )
        ).scalars().all()
    )


def _snapshot_is_fresh(rows: list[DailyRiskScore], query_date: date) -> bool:
    if not rows:
        return False
    if query_date != today_chile():
        return True
    latest = max(r.computed_at for r in rows)
    if latest.tzinfo is None:
        latest = latest.replace(tzinfo=timezone.utc)
    age = datetime.now(timezone.utc) - latest
    return age < timedelta(minutes=settings.risk_refresh_minutes)


async def _climate_scores_before(
    session: AsyncSession, end: datetime
) -> dict[int, dict[str, float]]:
    """Latest climate reading per comuna strictly before end of the query day."""
    subq = (
        select(
            ClimateReading.cod_comuna,
            func.max(ClimateReading.measured_at).label("max_time"),
        )
        .where(ClimateReading.measured_at < end)
        .group_by(ClimateReading.cod_comuna)
        .subquery()
    )
    stmt = (
        select(
            ClimateReading.cod_comuna,
            ClimateReading.ola_calor_score,
            ClimateReading.ola_frio_score,
            ClimateReading.viento_score,
        )
        .join(
            subq,
            (ClimateReading.cod_comuna == subq.c.cod_comuna)
            & (ClimateReading.measured_at == subq.c.max_time),
        )
    )
    rows = (await session.execute(stmt)).all()
    return {
        int(cod): {
            "ola_calor": float(ola_calor),
            "ola_frio": float(ola_frio),
            "viento": float(viento),
        }
        for cod, ola_calor, ola_frio, viento in rows
    }


async def compute_and_store_daily_scores(
    session: AsyncSession, query_date: date
) -> list[DailyRiskScore]:
    query_date = clamp_query_date(query_date)
    start, end = day_bounds_utc(query_date)

    comunas = (await session.execute(select(Comuna))).scalars().all()
    if not comunas:
        return []

    sismo_map = await get_max_risk_per_comuna_from_impacts(session, start=start, end=end)
    climate_map = await _climate_scores_before(session, end)
    latest_map = await _latest_risk_by_comuna(session)

    now = datetime.now(timezone.utc)
    rows: list[DailyRiskScore] = []

    for comuna in comunas:
        cod = comuna.cod_comuna
        climate = climate_map.get(cod)
        latest_rs = latest_map.get(cod)
        if climate:
            ola_calor = climate["ola_calor"]
            ola_frio = climate["ola_frio"]
            viento = climate["viento"]
        else:
            ola_calor = 0.0
            ola_frio = 0.0
            viento = 0.0

        # Flood score comes from RiskScore (flood_service); ClimateReading has no flood data.
        inundacion = latest_rs.inundacion_score if latest_rs else 0.0

        # Day window impacts only — do not inherit a score without a real event.
        sismo = float(sismo_map.get(cod, 0.0))
        if sismo > 0:
            sismo = sismo * 1.2

        # Do not materialize a zero-valued snapshot for a comuna with no observed input.
        if climate is None and latest_rs is None and sismo <= 0:
            continue

        scores_dict = {
            "sismo": round(sismo, 1),
            "ola_calor": round(ola_calor, 1),
            "ola_frio": round(ola_frio, 1),
            "viento": round(viento, 1),
            "inundacion": round(inundacion, 1),
        }
        composite, dominant = compute_composite_and_dominant(scores_dict)
        sev = severity_from_score(composite)

        rows.append(
            DailyRiskScore(
                score_date=query_date,
                cod_comuna=cod,
                sismo_score=scores_dict["sismo"],
                ola_calor_score=scores_dict["ola_calor"],
                ola_frio_score=scores_dict["ola_frio"],
                viento_score=scores_dict["viento"],
                inundacion_score=scores_dict["inundacion"],
                composite_score=composite,
                dominant_hazard=dominant,
                severity=sev,
                computed_at=now,
            )
        )

    await _upsert_daily_rows(session, rows)
    await session.commit()
    return rows


async def get_or_compute_daily_scores(
    session: AsyncSession, query_date: date
) -> list[DailyRiskScore]:
    query_date = clamp_query_date(query_date)
    expected = await _comuna_count(session)
    existing = await _load_snapshots(session, query_date)

    if _snapshots_complete(existing, expected) and _snapshot_is_fresh(
        existing, query_date
    ):
        return existing

    lock = _lock_for_date(query_date)
    async with lock:
        existing = await _load_snapshots(session, query_date)
        if _snapshots_complete(existing, expected) and _snapshot_is_fresh(
            existing, query_date
        ):
            return existing

        try:
            await _pg_advisory_lock(session, query_date)
            existing = await _load_snapshots(session, query_date)
            if _snapshots_complete(existing, expected) and _snapshot_is_fresh(
                existing, query_date
            ):
                return existing
            return await compute_and_store_daily_scores(session, query_date)
        except IntegrityError:
            await session.rollback()
            existing = await _load_snapshots(session, query_date)
            if _snapshots_complete(existing, expected):
                return existing
            raise


async def get_comuna_map_scores_for_date(
    session: AsyncSession, query_date: date
) -> list[dict]:
    rows = await get_or_compute_daily_scores(session, query_date)
    return [
        {"cod_comuna": r.cod_comuna, "composite_score": float(r.composite_score)}
        for r in rows
    ]


def _severity_label(composite: float) -> str:
    if composite >= 75:
        return "critico"
    if composite >= 55:
        return "alto"
    if composite >= 35:
        return "moderado"
    return "bajo"


async def get_national_risk_for_date(
    session: AsyncSession, query_date: date
) -> list[dict]:
    query_date = clamp_query_date(query_date)
    snapshots = await get_or_compute_daily_scores(session, query_date)

    comuna_regions = {
        row[0]: row[1]
        for row in (
            await session.execute(select(Comuna.cod_comuna, Comuna.codregion))
        ).all()
    }
    regions = (await session.execute(select(Region).order_by(Region.codregion))).scalars().all()

    by_region: dict[int, list[DailyRiskScore]] = {}
    for snap in snapshots:
        codregion = comuna_regions.get(snap.cod_comuna)
        if codregion is None:
            continue
        by_region.setdefault(codregion, []).append(snap)

    results: list[dict] = []
    for region in regions:
        scores = by_region.get(region.codregion, [])
        if not scores:
            continue

        agg = aggregate_region_scores(scores)
        composite, dominant = compute_composite_and_dominant(agg)

        results.append(
            {
                "codregion": region.codregion,
                "name": region.name,
                "composite_score": round(composite, 1),
                "dominant_hazard": dominant,
                "severity": _severity_label(composite),
                "sismo_score": agg["sismo"],
                "ola_calor_score": agg["ola_calor"],
                "ola_frio_score": agg["ola_frio"],
                "viento_score": agg["viento"],
                "comuna_count": len(scores),
            }
        )

    return results
