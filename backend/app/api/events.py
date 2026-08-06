"""Seismic events and impact endpoints."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.models.seismic_event import SeismicEvent
from app.schemas.event import SeismicEventResponse, SeismicImpactResponse
from app.services.impact_service import get_event_impact as get_event_impact_service
from app.services.query_date_window import clamp_query_date, day_bounds_utc, today_chile
from app.services.seismic_event_utils import event_to_response as event_to_response_async

router = APIRouter()


@router.get("", response_model=list[SeismicEventResponse])
@limiter.limit("60/minute")
async def list_recent_events(
    request: Request,
    date: date | None = Query(
        default=None,
        description="Día calendario Chile (YYYY-MM-DD). Por defecto: hoy.",
    ),
    db: AsyncSession = Depends(get_db),
) -> list[SeismicEventResponse]:
    """List seismic events for one calendar day (Chile timezone)."""
    query_date = clamp_query_date(date or today_chile())
    start, end = day_bounds_utc(query_date)
    result = await db.execute(
        select(SeismicEvent)
        .where(
            SeismicEvent.occurred_at >= start,
            SeismicEvent.occurred_at < end,
        )
        .order_by(SeismicEvent.occurred_at.desc())
    )
    events = result.scalars().all()
    return [await event_to_response_async(e, db) for e in events]


@router.get("/{event_id}/impact", response_model=SeismicImpactResponse)
@limiter.limit("30/minute")
async def get_event_impact(
    request: Request,
    event_id: int = Path(ge=1),
    db: AsyncSession = Depends(get_db),
) -> SeismicImpactResponse:
    """Return estimated impact (risk score) on every comuna from one specific event."""
    event = await db.get(SeismicEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Seismic event not found")
    return await get_event_impact_service(db, event)
