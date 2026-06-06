"""Per-hazard alert evaluation (pure functions, no I/O).

Composite regional score is not used for gating ChileRisk alerts.
"""

from dataclasses import dataclass
from typing import Literal

AlertSeverity = Literal["moderado", "alto", "critico"]
ClimateHazard = Literal["ola_calor", "ola_frio", "viento"]

SEISMIC_MAGNITUDE_THRESHOLDS: dict[AlertSeverity, float] = {
    "moderado": 4.0,
    "alto": 5.0,
    "critico": 6.5,
}
SEISMIC_INTENSITY_THRESHOLDS: dict[AlertSeverity, float] = {
    "moderado": 3.0,
    "alto": 5.0,
    "critico": 7.0,
}
SEISMIC_SCORE_THRESHOLDS: dict[AlertSeverity, float] = {
    "moderado": 35,
    "alto": 55,
    "critico": 75,
}
CLIMATE_SCORE_THRESHOLDS: dict[AlertSeverity, float] = {
    "moderado": 55,
    "alto": 75,
    "critico": 90,
}

SEVERITY_ORDER: tuple[AlertSeverity, ...] = ("moderado", "alto", "critico")


@dataclass(frozen=True)
class HazardAlertEvaluation:
    hazard: str
    severity: AlertSeverity
    trigger_value: float
    trigger_metric: str


def severity_from_value(
    value: float,
    thresholds: dict[AlertSeverity, float],
) -> AlertSeverity | None:
    if value >= thresholds["critico"]:
        return "critico"
    if value >= thresholds["alto"]:
        return "alto"
    if value >= thresholds["moderado"]:
        return "moderado"
    return None


def evaluate_seismic(
    *,
    max_intensity: float | None,
    max_sismo_score: float,
    max_magnitude: float | None = None,
) -> HazardAlertEvaluation | None:
    """Magnitude from CSN wins; fallback to estimated intensity, then score."""
    if max_magnitude is not None and max_magnitude > 0:
        sev = severity_from_value(max_magnitude, SEISMIC_MAGNITUDE_THRESHOLDS)
        if sev:
            return HazardAlertEvaluation(
                hazard="sismo",
                severity=sev,
                trigger_value=max_magnitude,
                trigger_metric="magnitude",
            )

    if max_intensity is not None and max_intensity > 0:
        sev = severity_from_value(max_intensity, SEISMIC_INTENSITY_THRESHOLDS)
        if sev:
            return HazardAlertEvaluation(
                hazard="sismo",
                severity=sev,
                trigger_value=max_intensity,
                trigger_metric="intensity",
            )

    sev = severity_from_value(max_sismo_score, SEISMIC_SCORE_THRESHOLDS)
    if sev:
        return HazardAlertEvaluation(
            hazard="sismo",
            severity=sev,
            trigger_value=max_sismo_score,
            trigger_metric="sismo_score",
        )
    return None


def evaluate_climate_hazard(
    hazard: ClimateHazard,
    score: float,
) -> HazardAlertEvaluation | None:
    sev = severity_from_value(score, CLIMATE_SCORE_THRESHOLDS)
    if not sev:
        return None
    return HazardAlertEvaluation(
        hazard=hazard,
        severity=sev,
        trigger_value=score,
        trigger_metric=f"{hazard}_score",
    )


def evaluate_region_hazards(
    *,
    sismo_score: float,
    max_sismo_score: float,
    ola_calor_score: float,
    ola_frio_score: float,
    viento_score: float,
    max_intensity: float | None = None,
    max_magnitude: float | None = None,
) -> list[HazardAlertEvaluation]:
    """Return zero or more hazard alerts for one region (multi-hazard)."""
    results: list[HazardAlertEvaluation] = []

    seismic = evaluate_seismic(
        max_intensity=max_intensity,
        max_sismo_score=max_sismo_score,
        max_magnitude=max_magnitude,
    )
    if seismic:
        results.append(seismic)

    for hazard, score in (
        ("ola_calor", ola_calor_score),
        ("ola_frio", ola_frio_score),
        ("viento", viento_score),
    ):
        climate = evaluate_climate_hazard(hazard, score)
        if climate:
            results.append(climate)

    return results