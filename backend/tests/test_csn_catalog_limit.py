from datetime import datetime, timedelta, timezone

from app.services.csn_service import _limit_catalog_events

_BASE = datetime(2026, 6, 3, 12, 0, 0, tzinfo=timezone.utc)


def _ev(mag: float, minutes_ago: int) -> dict:
    t = _BASE - timedelta(minutes=minutes_ago)
    return {
        "latitude": -33.0,
        "longitude": -71.0,
        "magnitude": mag,
        "depth_km": 10.0,
        "occurred_at": t,
        "source": "csn",
        "raw_data": {"is_perceived": False},
    }


def test_limit_keeps_significant_when_many_small_events():
    events = [_ev(6.0, 0)]
    events.extend(_ev(3.0, m) for m in range(1, 150))
    limited = _limit_catalog_events(events, max_total=100)
    mags = [e["magnitude"] for e in limited]
    assert 6.0 in mags
    assert len(limited) == 100