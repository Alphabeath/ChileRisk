from app.services.senapred_service import (
    _parse_evento,
    normalize_hazard_type,
    _map_level,
)


def test_map_level_az_evento():
    assert _map_level("az", kind="evento") == "informativa"


def test_normalize_hazard_sismo():
    assert normalize_hazard_type("Sismo") == "sismo"


def test_normalize_hazard_volcan():
    assert normalize_hazard_type("Actividad Volcánica") == "volcan"


def test_parse_evento_minimal():
    raw = {
        "id": "evt-1",
        "titulo": "Sismo de menor intensidad en la Región de Coquimbo",
        "fechaHora": "2026-06-02T06:16:49.000Z",
        "isActive": True,
        "isDeleted": False,
        "isPrincipal": True,
        "urlAccess": "sismo-de-menor-intensidad-en-la-region-de-coquimbo-2026",
        "metaData": '{"nombreVariable":"Sismo","codigoAlertaEvento":"az","regiones":"Región de Coquimbo"}',
    }
    parsed_list = _parse_evento(raw)
    assert len(parsed_list) == 1
    parsed = parsed_list[0]
    assert parsed["kind"] == "evento"
    assert parsed["level"] == "informativa"
    assert parsed["category"] == "Sismo"
    assert parsed["is_active"] is True
    assert parsed["affected_scope"] == "region"
    assert parsed["comuna_codes"] == []
    assert parsed["url_access"] == "sismo-de-menor-intensidad-en-la-region-de-coquimbo-2026"


def test_parse_evento_comuna_scope():
    raw = {
        "id": "evt-2",
        "titulo": "Sismo de menor intensidad en Isla de Pascua",
        "fechaHora": "2026-06-02T06:16:49.000Z",
        "isActive": True,
        "isDeleted": False,
        "isPrincipal": True,
        "metaData": '{"nombreVariable":"Sismo","codigoAlertaEvento":"az","regiones":"Región de Valparaíso"}',
    }
    parsed_list = _parse_evento(raw)
    assert len(parsed_list) == 1
    parsed = parsed_list[0]
    assert parsed["region_code"] == 5
    assert parsed["affected_scope"] == "comuna"
    assert parsed["comuna_codes"] == [5201]


def test_parse_evento_no_principal_inactive():
    raw = {
        "id": "evt-3",
        "titulo": "Sismo de menor intensidad en la Región de Antofagasta",
        "fechaHora": "2026-06-02T06:16:49.000Z",
        "isActive": True,
        "isDeleted": False,
        "isPrincipal": False,
        "metaData": '{"nombreVariable":"Sismo","codigoAlertaEvento":"az","regiones":"Región de Antofagasta"}',
    }
    parsed = _parse_evento(raw)[0]
    assert parsed["is_active"] is False


def test_parse_evento_meta_comunas():
    raw = {
        "id": "evt-4",
        "titulo": "Evento meteorológico en sector costero",
        "fechaHora": "2026-06-02T06:16:49.000Z",
        "isActive": True,
        "isDeleted": False,
        "isPrincipal": True,
        "metaData": (
            '{"nombreVariable":"Evento meteorológico","codigoAlertaEvento":"az",'
            '"regiones":"Región Metropolitana de Santiago",'
            '"comunas":"Santiago, Puente Alto"}'
        ),
    }
    parsed = _parse_evento(raw)[0]
    assert parsed["affected_scope"] == "comuna"
    assert 13101 in parsed["comuna_codes"]
    assert 13201 in parsed["comuna_codes"]
