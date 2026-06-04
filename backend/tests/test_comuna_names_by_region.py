from app.data.comuna_names_by_region import resolve_in_text_for_region


def test_resolve_isla_de_pascua_in_region_5():
    assert resolve_in_text_for_region("Alerta en Isla de Pascua", 5) == [5201]


def test_resolve_rapa_nui_alias():
    assert resolve_in_text_for_region("Monitoreo en Rapa Nui", 5) == [5201]


def test_no_match_wrong_region():
    assert resolve_in_text_for_region("Alerta en Isla de Pascua", 4) == []