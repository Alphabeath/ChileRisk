from datetime import date, datetime, timedelta, timezone

from app.services.query_date_window import day_bounds_utc


def _senapred_visible_on_date(issued_at: datetime, query_date: date) -> bool:
    start, end = day_bounds_utc(query_date)
    if issued_at.tzinfo is None:
        issued_at = issued_at.replace(tzinfo=timezone.utc)
    return start <= issued_at < end


def test_senapred_on_query_day_included():
    qd = date(2026, 6, 3)
    issued = datetime(2026, 6, 3, 15, 0, tzinfo=timezone.utc)
    assert _senapred_visible_on_date(issued, qd)


def test_senapred_previous_calendar_day_excluded():
    qd = date(2026, 6, 3)
    start, _ = day_bounds_utc(qd)
    issued = start - timedelta(seconds=1)
    assert not _senapred_visible_on_date(issued, qd)


def test_senapred_next_calendar_day_excluded():
    qd = date(2026, 6, 3)
    _, end = day_bounds_utc(qd)
    assert not _senapred_visible_on_date(end, qd)