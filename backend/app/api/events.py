"""Seismic events and impact endpoints."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.models.seismic_event import SeismicEvent
from app.services.seismic_service import (
    compute_sismo_score_for_comuna,
    estimate_intensity,
    haversine_km,
)

router = APIRouter()


@router.get("")
@limiter.limit("60/minute")
async def list_recent_events(request: Request, hours: int = 48, db: AsyncSession = Depends(get_db)):
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
            "occurred_at_local": e.occurred_at_local,
            "source": e.source,
            "raw_data": e.raw_data,
        }
        for e in events
    ]


@router.get("/{event_id}/impact")
@limiter.limit("30/minute")
async def get_event_impact(request: Request, event_id: int, db: AsyncSession = Depends(get_db)):
    """Return estimated impact (risk score) on every comuna from one specific event."""
    event = await db.get(SeismicEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Seismic event not found")

    from app.models.comuna import Comuna
    from app.models.seismic_impact import SeismicImpact

    precomputed = (
        await db.execute(
            select(SeismicImpact)
            .where(SeismicImpact.event_id == event_id)
            .order_by(SeismicImpact.risk_score.desc())
        )
    ).scalars().all()

    if precomputed:
        comuna_ids = [imp.cod_comuna for imp in precomputed]
        comunas = (await db.execute(select(Comuna).where(Comuna.cod_comuna.in_(comuna_ids)))).scalars().all()
        comuna_map = {c.cod_comuna: c for c in comunas}

        impacts = []
        for imp in precomputed:
            c = comuna_map.get(imp.cod_comuna)
            impacts.append({
                "cod_comuna": imp.cod_comuna,
                "name": c.name if c else "Desconocida",
                "codregion": c.codregion if c else None,
                "distance_km": imp.distance_km,
                "estimated_intensity": imp.estimated_intensity,
                "risk_score": imp.risk_score,
            })

        return {
            "event": {
                "id": event.id,
                "latitude": event.latitude,
                "longitude": event.longitude,
                "magnitude": event.magnitude,
                "depth_km": event.depth_km,
                "occurred_at": event.occurred_at,
                "occurred_at_local": event.occurred_at_local,
                "source": event.source,
                "raw_data": event.raw_data,
            },
            "affected_comunas": impacts[:50],
            "total_affected": len(impacts),
        }

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
        if intensity < 3.0:
            continue
        risk = compute_sismo_score_for_comuna(c.latitude, c.longitude, [ev_dict])

        impacts.append({
            "cod_comuna": c.cod_comuna,
            "name": c.name,
            "codregion": c.codregion,
            "distance_km": round(dist, 1),
            "estimated_intensity": round(intensity, 2),
            "risk_score": risk,
        })

    impacts.sort(key=lambda x: x["risk_score"], reverse=True)

    return {
        "event": {
            "id": event.id,
            "latitude": event.latitude,
            "longitude": event.longitude,
            "magnitude": event.magnitude,
            "depth_km": event.depth_km,
            "occurred_at": event.occurred_at,
            "occurred_at_local": event.occurred_at_local,
            "source": event.source,
            "raw_data": event.raw_data,
        },
        "affected_comunas": impacts[:50],
        "total_affected": len(impacts),
    }
