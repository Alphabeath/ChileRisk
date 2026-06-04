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
) -> SenapredAlert:
    return SenapredAlert(
        senapred_id=senapred_id,
        kind=kind,
        level="informativa",
        title="Sismo",
        parent_id=parent_id,
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


def test_pick_latest_keeps_newest_in_chain():
    rows = [
        _row("7033", parent_id="4ca09", issued_at=_T1),
        _row("938f", parent_id="7033", issued_at=_T2),
    ]
    latest = pick_latest_senapred_per_thread(rows)
    assert len(latest) == 1
    assert latest[0].senapred_id == "938f"


def test_pick_latest_keeps_unrelated_threads():
    rows = [
        _row("a", issued_at=_T0),
        _row("b", issued_at=_T1),
    ]
    assert len(pick_latest_senapred_per_thread(rows)) == 2