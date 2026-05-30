"""CSN (sismologia.cl) real seismic data integration via HTML scraping.

This module fetches recent earthquakes from the official Centro Sismológico Nacional
(Universidad de Chile) and syncs them into the seismic_events table.

Note: sismologia.cl primarily serves data as HTML. This scraper is a pragmatic solution
until an official structured feed (JSON/CSV/API) becomes available.
"""

import re
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.seismic_event import SeismicEvent


CSN_BASE = settings.csn_base_url
RECENT_URL = f"{CSN_BASE}{settings.csn_recent_path}"


def _parse_magnitude(text: str) -> float | None:
    """Extract magnitude from text like '2.9 MLv' or 'Magnitud 3.8'."""
    m = re.search(r"(\d+\.?\d*)\s*(ML|Mw|MLv|mb)", text, re.IGNORECASE)
    if m:
        return float(m.group(1))
    m = re.search(r"Magnitud\s*(\d+\.?\d*)", text, re.IGNORECASE)
    return float(m.group(1)) if m else None


def _parse_lat_lon(text: str) -> tuple[float | None, float | None]:
    """Extract latitude and longitude. CSN pages usually show positive values for Chile."""
    lat_match = re.search(r"Latitud\s*[-]?\s*(\d+\.?\d*)", text, re.IGNORECASE)
    lon_match = re.search(r"Longitud\s*[-]?\s*(\d+\.?\d*)", text, re.IGNORECASE)

    lat = float(lat_match.group(1)) * -1 if lat_match else None
    lon = float(lon_match.group(1)) * -1 if lon_match else None
    return lat, lon


def _parse_time(text: str) -> datetime | None:
    """Parse '20:40:55 29/05/2026' style timestamps."""
    m = re.search(r"(\d{2}:\d{2}:\d{2})\s+(\d{2}/\d{2}/\d{4})", text)
    if not m:
        return None
    try:
        dt = datetime.strptime(f"{m.group(2)} {m.group(1)}", "%d/%m/%Y %H:%M:%S")
        return dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


async def _fetch_detail(client: httpx.AsyncClient, url: str) -> dict[str, Any] | None:
    """Fetch and parse a single CSN earthquake report page."""
    try:
        resp = await client.get(url, timeout=15.0, follow_redirects=True)
        resp.raise_for_status()
    except Exception:
        return None

    soup = BeautifulSoup(resp.text, "html.parser")
    page_text = soup.get_text(separator=" ", strip=True)

    lat, lon = _parse_lat_lon(page_text)
    if lat is None or lon is None:
        return None

    mag = _parse_magnitude(page_text)
    if mag is None or mag < 3.0:
        return None

    depth_match = re.search(r"Profundidad\s*(\d+\.?\d*)", page_text, re.IGNORECASE)
    depth = float(depth_match.group(1)) if depth_match else 30.0

    occurred = _parse_time(page_text)
    if occurred is None:
        occurred = datetime.now(timezone.utc) - timedelta(hours=2)

    return {
        "latitude": lat,
        "longitude": lon,
        "magnitude": mag,
        "depth_km": depth,
        "occurred_at": occurred,
        "source": "csn",
    }


async def fetch_recent_earthquakes(hours: int = 48) -> list[dict]:
    """
    Scrape recent earthquakes from sismologia.cl.
    Returns list of dicts ready for SeismicEvent.
    """
    end = datetime.now(timezone.utc)
    cutoff = end - timedelta(hours=hours)

    events: list[dict] = []

    try:
        async with httpx.AsyncClient(timeout=25.0, follow_redirects=True) as client:
            resp = await client.get(RECENT_URL)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            link_pattern = re.compile(r"/sismicidad/informes/\d{4}/\d{2}/\d+\.html")
            links = soup.find_all("a", href=link_pattern)

            seen_urls = set()
            for a in links[:80]:   # safety cap
                href = a.get("href", "")
                if not href:
                    continue
                full_url = f"{CSN_BASE}{href}" if href.startswith("/") else href
                if full_url in seen_urls:
                    continue
                seen_urls.add(full_url)

                detail = await _fetch_detail(client, full_url)
                if not detail:
                    continue
                if detail["occurred_at"] < cutoff:
                    continue

                events.append(detail)

    except Exception as e:
        print(f"[CSN Scraper] General error: {e}")
        return []

    # Deduplicate by time + magnitude
    seen = set()
    unique = []
    for e in sorted(events, key=lambda x: x["occurred_at"], reverse=True):
        key = (round(e["occurred_at"].timestamp()), round(e["magnitude"], 1))
        if key not in seen:
            seen.add(key)
            unique.append(e)

    return unique[:80]


async def sync_recent_csn_events(session: AsyncSession, hours: int = 48) -> int:
    """Fetch recent CSN events and insert the new ones (idempotent)."""
    events = await fetch_recent_earthquakes(hours)
    if not events:
        return 0

    new_events = []
    for ev in events:
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
