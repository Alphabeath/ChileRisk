from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.auth import CurrentUser, get_current_user
from app.core.limiter import limiter
from app.schemas.family_plan import FamilyPlanOut, FamilyPlanUpsertRequest
from app.services.family_plan_service import get_family_plan, upsert_family_plan

router = APIRouter()


@router.get("", response_model=FamilyPlanOut)
@limiter.limit("60/minute")
async def read_family_plan(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    return await get_family_plan(db, user.id)


@router.put("", response_model=FamilyPlanOut)
@limiter.limit("60/minute")
async def write_family_plan(
    request: Request,
    body: FamilyPlanUpsertRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    return await upsert_family_plan(db, user.id, body.data)