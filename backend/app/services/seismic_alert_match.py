"""Match seismic events to SERNAPRED alertas and eventos (reportes)."""

import re
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.comuna import Comuna
from app.models.seismic_event import SeismicEvent
from app.models.senapred_alert import SenapredAlert
from app.services.senapred_service import normalize_hazard_type, pick_latest_senapred_per_thread
from app.services.seismic_service import haversine_km

_SISMO_RE = re.compile(r"sismo|sísmic|temblor", re.IGNORECASE)


def slug_from_senapred_url(url: str | None) -> str | None:
    if not url or not url.strip():
        return None
    u = url.strip()
    for prefix in (
        settings.senapred_event_base_url,
        "https://senapred.cl/evento/",
        "http://senapred.cl/evento/",
    ):
        if u.startswith(prefix):
            return u[len(prefix) :].strip("/").split("?")[0] or None
    if "/evento/" in u:
        return u.split("/evento/", 1)[-1].strip("/").split("?")[0] or None
    return None


async def nearest_comuna(
    session: AsyncSession, latitude: float, longitude: float
) -> tuple[Comuna, float] | None:
    """Return (comuna, distance_km) for the centroid nearest to lat/lon."""
    comunas = (await session.execute(select(Comuna))).scalars().all()
    best: tuple[float, Comuna] | None = None
    for c in comunas:
        if c.latitude is None or c.longitude is None:
            continue
        dist = haversine_km(c.latitude, c.longitude, latitude, longitude)
        if best is None or dist < best[0]:
            best = (dist, c)
    if best is None:
        return None
    return best[1], best[0]


async def nearest_region_code(
    session: AsyncSession, latitude: float, longitude: float
) -> int | None:
    found = await nearest_comuna(session, latitude, longitude)
    return found[0].codregion if found else None


async def find_related_senapred(
    session: AsyncSession,
    event: SeismicEvent,
    *,
    hours_before: int = 6,
    hours_after: int = 48,
    limit: int = 5,
) -> tuple[list[str], list[str]]:
    """Return (event_ids, alert_ids) for related SERNAPRED records."""
    codregion = await nearest_region_code(session, event.latitude, event.longitude)
    start = event.occurred_at - timedelta(hours=hours_before)
    end = event.occurred_at + timedelta(hours=hours_after)
    intensity_slug = slug_from_senapred_url((event.raw_data or {}).get("intensity_report_url"))

    stmt = (
        select(SenapredAlert)
        .where(
            SenapredAlert.is_active.is_(True),
            SenapredAlert.senapred_issued_at >= start,
            SenapredAlert.senapred_issued_at <= end,
        )
        .order_by(SenapredAlert.senapred_issued_at.desc())
    )
    rows = pick_latest_senapred_per_thread(
        (await session.execute(stmt)).scalars().all()
    )

    event_ids: list[str] = []
    alert_ids: list[str] = []
    seen: set[str] = set()

    for row in rows:
        if row.senapred_id in seen:
            continue
        hazard = normalize_hazard_type(row.category)
        title = row.title or ""
        is_sismo_row = hazard == "sismo" or bool(_SISMO_RE.search(title))

        if row.kind == "evento":
            if not is_sismo_row:
                continue
            if intensity_slug and row.url_access:
                if row.url_access.strip("/") == intensity_slug:
                    event_ids.append(row.senapred_id)
                    seen.add(row.senapred_id)
                    continue
            if codregion is not None and row.region_code not in (None, codregion):
                continue
            event_ids.append(row.senapred_id)
            seen.add(row.senapred_id)
        elif row.kind == "alerta" and is_sismo_row:
            if codregion is not None and row.region_code not in (None, codregion):
                continue
            alert_ids.append(row.senapred_id)
            seen.add(row.senapred_id)

        if len(event_ids) + len(alert_ids) >= limit:
            break

    return event_ids[:limit], alert_ids[:limit]