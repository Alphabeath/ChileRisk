"""Public read-only endpoints for the SERNAPRED simulacros calendar."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.schemas.simulacro import (
    DrillSource,
    DrillType,
    SimulacroBodyBlock,
    SimulacroDetailOut,
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


def _to_detail(row) -> SimulacroDetailOut:
    raw_blocks = row.detail_body or []
    blocks: list[SimulacroBodyBlock] = []
    for block in raw_blocks:
        if isinstance(block, dict):
            try:
                blocks.append(SimulacroBodyBlock.model_validate(block))
            except Exception:
                continue
    return SimulacroDetailOut(
        **_to_out(row).model_dump(),
        headline=row.headline,
        schedule_note=row.schedule_note,
        hero_image_url=row.hero_image_url,
        body_blocks=blocks,
    )


@router.get("", response_model=SimulacroListResponse)
@limiter.limit("60/minute")
async def list_simulacros_endpoint(
    request: Request,
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


@router.get("/next", response_model=SimulacroOut | None)
@limiter.limit("60/minute")
async def next_simulacro_endpoint(
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> SimulacroOut | None:
    row = await get_next_simulacro(session)
    if row is None:
        return None
    return _to_out(row)


@router.get("/{slug}", response_model=SimulacroDetailOut)
@limiter.limit("60/minute")
async def simulacro_detail_endpoint(
    request: Request,
    slug: str,
    session: AsyncSession = Depends(get_db),
) -> SimulacroDetailOut:
    row = await get_simulacro_by_slug(session, slug)
    if row is None:
        raise HTTPException(status_code=404, detail="Simulacro not found")
    return _to_detail(row)
