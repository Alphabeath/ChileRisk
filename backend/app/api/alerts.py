from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.schemas.alert import ActiveAlertOut, AlertLevel, HazardType, RecordKind
from app.services.alert_service import list_active_alerts as list_active_alerts_service
from app.services.meteochile_aaa_service import build_active_zone_geojson
from app.services.query_date_window import clamp_query_date, today_chile

router = APIRouter()


@router.get("/active", response_model=list[ActiveAlertOut])
@limiter.limit("60/minute")
async def list_active_alerts(
    request: Request,
    session: AsyncSession = Depends(get_db),
    date: date | None = Query(
        default=None,
        description="Día calendario Chile (YYYY-MM-DD). Por defecto: hoy.",
    ),
    region: int | None = Query(default=None, ge=1, le=16, description="codregion (1-16)"),
    comuna: int | None = Query(
        default=None, description="cod_comuna: filtra por alcance comunal/regional"
    ),
    level: AlertLevel | None = Query(default=None, description="Filtrar por nivel"),
    kind: RecordKind | None = Query(
        default=None,
        alias="kind",
        description="alerta (ATP) | evento (Sismos y otros)",
    ),
    hazard: HazardType | None = Query(
        default=None,
        description="sismo | volcan | incendio | incendio_estructural | remocion | otros",
    ),
    include_content: bool = Query(
        default=False,
        description=(
            "Si true, incluye HTML/texto `content` (~MB). "
            "El monitor solo necesita metadatos; default false."
        ),
    ),
) -> list[ActiveAlertOut]:
    """Alertas activas: SERNAPRED + ChileRisk + SERNAGEOMIN + MeteoChile."""
    query_date = clamp_query_date(date or today_chile())
    alerts = await list_active_alerts_service(
        session,
        query_date=query_date,
        region=region,
        comuna=comuna,
        level=level,
        record_kind=kind,
        hazard=hazard,
    )
    if include_content:
        return alerts
    # Strip bulky HTML bodies — list UI uses title/level/geo, not content.
    return [a.model_copy(update={"content": None}) for a in alerts]


@router.get("/meteochile/zones")
@limiter.limit("60/minute")
async def list_meteochile_zone_geojson(
    request: Request,
    session: AsyncSession = Depends(get_db),
    date: date | None = Query(
        default=None,
        description="Solo disponible para hoy (franjas DMC vigentes).",
    ),
) -> dict:
    """GeoJSON de franjas DMC AAA activas (polígonos oficiales, no regiones CUT)."""
    query_date = clamp_query_date(date or today_chile())
    if query_date != today_chile():
        return {"type": "FeatureCollection", "features": []}
    return await build_active_zone_geojson(session)
