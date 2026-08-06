"""Aire Chile GEC air-quality endpoints (official episode conditions)."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.schemas.air_quality import AirQualityListResponse, AirQualityZoneOut
from app.services.airechile_service import (
    get_airechile_by_comuna,
    get_airechile_zone,
    list_airechile_for_date,
)
from app.services.airechile_zones import AIRECHILE_LEVEL_RANK, get_zone
from app.services.query_date_window import clamp_query_date, today_chile

router = APIRouter()


def _resolve_date(value: date | None) -> date:
    return clamp_query_date(value) if value is not None else today_chile()


def _to_out(row) -> AirQualityZoneOut:
    return AirQualityZoneOut.model_validate(row)


@router.get("", response_model=AirQualityListResponse)
@limiter.limit("60/minute")
async def list_air_quality(
    request: Request,
    session: AsyncSession = Depends(get_db),
    date_param: date | None = Query(default=None, alias="date"),
    region: int | None = Query(default=None, ge=1, le=16),
    episode_only: bool = Query(
        default=False,
        description="If true, only zones with level ≥ alerta",
    ),
) -> AirQualityListResponse:
    """List Aire Chile GEC zone conditions for a Chile calendar day."""
    d = _resolve_date(date_param)
    min_rank = AIRECHILE_LEVEL_RANK["alerta"] if episode_only else None
    rows = await list_airechile_for_date(
        session,
        condition_date=d,
        region=region,
        min_level_rank=min_rank,
    )
    return AirQualityListResponse(
        items=[_to_out(r) for r in rows],
        total=len(rows),
        condition_date=d,
    )


@router.get("/by-comuna/{cod_comuna}", response_model=AirQualityZoneOut)
@limiter.limit("60/minute")
async def air_quality_by_comuna(
    request: Request,
    cod_comuna: int,
    session: AsyncSession = Depends(get_db),
    date_param: date | None = Query(default=None, alias="date"),
) -> AirQualityZoneOut:
    """Lookup GEC condition for a CUT comuna (404 if not in a GEC zone)."""
    d = _resolve_date(date_param)
    row = await get_airechile_by_comuna(
        session, cod_comuna=cod_comuna, condition_date=d
    )
    if not row:
        raise HTTPException(
            status_code=404,
            detail="Comuna not covered by Aire Chile GEC zones or no snapshot for date",
        )
    return _to_out(row)


@router.get("/{slug}", response_model=AirQualityZoneOut)
@limiter.limit("60/minute")
async def air_quality_zone(
    request: Request,
    slug: str,
    session: AsyncSession = Depends(get_db),
    date_param: date | None = Query(default=None, alias="date"),
) -> AirQualityZoneOut:
    """Detail for one Aire Chile zone slug."""

    if not get_zone(slug):
        raise HTTPException(status_code=404, detail="Unknown Aire Chile zone slug")
    d = _resolve_date(date_param)
    row = await get_airechile_zone(session, slug=slug, condition_date=d)
    if not row:
        raise HTTPException(
            status_code=404,
            detail="No Aire Chile snapshot for this zone and date",
        )
    return _to_out(row)
