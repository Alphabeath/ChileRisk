"""Seismic events and impact endpoints."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.seismic_event import SeismicEvent
from app.services.seismic_service import (
    compute_sismo_score_for_comuna,
    estimate_intensity,
    haversine_km,
)

router = APIRouter()


@router.get("")
async def list_recent_events(hours: int = 48, db: AsyncSession = Depends(get_db)):
    """List recent seismic events (mock + future real sources)."""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    result = await db.execute(
        select(SeismicEvent)
        .where(SeismicEvent.occurred_at >= since)
        .order_by(SeismicEvent.occurred_at.desc())
    )
    events = result.scalars().all()
    return [
        {
            "id": e.id,
            "latitude": e.latitude,
            "longitude": e.longitude,
            "magnitude": e.magnitude,
            "depth_km": e.depth_km,
            "occurred_at": e.occurred_at,
            "source": e.source,
        }
        for e in events
    ]


@router.get("/{event_id}/impact")
async def get_event_impact(event_id: int, db: AsyncSession = Depends(get_db)):
    """Return estimated impact (risk score) on every comuna from one specific event."""
    event = await db.get(SeismicEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Seismic event not found")

    # For MVP we recompute on the fly using the attenuation model
    from app.models.comuna import Comuna

    comunas = (await db.execute(select(Comuna))).scalars().all()

    impacts = []
    ev_dict = {
        "latitude": event.latitude,
        "longitude": event.longitude,
        "magnitude": event.magnitude,
        "depth_km": event.depth_km,
        "occurred_at": event.occurred_at,
    }

    for c in comunas:
        if c.latitude is None or c.longitude is None:
            continue
        dist = haversine_km(c.latitude, c.longitude, event.latitude, event.longitude)
        intensity = estimate_intensity(event.magnitude, dist, event.depth_km)
        risk = compute_sismo_score_for_comuna(c.latitude, c.longitude, [ev_dict])

        impacts.append({
            "cod_comuna": c.cod_comuna,
            "name": c.name,
            "codregion": c.codregion,
            "distance_km": round(dist, 1),
            "estimated_intensity": round(intensity, 2),
            "risk_score": risk,
        })

    # Sort by risk descending so most affected appear first
    impacts.sort(key=lambda x: x["risk_score"], reverse=True)

    return {
        "event": {
            "id": event.id,
            "latitude": event.latitude,
            "longitude": event.longitude,
            "magnitude": event.magnitude,
            "depth_km": event.depth_km,
            "occurred_at": event.occurred_at,
            "source": event.source,
        },
        "affected_comunas": impacts[:50],  # cap for response size in MVP
        "total_affected": len(impacts),
    }
