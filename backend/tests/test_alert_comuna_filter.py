from app.schemas.alert import ActiveAlertOut
from app.services.alert_service import _alert_applies_to_comuna


def _alert(**kwargs) -> ActiveAlertOut:
    base = dict(
        id="a1",
        source="senapred",
        level="informativa",
        title="t",
        issued_at="2026-06-01T00:00:00Z",
        synced_at="2026-06-01T00:00:00Z",
    )
    base.update(kwargs)
    return ActiveAlertOut(**base)


def test_comuna_scope_only_target_comuna():
    alert = _alert(
        region_code=5,
        affected_scope="comuna",
        comuna_codes=[5201],
    )
    assert _alert_applies_to_comuna(alert, 5, 5201)
    assert not _alert_applies_to_comuna(alert, 5, 5101)


def test_region_scope_all_comunas_in_region():
    alert = _alert(region_code=5, affected_scope="region", comuna_codes=[])
    assert _alert_applies_to_comuna(alert, 5, 5201)
    assert _alert_applies_to_comuna(alert, 5, 5101)


def test_unknown_not_shown_in_comuna_view():
    alert = _alert(region_code=5, affected_scope="unknown", comuna_codes=[])
    assert not _alert_applies_to_comuna(alert, 5, 5201)