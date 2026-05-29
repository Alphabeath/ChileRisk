"""
Mock data generators for ChileRisk MVP.

All values are synthetic but realistic enough for development and demos.
"""

import math
import random
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comuna import Comuna
from app.models.risk_score import RiskScore
from app.models.seismic_event import SeismicEvent
from app.services.seismic_service import compute_sismo_score_for_comuna


HAZARDS = ["sismo", "ola_calor", "ola_frio", "viento"]


def _zone_biases(codregion: int) -> dict[str, float]:
    """
    Very rough climatic + seismic bias per Chilean region group.
    Returns base scores (0-100) before noise.
    """
    # North: hot, arid, high sismo
    if codregion <= 4:
        return {"sismo": 55, "ola_calor": 72, "ola_frio": 8, "viento": 45}
    # Norte Chico / Coquimbo
    if codregion == 5:
        return {"sismo": 48, "ola_calor": 58, "ola_frio": 18, "viento": 52}
    # Central (Valpo, RM, O'Higgins, Maule): high sismo, moderate everything
    if codregion in (6, 7, 8, 9):
        return {"sismo": 68, "ola_calor": 42, "ola_frio": 22, "viento": 38}
    # Ñuble / Biobio
    if codregion in (10, 11):
        return {"sismo": 52, "ola_calor": 28, "ola_frio": 38, "viento": 55}
    # South (Araucania, Los Rios, Los Lagos): colder, windier
    if codregion in (12, 13, 14):
        return {"sismo": 38, "ola_calor": 15, "ola_frio": 58, "viento": 62}
    # Extreme south + Aysen / Magallanes: cold + very windy
    return {"sismo": 25, "ola_calor": 8, "ola_frio": 78, "viento": 75}


def generate_baseline_scores(codregion: int, seed: int | None = None) -> dict[str, float]:
    """Generate stable baseline scores for a comuna."""
    if seed is not None:
        random.seed(seed)

    base = _zone_biases(codregion)
    noise = 6.0  # +/- 6 points

    scores: dict[str, float] = {}
    for h in HAZARDS:
        val = base[h] + random.uniform(-noise, noise)
        scores[h] = round(max(5.0, min(95.0, val)), 1)
    return scores


def compute_composite_and_dominant(scores: dict[str, float]) -> tuple[float, str]:
    """Simple average composite + argmax dominant hazard."""
    composite = sum(scores.values()) / len(scores)
    dominant = max(scores, key=scores.get)
    return round(composite, 1), dominant


def severity_from_score(score: float) -> str:
    if score >= 75:
        return "critico"
    if score >= 55:
        return "alto"
    if score >= 35:
        return "moderado"
    return "bajo"


async def generate_initial_seismic_events(session: AsyncSession, count: int = 12) -> list[SeismicEvent]:
    """Create a set of plausible recent seismic events across Chile."""
    now = datetime.now(timezone.utc)
    events: list[SeismicEvent] = []

    # Rough seismic "hot zones" (lat, lon, typical mag range)
    zones = [
        (-18.5, -70.3, 5.5, 7.2),   # Arica / north
        (-23.6, -70.4, 5.0, 6.8),   # Antofagasta
        (-29.9, -71.3, 4.8, 6.5),   # Coquimbo
        (-33.5, -71.8, 5.2, 7.0),   # Valparaiso / central
        (-36.8, -73.0, 5.0, 6.8),   # Concepcion
        (-41.5, -73.5, 4.5, 6.2),   # Puerto Montt area
        (-45.5, -72.8, 4.2, 5.8),   # Aysen
    ]

    for i in range(count):
        zone = random.choice(zones)
        lat = zone[0] + random.uniform(-1.2, 1.2)
        lon = zone[1] + random.uniform(-1.0, 1.0)
        mag = round(random.uniform(zone[2], zone[3]), 1)
        depth = round(random.uniform(12, 95), 1)
        occurred = now - timedelta(hours=random.randint(1, 23), minutes=random.randint(0, 59))

        ev = SeismicEvent(
            latitude=round(lat, 4),
            longitude=round(lon, 4),
            magnitude=mag,
            depth_km=depth,
            occurred_at=occurred,
            source="mock",
        )
        events.append(ev)

    session.add_all(events)
    await session.commit()
    return events


async def seed_initial_risk_scores(session: AsyncSession) -> int:
    """Create one RiskScore row for every comuna using baseline + recent events."""
    comunas = (await session.execute(select(Comuna))).scalars().all()
    if not comunas:
        return 0

    # Load recent events for sismo calculation
    events_result = await session.execute(
        select(SeismicEvent).order_by(SeismicEvent.occurred_at.desc()).limit(50)
    )
    events = [
        {
            "latitude": e.latitude,
            "longitude": e.longitude,
            "magnitude": e.magnitude,
            "depth_km": e.depth_km,
            "occurred_at": e.occurred_at,
        }
        for e in events_result.scalars().all()
    ]

    scores_to_add: list[RiskScore] = []

    for comuna in comunas:
        base = generate_baseline_scores(comuna.codregion, seed=comuna.cod_comuna)

        # Sismo score can be boosted by actual recent events near the comuna
        if comuna.latitude is not None and comuna.longitude is not None and events:
            sismo_from_events = compute_sismo_score_for_comuna(
                comuna.latitude, comuna.longitude, events
            )
            base["sismo"] = max(base["sismo"], sismo_from_events)

        composite, dominant = compute_composite_and_dominant(base)
        sev = severity_from_score(composite)

        scores_to_add.append(
            RiskScore(
                cod_comuna=comuna.cod_comuna,
                sismo_score=base["sismo"],
                ola_calor_score=base["ola_calor"],
                ola_frio_score=base["ola_frio"],
                viento_score=base["viento"],
                composite_score=composite,
                dominant_hazard=dominant,
                severity=sev,
            )
        )

    session.add_all(scores_to_add)
    await session.commit()
    return len(scores_to_add)
