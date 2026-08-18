"""Email/password accounts: register, login, reset, profile."""

from datetime import datetime, timezone

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.models  # noqa: F401 — register ORM metadata
from app.database import Base
from app.models.comuna import Comuna
from app.models.region import Region
from app.schemas.user_profile import UserProfileUpdate
from app.services.auth_service import (
    login_user,
    register_user,
    request_password_reset,
    reset_password,
)
from app.services.user_profile_service import get_user_profile, update_user_profile


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as s:
        yield s
    await engine.dispose()


@pytest.mark.asyncio
async def test_register_and_login(session):
    user = await register_user(
        session, name="Ana Pérez", email="A@B.com", password="secret12"
    )
    assert user.email == "a@b.com"
    assert user.name == "Ana Pérez"
    assert user.password_hash
    assert user.notify_email_alerts is True

    ok = await login_user(session, email="a@b.com", password="secret12")
    assert ok is not None
    assert ok.id == user.id

    assert await login_user(session, email="a@b.com", password="wrongpass") is None


@pytest.mark.asyncio
async def test_register_duplicate_email(session):
    await register_user(session, name="Ana", email="ana@x.cl", password="secret12")
    with pytest.raises(ValueError, match="email_taken"):
        await register_user(session, name="Otra", email="ANA@x.cl", password="secret12")


@pytest.mark.asyncio
async def test_password_reset_roundtrip(session, monkeypatch):
    await register_user(session, name="Ana", email="ana@x.cl", password="oldpass12")
    monkeypatch.setattr(
        "app.services.auth_service.secrets.token_urlsafe", lambda n: "fixed-token"
    )
    sent: dict[str, str] = {}

    async def fake_send(to_email: str, reset_url: str) -> None:
        sent["to"] = to_email
        sent["url"] = reset_url

    monkeypatch.setattr("app.services.auth_service._send_reset_email", fake_send)

    await request_password_reset(session, email="ana@x.cl")
    assert sent["to"] == "ana@x.cl"
    assert "token=fixed-token" in sent["url"]
    assert "/restablecer-contrasena" in sent["url"]

    ok = await reset_password(
        session, email="ana@x.cl", token="fixed-token", password="newpass12"
    )
    assert ok is True
    assert await login_user(session, email="ana@x.cl", password="newpass12") is not None
    assert await login_user(session, email="ana@x.cl", password="oldpass12") is None

    reused = await reset_password(
        session, email="ana@x.cl", token="fixed-token", password="thirdpass"
    )
    assert reused is False


@pytest.mark.asyncio
async def test_update_profile_name_comuna_and_notify(session):
    session.add(Region(codregion=13, name="Metropolitana"))
    session.add(
        Comuna(cod_comuna=13101, name="Santiago", provincia="Santiago", codregion=13)
    )
    await session.commit()

    user = await register_user(
        session, name="Ana", email="ana@x.cl", password="secret12"
    )
    updated = await update_user_profile(
        session,
        user.id,
        UserProfileUpdate(
            name="Ana Ríos",
            home_comuna_code=13101,
            notify_email_alerts=False,
            notify_email_simulacros=True,
        ),
    )
    assert updated.name == "Ana Ríos"
    assert updated.home_comuna_code == 13101
    assert updated.home_comuna_name == "Santiago"
    assert updated.notify_email_alerts is False
    assert updated.notify_email_simulacros is True

    profile = await get_user_profile(session, user.id)
    assert profile is not None
    assert profile.notify_email_alerts is False


@pytest.mark.asyncio
async def test_update_profile_unknown_comuna(session):
    user = await register_user(
        session, name="Ana", email="ana@x.cl", password="secret12"
    )
    with pytest.raises(ValueError, match="comuna_not_found"):
        await update_user_profile(
            session, user.id, UserProfileUpdate(home_comuna_code=13101)
        )
