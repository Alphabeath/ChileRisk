"""Seismic impact precomputation service.

Computes and stores the impact of seismic events on comunas
so that risk_service can read precomputed values instead of recalculating.
"""

import math
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comuna import Comuna
from app.models.seismic_event import SeismicEvent
from app.models.seismic_impact import SeismicImpact
from app.models.senapred_alert import SenapredAlert
from app.services.seismic_alert_match import nearest_region_code, find_related_senapred
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
    session: AsyncSession,
    *,
    hours: int | None = 24,
    start: datetime | None = None,
    end: datetime | None = None,
) -> dict[int, float]:
    """Return {cod_comuna: max_risk_score} from seismic impacts in a time window."""
    if start is None or end is None:
        now = datetime.now(timezone.utc)
        window_hours = hours if hours is not None else 24
        start = now - timedelta(hours=window_hours)
        end = now

    stmt = (
        select(
            SeismicImpact.cod_comuna,
            SeismicImpact.risk_score,
        )
        .join(SeismicEvent, SeismicEvent.id == SeismicImpact.event_id)
        .where(
            SeismicEvent.occurred_at >= start,
            SeismicEvent.occurred_at < end,
        )
    )
    rows = (await session.execute(stmt)).all()

    max_by_comuna: dict[int, float] = {}
    for cod_comuna, risk_score in rows:
        if cod_comuna not in max_by_comuna or risk_score > max_by_comuna[cod_comuna]:
            max_by_comuna[cod_comuna] = risk_score

    return max_by_comuna


async def get_max_seismic_metrics_by_region(
    session: AsyncSession,
    *,
    start: datetime,
    end: datetime,
) -> dict[int, dict[str, float | str]]:
    """Per-region max intensity/magnitude from precomputed impacts in [start, end)."""

    stmt = (
        select(
            Comuna.codregion,
            SeismicImpact.estimated_intensity,
            SeismicEvent.magnitude,
            SeismicEvent.raw_data,
        )
        .join(Comuna, Comuna.cod_comuna == SeismicImpact.cod_comuna)
        .join(SeismicEvent, SeismicEvent.id == SeismicImpact.event_id)
        .where(
            SeismicEvent.occurred_at >= start,
            SeismicEvent.occurred_at < end,
        )
    )
    rows = (await session.execute(stmt)).all()

    metrics: dict[int, dict[str, float | str]] = {}
    for codregion, intensity, magnitude, raw_data in rows:
        region = int(codregion)
        raw = raw_data or {}
        detail_url = raw.get("detail_url")
        magnitude_type = raw.get("magnitude_type", "Ml")
        current = metrics.get(region)
        if current is None or intensity > current["max_intensity"]:
            metrics[region] = {
                "max_intensity": round(float(intensity), 1),
                "max_magnitude": round(float(magnitude), 1),
                "magnitude_type": magnitude_type,
                "detail_url": detail_url,
            }
        elif intensity == current["max_intensity"] and magnitude > current["max_magnitude"]:
            current["max_magnitude"] = round(float(magnitude), 1)
            current["magnitude_type"] = magnitude_type
            if detail_url:
                current["detail_url"] = detail_url

    perceived = (
        await session.execute(
            select(SeismicEvent).where(
                SeismicEvent.occurred_at >= start,
                SeismicEvent.occurred_at < end,
            )
        )
    ).scalars().all()

    for ev in perceived:
        raw = ev.raw_data or {}
        if not raw.get("is_perceived"):
            continue

        reported_f: float | None = None
        reported = raw.get("reported_intensity_max")
        if reported is not None:
            try:
                reported_f = float(reported)
            except (TypeError, ValueError):
                pass

        if reported_f is None:
            event_ids, alert_ids = await find_related_senapred(session, ev)
            all_sids = [s for s in event_ids + alert_ids if s]
            if all_sids:
                senapred_rows = (
                    await session.execute(
                        select(SenapredAlert).where(SenapredAlert.senapred_id.in_(all_sids))
                    )
                ).scalars().all()
                for alert in senapred_rows:
                    if alert.meta_data:
                        mercalli = alert.meta_data.get("max_mercalli")
                        if mercalli is not None:
                            try:
                                m_f = float(mercalli)
                                if reported_f is None or m_f > reported_f:
                                    reported_f = m_f
                            except (TypeError, ValueError):
                                pass

        if reported_f is None:
            continue

        codregion = await nearest_region_code(session, ev.latitude, ev.longitude)
        if codregion is None:
            continue
        region = int(codregion)
        detail_url = raw.get("detail_url")
        current = metrics.get(region)
        if current is None or current.get("intensity_source") != "reported" or reported_f > current["max_intensity"]:
            metrics[region] = {
                "max_intensity": round(reported_f, 1),
                "max_magnitude": round(float(ev.magnitude), 1),
                "intensity_source": "reported",
                "detail_url": detail_url,
            }

    for m in metrics.values():
        m.setdefault("intensity_source", "estimated")

    return metrics
