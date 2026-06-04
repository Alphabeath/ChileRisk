"""Seismic events and impact endpoints."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.models.seismic_event import SeismicEvent
from app.services.query_date_window import clamp_query_date, day_bounds_utc, today_chile
from app.services.seismic_event_utils import event_to_response as event_to_response_async
from app.services.seismic_service import (
    compute_sismo_score_for_comuna,
    estimate_intensity,
    haversine_km,
)

router = APIRouter()


@router.get("")
@limiter.limit("60/minute")
async def list_recent_events(
    request: Request,
    date: date | None = Query(
        default=None,
        description="Día calendario Chile (YYYY-MM-DD). Por defecto: hoy.",
    ),
    db: AsyncSession = Depends(get_db),
):
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
    out = []
    for e in events:
        out.append((await event_to_response_async(e, db)).model_dump())
    return out


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
            "event": (await event_to_response_async(event, db)).model_dump(),
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
        "event": (await event_to_response_async(event, db)).model_dump(),
        "affected_comunas": impacts[:50],
        "total_affected": len(impacts),
    }


@router.get("/artificial")
@limiter.limit("10/minute")
async def create_artificial_event(request: Request, mag: float = 6.1, lat: float = -33.45, lon: float = -70.65, depth: float = 25.0, db: AsyncSession = Depends(get_db)):
    from app.services.mock_service import generate_artificial_seismic_event
    from app.services.risk_service import recompute_all_scores
    ev = await generate_artificial_seismic_event(db, mag, lat, lon, depth)
    await recompute_all_scores(db)
    from app.services.region_service import _national_cache, _region_cache
    _national_cache.clear()
    _region_cache.clear()
    return (await event_to_response_async(ev, db)).model_dump()