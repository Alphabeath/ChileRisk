"""Open-Meteo Flood API integration — river discharge → inundacion_score.

Source: GloFAS v4 via https://flood-api.open-meteo.com/v1/flood
Resolution: ~5 km grid, daily river_discharge (m³/s), historical + 7-month forecast.

Scoring rationale (validated 2026-07-25 against real data):
- Reference = P90 of 1-year observed discharge (not median/P50).
  Chilean rivers in winter routinely reach 3-6× P50 without flooding;
  using P50 as baseline produced false positives.
- Effective discharge = max(last-3-day observed, forecast peak).
  Official alerts (SENAPRED/DGA) are issued for forecast crests, not
  yesterday's observation.  Missing the forecast = missing the event.
- Gate: P90 ≤ 0 → ephemeral/absent stream in GloFAS 5 km cell → score 0.
  Prevents 0.5 m³/s over a dry-bed median of 0.0 from scoring 100.
- Score bands (ratio = effective / P90):
    ≤1×  → 0   (normal-to-high seasonal flow)
    1-2× → 0-40  (elevated)
    2-4× → 40-70 (high)
    4-6× → 70-90 (severe)
    >6×  → 90-100 (extreme / flash flood — matches official red alerts)
"""

import asyncio
import logging
from datetime import date, datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.comuna import Comuna
from app.models.risk_score import RiskScore
from app.services.risk_utils import compute_composite_and_dominant, severity_from_score

logger = logging.getLogger(__name__)

FLOOD_API_BASE = "https://flood-api.open-meteo.com/v1/flood"

# Historical window for P90 computation (days).  365 gives a full seasonal cycle.
_HIST_DAYS = 365
# Forecast window (days).  10 captures near-term crests from GloFAS 30-day forecast.
_FC_DAYS = 10


class FloodRateLimited(Exception):
    """Raised when Flood API returns persistent 429 — abort remaining batches."""


def discharge_to_flood_score(effective_m3s: float, p90_m3s: float) -> float:
    """Convert effective river discharge to 0-100 flood risk score.

    Uses ratio of effective discharge to the P90 of 1-year observed data.
    P90 represents "high normal flow" — exceeding it means something unusual.

    Ratio ≤ 1× → 0   (within normal high-season range)
    Ratio 1-2× → 0-40  (elevated, watch)
    Ratio 2-4× → 40-70 (high flood risk)
    Ratio 4-6× → 70-90 (severe)
    Ratio > 6× → 90-100 (extreme / flash flood — matches official red alerts)
    """
    if p90_m3s <= 0:
        return 0.0
    ratio = effective_m3s / p90_m3s
    if ratio <= 1.0:
        return 0.0
    if ratio <= 2.0:
        return round((ratio - 1.0) / 1.0 * 40.0, 1)
    if ratio <= 4.0:
        return round(40.0 + (ratio - 2.0) / 2.0 * 30.0, 1)
    if ratio <= 6.0:
        return round(70.0 + (ratio - 4.0) / 2.0 * 20.0, 1)
    return min(100.0, round(90.0 + (ratio - 6.0) / 4.0 * 10.0, 1))


def _percentile(values: list[float], p: float) -> float:
    """Linear-interpolation percentile (same as numpy default)."""
    if not values:
        return 0.0
    s = sorted(values)
    k = (len(s) - 1) * p
    f = int(k)
    c = min(f + 1, len(s) - 1)
    if f == c:
        return s[f]
    return s[f] + (s[c] - s[f]) * (k - f)


async def _fetch_flood_batch(
    client: httpx.AsyncClient,
    lats: list[float],
    lons: list[float],
) -> list[dict] | None:
    """Fetch river discharge for a batch of coordinates.

    Returns:
      - list[dict] on success
      - None on soft failure (timeout / 5xx after retries)
      - raises FloodRateLimited if Open-Meteo keeps returning 429
    """
    params = {
        "latitude": ",".join(str(l) for l in lats),
        "longitude": ",".join(str(l) for l in lons),
        "daily": "river_discharge",
        "past_days": str(_HIST_DAYS),
        "forecast_days": str(_FC_DAYS),
    }

    # Cap retries: cold-start must not block Uvicorn for minutes on 429.
    for attempt in range(3):
        try:
            resp = await client.get(FLOOD_API_BASE, params=params, timeout=45.0)
            if resp.status_code == 429:
                if attempt == 2:
                    raise FloodRateLimited("Open-Meteo Flood API rate limited (429)")
                delay = 2 ** attempt + 1
                await asyncio.sleep(min(delay, 8))
                continue
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list):
                return data
            return [data]
        except FloodRateLimited:
            raise
        except (httpx.HTTPError, httpx.TimeoutException, asyncio.TimeoutError):
            if attempt == 2:
                logger.warning("Flood API batch failed after retries for %d coordinates", len(lats))
                return None
            await asyncio.sleep(2 ** attempt + 0.5)
    return None


def _parse_flood_item(item: dict) -> float:
    """Extract flood score from daily time series.

    Splits observed vs forecast, computes P90 from 1-year observed data,
    gates ephemeral streams (P90 ≤ 0), and uses effective discharge
    (max of recent observed + forecast peak) for scoring.
    """
    daily = item.get("daily", {})
    discharges = daily.get("river_discharge")
    times = daily.get("time")
    if not discharges or not times:
        return 0.0

    today = date.today()
    obs: list[float] = []
    fc: list[float] = []

    for t_str, v in zip(times, discharges):
        if v is None:
            continue
        try:
            d = date.fromisoformat(t_str)
        except (ValueError, TypeError):
            continue
        if d > today:
            fc.append(v)
        else:
            obs.append(v)

    if not obs:
        return 0.0

    # P90 of observed data = "high normal flow" reference
    p90 = _percentile(obs, 0.90)

    # Gate: ephemeral/absent stream in GloFAS cell → no flood risk
    if p90 <= 0:
        return 0.0

    # Effective discharge: max of last 3 observed days + forecast peak
    recent_obs = obs[-3:] if len(obs) >= 3 else obs
    eff_obs = max(recent_obs)
    fc_peak = max(fc) if fc else 0.0
    effective = max(eff_obs, fc_peak)

    return discharge_to_flood_score(effective, p90)


async def update_flood_scores(session: AsyncSession) -> int:
    """Fetch river discharge for all comunas, compute inundacion_score, update risk."""
    if not settings.use_real_flood:
        return 0

    comunas = (
        await session.execute(
            select(Comuna).where(
                Comuna.latitude.isnot(None),
                Comuna.longitude.isnot(None),
            )
        )
    ).scalars().all()

    if not comunas:
        return 0

    batch_size = 20
    scores_by_comuna: dict[int, float] = {}

    async with httpx.AsyncClient(timeout=45.0) as client:
        for i in range(0, len(comunas), batch_size):
            batch = comunas[i : i + batch_size]
            lats = [c.latitude for c in batch]
            lons = [c.longitude for c in batch]

            try:
                raw_items = await _fetch_flood_batch(client, lats, lons)
            except FloodRateLimited:
                logger.warning(
                    "Flood sync aborted early after rate limit (%d/%d comunas scored)",
                    len(scores_by_comuna),
                    len(comunas),
                )
                break

            if not raw_items:
                continue

            for j, item in enumerate(raw_items):
                score = _parse_flood_item(item)
                scores_by_comuna[batch[j].cod_comuna] = score

            if i + batch_size < len(comunas):
                await asyncio.sleep(1.0)

    if not scores_by_comuna:
        return 0

    updated = 0
    for cod_comuna, flood_score in scores_by_comuna.items():
        rs = (
            await session.execute(
                select(RiskScore)
                .where(RiskScore.cod_comuna == cod_comuna)
                .order_by(RiskScore.computed_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()

        if not rs:
            rs = RiskScore(cod_comuna=cod_comuna, sismo_score=0.0)
            session.add(rs)

        rs.inundacion_score = flood_score

        scores_dict = {
            "sismo": rs.sismo_score,
            "ola_calor": rs.ola_calor_score,
            "ola_frio": rs.ola_frio_score,
            "viento": rs.viento_score,
            "inundacion": flood_score,
        }
        composite, dominant = compute_composite_and_dominant(scores_dict)
        sev = severity_from_score(composite)

        rs.composite_score = composite
        rs.dominant_hazard = dominant
        rs.severity = sev
        rs.computed_at = datetime.now(timezone.utc)
        updated += 1

    await session.commit()
    return updated
