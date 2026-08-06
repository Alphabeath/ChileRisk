"""Visibility rules: today = lookback vigentes; historical = issued that day."""

from datetime import date, datetime, timedelta, timezone
from unittest.mock import patch

from app.config import settings
from app.services.alert_service import senapred_list_time_bounds
from app.services.query_date_window import day_bounds_utc


def test_historical_on_query_day_included():
    qd = date(2026, 6, 3)
    issued = datetime(2026, 6, 3, 15, 0, tzinfo=timezone.utc)
    start, end = senapred_list_time_bounds(qd)
    assert end is not None
    assert start <= issued < end


def test_historical_previous_calendar_day_excluded():
    qd = date(2026, 6, 3)
    start, end = senapred_list_time_bounds(qd)
    assert end is not None
    issued = start - timedelta(seconds=1)
    assert not (start <= issued < end)


def test_historical_next_calendar_day_excluded():
    qd = date(2026, 6, 3)
    start, end = senapred_list_time_bounds(qd)
    assert end is not None
    issued_at_end = end
    assert not (start <= issued_at_end < end)


def test_today_includes_prior_day_within_lookback():
    today = date(2026, 7, 25)
    now = datetime(2026, 7, 25, 18, 0, tzinfo=timezone.utc)
    issued = now - timedelta(days=2)
    with patch("app.services.alert_service.today_chile", return_value=today):
        start, end = senapred_list_time_bounds(today, now=now)
    assert end is None
    assert issued >= start
    assert start == now - timedelta(days=settings.senapred_lookback_days)
    day_start, _ = day_bounds_utc(today)
    assert start < day_start


def test_today_excludes_before_lookback():
    today = date(2026, 7, 25)
    now = datetime(2026, 7, 25, 18, 0, tzinfo=timezone.utc)
    with patch("app.services.alert_service.today_chile", return_value=today):
        start, end = senapred_list_time_bounds(today, now=now)
    issued = start - timedelta(seconds=1)
    assert end is None
    assert issued < start
