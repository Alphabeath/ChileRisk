"""Authenticated user profile (home comuna preference)."""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.auth import CurrentUser, get_current_user
from app.core.limiter import limiter
from app.schemas.user_profile import UserProfileOut, UserProfileUpdate
from app.services.user_profile_service import get_user_profile, update_home_comuna

router = APIRouter()


@router.get("/me", response_model=UserProfileOut)
@limiter.limit("60/minute")
async def read_me(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> UserProfileOut:
    profile = await get_user_profile(db, user.id)
    if profile is None:
        raise HTTPException(status_code=404, detail="User not found")
    return profile


@router.patch("/me", response_model=UserProfileOut)
@limiter.limit("30/minute")
async def patch_me(
    request: Request,
    body: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> UserProfileOut:
    try:
        return await update_home_comuna(db, user.id, body.home_comuna_code)
    except ValueError as exc:
        code = str(exc)
        if code == "comuna_not_found":
            raise HTTPException(status_code=400, detail="Unknown comuna code") from exc
        raise HTTPException(status_code=404, detail="User not found") from exc
