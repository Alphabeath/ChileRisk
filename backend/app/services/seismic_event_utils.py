from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.seismic_event import SeismicEvent
from app.models.senapred_alert import SenapredAlert
from app.schemas.alert import SenapredAlertBrief
from app.schemas.event import SeismicEventResponse
from app.services.senapred_service import normalize_hazard_type


def seismic_detail_url(event: SeismicEvent) -> str | None:
    raw = event.raw_data or {}
    url = raw.get("detail_url")
    return url if isinstance(url, str) and url.strip() else None


async def _load_senapred_briefs(
    session: AsyncSession | None,
    ids: list[str],
) -> list[SenapredAlertBrief]:
    if not session or not ids:
        return []
    rows = (
        await session.execute(
            select(SenapredAlert).where(SenapredAlert.senapred_id.in_(ids))
        )
    ).scalars().all()
    by_id = {r.senapred_id: r for r in rows}
    out: list[SenapredAlertBrief] = []
    for sid in ids:
        r = by_id.get(sid)
        if not r:
            continue
        kind = "evento" if r.kind == "evento" else "alerta"
        base = (
            settings.senapred_event_base_url
            if kind == "evento"
            else settings.senapred_alert_base_url
        )
        level = r.level if r.level in ("preventiva", "amarilla", "naranja", "roja", "informativa") else "informativa"
        out.append(
            SenapredAlertBrief(
                id=r.senapred_id,
                record_kind=kind,
                title=r.title,
                level=level,
                external_url=f"{base}{r.url_access}" if r.url_access else None,
                hazard_type=normalize_hazard_type(r.category),
            )
        )
    return out


async def event_to_response(
    event: SeismicEvent,
    session: AsyncSession | None = None,
) -> SeismicEventResponse:
    raw = event.raw_data or {}
    event_ids = raw.get("related_senapred_event_ids") or []
    alert_ids = raw.get("related_senapred_alert_ids") or []
    if isinstance(event_ids, str):
        event_ids = [event_ids]
    if isinstance(alert_ids, str):
        alert_ids = [alert_ids]

    reported = raw.get("reported_intensity_max")
    try:
        reported_f = float(reported) if reported is not None else None
    except (TypeError, ValueError):
        reported_f = None

    return SeismicEventResponse(
        id=event.id,
        latitude=event.latitude,
        longitude=event.longitude,
        magnitude=event.magnitude,
        depth_km=event.depth_km,
        occurred_at=event.occurred_at,
        occurred_at_local=event.occurred_at_local,
        source=event.source,
        detail_url=seismic_detail_url(event),
        is_perceived=bool(raw.get("is_perceived")),
        intensity_report_url=raw.get("intensity_report_url"),
        reported_intensity_max=reported_f,
        related_senapred_events=await _load_senapred_briefs(session, list(event_ids)),
        related_senapred_alerts=await _load_senapred_briefs(session, list(alert_ids)),
        raw_data=raw,
    )