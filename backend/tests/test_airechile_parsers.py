"""Tests for Aire Chile GEC HTML parsers."""

from datetime import date
from pathlib import Path

from app.services.airechile_parsers import (
    absolute_zone_url,
    level_from_classes,
    normalize_level,
    parse_detail,
    parse_home,
    slug_from_href,
)
from app.services.airechile_zones import AIRECHILE_ZONES, get_zone, zone_by_comuna

FIXTURES = Path(__file__).parent / "fixtures"
HOME_HTML = (FIXTURES / "airechile_home_sample.html").read_text(encoding="utf-8")
CONCE_HTML = (FIXTURES / "airechile_concepcion_sample.html").read_text(encoding="utf-8")
BASE = "https://airechile.mma.gob.cl/"


def test_slug_from_href():
    assert slug_from_href("/comunas/concepcion") == "concepcion"
    assert slug_from_href("https://airechile.mma.gob.cl/comunas/temuco") == "temuco"
    assert slug_from_href("/comunas/unknown-zone") is None
    assert slug_from_href("/other") is None


def test_normalize_and_class_level():
    assert normalize_level("Bueno (MP2.5)") == "bueno"
    assert normalize_level("Preemergencia") == "preemergencia"
    assert level_from_classes(["panel-heading", "bg-regular"]) == "regular"
    assert level_from_classes(["bg-emergencia"]) == "emergencia"


def test_absolute_zone_url():
    assert absolute_zone_url(BASE, "osorno") == "https://airechile.mma.gob.cl/comunas/osorno"


def test_parse_home_finds_catalog_zones():
    rows = parse_home(HOME_HTML, base_url=BASE)
    by_slug = {r["zone_slug"]: r for r in rows}
    assert "concepcion" in by_slug
    assert "coyhaique" in by_slug
    assert by_slug["concepcion"]["level"] in (
        "bueno",
        "regular",
        "alerta",
        "preemergencia",
        "emergencia",
    )
    assert by_slug["concepcion"]["comuna_codes"] == list(
        AIRECHILE_ZONES["concepcion"].comuna_codes
    )


def test_parse_detail_concepcion():
    detail = parse_detail(CONCE_HTML, slug="concepcion", base_url=BASE)
    assert detail is not None
    assert detail["zone_slug"] == "concepcion"
    assert detail["level"] in (
        "bueno",
        "regular",
        "alerta",
        "preemergencia",
        "emergencia",
    )
    assert detail["external_url"].endswith("/comunas/concepcion")
    assert isinstance(detail["measures_current"], list)
    # Forecast often present on detail pages
    if detail["forecast_level"]:
        assert detail["forecast_level"] in (
            "bueno",
            "regular",
            "alerta",
            "preemergencia",
            "emergencia",
        )
    # Condition date if parsed
    if detail["condition_date"]:
        assert isinstance(detail["condition_date"], date)


def test_zone_catalog_lookup():
    z = get_zone("temuco")
    assert z is not None
    assert 9101 in z.comuna_codes
    conce = zone_by_comuna(8112)
    assert conce is not None
    assert conce.slug == "concepcion"
    assert zone_by_comuna(99999) is None
