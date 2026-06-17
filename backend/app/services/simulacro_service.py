"""Read helpers for SERNAPRED simulacros stored in the local DB."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.simulacro import Simulacro
from app.services.simulacro_sync import sync_simulacros

__all__ = [
    "get_next_simulacro",
    "get_simulacro_by_slug",
    "list_simulacros",
    "prune_old_simulacros",
    "sync_simulacros",
]


def _apply_filters(
    stmt,
    *,
    from_date: date | None,
    to_date: date | None,
    region: int | None,
    drill_type: str | None,
    source: str | None,
):
    if from_date is not None:
        stmt = stmt.where(Simulacro.drill_date >= from_date)
    if to_date is not None:
        stmt = stmt.where(Simulacro.drill_date <= to_date)
    if region is not None:
        stmt = stmt.where(Simulacro.region_code == region)
    if drill_type is not None:
        stmt = stmt.where(Simulacro.drill_type == drill_type)
    if source is not None:
        stmt = stmt.where(Simulacro.source == source)
    return stmt


async def list_simulacros(
    session: AsyncSession,
    *,
    from_date: date | None = None,
    to_date: date | None = None,
    region: int | None = None,
    drill_type: str | None = None,
    source: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Simulacro], int, datetime | None]:
    base = select(Simulacro)
    base = _apply_filters(
        base,
        from_date=from_date,
        to_date=to_date,
        region=region,
        drill_type=drill_type,
        source=source,
    )

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    list_stmt = base.order_by(Simulacro.drill_date.asc()).limit(limit).offset(offset)
    rows = (await session.execute(list_stmt)).scalars().all()

    sync_stmt = select(func.max(Simulacro.synced_at))
    next_sync = (await session.execute(sync_stmt)).scalar_one_or_none()
    return list(rows), total, next_sync


async def get_next_simulacro(session: AsyncSession) -> Simulacro | None:
    today = datetime.now(timezone.utc).date()
    stmt = (
        select(Simulacro)
        .where(Simulacro.drill_date >= today)
        .order_by(Simulacro.drill_date.asc(), Simulacro.id.asc())
        .limit(1)
    )
    return (await session.execute(stmt)).scalars().first()


async def get_simulacro_by_slug(session: AsyncSession, slug: str) -> Simulacro | None:
    stmt = select(Simulacro).where(Simulacro.slug == slug)
    return (await session.execute(stmt)).scalars().first()


async def prune_old_simulacros(session: AsyncSession, *, lookback_days: int) -> int:
    cutoff = datetime.now(timezone.utc).date() - timedelta(days=lookback_days)
    result = await session.execute(
        delete(Simulacro).where(Simulacro.drill_date < cutoff)
    )
    deleted = result.rowcount or 0
    if deleted:
        await session.commit()
    return deleted