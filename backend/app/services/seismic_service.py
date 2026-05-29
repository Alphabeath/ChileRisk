"""
Seismic impact model for ChileRisk MVP.

Combined approach:
- Mock events are generated with epicenter, magnitude, depth.
- For any given point (comuna centroid), we compute an approximate intensity
  using a simple distance + depth attenuation.
- Intensity is then mapped to a 0-100 risk score.
"""

import math
from datetime import datetime, timedelta, timezone


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def estimate_intensity(magnitude: float, distance_km: float, depth_km: float) -> float:
    """
    Very rough attenuation model (MVP only).

    Returns approximate intensity on a 0-10 scale (similar to MMI).
    Higher magnitude, closer distance, shallower depth → higher intensity.
    """
    if distance_km < 1.0:
        distance_km = 1.0

    # Base intensity from magnitude
    base = magnitude - 1.5

    # Distance attenuation (logarithmic)
    dist_term = 2.2 * math.log10(distance_km + 10)

    # Depth penalty
    depth_term = depth_km / 80.0

    intensity = base - dist_term - depth_term
    return max(0.0, min(10.0, intensity))


def intensity_to_risk_score(intensity: float) -> float:
    """Map 0-10 intensity to 0-100 risk score (linear for MVP)."""
    return round(max(0.0, min(100.0, (intensity / 10.0) * 100.0)), 1)


def compute_sismo_score_for_comuna(
    comuna_lat: float,
    comuna_lon: float,
    events: list[dict],
    now: datetime | None = None,
) -> float:
    """
    Given a comuna centroid and a list of recent seismic events,
    return the max risk score this comuna should have from those events.

    events: list of {"latitude": , "longitude": , "magnitude": , "depth_km": , "occurred_at": datetime}
    Only events from the last 24 hours are considered.
    """
    if now is None:
        now = datetime.now(timezone.utc)

    cutoff = now - timedelta(hours=24)
    max_score = 0.0

    for ev in events:
        if ev["occurred_at"] < cutoff:
            continue
        dist = haversine_km(
            comuna_lat, comuna_lon,
            ev["latitude"], ev["longitude"]
        )
        intensity = estimate_intensity(
            ev["magnitude"], dist, ev.get("depth_km", 30.0)
        )
        score = intensity_to_risk_score(intensity)
        if score > max_score:
            max_score = score

    return round(max_score, 1)
