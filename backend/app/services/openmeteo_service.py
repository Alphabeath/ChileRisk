"""Open-Meteo climate data integration (v2 — batch + storage).

Fetches weather for all comunas in batches, stores readings in climate_readings,
and updates risk_scores accordingly.
"""

import math
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.climate_reading import ClimateReading
from app.models.comuna import Comuna
from app.models.risk_score import RiskScore
from app.services.mock_service import compute_composite_and_dominant, severity_from_score


def temperature_to_heat_score(temp_c: float) -> float:
    if temp_c < 25:
        return max(0.0, temp_c * 1.0)
    elif temp_c < 30:
        return 25 + (temp_c - 25) * 5.0
    elif temp_c < 35:
        return 50 + (temp_c - 30) * 5.0
    else:
        return min(100.0, 75 + (temp_c - 35) * 5.0)


def temperature_to_cold_score(temp_c: float) -> float:
    if temp_c > 10:
        return max(0.0, (20 - temp_c) * 2.5)
    elif temp_c > 5:
        return 25 + (10 - temp_c) * 5.0
    elif temp_c > 0:
        return 50 + (5 - temp_c) * 5.0
    else:
        return min(100.0, 75 + abs(temp_c) * 5.0)


def wind_to_score(wind_kmh: float) -> float:
    if wind_kmh < 30:
        return wind_kmh * 0.83
    elif wind_kmh < 50:
        return 25 + (wind_kmh - 30) * 1.25
    elif wind_kmh < 70:
        return 50 + (wind_kmh - 50) * 1.25
    else:
        return min(100.0, 75 + (wind_kmh - 70) * 0.83)


async def _fetch_weather_batch(
    client: httpx.AsyncClient,
    lats: list[float],
    lons: list[float],
) -> list[dict] | None:
    """Fetch current weather for a batch of coordinates in one API call."""
    params = {
        "latitude": ",".join(str(l) for l in lats),
        "longitude": ",".join(str(l) for l in lons),
        "current": "temperature_2m,wind_speed_10m",
        "timezone": "America/Santiago",
    }
    url = f"{settings.openmeteo_api_base}/forecast"

    try:
        resp = await client.get(url, params=params, timeout=30.0)
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        return None

    if isinstance(data, list):
        return data
    return [data]


def _parse_weather_item(item: dict) -> dict | None:
    current = item.get("current", {})
    temp = current.get("temperature_2m")
    wind = current.get("wind_speed_10m")
    if temp is None:
        return None
    return {
        "time": current.get("time"),
        "temperature_c": float(temp),
        "wind_speed_kmh": float(wind) if wind is not None else 10.0,
    }


async def update_climate_scores_from_real_data(session: AsyncSession) -> int:
    """Fetch weather for all comunas in batches, store readings, update risk scores."""
    if not settings.use_real_meteo:
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

    batch_size = 40
    now = datetime.now(timezone.utc)
    readings: list[dict] = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        for i in range(0, len(comunas), batch_size):
            batch = comunas[i : i + batch_size]
            lats = [c.latitude for c in batch]
            lons = [c.longitude for c in batch]

            raw_items = await _fetch_weather_batch(client, lats, lons)
            if not raw_items:
                continue

            for j, item in enumerate(raw_items):
                parsed = _parse_weather_item(item)
                if not parsed:
                    continue
                readings.append({
                    "cod_comuna": batch[j].cod_comuna,
                    "codregion": batch[j].codregion,
                    **parsed,
                })

    if not readings:
        return 0

    for r in readings:
        session.add(ClimateReading(
            cod_comuna=r["cod_comuna"],
            temperature_c=r["temperature_c"],
            wind_speed_kmh=r["wind_speed_kmh"],
            ola_calor_score=round(temperature_to_heat_score(r["temperature_c"]), 1),
            ola_frio_score=round(temperature_to_cold_score(r["temperature_c"]), 1),
            viento_score=round(wind_to_score(r["wind_speed_kmh"]), 1),
            measured_at=now,
            source="openmeteo",
        ))

    updated = 0
    for r in readings:
        calor = round(temperature_to_heat_score(r["temperature_c"]), 1)
        frio = round(temperature_to_cold_score(r["temperature_c"]), 1)
        viento = round(wind_to_score(r["wind_speed_kmh"]), 1)

        rs = (
            await session.execute(
                select(RiskScore)
                .where(RiskScore.cod_comuna == r["cod_comuna"])
                .order_by(RiskScore.computed_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()

        if not rs:
            rs = RiskScore(cod_comuna=r["cod_comuna"], sismo_score=0.0)
            session.add(rs)

        rs.ola_calor_score = calor
        rs.ola_frio_score = frio
        rs.viento_score = viento

        scores_dict = {
            "sismo": rs.sismo_score,
            "ola_calor": calor,
            "ola_frio": frio,
            "viento": viento,
        }
        composite, dominant = compute_composite_and_dominant(scores_dict)
        sev = severity_from_score(composite)

        rs.composite_score = composite
        rs.dominant_hazard = dominant
        rs.severity = sev
        updated += 1

    await session.commit()
    return updated
