from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.schemas.alert import ActiveAlertOut, AlertLevel
from app.services.alert_service import list_active_alerts as list_active_alerts_service

router = APIRouter()


@router.get("/active", response_model=list[ActiveAlertOut])
@limiter.limit("60/minute")
async def list_active_alerts(
    request: Request,
    session: AsyncSession = Depends(get_db),
    region: int | None = Query(default=None, ge=1, le=16, description="codregion (1-16)"),
    level: AlertLevel | None = Query(default=None, description="Filtrar por nivel"),
) -> list[ActiveAlertOut]:
    """Alertas activas: SERNAPRED (oficial) + ChileRisk (algoritmo de riesgo por región).

    Filtros opcionales:
    - region: codregion (1-16)
    - level: preventiva | amarilla | naranja | roja
    """
    return await list_active_alerts_service(session, region=region, level=level)