"""Sync + read helpers for SERNAGEOMIN volcanic alerts."""

from __future__ import annotations

import logging
import ssl
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.data.sernageomin_volcanoes import geography_for
from app.models.sernageomin_volcanic_alert import SernageominVolcanicAlert
from app.services.sernageomin_parsers import parse_alerts_page

logger = logging.getLogger(__name__)


def _headers() -> dict[str, str]:
    return {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml",
    }


def _ssl_context() -> ssl.SSLContext | bool:
    """sernageomin.cl often serves an incomplete cert chain; config can relax verify."""
    if settings.sernageomin_ssl_verify:
        return True
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


async def _fetch_html(url: str, *, client: httpx.AsyncClient) -> str | None:
    try:
        resp = await client.get(url)
    except httpx.HTTPError as e:
        logger.warning("sernageomin fetch failed: %s — %s", url, e)
        return None
    if resp.status_code != 200:
        logger.warning("sernageomin fetch status %d: %s", resp.status_code, url)
        return None
    return resp.text


def _row_from_parsed(rec: dict[str, Any], *, page_url: str, now: datetime) -> dict[str, Any]:
    key, display_name, region_code, region_name, scope, comuna_codes = geography_for(
        rec["volcano_name"]
    )
    page_updated = rec.get("page_updated_at")
    issued = page_updated if isinstance(page_updated, datetime) else now
    if issued.tzinfo is None:
        issued = issued.replace(tzinfo=timezone.utc)
    return {
        "volcano_key": key,
        "volcano_name": display_name,
        "level": rec["level"],
        "title": rec.get("title") or f"Alerta {rec['level'].capitalize()} {display_name}",
        "content": rec.get("content"),
        "region_code": region_code,
        "region_name": region_name,
        "affected_scope": scope,
        "comuna_codes": comuna_codes,
        "external_url": rec.get("external_url") or page_url,
        "is_active": True,
        "issued_at": issued,
        "page_updated_at": page_updated if isinstance(page_updated, datetime) else None,
        "raw": {
            "volcano_name_raw": rec.get("volcano_name"),
            "level_raw": rec.get("level_raw"),
            "parse_source": rec.get("parse_source"),
            "reav_url": rec.get("reav_url"),
        },
        "synced_at": now,
    }


async def _upsert_rows(session: AsyncSession, rows: list[dict[str, Any]]) -> int:
    if not rows:
        return 0
    dialect = session.bind.dialect.name if session.bind else "sqlite"
    insert_stmt = (
        pg_insert(SernageominVolcanicAlert)
        if dialect == "postgresql"
        else sqlite_insert(SernageominVolcanicAlert)
    )
    insert_stmt = insert_stmt.values(rows)
    update_cols = {
        c.name: insert_stmt.excluded[c.name]
        for c in SernageominVolcanicAlert.__table__.columns
        if c.name not in ("id", "volcano_key")
    }
    upsert = insert_stmt.on_conflict_do_update(
        index_elements=["volcano_key"],
        set_=update_cols,
    )
    await session.execute(upsert)
    await session.commit()
    return len(rows)


async def _deactivate_missing(session: AsyncSession, active_keys: set[str]) -> int:
    """Mark volcanoes not present in the latest scrape as inactive."""
    now = datetime.now(timezone.utc)
    if active_keys:
        stmt = (
            update(SernageominVolcanicAlert)
            .where(SernageominVolcanicAlert.is_active.is_(True))
            .where(SernageominVolcanicAlert.volcano_key.notin_(active_keys))
            .values(is_active=False, synced_at=now)
        )
    else:
        stmt = (
            update(SernageominVolcanicAlert)
            .where(SernageominVolcanicAlert.is_active.is_(True))
            .values(is_active=False, synced_at=now)
        )
    result = await session.execute(stmt)
    await session.commit()
    return int(result.rowcount or 0)


async def sync_sernageomin_alerts(session: AsyncSession) -> int:
    """Scrape vigentes page; upsert elevated alerts; deactivate missing keys."""
    if not settings.use_real_sernageomin:
        return 0

    page_url = settings.sernageomin_alerts_url
    timeout = settings.sernageomin_request_timeout_seconds
    now = datetime.now(timezone.utc)

    async with httpx.AsyncClient(
        timeout=timeout,
        headers=_headers(),
        follow_redirects=True,
        verify=_ssl_context(),
    ) as client:
        html = await _fetch_html(page_url, client=client)

    if not html:
        logger.warning("sernageomin sync aborted: empty HTML")
        return 0

    parsed = parse_alerts_page(html, page_url=page_url)
    rows = [_row_from_parsed(rec, page_url=page_url, now=now) for rec in parsed]
    active_keys = {r["volcano_key"] for r in rows}

    n = await _upsert_rows(session, rows)
    pruned = await _deactivate_missing(session, active_keys)
    if n:
        logger.info(
            "Upserted %d SERNAGEOMIN volcanic alerts (deactivated %d)",
            n,
            pruned,
        )
    else:
        logger.warning(
            "sernageomin sync finished with 0 active alerts (deactivated %d)",
            pruned,
        )
    return n


async def list_active_sernageomin_rows(
    session: AsyncSession,
) -> list[SernageominVolcanicAlert]:
    result = await session.execute(
        select(SernageominVolcanicAlert)
        .where(SernageominVolcanicAlert.is_active.is_(True))
        .order_by(SernageominVolcanicAlert.level, SernageominVolcanicAlert.volcano_name)
    )
    return list(result.scalars().all())
