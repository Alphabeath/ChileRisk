"""Tests for SERNAGEOMIN volcanic alert parsers, catalog, and alert mapping."""

from datetime import datetime, timezone
from pathlib import Path

from app.data.sernageomin_volcanoes import geography_for, resolve_volcano
from app.models.sernageomin_volcanic_alert import SernageominVolcanicAlert
from app.schemas.alert import ActiveAlertOut
from app.services.alert_service import (
    _alert_applies_to_comuna,
    _matches_hazard_filter,
    _sernageomin_row_to_out,
)
from app.services.sernageomin_parsers import (
    is_elevated_level,
    normalize_level,
    parse_alerts_page,
)

FIXTURES = Path(__file__).parent / "fixtures"
PAGE_HTML = (FIXTURES / "sernageomin_alertas_volcanicas.html").read_text(encoding="utf-8")
PAGE_URL = "https://www.sernageomin.cl/alertas-volcanicas/"

MINI_HTML = """
<html><body>
<span class="updated">2026-07-08T16:16:52-04:00</span>
<img alt="Alerta Amarilla Complejo Volcánico Nevados de Chillán" />
<img alt="Alerta Verde Villarrica" />
<img title="Alerta Naranja Volcán Láscar" />
<a href="https://www.sernageomin.cl/wp-content/uploads/2026/06/REAV_NevChillan_20260615.pdf">
  Reporte Especial de Actividad Volcánica (REAV)
</a>
</body></html>
"""


def test_normalize_level_mapping():
    assert normalize_level("Amarilla") == "amarilla"
    assert normalize_level("verde") == "informativa"
    assert normalize_level("ROJA") == "roja"
    assert normalize_level(None) is None
    assert is_elevated_level("amarilla")
    assert not is_elevated_level("informativa")


def test_resolve_nevados_chillan_catalog():
    geo = resolve_volcano("Complejo Volcánico Nevados de Chillán")
    assert geo is not None
    assert geo.key == "nevados-de-chillan"
    assert geo.region_code == 16
    assert 16106 in geo.comuna_codes


def test_geography_fallback_unknown():
    key, name, region, rname, scope, comunas = geography_for("Volcán Inventado XYZ")
    assert key
    assert name == "Volcán Inventado XYZ"
    assert region is None
    assert scope == "unknown"
    assert comunas == []


def test_parse_mini_html_skips_verde():
    rows = parse_alerts_page(MINI_HTML, page_url=PAGE_URL)
    levels = {r["level"] for r in rows}
    assert "amarilla" in levels
    assert "naranja" in levels
    assert "informativa" not in levels
    names = " ".join(r["volcano_name"].lower() for r in rows)
    assert "chillán" in names or "chillan" in names
    assert "láscar" in names or "lascar" in names
    chillan = next(r for r in rows if "chill" in r["volcano_name"].lower())
    assert chillan["reav_url"] and "REAV" in chillan["reav_url"]
    assert chillan["page_updated_at"] is not None


def test_parse_live_fixture_nevados_amarilla():
    rows = parse_alerts_page(PAGE_HTML, page_url=PAGE_URL)
    assert rows, "expected at least one elevated alert from fixture"
    chillan = next(
        (r for r in rows if "chill" in r["volcano_name"].lower()),
        None,
    )
    assert chillan is not None
    assert chillan["level"] == "amarilla"
    assert chillan["external_url"]
    key, _, region, _, scope, comunas = geography_for(chillan["volcano_name"])
    assert key == "nevados-de-chillan"
    assert region == 16
    assert scope == "comuna"
    assert 16106 in comunas


def test_sernageomin_row_to_out_and_filters():
    now = datetime(2026, 7, 8, 20, 0, tzinfo=timezone.utc)
    row = SernageominVolcanicAlert(
        volcano_key="nevados-de-chillan",
        volcano_name="Complejo Volcánico Nevados de Chillán",
        level="amarilla",
        title="Alerta Amarilla Complejo Volcánico Nevados de Chillán",
        content="excerpt",
        region_code=16,
        region_name="Región de Ñuble",
        affected_scope="comuna",
        comuna_codes=[16106, 16302, 16304],
        external_url=PAGE_URL,
        is_active=True,
        issued_at=now,
        page_updated_at=now,
        raw={},
        synced_at=now,
    )
    out = _sernageomin_row_to_out(row)
    assert out.source == "sernageomin"
    assert out.id == "sernageomin:nevados-de-chillan"
    assert out.hazard_type == "volcan"
    assert out.record_kind == "alerta"
    assert out.level == "amarilla"
    assert _matches_hazard_filter(out.hazard_type, "volcan")
    assert _alert_applies_to_comuna(out, 16, 16106)
    assert not _alert_applies_to_comuna(out, 16, 16101)
    assert not _alert_applies_to_comuna(out, 8, 16106)


def test_active_alert_out_accepts_sernageomin_source():
    alert = ActiveAlertOut(
        id="sernageomin:villarrica",
        source="sernageomin",
        level="naranja",
        title="Alerta Naranja Villarrica",
        issued_at=datetime.now(timezone.utc),
        synced_at=datetime.now(timezone.utc),
        hazard_type="volcan",
    )
    assert alert.source == "sernageomin"
