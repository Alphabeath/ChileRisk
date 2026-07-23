from app.services.senapred_geography import infer_geography, title_implies_region_scope


def test_title_implies_region_scope():
    assert title_implies_region_scope("Sismo en la Región de Coquimbo")
    assert title_implies_region_scope("Alerta para regiones del sur")
    assert not title_implies_region_scope("Alerta en Isla de Pascua")


def test_infer_regional_scope():
    scope, codes = infer_geography(
        "Sismo de menor intensidad en la Región de Coquimbo",
        None,
        4,
    )
    assert scope == "region"
    assert codes == []


def test_infer_comuna_isla_de_pascua():
    scope, codes = infer_geography(
        "Alerta por sismo en Isla de Pascua",
        None,
        5,
    )
    assert scope == "comuna"
    assert codes == [5201]


def test_infer_unknown_without_region_keyword_or_comuna():
    scope, codes = infer_geography("Alerta meteorológica costera", None, 5)
    assert scope == "unknown"
    assert codes == []


def test_infer_unknown_without_region_code():
    scope, codes = infer_geography("Región de Valparaíso", None, None)
    assert scope == "unknown"
    assert codes == []


def test_infer_prefers_meta_comunas():
    scope, codes = infer_geography(
        "Alerta meteorológica costera",
        None,
        13,
        meta_comunas="Santiago, Puente Alto",
    )
    assert scope == "comuna"
    assert 13101 in codes  # Santiago
    assert 13201 in codes  # Puente Alto


def test_infer_meta_provincias_as_region_when_no_comunas():
    scope, codes = infer_geography(
        "Alerta por evento meteorológico",
        None,
        13,
        meta_provincias="Provincia de Santiago",
    )
    assert scope == "region"
    assert codes == []


def test_infer_title_region_beats_meta_comunas():
    scope, codes = infer_geography(
        "Monitoreo Alerta Temprana Preventiva para la Región de Valparaíso",
        None,
        5,
        meta_comunas="Viña del Mar",
    )
    assert scope == "region"
    assert codes == []
