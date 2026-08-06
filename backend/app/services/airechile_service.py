"""Sync + read helpers for Aire Chile GEC daily conditions."""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Any

import httpx
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.airechile_daily import AireChileDaily
from app.services.airechile_parsers import parse_detail, parse_home
from app.services.airechile_zones import AIRECHILE_ZONES, get_zone, zone_by_comuna
from app.services.query_date_window import QUERY_DATE_MAX_DAYS_BACK, today_chile

logger = logging.getLogger(__name__)


def _headers() -> dict[str, str]:
    return {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml",
    }


async def _fetch_html(url: str, *, client: httpx.AsyncClient) -> str | None:
    try:
        resp = await client.get(url)
    except httpx.HTTPError as e:
        logger.warning("airechile fetch failed: %s — %s", url, e)
        return None
    if resp.status_code != 200:
        logger.warning("airechile fetch status %d: %s", resp.status_code, url)
        return None
    return resp.text


def _merge_record(
    home: dict[str, Any] | None,
    detail: dict[str, Any] | None,
    *,
    slug: str,
    condition_date: date,
    base_url: str,
) -> dict[str, Any] | None:
    zone = get_zone(slug)
    if not zone:
        return None
    level = (detail or {}).get("level") or (home or {}).get("level")
    if not level:
        return None
    external = (detail or home or {}).get("external_url") or f"{base_url.rstrip('/')}/comunas/{slug}"
    return {
        "zone_slug": slug,
        "condition_date": (detail or {}).get("condition_date") or condition_date,
        "level": level,
        "forecast_date": (detail or {}).get("forecast_date"),
        "forecast_level": (detail or {}).get("forecast_level"),
        "pm25_range_label": (detail or {}).get("pm25_range_label"),
        "zone_name": (detail or {}).get("zone_name") or zone.name,
        "region_code": zone.region_code,
        "comuna_codes": list(zone.comuna_codes),
        "measures_current": (detail or {}).get("measures_current") or [],
        "restrictions_permanent": (detail or {}).get("restrictions_permanent") or [],
        "external_url": external,
        "raw": (detail or {}).get("raw") or {"source": "home"},
    }


async def _upsert_rows(session: AsyncSession, rows: list[dict[str, Any]]) -> int:
    if not rows:
        return 0
    dialect = session.bind.dialect.name if session.bind else "sqlite"
    insert_stmt = (
        pg_insert(AireChileDaily)
        if dialect == "postgresql"
        else sqlite_insert(AireChileDaily)
    )
    insert_stmt = insert_stmt.values(rows)
    update_cols = {
        c.name: insert_stmt.excluded[c.name]
        for c in AireChileDaily.__table__.columns
        if c.name not in ("id", "zone_slug", "condition_date", "synced_at")
    }
    update_cols["synced_at"] = datetime.now(timezone.utc)
    upsert = insert_stmt.on_conflict_do_update(
        index_elements=["zone_slug", "condition_date"],
        set_=update_cols,
    )
    await session.execute(upsert)
    await session.commit()
    return len(rows)


async def sync_airechile(session: AsyncSession) -> int:
    """Scrape Aire Chile home + zone details; upsert today's Chile calendar day."""
    base = settings.airechile_base_url
    today = today_chile()
    timeout = settings.airechile_request_timeout_seconds

    async with httpx.AsyncClient(
        timeout=timeout, headers=_headers(), follow_redirects=True
    ) as client:
        home_html = await _fetch_html(base, client=client)
        home_by_slug: dict[str, dict[str, Any]] = {}
        if home_html:
            for rec in parse_home(home_html, base_url=base):
                home_by_slug[rec["zone_slug"]] = rec
        else:
            logger.warning("airechile: home fetch failed; will try catalog detail pages")

        rows: list[dict[str, Any]] = []
        for slug in AIRECHILE_ZONES:
            detail_url = f"{base.rstrip('/')}/comunas/{slug}"
            detail_html = await _fetch_html(detail_url, client=client)
            detail = (
                parse_detail(detail_html, slug=slug, base_url=base)
                if detail_html
                else None
            )
            merged = _merge_record(
                home_by_slug.get(slug),
                detail,
                slug=slug,
                condition_date=today,
                base_url=base,
            )
            if merged:
                # Always store under Chile today for the query window
                merged["condition_date"] = today
                rows.append(merged)
            else:
                logger.debug("airechile: no data for zone %s", slug)

    n = await _upsert_rows(session, rows)
    if n:
        logger.info("Upserted %d Aire Chile zone conditions for %s", n, today)
    else:
        logger.warning("airechile sync finished with 0 rows")
    return n


async def prune_old_airechile(session: AsyncSession, *, lookback_days: int | None = None) -> int:
    days = lookback_days if lookback_days is not None else QUERY_DATE_MAX_DAYS_BACK
    cutoff = today_chile() - timedelta(days=days)
    result = await session.execute(
        delete(AireChileDaily).where(AireChileDaily.condition_date < cutoff)
    )
    deleted = result.rowcount or 0
    if deleted:
        await session.commit()
    return deleted


async def list_airechile_for_date(
    session: AsyncSession,
    *,
    condition_date: date,
    region: int | None = None,
    min_level_rank: int | None = None,
) -> list[AireChileDaily]:
    from app.services.airechile_zones import AIRECHILE_LEVEL_RANK

    stmt = select(AireChileDaily).where(
        AireChileDaily.condition_date == condition_date
    )
    if region is not None:
        stmt = stmt.where(AireChileDaily.region_code == region)
    stmt = stmt.order_by(AireChileDaily.zone_name.asc())
    rows = list((await session.execute(stmt)).scalars().all())
    if min_level_rank is not None:
        rows = [
            r
            for r in rows
            if AIRECHILE_LEVEL_RANK.get(r.level, -1) >= min_level_rank
        ]
    return rows


async def get_airechile_zone(
    session: AsyncSession,
    *,
    slug: str,
    condition_date: date,
) -> AireChileDaily | None:
    stmt = select(AireChileDaily).where(
        AireChileDaily.zone_slug == slug,
        AireChileDaily.condition_date == condition_date,
    )
    return (await session.execute(stmt)).scalars().first()


async def get_airechile_by_comuna(
    session: AsyncSession,
    *,
    cod_comuna: int,
    condition_date: date,
) -> AireChileDaily | None:
    zone = zone_by_comuna(cod_comuna)
    if not zone:
        return None
    return await get_airechile_zone(
        session, slug=zone.slug, condition_date=condition_date
    )
