from datetime import datetime, timezone

from app.models.senapred_alert import SenapredAlert
from app.services.senapred_service import pick_latest_senapred_per_thread, senapred_thread_root

_T0 = datetime(2026, 6, 2, 6, 23, tzinfo=timezone.utc)
_T1 = datetime(2026, 6, 2, 6, 25, tzinfo=timezone.utc)
_T2 = datetime(2026, 6, 2, 6, 27, tzinfo=timezone.utc)


def _row(
    senapred_id: str,
    *,
    parent_id: str | None = None,
    issued_at: datetime = _T0,
    kind: str = "evento",
    url_access: str | None = None,
    region_code: int | None = None,
) -> SenapredAlert:
    return SenapredAlert(
        senapred_id=senapred_id,
        kind=kind,
        level="informativa",
        title="Sismo",
        parent_id=parent_id,
        url_access=url_access,
        region_code=region_code,
        senapred_issued_at=issued_at,
        is_active=True,
        is_monitor=False,
        meta_data={},
        raw={},
    )


def test_thread_root_follows_parent_chain():
    rows = [
        _row("c", parent_id="b", issued_at=_T0),
        _row("b", parent_id="a", issued_at=_T1),
        _row("a", parent_id=None, issued_at=_T2),
    ]
    by_id = {r.senapred_id: r for r in rows}
    assert senapred_thread_root(rows[0], by_id) == "a"
    assert senapred_thread_root(rows[2], by_id) == "a"


def test_thread_root_prefers_url_access():
    rows = [
        _row(
            "old",
            parent_id="parent",
            url_access="sismo-coquimbo-2026",
            issued_at=_T0,
        ),
        _row(
            "new",
            parent_id="broken-orphan",
            url_access="sismo-coquimbo-2026",
            issued_at=_T2,
        ),
    ]
    by_id = {r.senapred_id: r for r in rows}
    assert senapred_thread_root(rows[0], by_id) == "sismo-coquimbo-2026"
    assert senapred_thread_root(rows[1], by_id) == "sismo-coquimbo-2026"


def test_pick_latest_keeps_newest_in_chain():
    rows = [
        _row("7033", parent_id="4ca09", issued_at=_T1),
        _row("938f", parent_id="7033", issued_at=_T2),
    ]
    latest = pick_latest_senapred_per_thread(rows)
    assert len(latest) == 1
    assert latest[0].senapred_id == "938f"


def test_pick_latest_by_url_access_despite_broken_parent():
    rows = [
        _row(
            "v1",
            parent_id="parent",
            url_access="monitoreo-atacama-2026",
            issued_at=_T0,
        ),
        _row(
            "v2",
            parent_id="missing-id",
            url_access="monitoreo-atacama-2026",
            issued_at=_T1,
        ),
        _row(
            "v3",
            parent_id="other-missing",
            url_access="monitoreo-atacama-2026",
            issued_at=_T2,
        ),
    ]
    latest = pick_latest_senapred_per_thread(rows)
    assert len(latest) == 1
    assert latest[0].senapred_id == "v3"


def test_pick_latest_keeps_unrelated_threads():
    rows = [
        _row("a", issued_at=_T0),
        _row("b", issued_at=_T1),
    ]
    assert len(pick_latest_senapred_per_thread(rows)) == 2


def test_pick_latest_keeps_multi_region_same_url():
    rows = [
        _row(
            "uuid-5",
            url_access="alerta-multi-2026",
            region_code=5,
            issued_at=_T1,
        ),
        _row(
            "uuid-13",
            url_access="alerta-multi-2026",
            region_code=13,
            issued_at=_T1,
        ),
        _row(
            "uuid-5-newer",
            url_access="alerta-multi-2026",
            region_code=5,
            issued_at=_T2,
        ),
    ]
    latest = pick_latest_senapred_per_thread(rows)
    by_region = {r.region_code: r.senapred_id for r in latest}
    assert by_region == {5: "uuid-5-newer", 13: "uuid-13"}
