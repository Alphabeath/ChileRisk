"""HTTP sync for the SERNAPRED simulacros calendar."""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from typing import Any, Iterable

import httpx
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.simulacro import Simulacro
from app.services.simulacro_parsers import (
    absolute_detail_url,
    parse_calendar_section,
    parse_detail_summary,
)

logger = logging.getLogger(__name__)


async def _fetch_html(url: str, *, client: httpx.AsyncClient) -> str | None:
    try:
        resp = await client.get(url)
    except httpx.HTTPError as e:
        logger.warning("simulacros fetch failed: %s — %s", url, e)
        return None
    if resp.status_code != 200:
        logger.warning("simulacros fetch status %d: %s", resp.status_code, url)
        return None
    return resp.text


async def _collect_calendar_records(
    client: httpx.AsyncClient, base: str, *, today: date
) -> list[dict]:
    """Fetch only the CALENDARIO SIMULACROS section from the public index."""
    index_html = await _fetch_html(base, client=client)
    if not index_html:
        return []
    records = parse_calendar_section(index_html, today=today)
    logger.info("simulacros calendar section: %d drills", len(records))
    return records


async def _enrich_with_details(
    records: list[dict],
    client: httpx.AsyncClient,
) -> None:
    for rec in records:
        if not rec.get("has_detail_page", True):
            continue
        if rec.get("summary"):
            continue
        detail_url = rec.get("detail_href")
        if not detail_url:
            detail_url = absolute_detail_url(f"/simulacros_t/{rec['slug']}/")
        if not detail_url:
            continue
        html = await _fetch_html(detail_url, client=client)
        if not html:
            continue
        try:
            summary, comunas, sae = parse_detail_summary(html)
        except Exception as e:
            logger.debug("detail parse failed for %s: %s", rec["slug"], e)
            continue
        if summary:
            rec["summary"] = summary
        if comunas and not rec.get("participating_comunas"):
            rec["participating_comunas"] = comunas
        if sae:
            rec["mensaje_sae"] = True


def _to_row(rec: dict) -> dict[str, Any] | None:
    if not rec.get("drill_date"):
        return None
    if rec.get("has_detail_page", True):
        detail_url = rec.get("detail_href") or absolute_detail_url(
            f"/simulacros_t/{rec['slug']}/"
        )
    else:
        detail_url = settings.simulacros_base_url
    if not detail_url:
        detail_url = settings.simulacros_base_url
    return {
        "slug": rec["slug"],
        "title": rec["title"],
        "drill_date": rec["drill_date"],
        "region_code": rec.get("region_code"),
        "region_name": rec.get("region_name"),
        "drill_type": rec.get("drill_type", "otro"),
        "participating_comunas": rec.get("participating_comunas", []),
        "summary": rec.get("summary"),
        "detail_url": detail_url,
        "mensaje_sae": bool(rec.get("mensaje_sae", False)),
        "source": rec.get("source", "future"),
    }


async def _upsert_simulacros(session: AsyncSession, records: Iterable[dict]) -> int:
    rows: list[dict] = []
    seen: set[str] = set()
    for rec in records:
        row = _to_row(rec)
        if not row or row["slug"] in seen:
            continue
        seen.add(row["slug"])
        rows.append(row)

    if not rows:
        return 0

    dialect = session.bind.dialect.name if session.bind else "sqlite"
    insert_stmt = (
        pg_insert(Simulacro) if dialect == "postgresql" else sqlite_insert(Simulacro)
    )
    insert_stmt = insert_stmt.values(rows)
    update_cols = {
        c.name: insert_stmt.excluded[c.name]
        for c in Simulacro.__table__.columns
        if c.name not in ("id", "slug", "synced_at")
    }
    update_cols["synced_at"] = datetime.now(timezone.utc)
    upsert = insert_stmt.on_conflict_do_update(
        index_elements=["slug"],
        set_=update_cols,
    )
    await session.execute(upsert)
    await session.commit()
    logger.info("Upserted %d simulacros", len(rows))
    return len(rows)


async def sync_simulacros(session: AsyncSession) -> int:
    """Fetch the SERNAPRED 2026 calendar section and upsert into the DB."""
    today = datetime.now(timezone.utc).date()
    base = settings.simulacros_base_url

    timeout = settings.simulacros_request_timeout_seconds
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml",
    }

    async with httpx.AsyncClient(timeout=timeout, headers=headers, follow_redirects=True) as client:
        try:
            records = await _collect_calendar_records(client, base, today=today)
        except Exception as e:
            logger.exception("simulacros collection failed: %s", e)
            return 0
        if not records:
            logger.warning("simulacros: no records collected from %s", base)
            return 0
        try:
            await _enrich_with_details(records, client)
        except Exception as e:
            logger.exception("simulacros detail enrichment failed: %s", e)

    return await _upsert_simulacros(session, records)