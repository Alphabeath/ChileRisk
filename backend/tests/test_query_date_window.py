from datetime import date, datetime, timedelta, timezone

import pytest

from app.services.query_date_window import (
    QUERY_DATE_MAX_DAYS_BACK,
    CHILE_TZ,
    clamp_query_date,
    day_bounds_utc,
    min_query_date,
    parse_query_date,
)


def test_constants():
    assert QUERY_DATE_MAX_DAYS_BACK == 30


def test_min_query_date_span():
    ref = date(2026, 6, 10)
    assert min_query_date(reference=ref) == date(2026, 5, 12)


def test_clamp_query_date_future():
    ref = date(2026, 6, 10)
    assert clamp_query_date(date(2026, 6, 15), reference=ref) == ref


def test_clamp_query_date_too_old():
    ref = date(2026, 6, 10)
    assert clamp_query_date(date(2026, 1, 1), reference=ref) == min_query_date(reference=ref)


def test_parse_query_date_invalid():
    with pytest.raises(ValueError, match="YYYY-MM-DD"):
        parse_query_date("06-03-2026")


def test_day_bounds_utc_mid_summer():
    start, end = day_bounds_utc(date(2026, 1, 15))
    assert start.tzinfo == timezone.utc
    assert end - start == timedelta(days=1)
    local_start = start.astimezone(CHILE_TZ)
    assert local_start.date() == date(2026, 1, 15)
    assert local_start.hour == 0


def test_senapred_style_filter_on_bounds():
    ref = date(2026, 6, 3)
    start, end = day_bounds_utc(ref)
    issued_in = datetime(2026, 6, 3, 15, 0, tzinfo=CHILE_TZ).astimezone(timezone.utc)
    issued_out = start - timedelta(seconds=1)
    assert start <= issued_in < end
    assert not (start <= issued_out < end)