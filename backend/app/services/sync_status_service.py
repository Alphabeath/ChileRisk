"""Record and query scheduler sync run outcomes."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sync_run import SyncRun

_ERROR_TEXT_MAX = 2000

JOB_IDS = (
    "risk_refresh",
    "csn_sync",
    "meteo_update",
    "senapred_sync",
    "simulacros_sync",
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def record_sync_run(
    session: AsyncSession,
    *,
    job_id: str,
    started_at: datetime,
    status: str,
    items_written: int = 0,
    error_text: str | None = None,
    partial: bool = False,
) -> SyncRun:
    truncated = None
    if error_text:
        truncated = error_text[:_ERROR_TEXT_MAX]
    row = SyncRun(
        job_id=job_id,
        started_at=started_at,
        finished_at=_utcnow(),
        status=status,
        items_written=items_written,
        error_text=truncated,
        partial=partial,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row


async def latest_sync_runs(session: AsyncSession) -> list[SyncRun]:
    """Return the newest SyncRun per known job_id (missing jobs omitted)."""
    results: list[SyncRun] = []
    for job_id in JOB_IDS:
        stmt = (
            select(SyncRun)
            .where(SyncRun.job_id == job_id)
            .order_by(SyncRun.finished_at.desc().nullslast(), SyncRun.id.desc())
            .limit(1)
        )
        row = (await session.execute(stmt)).scalar_one_or_none()
        if row is not None:
            results.append(row)
    return results
