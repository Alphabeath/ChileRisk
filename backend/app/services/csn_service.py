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
SENAPRED_EVENTO_RE = re.compile(
    r'href=["\'](https?://(?:www\.)?senapred\.cl/evento/[^"\']+)["\']',
    re.IGNORECASE,
)


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

    detail_url: str | None = None
    link = local_cell.find("a", href=True)
    if link:
        href = (link.get("href") or "").strip()
        if href.startswith("http"):
            detail_url = href
        elif href.startswith("/"):
            detail_url = f"{CSN_BASE}{href}"

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

    row_classes = row.get("class") or []
    if isinstance(row_classes, str):
        row_classes = row_classes.split()
    is_perceived = "percibido" in row_classes

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
        "detail_url": detail_url,
        "is_perceived": is_perceived,
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


async def _fetch_csn_detail_enrichment(
    client: httpx.AsyncClient, detail_url: str
) -> dict[str, Any]:
    out: dict[str, Any] = {}
    try:
        resp = await client.get(detail_url, timeout=25.0, follow_redirects=True)
        resp.raise_for_status()
    except (httpx.HTTPError, httpx.TimeoutException):
        logger.warning("CSN detail fetch failed: %s", detail_url)
        return out

    match = SENAPRED_EVENTO_RE.search(resp.text)
    if match:
        out["intensity_report_url"] = match.group(1)

    return out


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


def _catalog_days_for_hours(hours: int) -> int:
    """CSN publishes daily pages; fetch enough days to cover the lookback window."""
    return min(8, max(3, (hours + 23) // 24))


def _dedupe_catalog_events(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[tuple] = set()
    unique: list[dict[str, Any]] = []
    for e in sorted(events, key=lambda x: x["occurred_at"], reverse=True):
        key = (
            round(e["occurred_at"].timestamp()),
            round(e["magnitude"], 1),
            round(e["latitude"], 2),
            round(e["longitude"], 2),
        )
        if key not in seen:
            seen.add(key)
            unique.append(e)
    return unique


def _limit_catalog_events(
    events: list[dict[str, Any]],
    *,
    max_total: int = 300,
    significant_magnitude: float = 4.5,
) -> list[dict[str, Any]]:
    """Never drop M≥4.5 (or perceived) events when capping catalog size."""
    unique = _dedupe_catalog_events(events)
    significant: list[dict[str, Any]] = []
    other: list[dict[str, Any]] = []
    for e in unique:
        raw = e.get("raw_data") or {}
        if e["magnitude"] >= significant_magnitude or raw.get("is_perceived"):
            significant.append(e)
        else:
            other.append(e)
    if len(significant) >= max_total:
        return significant
    return significant + other[: max_total - len(significant)]


async def fetch_recent_earthquakes(hours: int = 48) -> list[dict]:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=hours)
    all_events: list[dict] = []
    catalog_days = _catalog_days_for_hours(hours)

    async with httpx.AsyncClient(timeout=25.0, follow_redirects=True) as client:
        perceived_urls: list[str] = []
        for delta in range(0, catalog_days):
            day = now - timedelta(days=delta)
            day_events = await _fetch_catalog_day(client, day)
            for ev in day_events:
                if ev["occurred_at"] >= cutoff:
                    all_events.append(ev)
                    raw = ev.get("raw_data") or {}
                    if raw.get("is_perceived") and raw.get("detail_url"):
                        perceived_urls.append(raw["detail_url"])

            if delta < catalog_days - 1:
                await asyncio.sleep(1.2)

        sem = asyncio.Semaphore(3)

        async def enrich_one(detail_url: str) -> tuple[str, dict[str, Any]]:
            async with sem:
                extra = await _fetch_csn_detail_enrichment(client, detail_url)
                return detail_url, extra

        if perceived_urls:
            results = await asyncio.gather(*(enrich_one(u) for u in perceived_urls))
            by_url = dict(results)
            for ev in all_events:
                url = (ev.get("raw_data") or {}).get("detail_url")
                if url and url in by_url:
                    ev["raw_data"] = {**(ev.get("raw_data") or {}), **by_url[url]}

    return _limit_catalog_events(all_events)


async def _enrich_event_relations(session: AsyncSession, event: SeismicEvent) -> None:
    from app.services.seismic_alert_match import find_related_senapred

    event_ids, alert_ids = await find_related_senapred(session, event)
    raw = dict(event.raw_data or {})
    if event_ids:
        raw["related_senapred_event_ids"] = event_ids
    if alert_ids:
        raw["related_senapred_alert_ids"] = alert_ids
    event.raw_data = raw


async def sync_recent_csn_events(session: AsyncSession, hours: int = 48) -> int:
    events = await fetch_recent_earthquakes(hours)
    if not events:
        return 0

    new_events: list[SeismicEvent] = []
    updated = 0
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
            merged_raw = {**(existing.raw_data or {}), **(ev.get("raw_data") or {})}
            if merged_raw != (existing.raw_data or {}):
                existing.raw_data = merged_raw
                updated += 1
                await _enrich_event_relations(session, existing)
            continue

        new_ev = SeismicEvent(**ev)
        session.add(new_ev)
        new_events.append(new_ev)

    if new_events or updated:
        await session.commit()

        from app.services.impact_service import compute_and_store_event_impact

        for ev in new_events:
            await session.refresh(ev)
            await _enrich_event_relations(session, ev)
            await compute_and_store_event_impact(session, ev)
        if updated:
            await session.commit()

    return len(new_events)