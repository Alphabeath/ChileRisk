from app.services.senapred_service import _is_active


def test_alerta_cancela_y_declara_es_activa():
    raw = {
        "id": "pucon-test-1",
        "titulo": "Se cancela alerta amarilla y declara alerta roja para la comuna de Pucón por evento meteorológico",
        "isActive": True,
        "isDeleted": False,
        "isPrincipal": True,
        "metaData": '{"codigoAlertaEvento":"r"}',
    }
    assert _is_active(raw["titulo"], raw, kind="alerta") is True


def test_alerta_solo_cancelada_es_inactiva():
    raw = {
        "id": "x",
        "titulo": "Se cancela alerta amarilla para la comuna de Villarrica",
        "isActive": True,
        "isDeleted": False,
        "isPrincipal": True,
    }
    assert _is_active(raw["titulo"], raw, kind="alerta") is False


def test_alerta_declara_sin_cancel_es_activa():
    raw = {
        "id": "y",
        "titulo": "Se declara alerta roja para la comuna de Pucón por evento meteorológico",
        "isActive": True,
        "isDeleted": False,
        "isPrincipal": True,
        "metaData": '{"codigoAlertaEvento":"r"}',
    }
    assert _is_active(raw["titulo"], raw, kind="alerta") is True
