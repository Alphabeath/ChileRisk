"""SQLite async session tests: region risk query (no N+1)."""

from datetime import datetime, timezone

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.database import Base
from app.models.comuna import Comuna
from app.models.region import Region
from app.models.risk_score import RiskScore
from app.services.risk_service import get_latest_risks_for_region


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
async def test_get_latest_risks_for_region_returns_latest_per_comuna(session):
    session.add(Region(codregion=13, name="Metropolitana"))
    session.add(Region(codregion=5, name="Valparaíso"))
    session.add(Comuna(cod_comuna=13101, name="Santiago", provincia="Santiago", codregion=13))
    session.add(Comuna(cod_comuna=13102, name="Cerrillos", provincia="Santiago", codregion=13))
    session.add(Comuna(cod_comuna=5101, name="Valparaíso", provincia="Valparaíso", codregion=5))

    t1 = datetime(2026, 7, 1, tzinfo=timezone.utc)
    t2 = datetime(2026, 7, 2, tzinfo=timezone.utc)
    session.add(RiskScore(cod_comuna=13101, composite_score=10.0, severity="bajo", computed_at=t1))
    session.add(RiskScore(cod_comuna=13101, composite_score=80.0, severity="critico", computed_at=t2))
    session.add(RiskScore(cod_comuna=13102, composite_score=40.0, severity="moderado", computed_at=t2))
    await session.commit()

    scores = await get_latest_risks_for_region(session, 13)

    assert [s.cod_comuna for s in scores] == [13101, 13102]
    by_comuna = {s.cod_comuna: s for s in scores}
    assert by_comuna[13101].composite_score == 80.0
    assert by_comuna[13101].severity == "critico"
    assert by_comuna[13102].composite_score == 40.0


@pytest.mark.asyncio
async def test_get_latest_risks_for_region_empty_region(session):
    session.add(Region(codregion=15, name="Arica y Parinacota"))
    await session.commit()

    scores = await get_latest_risks_for_region(session, 15)

    assert scores == []
