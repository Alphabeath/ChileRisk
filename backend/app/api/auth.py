from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.schemas.auth import (
    AuthUserOut,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.services.auth_service import (
    login_user,
    register_user,
    request_password_reset,
    reset_password,
)

router = APIRouter()


def _to_auth_user(user) -> AuthUserOut:
    return AuthUserOut(id=user.id, email=user.email, name=user.name)


@router.post("/register", response_model=AuthUserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await register_user(
            db, name=body.name, email=body.email, password=body.password
        )
    except ValueError as exc:
        if str(exc) == "email_taken":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            ) from exc
        raise
    return _to_auth_user(user)


@router.post("/login", response_model=AuthUserOut)
@limiter.limit("20/minute")
async def login(
    request: Request,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await login_user(db, email=body.email, password=body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return _to_auth_user(user)


@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    await request_password_reset(db, email=body.email)


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/minute")
async def reset_password_endpoint(
    request: Request,
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    ok = await reset_password(
        db, email=body.email, token=body.token, password=body.password
    )
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
