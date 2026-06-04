"""Comuna detail endpoints."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.climate_reading import ClimateReading
from app.models.comuna import Comuna
from app.models.seismic_event import SeismicEvent
from app.models.seismic_impact import SeismicImpact
from app.services.query_date_window import clamp_query_date, day_bounds_utc, today_chile
from app.services.risk_service import get_latest_risk_for_comuna

router = APIRouter()


@router.get("/{cod_comuna}/risk")
async def get_comuna_risk(
    cod_comuna: int,
    date: date | None = Query(
        default=None,
        description="Día calendario Chile para impacto sísmico en popup (YYYY-MM-DD).",
    ),
    db: AsyncSession = Depends(get_db),
):
    score = await get_latest_risk_for_comuna(db, cod_comuna)
    if not score:
        raise HTTPException(status_code=404, detail="No risk data for this comuna")

    comuna = await db.get(Comuna, cod_comuna)
    name = comuna.name if comuna else "Desconocida"

    reading = (
        await db.execute(
            select(ClimateReading)
            .where(ClimateReading.cod_comuna == cod_comuna)
            .order_by(ClimateReading.measured_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()

    query_date = clamp_query_date(date or today_chile())
    start, end = day_bounds_utc(query_date)
    impact_stmt = (
        select(
            SeismicImpact.event_id,
            SeismicImpact.distance_km,
            SeismicImpact.estimated_intensity,
            SeismicImpact.risk_score,
            SeismicEvent.magnitude,
            SeismicEvent.occurred_at,
            SeismicEvent.raw_data,
        )
        .join(SeismicEvent, SeismicEvent.id == SeismicImpact.event_id)
        .where(
            SeismicImpact.cod_comuna == cod_comuna,
            SeismicEvent.occurred_at >= start,
            SeismicEvent.occurred_at < end,
        )
        .order_by(SeismicImpact.risk_score.desc())
        .limit(1)
    )
    impact_row = (await db.execute(impact_stmt)).one_or_none()

    seismic_impact = None
    if impact_row:
        mapping = impact_row._mapping
        raw = mapping["raw_data"] or {}
        detail_url = raw.get("detail_url") if isinstance(raw.get("detail_url"), str) and raw["detail_url"].strip() else None
        seismic_impact = {
            "event_id": mapping["event_id"],
            "distance_km": mapping["distance_km"],
            "estimated_intensity": mapping["estimated_intensity"],
            "risk_score": mapping["risk_score"],
            "magnitude": mapping["magnitude"],
            "occurred_at": mapping["occurred_at"],
            "detail_url": detail_url,
        }

    return {
        "cod_comuna": cod_comuna,
        "name": name,
        "codregion": comuna.codregion if comuna else None,
        "sismo_score": score.sismo_score,
        "ola_calor_score": score.ola_calor_score,
        "ola_frio_score": score.ola_frio_score,
        "viento_score": score.viento_score,
        "composite_score": score.composite_score,
        "dominant_hazard": score.dominant_hazard,
        "severity": score.severity,
        "computed_at": score.computed_at,
        "temperature_c": reading.temperature_c if reading else None,
        "wind_speed_kmh": reading.wind_speed_kmh if reading else None,
        "seismic_impact": seismic_impact,
    }
