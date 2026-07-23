from datetime import datetime, timezone

from app.models.senapred_alert import SenapredAlert
from app.services.alert_service import filter_senapred_rows_for_active_list

_T0 = datetime(2026, 7, 22, 12, 0, tzinfo=timezone.utc)
_T1 = datetime(2026, 7, 22, 15, 0, tzinfo=timezone.utc)


def _row(
    senapred_id: str,
    *,
    title: str,
    issued_at: datetime = _T0,
    is_active: bool = True,
    parent_id: str | None = None,
    level: str = "roja",
) -> SenapredAlert:
    return SenapredAlert(
        senapred_id=senapred_id,
        kind="alerta",
        level=level,
        title=title,
        parent_id=parent_id,
        senapred_issued_at=issued_at,
        is_active=is_active,
        is_monitor=False,
        meta_data={},
        raw={},
    )


def test_historical_pure_cancel_not_listed():
    rows = [
        _row(
            "sal-cancel",
            title="Se cancela Alerta Roja para la comuna de Salamanca por desborde",
            is_active=False,
        )
    ]
    assert filter_senapred_rows_for_active_list(rows, include_inactive=True) == []


def test_thread_declara_then_cancela_closes():
    rows = [
        _row(
            "decl",
            title="Se declara alerta roja para la comuna de Salamanca por desborde",
            issued_at=_T0,
            is_active=True,
        ),
        _row(
            "canc",
            title="Se cancela Alerta Roja para la comuna de Salamanca por desborde",
            issued_at=_T1,
            is_active=False,
            parent_id="decl",
        ),
    ]
    assert filter_senapred_rows_for_active_list(rows, include_inactive=True) == []
    assert filter_senapred_rows_for_active_list(rows, include_inactive=False) == []


def test_cancela_y_declara_remains():
    rows = [
        _row(
            "upgrade",
            title=(
                "Se cancela alerta amarilla y declara alerta roja "
                "para la comuna de Pucón por evento meteorológico"
            ),
            is_active=True,
        )
    ]
    out = filter_senapred_rows_for_active_list(rows, include_inactive=False)
    assert len(out) == 1
    assert out[0].senapred_id == "upgrade"


def test_today_inactive_non_cancel_dropped():
    rows = [
        _row(
            "old",
            title="Se declara alerta amarilla para la comuna de Villarrica",
            is_active=False,
            level="amarilla",
        )
    ]
    assert filter_senapred_rows_for_active_list(rows, include_inactive=False) == []
    out = filter_senapred_rows_for_active_list(rows, include_inactive=True)
    assert len(out) == 1
    assert out[0].senapred_id == "old"
