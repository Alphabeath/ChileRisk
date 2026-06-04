from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.schemas.risk import ComunaMapScore
from app.services.daily_risk_service import (
    get_comuna_map_scores_for_date,
    get_national_risk_for_date,
)
from app.services.query_date_window import clamp_query_date, today_chile

router = APIRouter()


@router.get("/national", response_model=list[dict])
@limiter.limit("100/minute")
async def get_national_risk(
    request: Request,
    date: date | None = Query(
        default=None,
        description="Día calendario Chile (YYYY-MM-DD). Por defecto: hoy.",
    ),
    db: AsyncSession = Depends(get_db),
):
    query_date = clamp_query_date(date or today_chile())
    return await get_national_risk_for_date(db, query_date)


@router.get("/comunas", response_model=list[ComunaMapScore])
@limiter.limit("100/minute")
async def get_comuna_map_scores(
    request: Request,
    date: date | None = Query(
        default=None,
        description="Día calendario Chile (YYYY-MM-DD). Por defecto: hoy.",
    ),
    db: AsyncSession = Depends(get_db),
):
    """Lightweight scores for map coloring (composite_score per comuna)."""
    query_date = clamp_query_date(date or today_chile())
    data = await get_comuna_map_scores_for_date(db, query_date)
    return data