"""Google OAuth identity resolution: strict token validation + legacy path."""

import pytest

import app.services.auth_service as auth_service
from app.config import settings
from app.services.auth_service import resolve_google_identity


def _claims(**overrides):
    claims = {
        "aud": "client-123",
        "email": "Persona@Test.com",
        "email_verified": True,
        "sub": "google-sub-1",
    }
    claims.update(overrides)
    return claims


@pytest.mark.asyncio
async def test_strict_mode_claims_override_client_values(monkeypatch):
    monkeypatch.setattr(settings, "google_client_id", "client-123")

    async def fake_tokeninfo(token):
        assert token == "id-token"
        return _claims()

    monkeypatch.setattr(auth_service, "_verify_google_id_token", fake_tokeninfo)

    email, sub = await resolve_google_identity(
        email="spoofed@evil.test",
        provider_account_id="spoofed",
        google_id_token="id-token",
    )
    assert email == "persona@test.com"
    assert sub == "google-sub-1"


@pytest.mark.asyncio
async def test_strict_mode_rejects_aud_mismatch(monkeypatch):
    monkeypatch.setattr(settings, "google_client_id", "client-123")

    async def fake_tokeninfo(token):
        return _claims(aud="other-client")

    monkeypatch.setattr(auth_service, "_verify_google_id_token", fake_tokeninfo)

    with pytest.raises(ValueError, match="invalid_google_token"):
        await resolve_google_identity(
            email="a@b.com", provider_account_id="x", google_id_token="tok"
        )


@pytest.mark.asyncio
async def test_strict_mode_rejects_unverified_email(monkeypatch):
    monkeypatch.setattr(settings, "google_client_id", "client-123")

    async def fake_tokeninfo(token):
        return _claims(email_verified=False)

    monkeypatch.setattr(auth_service, "_verify_google_id_token", fake_tokeninfo)

    with pytest.raises(ValueError, match="invalid_google_token"):
        await resolve_google_identity(
            email="a@b.com", provider_account_id="x", google_id_token="tok"
        )


@pytest.mark.asyncio
async def test_strict_mode_requires_token(monkeypatch):
    monkeypatch.setattr(settings, "google_client_id", "client-123")

    with pytest.raises(ValueError, match="missing_google_token"):
        await resolve_google_identity(
            email="a@b.com", provider_account_id="x", google_id_token=None
        )


@pytest.mark.asyncio
async def test_legacy_mode_keeps_trust_path(monkeypatch):
    monkeypatch.setattr(settings, "google_client_id", "")

    email, sub = await resolve_google_identity(
        email="A@B.com", provider_account_id="g-1", google_id_token=None
    )
    assert email == "a@b.com"
    assert sub == "g-1"
