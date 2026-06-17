"""
Pure risk scoring utilities (extracted from legacy mock_service).

These are deterministic composite + severity functions used by real data paths
(risk_service, openmeteo, daily_risk, region). No synthetic data generation.
"""

HAZARD_WEIGHTS = {
    "sismo": 1.5,
    "ola_calor": 1.0,
    "viento": 0.8,
    "ola_frio": 0.6,
}


def compute_composite_and_dominant(scores: dict[str, float]) -> tuple[float, str]:
    """Weighted average composite with dominant hazard bonus."""
    weighted_sum = 0.0
    total_weight = 0.0
    dominant = max(scores, key=scores.get)

    for hazard, score in scores.items():
        weight = HAZARD_WEIGHTS.get(hazard, 1.0)
        if hazard == dominant:
            if score >= 70:
                weight *= 2.5
            elif score >= 50:
                weight *= 2.0
            else:
                weight *= 1.5
        weighted_sum += score * weight
        total_weight += weight

    composite = weighted_sum / total_weight if total_weight > 0 else 0.0
    return round(composite, 1), dominant


def severity_from_score(score: float) -> str:
    if score >= 75:
        return "critico"
    if score >= 55:
        return "alto"
    if score >= 35:
        return "moderado"
    return "bajo"
