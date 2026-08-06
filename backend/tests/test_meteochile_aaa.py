"""Tests: MeteoChile AAA JSON + sync/fan-out + ActiveAlertOut."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from app.models.meteochile_aaa_alert import MeteoChileAaaAlert
from app.schemas.alert import ActiveAlertOut
from app.schemas.meteochile_aaa import MeteoChileAaaFeed
from app.services.alert_service import _meteochile_row_to_out
from app.services.meteochile_aaa_parsers import (
    geometries_for_item,
    parse_aaa_coordinate_js,
    parse_inline_area_polygon,
    zone_ids_from_data_zona,
)
from app.services.meteochile_aaa_service import (
    _LEVEL_MAP,
    _geometry_for_map,
    _rows_from_item,
    normalize_feed,
)
from app.services.meteochile_aaa_zones import (
    cut_comunas_for_zone_ids,
    region_cut_for_dmc_id,
    resolve_comuna_codes,
    resolve_comuna_codes_in_region,
)

FIXTURES = Path(__file__).parent / "fixtures" / "meteochile_aaa"


def test_parse_feed_fixture():
    raw = json.loads((FIXTURES / "datos_AAA.json").read_text(encoding="utf-8"))
    feed = MeteoChileAaaFeed.model_validate(raw)
    assert feed.avisos >= 1
    assert feed.alertas >= 0
    assert len(feed.items) == feed.avisos + feed.alertas + feed.alarmas
    types = {i.tipo for i in feed.items}
    assert "Aviso" in types
    storm = next(i for i in feed.items if i.id == "5366")
    assert storm.fenomeno == "Tormentas Eléctricas"
    assert storm.tipo_zona_afecta == "zonas"
    ids = zone_ids_from_data_zona(storm.data_zona_afecta)
    assert "08a_Litoral" in ids
    assert "08b_Cordillera" in ids


def test_parse_zone_coordinate_js_to_geojson():
    src = (FIXTURES / "coordenadas_zonas_sample.js").read_text(encoding="utf-8")
    geoms = parse_aaa_coordinate_js(src)
    assert "08a_Litoral" in geoms
    assert "03_Litoral" in geoms
    assert "05m_Cordillera" in geoms
    poly = geoms["08a_Litoral"]
    assert poly["type"] == "Polygon"
    ring = poly["coordinates"][0]
    assert len(ring) >= 4  # closed
    assert ring[0] == ring[-1]
    # GeoJSON order: lng, lat (Chile west → lng ~ -72)
    assert ring[0][0] < -70
    assert -40 < ring[0][1] < -30


def test_parse_region_js_polygon_and_point():
    src = (FIXTURES / "coordenadas_regiones_sample.js").read_text(encoding="utf-8")
    geoms = parse_aaa_coordinate_js(src)
    assert geoms["08a"]["type"] == "Polygon"
    assert geoms["ip"]["type"] == "Point"
    assert geoms["ip"]["radius_m"] > 0


def test_geometries_for_zonas_item():
    zone_geoms = parse_aaa_coordinate_js(
        (FIXTURES / "coordenadas_zonas_sample.js").read_text(encoding="utf-8")
    )
    region_geoms = parse_aaa_coordinate_js(
        (FIXTURES / "coordenadas_regiones_sample.js").read_text(encoding="utf-8")
    )
    geoms = geometries_for_item(
        tipo_zona_afecta="zonas",
        data_zona_afecta="08a_Litoral,03_Litoral",
        zone_geoms=zone_geoms,
        region_geoms=region_geoms,
    )
    assert len(geoms) == 2
    geoms_r = geometries_for_item(
        tipo_zona_afecta="regiones",
        data_zona_afecta="08a,ip",
        zone_geoms=zone_geoms,
        region_geoms=region_geoms,
    )
    assert len(geoms_r) == 2


def test_inline_area_polygon():
    poly = parse_inline_area_polygon(
        "-33.0,-70.5|-33.1,-70.5|-33.1,-70.4|-33.0,-70.4"
    )
    assert poly is not None
    assert poly["type"] == "Polygon"
    assert poly["coordinates"][0][0] == [-70.5, -33.0]


def test_cut_mapping_spike_zones():
    assert region_cut_for_dmc_id("08a_Litoral") == 16
    assert region_cut_for_dmc_id("05m_Cordillera") == 13
    assert region_cut_for_dmc_id("ip") == 5
    comunas = cut_comunas_for_zone_ids(["08a_Litoral", "05m_Cordillera"])
    assert 16202 in comunas  # Cobquecura sample
    assert 13115 in comunas  # Lo Barnechea sample


def test_normalize_feed_attaches_seed_comunas():
    raw = json.loads((FIXTURES / "datos_AAA.json").read_text(encoding="utf-8"))
    feed = MeteoChileAaaFeed.model_validate(raw)
    zone_geoms = parse_aaa_coordinate_js(
        (FIXTURES / "coordenadas_zonas_sample.js").read_text(encoding="utf-8")
    )
    region_geoms = parse_aaa_coordinate_js(
        (FIXTURES / "coordenadas_regiones_sample.js").read_text(encoding="utf-8")
    )
    rows = normalize_feed(feed, zone_geoms=zone_geoms, region_geoms=region_geoms)
    storm = next(r for r in rows if r["external_id"] == "meteochile:5366")
    assert storm["source"] == "meteochile"
    assert storm["level_hint"] == "amarilla"
    assert 16 in storm["region_codes"] or 8 in storm["region_codes"]
    # Seeded fringe present in this alert's zone list
    assert any(c in storm["comuna_codes"] for c in (16202, 16207, 16203, 16205))
    assert any(g["type"] == "Polygon" for g in storm["geometries"])


def test_level_map_aviso_alerta_alarma():
    assert _LEVEL_MAP["Aviso"] == "amarilla"
    assert _LEVEL_MAP["Alerta"] == "naranja"
    assert _LEVEL_MAP["Alarma"] == "roja"


def test_geometry_for_map_polygon_and_point():
    poly = {
        "type": "Polygon",
        "coordinates": [[[-70.0, -33.0], [-70.1, -33.0], [-70.1, -33.1], [-70.0, -33.0]]],
    }
    assert _geometry_for_map(poly)["type"] == "Polygon"
    point = {"type": "Point", "coordinates": [-109.3, -27.1], "radius_m": 1000}
    circled = _geometry_for_map(point)
    assert circled["type"] == "Polygon"
    assert len(circled["coordinates"][0]) >= 4


def test_rows_from_item_fans_out_per_region():
    raw = json.loads((FIXTURES / "datos_AAA.json").read_text(encoding="utf-8"))
    feed = MeteoChileAaaFeed.model_validate(raw)
    storm = next(i for i in feed.items if i.id == "5366")
    now = datetime.now(timezone.utc)
    rows = _rows_from_item(storm, now=now)
    assert len(rows) >= 2
    keys = {r["row_key"] for r in rows}
    assert all(k.startswith("5366:") for k in keys)
    codes = {r["region_code"] for r in rows}
    assert None not in codes
    # At least Biobío / Ñuble fringe prefixes map to CUT 8 or 16
    assert codes & {8, 16}


def test_ip_override_only_isla_de_pascua():
    """Isla de Pascua must not attribute continental Valparaíso comunas."""
    codes = resolve_comuna_codes(["ip"])
    assert codes == [5201]
    in_valpo = resolve_comuna_codes_in_region(["ip"], 5)
    assert in_valpo == [5201]
    # No comunas outside Valparaíso
    assert resolve_comuna_codes_in_region(["ip"], 13) == []


def test_rows_from_item_ip_comuna_scope():
    raw = json.loads((FIXTURES / "datos_AAA.json").read_text(encoding="utf-8"))
    feed = MeteoChileAaaFeed.model_validate(raw)
    # Prefer live fixture id if present; else synthesize
    ip_items = [
        i
        for i in feed.items
        if "ip" in zone_ids_from_data_zona(i.data_zona_afecta)
    ]
    now = datetime.now(timezone.utc)
    if ip_items:
        rows = _rows_from_item(ip_items[0], now=now)
    else:
        from app.schemas.meteochile_aaa import MeteoChileAaaItem

        item = MeteoChileAaaItem.model_validate(
            {
                "id": "9999",
                "tipo": "Aviso",
                "codigoMeteo": "A-TEST",
                "fenomeno": "Viento",
                "titulo": "Viento en Isla de Pascua",
                "tipoZonaAfecta": "regiones",
                "dataZonaAfecta": "ip",
                "textoZonaAfecta": "Isla de Pascua",
            }
        )
        rows = _rows_from_item(item, now=now)
    assert len(rows) == 1
    row = rows[0]
    assert row["region_code"] == 5
    assert row["affected_scope"] == "comuna"
    assert row["comuna_codes"] == [5201]


def test_seed_litoral_nuble_subset():
    """Without live JS catalogs, seeded 08a_Litoral stays Ñuble-only."""
    codes = resolve_comuna_codes_in_region(["08a_Litoral"], 16)
    assert set(codes) <= {16202, 16207, 16203, 16205}
    assert codes
    assert resolve_comuna_codes_in_region(["08a_Litoral"], 8) == []


def test_meteochile_row_to_out():
    now = datetime.now(timezone.utc)
    row = MeteoChileAaaAlert(
        row_key="5366:16",
        aaa_id="5366",
        codigo_meteo="AAA-TEST",
        tipo="Aviso",
        level="amarilla",
        fenomeno="Tormentas Eléctricas",
        title="Aviso por tormentas",
        content="Detalle",
        region_code=16,
        region_name="Ñuble",
        affected_scope="region",
        comuna_codes=[],
        zone_ids=["08a_Litoral"],
        external_url="https://archivos.meteochile.gob.cl/portaldmc/AAA/aaa_mapa.php",
        is_active=True,
        issued_at=now,
        synced_at=now,
    )
    out = _meteochile_row_to_out(row)
    assert out.source == "meteochile"
    assert out.id == "meteochile:5366:16"
    assert out.level == "amarilla"
    assert out.region_code == 16
    assert out.hazard_type == "otros"


def test_active_alert_out_accepts_meteochile_source():
    now = datetime.now(timezone.utc)
    alert = ActiveAlertOut(
        id="meteochile:1:13",
        source="meteochile",
        level="amarilla",
        title="Alerta viento",
        issued_at=now,
        synced_at=now,
    )
    assert alert.source == "meteochile"
