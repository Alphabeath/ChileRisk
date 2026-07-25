"""Nearest official evacuation meeting points."""

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.schemas.meeting_point import MeetingPointNearestResponse
from app.services.meeting_point_service import find_nearest_meeting_points

router = APIRouter()


@router.get("/nearest", response_model=MeetingPointNearestResponse)
@limiter.limit("60/minute")
async def nearest_meeting_points(
    request: Request,
    lat: float = Query(..., ge=-56.0, le=-17.0),
    lon: float = Query(..., ge=-76.0, le=-66.0),
    hazard: str | None = Query(default=None, pattern="^(tsunami|volcanic)$"),
    limit: int = Query(default=5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
) -> MeetingPointNearestResponse:
    items, total = await find_nearest_meeting_points(
        db, lat=lat, lon=lon, hazard=hazard, limit=limit
    )
    return MeetingPointNearestResponse(
        items=items,
        origin_lat=lat,
        origin_lon=lon,
        hazard=hazard,
        total_candidates=total,
    )
