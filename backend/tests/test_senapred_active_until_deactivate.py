"""Today lists SERNAPRED vigentes across lookback; historical stays day-bound."""

from datetime import date, datetime, timedelta, timezone
from unittest.mock import patch

from app.config import settings
from app.models.senapred_alert import SenapredAlert
from app.services.alert_service import (
    filter_senapred_rows_for_active_list,
    senapred_list_time_bounds,
)
from app.services.query_date_window import day_bounds_utc


def _row(
    senapred_id: str,
    *,
    title: str,
    issued_at: datetime,
    is_active: bool = True,
    parent_id: str | None = None,
    url_access: str | None = None,
    level: str = "roja",
    kind: str = "alerta",
) -> SenapredAlert:
    return SenapredAlert(
        senapred_id=senapred_id,
        kind=kind,
        level=level,
        title=title,
        parent_id=parent_id,
        url_access=url_access,
        senapred_issued_at=issued_at,
        is_active=is_active,
        is_monitor=False,
        meta_data={},
        raw={},
        comuna_codes=[],
    )


def test_today_bounds_use_lookback_not_calendar_day():
    today = date(2026, 7, 25)
    now = datetime(2026, 7, 25, 16, 0, tzinfo=timezone.utc)
    with patch("app.services.alert_service.today_chile", return_value=today):
        start, end = senapred_list_time_bounds(today, now=now)
    assert end is None
    assert start == now - timedelta(days=settings.senapred_lookback_days)
    day_start, _ = day_bounds_utc(today)
    assert start < day_start


def test_historical_bounds_are_single_chile_day():
    qd = date(2026, 6, 3)
    start, end = senapred_list_time_bounds(qd)
    expected_start, expected_end = day_bounds_utc(qd)
    assert start == expected_start
    assert end == expected_end

def test_active_alert_issued_yesterday_kept_for_today_filter():
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    rows = [
        _row(
            "multi-day",
            title="Se declara alerta roja para la comuna de Pucón por evento meteorológico",
            issued_at=yesterday,
            is_active=True,
            url_access="pucon-roja",
        )
    ]
    out = filter_senapred_rows_for_active_list(rows, include_inactive=False)
    assert len(out) == 1
    assert out[0].senapred_id == "multi-day"


def test_cancel_closes_multi_day_thread():
    t0 = datetime(2026, 7, 20, 12, 0, tzinfo=timezone.utc)
    t1 = datetime(2026, 7, 24, 9, 0, tzinfo=timezone.utc)
    rows = [
        _row(
            "decl",
            title="Se declara alerta roja para la comuna de Salamanca por desborde",
            issued_at=t0,
            is_active=True,
            url_access="salamanca-desborde",
        ),
        _row(
            "canc",
            title="Se cancela Alerta Roja para la comuna de Salamanca por desborde",
            issued_at=t1,
            is_active=False,
            parent_id="decl",
            url_access="salamanca-desborde",
        ),
    ]
    assert filter_senapred_rows_for_active_list(rows, include_inactive=False) == []


def test_inactive_non_cancel_from_prior_day_dropped_today():
    prior = datetime.now(timezone.utc) - timedelta(days=2)
    rows = [
        _row(
            "closed",
            title="Se declara alerta amarilla para la comuna de Villarrica",
            issued_at=prior,
            is_active=False,
            level="amarilla",
        )
    ]
    assert filter_senapred_rows_for_active_list(rows, include_inactive=False) == []


def test_coyhaique_evento_cierre_closes_thread():
    """AppSync keeps isActive on '(Cierre de evento)'; title must close the thread."""
    t0 = datetime(2026, 6, 30, 14, 23, tzinfo=timezone.utc)
    t1 = datetime(2026, 7, 1, 21, 30, tzinfo=timezone.utc)
    url = "viento-comuna-de-coyhaique-2026-07-01-17-27-23"
    rows = [
        _row(
            "4ae0dba9-7b76-4e73-bb2c-94dfa5726127",
            title="Viento, comuna de Coyhaique",
            issued_at=t0,
            is_active=False,
            kind="evento",
            level="informativa",
            url_access=url,
        ),
        _row(
            "d091b58a-3d87-42d7-b678-19a300be25e4",
            title="Viento, comuna de Coyhaique (Cierre de evento)",
            issued_at=t1,
            is_active=True,
            kind="evento",
            level="informativa",
            parent_id="4ae0dba9-7b76-4e73-bb2c-94dfa5726127",
            url_access=url,
        ),
    ]
    assert filter_senapred_rows_for_active_list(rows, include_inactive=False) == []
    # Even without the open row, a lone cierre must not list.
    assert (
        filter_senapred_rows_for_active_list([rows[1]], include_inactive=False) == []
    )


def test_stale_sismo_evento_dropped_today():
    """AppSync leaves old sismos isActive; today list caps evento age."""
    now = datetime(2026, 7, 25, 12, 0, tzinfo=timezone.utc)
    rows = [
        _row(
            "5232f95c-eb4a-4ff8-8950-33f8eaa744c1-7",
            title="Sismo de menor intensidad en las regiones de Ñuble, Maule y Biobío",
            issued_at=now - timedelta(days=23),
            is_active=True,
            kind="evento",
            level="informativa",
            url_access="sismo-nuble-maule-biobio-2026-07-01",
        )
    ]
    assert (
        filter_senapred_rows_for_active_list(rows, include_inactive=False, now=now)
        == []
    )


def test_recent_sismo_evento_kept_today():
    now = datetime(2026, 7, 25, 12, 0, tzinfo=timezone.utc)
    rows = [
        _row(
            "recent-sismo",
            title="Sismo de menor intensidad en la Región de Atacama",
            issued_at=now - timedelta(hours=12),
            is_active=True,
            kind="evento",
            level="informativa",
            url_access="sismo-atacama-recent",
        )
    ]
    out = filter_senapred_rows_for_active_list(
        rows, include_inactive=False, now=now
    )
    assert len(out) == 1
    assert out[0].senapred_id == "recent-sismo"


def test_stale_sismo_still_visible_on_historical_day():
    now = datetime(2026, 7, 25, 12, 0, tzinfo=timezone.utc)
    issued = datetime(2026, 7, 1, 20, 10, tzinfo=timezone.utc)
    rows = [
        _row(
            "old-sismo",
            title="Sismo de menor intensidad en las regiones de Ñuble, Maule y Biobío",
            issued_at=issued,
            is_active=True,
            kind="evento",
            level="informativa",
            url_access="sismo-nuble-maule",
        )
    ]
    out = filter_senapred_rows_for_active_list(
        rows, include_inactive=True, now=now
    )
    assert len(out) == 1
