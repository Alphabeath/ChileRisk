from app.services.senapred_service import _is_active, is_cancel_title


def test_alerta_cancela_y_declara_es_activa():
    raw = {
        "id": "pucon-test-1",
        "titulo": "Se cancela alerta amarilla y declara alerta roja para la comuna de Pucón por evento meteorológico",
        "isActive": True,
        "isDeleted": False,
        "isPrincipal": True,
        "metaData": '{"codigoAlertaEvento":"r"}',
    }
    assert is_cancel_title(raw["titulo"]) is False
    assert _is_active(raw["titulo"], raw, kind="alerta") is True


def test_alerta_solo_cancelada_es_inactiva():
    raw = {
        "id": "x",
        "titulo": "Se cancela alerta amarilla para la comuna de Villarrica",
        "isActive": True,
        "isDeleted": False,
        "isPrincipal": True,
    }
    assert is_cancel_title(raw["titulo"]) is True
    assert _is_active(raw["titulo"], raw, kind="alerta") is False


def test_alerta_cancela_roja_salamanca_por_desborde():
    titulo = "Se cancela Alerta Roja para la comuna de Salamanca por desborde"
    raw = {
        "id": "salamanca-cancel",
        "titulo": titulo,
        "isActive": True,
        "isDeleted": False,
        "isPrincipal": True,
        "metaData": '{"codigoAlertaEvento":"r"}',
    }
    assert is_cancel_title(titulo) is True
    assert _is_active(titulo, raw, kind="alerta") is False


def test_alerta_declara_sin_cancel_es_activa():
    raw = {
        "id": "y",
        "titulo": "Se declara alerta roja para la comuna de Pucón por evento meteorológico",
        "isActive": True,
        "isDeleted": False,
        "isPrincipal": True,
        "metaData": '{"codigoAlertaEvento":"r"}',
    }
    assert is_cancel_title(raw["titulo"]) is False
    assert _is_active(raw["titulo"], raw, kind="alerta") is True


def test_alerta_no_principal_es_inactiva():
    raw = {
        "id": "old",
        "titulo": "Se declara alerta amarilla para la comuna de Arauco",
        "isActive": True,
        "isDeleted": False,
        "isPrincipal": False,
    }
    assert _is_active(raw["titulo"], raw, kind="alerta") is False


def test_evento_no_principal_es_inactivo():
    raw = {
        "id": "evt-old",
        "titulo": "Sismo de menor intensidad en la Región de Antofagasta",
        "isActive": True,
        "isDeleted": False,
        "isPrincipal": False,
    }
    assert _is_active(raw["titulo"], raw, kind="evento") is False


def test_evento_principal_activo():
    raw = {
        "id": "evt-new",
        "titulo": "Sismo de menor intensidad en la Región de Antofagasta",
        "isActive": True,
        "isDeleted": False,
        "isPrincipal": True,
    }
    assert _is_active(raw["titulo"], raw, kind="evento") is True
