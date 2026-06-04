"""Unit tests for per-hazard alert evaluation."""

from app.services.alert_evaluator import (
    evaluate_climate_hazard,
    evaluate_region_hazards,
    evaluate_seismic,
)


def test_seismic_alert_fires_with_low_climate():
    """M4.5-class intensity with low climate scores → yellow seismic alert only."""
    alerts = evaluate_region_hazards(
        sismo_score=20.0,
        max_sismo_score=49.9,
        ola_calor_score=11.2,
        ola_frio_score=24.8,
        viento_score=3.2,
        max_intensity=4.16,
        max_magnitude=4.5,
    )
    assert len(alerts) == 1
    assert alerts[0].hazard == "sismo"
    assert alerts[0].severity == "moderado"
    assert alerts[0].trigger_metric == "intensity"


def test_heat_alert_fires_without_seismic():
    alerts = evaluate_region_hazards(
        sismo_score=10.0,
        max_sismo_score=10.0,
        ola_calor_score=85.0,
        ola_frio_score=5.0,
        viento_score=5.0,
        max_intensity=None,
    )
    hazards = {a.hazard for a in alerts}
    assert hazards == {"ola_calor"}
    assert alerts[0].severity == "alto"


def test_multi_hazard_alerts():
    alerts = evaluate_region_hazards(
        sismo_score=60.0,
        max_sismo_score=70.0,
        ola_calor_score=80.0,
        ola_frio_score=10.0,
        viento_score=5.0,
        max_intensity=5.2,
        max_magnitude=5.0,
    )
    hazards = {a.hazard for a in alerts}
    assert hazards == {"sismo", "ola_calor"}
    seismic = next(a for a in alerts if a.hazard == "sismo")
    assert seismic.severity == "alto"
    heat = next(a for a in alerts if a.hazard == "ola_calor")
    assert heat.severity == "alto"


def test_no_alert_when_all_low():
    alerts = evaluate_region_hazards(
        sismo_score=10.0,
        max_sismo_score=15.0,
        ola_calor_score=20.0,
        ola_frio_score=20.0,
        viento_score=10.0,
        max_intensity=1.5,
    )
    assert alerts == []


def test_alert_via_sismo_score_fallback():
    """No impacts row but elevated max comuna sismo_score triggers alert."""
    alert = evaluate_seismic(max_intensity=None, max_sismo_score=40.0)
    assert alert is not None
    assert alert.severity == "moderado"
    assert alert.trigger_metric == "sismo_score"


def test_fallback_not_diluted_by_low_regional_average():
    """High max_sismo_score alerts even when aggregated sismo_score is low."""
    alerts = evaluate_region_hazards(
        sismo_score=12.0,
        max_sismo_score=49.9,
        ola_calor_score=10.0,
        ola_frio_score=10.0,
        viento_score=5.0,
        max_intensity=None,
    )
    assert len(alerts) == 1
    assert alerts[0].hazard == "sismo"
    assert alerts[0].trigger_metric == "sismo_score"


def test_intensity_beats_weaker_score_fallback():
    alert = evaluate_seismic(max_intensity=4.0, max_sismo_score=10.0)
    assert alert is not None
    assert alert.trigger_metric == "intensity"


def test_climate_critico_threshold():
    alert = evaluate_climate_hazard("viento", 92.0)
    assert alert is not None
    assert alert.severity == "critico"