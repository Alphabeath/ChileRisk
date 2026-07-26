"""Idempotent demo / hackathon user seed."""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.services.auth_service import hash_password

logger = logging.getLogger("chilerisk.auth")


async def ensure_demo_user(session: AsyncSession) -> User | None:
    """Create or refresh the hackathon demo account when SEED_DEMO_USER=true.

    Password is re-hashed each boot so DEMO_USER_PASSWORD always matches login.
    """
    if not settings.seed_demo_user:
        return None

    email = settings.demo_user_email.strip().lower()
    if not email or not settings.demo_user_password:
        logger.warning("SEED_DEMO_USER enabled but email/password empty — skipped")
        return None

    name = (settings.demo_user_name or "Demo ChileRisk").strip()
    home = settings.demo_user_home_comuna
    password_hash = hash_password(settings.demo_user_password)

    user = await session.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            email=email,
            name=name,
            password_hash=password_hash,
            home_comuna_code=home,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        logger.info("Seeded demo user %s (home_comuna=%s)", email, home)
        return user

    user.password_hash = password_hash
    if name:
        user.name = name
    if home is not None:
        user.home_comuna_code = home

    await session.commit()
    await session.refresh(user)
    logger.info("Refreshed demo user %s", email)
    return user
