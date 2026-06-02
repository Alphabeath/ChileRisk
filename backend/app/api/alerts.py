from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.config import settings
from app.core.limiter import limiter
from app.models.senapred_alert import SenapredAlert
from app.schemas.alert import AlertLevel, SenapredAlertOut

router = APIRouter()


@router.get("/active", response_model=list[SenapredAlertOut])
@limiter.limit("60/minute")
async def list_active_alerts(
    request: Request,
    session: AsyncSession = Depends(get_db),
    region: int | None = Query(default=None, ge=1, le=16, description="codregion (1-16)"),
    level: AlertLevel | None = Query(default=None, description="Filtrar por nivel"),
) -> list[SenapredAlertOut]:
    """Lista las alertas activas de SERNAPRED sincronizadas en la última corrida.

    Filtros opcionales:
    - region: codregion (1-16)
    - level: preventiva | amarilla | naranja | roja
    """
    stmt = (
        select(SenapredAlert)
        .where(SenapredAlert.is_active.is_(True))
        .order_by(SenapredAlert.senapred_issued_at.desc())
    )
    if region is not None:
        stmt = stmt.where(SenapredAlert.region_code == region)
    if level is not None:
        stmt = stmt.where(SenapredAlert.level == level)
    stmt = stmt.limit(200)

    result = await session.execute(stmt)
    rows = result.scalars().all()

    return [
        SenapredAlertOut(
            id=r.senapred_id,
            level=r.level,
            category=r.category,
            title=r.title,
            content=r.content,
            url_access=r.url_access,
            senapred_url=(
                f"{settings.senapred_alert_base_url}{r.url_access}"
                if r.url_access
                else None
            ),
            issued_at=r.senapred_issued_at,
            synced_at=r.synced_at,
            region_code=r.region_code,
            region_name=r.region_name,
            is_monitor=r.is_monitor,
            parent_id=r.parent_id,
        )
        for r in rows
    ]
