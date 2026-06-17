"""Tests for SERNAPRED simulacros scraping + parse helpers."""

from datetime import date

import pytest

from app.services.simulacro_parsers import (
    _extract_participating_comunas,
    _extract_region,
    _normalize_drill_type,
    absolute_detail_url,
    parse_calendar_section,
    parse_detail_summary,
    parse_index,
    _parse_long_date,
    _parse_short_date,
    slug_from_href,
    year_from_slug,
)


def test_slug_from_href_valid():
    assert slug_from_href("/simulacros_t/sbc-magallanes-2026/") == "sbc-magallanes-2026"
    assert (
        slug_from_href("https://senapred.cl/simulacros_t/araucania-erupcion-volcanica-2025/")
        == "araucania-erupcion-volcanica-2025"
    )


def test_absolute_detail_url():
    assert (
        absolute_detail_url("/simulacros_t/sbc-magallanes-2026/")
        == "https://senapred.cl/simulacros_t/sbc-magallanes-2026/"
    )
    assert (
        absolute_detail_url("https://senapred.cl/simulacros_t/sce-coquimbo-2026/")
        == "https://senapred.cl/simulacros_t/sce-coquimbo-2026/"
    )


def test_slug_from_href_invalid():
    assert slug_from_href("/alertas/something/") is None
    assert slug_from_href("/simulacros_t/page/2/") is None
    assert slug_from_href(None) is None


def test_extract_region_known():
    name, code = _extract_region("Simulacro en la Región de Magallanes y Antártica Chilena")
    assert code == 12
    assert name and name.startswith("Región de Magallanes")


def test_normalize_drill_type_borde_costero():
    assert (
        _normalize_drill_type("Simulacro por Sismo y Tsunami para el Borde Costero")
        == "sismo_tsunami_borde_costero"
    )


def test_parse_short_date_with_calendar_year():
    today = date(2026, 6, 14)
    parsed = _parse_short_date("16", "abril", today=today, calendar_year=2026)
    assert parsed == date(2026, 4, 16)


def test_parse_short_date_future_in_year():
    today = date(2026, 4, 1)
    parsed = _parse_short_date("16", "abril", today=today)
    assert parsed == date(2026, 4, 16)


INDEX_HTML = """
<html>
  <body>
    <h3>CALENDARIO SIMULACROS 2026</h3>
    <div class="e-con-inner">
      <a href="/simulacros_t/sbc-magallanes-2026/">
        <h2>Jueves</h2>
        <h2>16 abril</h2>
        <h2>Región de Magallanes</h2>
        <p>Simulacro por Sismo y Tsunami para el Borde Costero, participan todas las comunas del borde costero de la región.</p>
      </a>
    </div>
    <div class="e-con-inner">
      <a href="https://senapred.cl/simulacros_t/sbc-antofagasta-2026/">
        <h2>Jueves</h2>
        <h2>04 junio</h2>
        <h2>Región de Antofagasta</h2>
        <p>Simulacro por Sismo y Tsunami para el Borde Costero, participan todas las comunas del borde costero de la región.</p>
      </a>
    </div>
    <div class="e-con-full">
      <h2>Jueves</h2>
      <h2>13 agosto</h2>
      <h2>Región de O'Higgins</h2>
      <p>Simulacro por Remoción en masa, participan las localidades de Cantarrana y Caracoles de la comuna de Malloa.</p>
    </div>

    <h1>Simulacros recientes</h1>
    <div class="elementor-post__card">
      <a href="/simulacros_t/biobio-2025/">
        <h3>Biobío (2025)</h3>
      </a>
    </div>
  </body>
</html>
"""


DETAIL_HTML = """
<html>
  <body>
    <p>
      SENAPRED, en coordinación con los organismos que integran el Sistema Nacional
      de Prevención y Respuesta ante Desastres, ejecutan año a año una serie de
      simulacros de evacuación en distintos territorios del país con gran cobertura.
    </p>
    <p>Este simulacro contará con Mensaje SAE.</p>
  </body>
</html>
"""


def test_parse_calendar_section_only_2026_block():
    today = date(2026, 6, 14)
    items = parse_calendar_section(INDEX_HTML, today=today)

    assert len(items) == 3
    slugs = {r["slug"] for r in items}
    assert "sbc-magallanes-2026" in slugs
    assert "sbc-antofagasta-2026" in slugs
    assert "srm-ohiggins-2026" in slugs
    assert "biobio-2025" not in slugs

    past = next(r for r in items if r["slug"] == "sbc-magallanes-2026")
    assert past["drill_date"] == date(2026, 4, 16)
    assert past["source"] == "recent"
    assert past["has_detail_page"] is True
    assert past["detail_href"] == "https://senapred.cl/simulacros_t/sbc-magallanes-2026/"

    linked = next(r for r in items if r["slug"] == "sbc-antofagasta-2026")
    assert linked["detail_href"] == "https://senapred.cl/simulacros_t/sbc-antofagasta-2026/"

    future = next(r for r in items if r["slug"] == "srm-ohiggins-2026")
    assert future["drill_date"] == date(2026, 8, 13)
    assert future["source"] == "future"
    assert future["has_detail_page"] is False
    assert future.get("detail_href") is None


def test_parse_index_splits_future_and_past_from_calendar():
    today = date(2026, 6, 14)
    future, past = parse_index(INDEX_HTML, today=today)
    assert len(future) == 1
    assert len(past) == 2


def test_parse_detail_summary_extracts_text_and_sae():
    summary, comunas, sae = parse_detail_summary(DETAIL_HTML)
    assert summary is not None
    assert "SENAPRED" in summary
    assert sae is True
    assert comunas == []


def test_parse_calendar_section_handles_empty_html():
    assert parse_calendar_section("<html><body></body></html>", today=date(2026, 4, 1)) == []


def test_year_from_slug_fallback():
    assert year_from_slug("sbc-magallanes-2026") == date(2026, 1, 1)
    assert year_from_slug("no-year-here") is None


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))