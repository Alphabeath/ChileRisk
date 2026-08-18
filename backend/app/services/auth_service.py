import asyncio
import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import resend
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User

logger = logging.getLogger("chilerisk.auth")

RESET_TOKEN_TTL_HOURS = 1


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def register_user(
    session: AsyncSession, *, name: str, email: str, password: str
) -> User:
    normalized_email = email.strip().lower()
    existing = await session.scalar(select(User).where(User.email == normalized_email))
    if existing:
        raise ValueError("email_taken")

    user = User(
        email=normalized_email,
        name=name.strip(),
        password_hash=hash_password(password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def login_user(
    session: AsyncSession, *, email: str, password: str
) -> User | None:
    normalized_email = email.strip().lower()
    user = await session.scalar(select(User).where(User.email == normalized_email))
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


async def request_password_reset(session: AsyncSession, *, email: str) -> None:
    normalized_email = email.strip().lower()
    user = await session.scalar(select(User).where(User.email == normalized_email))
    if user is None:
        return

    raw_token = secrets.token_urlsafe(32)
    token = PasswordResetToken(
        token_hash=_hash_reset_token(raw_token),
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_TTL_HOURS),
    )
    session.add(token)
    await session.commit()

    reset_url = (
        f"{settings.auth_url.rstrip('/')}/restablecer-contrasena"
        f"?token={raw_token}&email={normalized_email}"
    )
    await _send_reset_email(normalized_email, reset_url)


async def reset_password(
    session: AsyncSession, *, email: str, token: str, password: str
) -> bool:
    normalized_email = email.strip().lower()
    user = await session.scalar(select(User).where(User.email == normalized_email))
    if user is None:
        return False

    token_hash = _hash_reset_token(token)
    now = datetime.now(timezone.utc)
    reset_row = await session.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        )
    )
    if reset_row is None:
        return False

    user.password_hash = hash_password(password)
    reset_row.used_at = now
    await session.commit()
    return True


async def _send_reset_email(to_email: str, reset_url: str) -> None:
    if not settings.resend_api_key:
        logger.warning("Password reset link for %s: %s", to_email, reset_url)
        return

    resend.api_key = settings.resend_api_key

    def _send_sync() -> None:
        resend.Emails.send(
            {
                "from": settings.auth_email_from,
                "to": [to_email],
                "subject": "Recupera tu contraseña — ChileRisk",
                "html": (
                    "<p>Recibimos una solicitud para restablecer tu contraseña.</p>"
                    f'<p><a href="{reset_url}">Restablecer contraseña</a></p>'
                    "<p>Si no solicitaste esto, ignora este correo.</p>"
                ),
            }
        )

    try:
        await asyncio.to_thread(_send_sync)
    except Exception:
        logger.exception("Failed to send password reset email to %s", to_email)
