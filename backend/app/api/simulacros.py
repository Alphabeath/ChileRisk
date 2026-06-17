"""Public read-only endpoints for the SERNAPRED simulacros calendar."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.simulacro import (
    DrillSource,
    DrillType,
    SimulacroListResponse,
    SimulacroOut,
)
from app.services.simulacro_service import (
    get_next_simulacro,
    get_simulacro_by_slug,
    list_simulacros,
)

router = APIRouter()


def _to_out(row) -> SimulacroOut:
    return SimulacroOut.model_validate(row)


@router.get("", response_model=SimulacroListResponse)
async def list_simulacros_endpoint(
    session: AsyncSession = Depends(get_db),
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
    region: int | None = Query(default=None, ge=1, le=16, description="codregion (1-16)"),
    drill_type: DrillType | None = Query(default=None, alias="type"),
    source: DrillSource | None = Query(default=None, description="future | recent | archive"),
    upcoming_only: bool = Query(default=False),
    past_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> SimulacroListResponse:
    """List SERNAPRED simulacros (drills) with optional filters."""
    today = date.today()
    if upcoming_only and not from_date:
        from_date = today
    if past_only and not to_date:
        to_date = today
    rows, total, synced = await list_simulacros(
        session,
        from_date=from_date,
        to_date=to_date,
        region=region,
        drill_type=drill_type,
        source=source,
        limit=limit,
        offset=offset,
    )
    return SimulacroListResponse(
        items=[_to_out(r) for r in rows],
        total=total,
        next_synced_at=synced,
    )