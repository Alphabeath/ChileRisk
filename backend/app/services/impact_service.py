"""Seismic impact precomputation service.

Computes and stores the impact of seismic events on comunas
so that risk_service can read precomputed values instead of recalculating.
"""

import math
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comuna import Comuna
from app.models.seismic_event import SeismicEvent
from app.models.seismic_impact import SeismicImpact
from app.services.seismic_service import (
    haversine_km,
    estimate_intensity,
    intensity_to_risk_score,
)


def _max_radius_km(magnitude: float) -> float:
    """Theoretical max affected radius for a given magnitude."""
    return max(50.0, 80.0 * (magnitude - 1.5))


async def compute_and_store_event_impact(
    session: AsyncSession, event: SeismicEvent
) -> int:
    """Calculate impact of one event on all comunas and store in seismic_impacts."""
    existing = (
        await session.execute(
            select(SeismicImpact).where(SeismicImpact.event_id == event.id).limit(1)
        )
    ).scalar_one_or_none()
    if existing:
        return 0

    comunas = (await session.execute(select(Comuna))).scalars().all()
    max_radius = _max_radius_km(event.magnitude)

    inserted = 0
    for c in comunas:
        if c.latitude is None or c.longitude is None:
            continue

        dist = haversine_km(c.latitude, c.longitude, event.latitude, event.longitude)
        if dist > max_radius:
            continue

        intensity = estimate_intensity(event.magnitude, dist, event.depth_km)
        if intensity < 2.0:
            continue

        score = intensity_to_risk_score(intensity)

        session.add(SeismicImpact(
            event_id=event.id,
            cod_comuna=c.cod_comuna,
            distance_km=round(dist, 1),
            estimated_intensity=round(intensity, 2),
            risk_score=score,
        ))
        inserted += 1

    if inserted:
        await session.commit()
    return inserted


async def get_max_risk_per_comuna_from_impacts(
    session: AsyncSession, hours: int = 24
) -> dict[int, float]:
    """Return {cod_comuna: max_risk_score} from recent seismic impacts."""
    now = datetime.now(timezone.utc)
    from datetime import timedelta
    cutoff = now - timedelta(hours=hours)

    stmt = (
        select(
            SeismicImpact.cod_comuna,
            SeismicImpact.risk_score,
        )
        .join(SeismicEvent, SeismicEvent.id == SeismicImpact.event_id)
        .where(SeismicEvent.occurred_at >= cutoff)
    )
    rows = (await session.execute(stmt)).all()

    max_by_comuna: dict[int, float] = {}
    for cod_comuna, risk_score in rows:
        if cod_comuna not in max_by_comuna or risk_score > max_by_comuna[cod_comuna]:
            max_by_comuna[cod_comuna] = risk_score

    return max_by_comuna
