"""Citizen dashboard summary (AI-generated)."""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.auth import CurrentUser, get_current_user
from app.core.limiter import limiter
from app.schemas.dashboard import DashboardSummaryOut
from app.services.dashboard_service import get_dashboard_summary

router = APIRouter()


@router.get("/summary", response_model=DashboardSummaryOut)
@limiter.limit("60/minute")
async def read_dashboard_summary(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> DashboardSummaryOut:
    return await get_dashboard_summary(db, user.id)
