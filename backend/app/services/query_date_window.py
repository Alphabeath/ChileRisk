"""Calendar-day query windows in America/Santiago for map/API filters."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

CHILE_TZ = ZoneInfo("America/Santiago")
QUERY_DATE_MAX_DAYS_BACK = 30


def today_chile() -> date:
    return datetime.now(CHILE_TZ).date()


def min_query_date(*, reference: date | None = None) -> date:
    ref = reference or today_chile()
    return ref - timedelta(days=QUERY_DATE_MAX_DAYS_BACK - 1)


def clamp_query_date(value: date, *, reference: date | None = None) -> date:
    ref = reference or today_chile()
    lo = min_query_date(reference=ref)
    if value < lo:
        return lo
    if value > ref:
        return ref
    return value


def parse_query_date(value: str) -> date:
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError("date must be YYYY-MM-DD") from exc
    return clamp_query_date(parsed)


def day_bounds_utc(d: date) -> tuple[datetime, datetime]:
    """Inclusive start, exclusive end (UTC) for one Chile calendar day."""
    start_local = datetime(d.year, d.month, d.day, tzinfo=CHILE_TZ)
    end_local = start_local + timedelta(days=1)
    return (
        start_local.astimezone(timezone.utc),
        end_local.astimezone(timezone.utc),
    )