from app.models.seismic_event import SeismicEvent
from app.schemas.event import SeismicEventResponse


def seismic_detail_url(event: SeismicEvent) -> str | None:
    raw = event.raw_data or {}
    url = raw.get("detail_url")
    return url if isinstance(url, str) and url.strip() else None


def event_to_response(event: SeismicEvent) -> SeismicEventResponse:
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
        raw_data=event.raw_data,
    )