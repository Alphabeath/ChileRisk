"""User profile helpers (home comuna preference)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comuna import Comuna
from app.models.user import User
from app.schemas.user_profile import UserProfileOut


async def get_user_profile(session: AsyncSession, user_id: str) -> UserProfileOut | None:
    user = await session.get(User, user_id)
    if user is None:
        return None
    name = None
    if user.home_comuna_code is not None:
        comuna = await session.get(Comuna, user.home_comuna_code)
        name = comuna.name if comuna else None
    return UserProfileOut(
        id=user.id,
        email=user.email,
        name=user.name,
        home_comuna_code=user.home_comuna_code,
        home_comuna_name=name,
    )


async def update_home_comuna(
    session: AsyncSession, user_id: str, home_comuna_code: int | None
) -> UserProfileOut:
    user = await session.get(User, user_id)
    if user is None:
        raise ValueError("user_not_found")

    if home_comuna_code is not None:
        comuna = await session.get(Comuna, home_comuna_code)
        if comuna is None:
            raise ValueError("comuna_not_found")

    user.home_comuna_code = home_comuna_code
    await session.commit()
    await session.refresh(user)
    profile = await get_user_profile(session, user_id)
    assert profile is not None
    return profile


async def resolve_comuna_code(
    session: AsyncSession,
    *,
    user_id: str,
    explicit: int | None = None,
    lat: float | None = None,
    lon: float | None = None,
) -> int | None:
    """Resolve comuna: explicit → GPS nearest → home preference."""
    if explicit is not None:
        return explicit
    if lat is not None and lon is not None:
        from app.services.seismic_alert_match import nearest_comuna

        found = await nearest_comuna(session, lat, lon)
        if found is not None:
            return found[0].cod_comuna
    result = await session.execute(select(User.home_comuna_code).where(User.id == user_id))
    return result.scalar_one_or_none()
