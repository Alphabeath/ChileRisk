import asyncio
import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import httpx
import resend
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.oauth_account import OAuthAccount
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User

logger = logging.getLogger("chilerisk.auth")

RESET_TOKEN_TTL_HOURS = 1

_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


async def _verify_google_id_token(token: str | None) -> dict | None:
    """Validate a Google ID token server-side (Google verifies signature+exp)."""
    if not token:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(_TOKENINFO_URL, params={"id_token": token})
    except httpx.HTTPError:
        logger.exception("Google tokeninfo request failed")
        return None
    if resp.status_code != 200:
        return None
    return resp.json()


async def resolve_google_identity(
    *,
    email: str,
    provider_account_id: str,
    google_id_token: str | None,
) -> tuple[str, str]:
    """Return (normalized_email, provider_account_id).

    With GOOGLE_CLIENT_ID configured (strict mode), the ID token is validated
    against Google and the claims override the client-supplied values. Without
    it, the legacy trust path is kept (Next.js/Auth.js already validated the
    token server-side).
    """
    if not settings.google_client_id:
        return email.strip().lower(), provider_account_id

    if not google_id_token:
        raise ValueError("missing_google_token")
    claims = await _verify_google_id_token(google_id_token)
    if claims is None:
        raise ValueError("invalid_google_token")
    if claims.get("aud") != settings.google_client_id:
        logger.warning("Google token aud mismatch: %r", claims.get("aud"))
        raise ValueError("invalid_google_token")
    if claims.get("email_verified") is not True:
        raise ValueError("invalid_google_token")
    claims_email = claims.get("email")
    claims_sub = claims.get("sub")
    if not isinstance(claims_email, str) or not isinstance(claims_sub, str):
        raise ValueError("invalid_google_token")
    return claims_email.strip().lower(), claims_sub


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


async def verify_user_credentials(
    session: AsyncSession, *, email: str, password: str
) -> User | None:
    normalized_email = email.strip().lower()
    user = await session.scalar(select(User).where(User.email == normalized_email))
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


async def upsert_google_user(
    session: AsyncSession,
    *,
    email: str,
    name: str | None,
    provider_account_id: str,
) -> User:
    normalized_email = email.strip().lower()
    account = await session.scalar(
        select(OAuthAccount).where(
            OAuthAccount.provider == "google",
            OAuthAccount.provider_account_id == provider_account_id,
        )
    )
    if account:
        user = await session.get(User, account.user_id)
        if user is None:
            raise ValueError("oauth_orphan")
        if name and not user.name:
            user.name = name.strip()
            await session.commit()
            await session.refresh(user)
        return user

    user = await session.scalar(select(User).where(User.email == normalized_email))
    if user is None:
        user = User(email=normalized_email, name=(name or "").strip() or None)
        session.add(user)
        await session.flush()
    else:
        linked = await session.scalar(
            select(OAuthAccount).where(
                OAuthAccount.user_id == user.id,
                OAuthAccount.provider == "google",
            )
        )
        if linked:
            return user

    session.add(
        OAuthAccount(
            provider="google",
            provider_account_id=provider_account_id,
            user_id=user.id,
        )
    )
    await session.commit()
    await session.refresh(user)
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
        f"{settings.auth_url.rstrip('/')}/reset-password"
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
        # resend SDK is sync HTTP — offload to the threadpool to keep the loop free.
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
        # 204 always: never leak whether the email exists.
        logger.exception("Failed to send password reset email to %s", to_email)