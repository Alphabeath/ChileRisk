import asyncio
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from bs4 import BeautifulSoup, Tag
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.seismic_event import SeismicEvent

logger = logging.getLogger(__name__)

CSN_BASE = settings.csn_base_url
CATALOG_PATH = "/sismicidad/catalogo"

MAGNITUDE_RE = re.compile(r"(\d+\.?\d*)\s*(ML|Mw|MLv|Mlw|mb)", re.IGNORECASE)
LATLON_RE = re.compile(r"(-?\d+\.?\d*)")
DATETIME_RE = re.compile(r"(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})")


def _parse_catalog_row(row: Tag) -> dict[str, Any] | None:
    cells = row.find_all("td")
    if len(cells) < 5:
        return None

    local_cell = cells[0]
    utc_cell = cells[1]
    coords_cell = cells[2]
    depth_cell = cells[3]
    mag_cell = cells[4]

    mag_text = mag_cell.get_text(strip=True)
    mag_match = MAGNITUDE_RE.search(mag_text)
    if not mag_match:
        return None
    magnitude = float(mag_match.group(1))
    mag_type = mag_match.group(2)

    utc_text = utc_cell.get_text(strip=True)
    utc_match = DATETIME_RE.search(utc_text)
    if not utc_match:
        return None
    occurred_utc = datetime.strptime(utc_match.group(1), "%Y-%m-%d %H:%M:%S").replace(
        tzinfo=timezone.utc
    )

    local_text = local_cell.get_text(" ", strip=True)
    local_match = DATETIME_RE.search(local_text)
    occurred_local = None
    location = None
    if local_match:
        occurred_local = datetime.strptime(local_match.group(1), "%Y-%m-%d %H:%M:%S")
        location_part = local_text[local_match.end() :].strip()
        if location_part:
            location = location_part

    coord_text = coords_cell.get_text(" ", strip=True)
    coord_matches = LATLON_RE.findall(coord_text)
    latitude = None
    longitude = None
    if len(coord_matches) >= 2:
        latitude = float(coord_matches[0])
        longitude = float(coord_matches[1])

    if latitude is None or longitude is None:
        return None

    depth_text = depth_cell.get_text(strip=True)
    depth_match = re.search(r"(\d+\.?\d*)", depth_text)
    depth_km = float(depth_match.group(1)) if depth_match else 30.0

    raw = {
        "local_time": local_match.group(1) if local_match else None,
        "utc_time": utc_match.group(1),
        "location": location,
        "latitude": latitude,
        "longitude": longitude,
        "depth_km": depth_km,
        "magnitude": magnitude,
        "magnitude_type": mag_type,
        "source_url": f"{CSN_BASE}{CATALOG_PATH}",
    }

    return {
        "latitude": latitude,
        "longitude": longitude,
        "magnitude": magnitude,
        "depth_km": depth_km,
        "occurred_at": occurred_utc,
        "occurred_at_local": occurred_local,
        "source": "csn",
        "raw_data": raw,
    }


def _build_catalog_url(date: datetime) -> str:
    return f"{CSN_BASE}{CATALOG_PATH}/{date.year}/{date.month:02d}/{date.strftime('%Y%m%d')}.html"


async def _fetch_catalog_day(
    client: httpx.AsyncClient, date: datetime
) -> list[dict[str, Any]]:
    url = _build_catalog_url(date)

    for attempt in range(5):
        try:
            resp = await client.get(url, timeout=25.0, follow_redirects=True)
            if resp.status_code == 404:
                return []
            if resp.status_code == 429:
                retry_after = resp.headers.get("Retry-After")
                delay = int(retry_after) if retry_after and retry_after.isdigit() else (2 ** attempt + 2)
                await asyncio.sleep(min(delay, 120))
                continue
            resp.raise_for_status()
            break
        except (httpx.HTTPError, httpx.TimeoutException):
            if attempt == 4:
                logger.warning("CSN catalog fetch failed after retries: %s", url)
                return []
            await asyncio.sleep(2 ** attempt + 1)
    else:
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    table = soup.find("table", class_="sismologia")
    if not table:
        return []

    events = []
    for row in table.find_all("tr"):
        parsed = _parse_catalog_row(row)
        if parsed:
            events.append(parsed)

    return events


async def fetch_recent_earthquakes(hours: int = 48) -> list[dict]:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=hours)
    all_events: list[dict] = []

    async with httpx.AsyncClient(timeout=25.0, follow_redirects=True) as client:
        for delta in range(0, 3):
            day = now - timedelta(days=delta)
            day_events = await _fetch_catalog_day(client, day)
            for ev in day_events:
                if ev["occurred_at"] >= cutoff:
                    all_events.append(ev)

            if delta < 2:
                await asyncio.sleep(1.2)

    seen: set[tuple] = set()
    unique = []
    for e in sorted(all_events, key=lambda x: x["occurred_at"], reverse=True):
        key = (
            round(e["occurred_at"].timestamp()),
            round(e["magnitude"], 1),
            round(e["latitude"], 2),
            round(e["longitude"], 2),
        )
        if key not in seen:
            seen.add(key)
            unique.append(e)

    return unique[:100]


async def sync_recent_csn_events(session: AsyncSession, hours: int = 48) -> int:
    events = await fetch_recent_earthquakes(hours)
    if not events:
        return 0

    new_events = []
    for ev in events:
        if ev["magnitude"] < 3.0:
            continue

        stmt = (
            select(SeismicEvent)
            .where(
                SeismicEvent.occurred_at >= ev["occurred_at"] - timedelta(minutes=3),
                SeismicEvent.occurred_at <= ev["occurred_at"] + timedelta(minutes=3),
                SeismicEvent.magnitude == ev["magnitude"],
            )
            .limit(1)
        )
        existing = (await session.execute(stmt)).scalar_one_or_none()
        if existing:
            continue

        new_ev = SeismicEvent(**ev)
        session.add(new_ev)
        new_events.append(new_ev)

    if new_events:
        await session.commit()

        from app.services.impact_service import compute_and_store_event_impact

        for ev in new_events:
            await session.refresh(ev)
            await compute_and_store_event_impact(session, ev)

    return len(new_events)
