"""Tests for SERNAPRED simulacros scraping + parse helpers."""

from datetime import date
from pathlib import Path

import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.database import Base
from app.models.simulacro import Simulacro

from app.services.simulacro_parsers import (
    _extract_calendar_summary,
    _extract_participating_comunas,
    _extract_region,
    _normalize_drill_type,
    absolute_detail_url,
    parse_calendar_section,
    parse_detail_page,
    parse_detail_summary,
    parse_index,
    _parse_short_date,
    slug_from_href,
    year_from_slug,
)
from app.services.simulacro_sync import (
    _enrich_with_details,
    _to_row,
    _upsert_simulacros,
)

FIXTURES = Path(__file__).parent / "fixtures"
INDEX_HTML = (FIXTURES / "simulacros_index_sample.html").read_text(encoding="utf-8")
OHIGGINS_HTML = (FIXTURES / "simulacro_detail_ohiggins_2026.html").read_text(
    encoding="utf-8"
)
HOME_FALLBACK_HTML = (
    FIXTURES / "simulacro_detail_home_fallback.html"
).read_text(encoding="utf-8")


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


def test_extract_participating_comunas_singular():
    text = "Simulacro por Erupción Volcánica, participa la comuna de Aysén y Río Ibáñez."
    assert _extract_participating_comunas(text) == ["Aysén", "Río Ibáñez"]
    assert _extract_participating_comunas(
        "Simulacro, participan todas las comunas del borde costero."
    ) == []


def test_extract_calendar_summary_starts_at_simulacro():
    text = (
        "Jueves 27 agosto Región de Aysén "
        "Simulacro por Erupción Volcánica, participa la comuna de Aysén."
    )
    assert _extract_calendar_summary(text) == (
        "Simulacro por Erupción Volcánica, participa la comuna de Aysén."
    )


def test_parse_short_date_with_calendar_year():
    today = date(2026, 6, 14)
    parsed = _parse_short_date("16", "abril", today=today, calendar_year=2026)
    assert parsed == date(2026, 4, 16)


def test_parse_short_date_future_in_year():
    today = date(2026, 4, 1)
    parsed = _parse_short_date("16", "abril", today=today)
    assert parsed == date(2026, 4, 16)


DETAIL_HTML = """
<html>
  <body>
    <div data-elementor-type="wp-post">
      <div class="elementor-widget elementor-widget-text-editor">
        <p>
          SENAPRED, en coordinación con los organismos que integran el Sistema
          Nacional de Prevención y Respuesta ante Desastres, ejecutan año a año una
          serie de simulacros de evacuación en distintos territorios del país con
          gran cobertura.
        </p>
      </div>
      <div class="elementor-widget elementor-widget-text-editor">
        <p>Este simulacro contará con Mensaje SAE.</p>
      </div>
    </div>
  </body>
</html>
"""


def test_parse_calendar_section_only_2026_block():
    today = date(2026, 6, 14)
    items = parse_calendar_section(INDEX_HTML, today=today)

    assert len(items) == 4
    slugs = {r["slug"] for r in items}
    assert "sbc-magallanes-2026" in slugs
    assert "sbc-antofagasta-2026" in slugs
    assert "srm-ohiggins-2026" in slugs
    assert "sev-aysen-2026" in slugs
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
    assert future["calendar_summary"].startswith("Simulacro por Remoción en masa")

    aysen = next(r for r in items if r["slug"] == "sev-aysen-2026")
    assert aysen["participating_comunas"] == ["Aysén", "Río Ibáñez"]
    assert aysen["calendar_summary"].startswith("Simulacro por Erupción Volcánica")


def test_to_row_prefers_detail_summary_and_falls_back_to_calendar_summary():
    record = {
        "slug": "sev-aysen-2026",
        "title": "Erupción Volcánica — Región de Aysén",
        "drill_date": date(2026, 8, 27),
        "calendar_summary": "Descripción visible del calendario.",
        "summary": "Resumen enriquecido de la página de detalle.",
        "has_detail_page": False,
        "headline": "Headline de prueba",
        "detail_body": [{"kind": "paragraph", "text": "hola", "items": [], "links": []}],
    }
    row = _to_row(record)
    assert row["summary"] == "Resumen enriquecido de la página de detalle."
    assert row["headline"] == "Headline de prueba"
    assert row["detail_body"][0]["kind"] == "paragraph"
    record["summary"] = None
    assert _to_row(record)["summary"] == "Descripción visible del calendario."


def test_parse_index_splits_future_and_past_from_calendar():
    today = date(2026, 6, 14)
    future, past = parse_index(INDEX_HTML, today=today)
    assert len(future) == 2
    assert len(past) == 2


def test_parse_detail_summary_extracts_text_and_sae():
    summary, comunas, sae = parse_detail_summary(DETAIL_HTML)
    assert summary is not None
    assert "SENAPRED" in summary
    assert sae is True
    assert comunas == []


def test_parse_detail_page_magallanes_steps_and_sae():
    html = (FIXTURES / "simulacro_detail_magallanes_2026.html").read_text(encoding="utf-8")
    parsed = parse_detail_page(html)
    assert parsed["mensaje_sae"] is True
    assert parsed["participating_comunas"] == [
        "Cabo de Hornos",
        "Porvenir",
        "Natales",
        "Punta Arenas",
        "Timaukel",
    ]
    assert parsed["headline"] and "participar" in parsed["headline"].lower()
    kinds = [b["kind"] for b in parsed["body_blocks"]]
    assert "steps" in kinds
    assert "sae_notice" in kinds
    assert "link_list" in kinds
    steps = next(b for b in parsed["body_blocks"] if b["kind"] == "steps")
    assert len(steps["items"]) == 7
    planos = [
        b for b in parsed["body_blocks"] if b["kind"] == "link_list" and b.get("links")
    ]
    assert any(len(b["links"]) >= 5 for b in planos)


def test_parse_detail_page_biobio_schedule_and_callouts():
    html = (FIXTURES / "simulacro_detail_biobio_2025.html").read_text(encoding="utf-8")
    parsed = parse_detail_page(html)
    assert parsed["schedule_note"] == "HORARIO: DIURNO"
    assert parsed["mensaje_sae"] is True
    assert parsed["headline"] and "SISMO" in parsed["headline"].upper()
    kinds = [b["kind"] for b in parsed["body_blocks"]]
    assert "callout" in kinds
    assert "sae_notice" in kinds
    assert "link_list" in kinds
    sae = next(b for b in parsed["body_blocks"] if b["kind"] == "sae_notice")
    assert len(sae["links"]) >= 3


def test_parse_detail_page_ohiggins_preserves_source_fidelity():
    parsed = parse_detail_page(OHIGGINS_HTML)

    assert parsed["headline"] == "Participa en el Simulacro por Aluvión"
    assert parsed["schedule_note"] == "11:00 horas"
    assert parsed["participating_comunas"] == ["Malloa"]
    assert parsed["hero_image_url"] == (
        "https://media.senapred.cl/wp-content/uploads/2026/06/06121256/"
        "PANOR0_0747-scaled-e1783354407959.jpg"
    )
    assert [block["kind"] for block in parsed["body_blocks"]] == [
        "heading",
        "heading",
        "steps",
        "steps",
        "heading",
        "paragraph",
        "link_list",
        "heading",
        "link_list",
    ]

    steps = [block for block in parsed["body_blocks"] if block["kind"] == "steps"]
    assert [block["title"] for block in steps] == [
        "Acciones previas al simulacro",
        "Durante el simulacro",
    ]
    assert [len(block["items"]) for block in steps] == [4, 7]
    links = [
        link
        for block in parsed["body_blocks"]
        for link in block.get("links", [])
    ]
    assert {link["url"] for link in links} == {
        "https://bibliogrd.senapred.gob.cl/bitstream/handle/1671/9002/"
        "MALLOA.pdf?sequence=1&isAllowed=y",
        "https://www.subtel.gob.cl/sae/",
    }
    assert "Cantarrana" not in parsed["participating_comunas"]
    assert "Caracoles" not in parsed["participating_comunas"]


def test_parse_detail_page_rejects_senapred_homepage_fallback():
    parsed = parse_detail_page(HOME_FALLBACK_HTML)

    assert parsed == {
        "summary": None,
        "participating_comunas": [],
        "mensaje_sae": False,
        "headline": None,
        "schedule_note": None,
        "hero_image_url": None,
        "body_blocks": [],
    }


@pytest.mark.asyncio
async def test_enrich_probes_deterministic_detail_url_without_index_link():
    record = {"slug": "srm-ohiggins-2026", "has_detail_page": False}

    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url == httpx.URL(
            "https://senapred.cl/simulacros_t/srm-ohiggins-2026/"
        )
        return httpx.Response(200, text=OHIGGINS_HTML)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        enriched, unavailable = await _enrich_with_details([record], client)

    assert enriched == {"srm-ohiggins-2026"}
    assert unavailable == set()
    assert record["has_detail_page"] is True
    assert record["detail_href"].endswith("/simulacros_t/srm-ohiggins-2026/")
    assert record["headline"] == "Participa en el Simulacro por Aluvión"
    assert record["schedule_note"] == "11:00 horas"
    assert record["detail_body"]


@pytest.mark.asyncio
async def test_enrich_rejects_successful_html_without_detail_structure():
    record = {"slug": "empty-2026", "has_detail_page": False}
    html = '<html><body><div data-elementor-type="wp-post"></div></body></html>'

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text=html)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        enriched, unavailable = await _enrich_with_details([record], client)

    assert enriched == set()
    assert unavailable == set()
    assert record["has_detail_page"] is False
    assert "detail_href" not in record



@pytest.mark.asyncio
async def test_enrich_marks_homepage_fallback_as_unavailable():
    record = {
        "slug": "sbc-atacama-2026",
        "has_detail_page": False,
        "detail_href": "https://senapred.cl/simulacros_t/sbc-atacama-2026/",
    }

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text=HOME_FALLBACK_HTML)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        enriched, unavailable = await _enrich_with_details([record], client)

    assert enriched == set()
    assert unavailable == {"sbc-atacama-2026"}
    assert record["has_detail_page"] is False
    assert "detail_href" not in record

@pytest.mark.asyncio
async def test_upsert_preserves_detail_until_slug_is_enriched():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, expire_on_commit=False)

    seed = {
        "slug": "srm-ohiggins-2026",
        "title": "Simulacro O’Higgins",
        "drill_date": date(2026, 8, 13),
        "region_code": 6,
        "region_name": "Región de O'Higgins",
        "drill_type": "remocion_en_masa",
        "participating_comunas": ["Malloa"],
        "summary": "Resumen calendario",
        "detail_url": "https://senapred.cl/simulacros_t/srm-ohiggins-2026/",
        "mensaje_sae": False,
        "source": "future",
        "headline": "Detalle anterior",
        "schedule_note": "10:00 horas",
        "hero_image_url": "https://example.test/old.jpg",
        "detail_body": [{"kind": "heading", "title": "Anterior"}],
    }
    replacement = {
        **seed,
        "title": "Simulacro O’Higgins actualizado",
        "summary": "Resumen calendario actualizado",
        "headline": "Detalle nuevo",
        "schedule_note": "11:00 horas",
        "hero_image_url": "https://example.test/new.jpg",
        "detail_body": [{"kind": "heading", "title": "Nuevo"}],
    }

    async with maker() as session:
        await _upsert_simulacros(
            session,
            [seed],
            enriched_slugs={"srm-ohiggins-2026"},
            unavailable_slugs=set(),
        )
        await _upsert_simulacros(
            session,
            [replacement],
            enriched_slugs=set(),
            unavailable_slugs=set(),
        )
        stored = (
            await session.execute(
                select(Simulacro).where(Simulacro.slug == "srm-ohiggins-2026")
            )
        ).scalar_one()
        assert stored.title == "Simulacro O’Higgins actualizado"
        assert stored.summary == "Resumen calendario actualizado"
        assert stored.headline == "Detalle anterior"
        assert stored.schedule_note == "10:00 horas"
        assert stored.hero_image_url == "https://example.test/old.jpg"
        assert stored.detail_body == [{"kind": "heading", "title": "Anterior"}]

        await _upsert_simulacros(
            session,
            [replacement],
            enriched_slugs={"srm-ohiggins-2026"},
            unavailable_slugs=set(),
        )
        stored = (
            await session.execute(
                select(Simulacro).where(Simulacro.slug == "srm-ohiggins-2026")
            )
        ).scalar_one()
        assert stored.headline == "Detalle nuevo"
        assert stored.schedule_note == "11:00 horas"
        assert stored.hero_image_url == "https://example.test/new.jpg"
        assert stored.detail_body == [{"kind": "heading", "title": "Nuevo"}]

        await _upsert_simulacros(
            session,
            [{**replacement, "participating_comunas": ["Aysén"]}],
            enriched_slugs=set(),
            unavailable_slugs={"srm-ohiggins-2026"},
        )
        session.expire_all()
        stored = (
            await session.execute(
                select(Simulacro).where(Simulacro.slug == "srm-ohiggins-2026")
            )
        ).scalar_one()
        assert stored.participating_comunas == ["Aysén"]
        assert stored.headline is None
        assert stored.schedule_note is None
        assert stored.hero_image_url is None
        assert stored.detail_body == []

    await engine.dispose()


def test_parse_calendar_section_handles_empty_html():
    assert parse_calendar_section("<html><body></body></html>", today=date(2026, 4, 1)) == []


def test_year_from_slug_fallback():
    assert year_from_slug("sbc-magallanes-2026") == date(2026, 1, 1)
    assert year_from_slug("no-year-here") is None


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
