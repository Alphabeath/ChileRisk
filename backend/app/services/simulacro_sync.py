"""HTTP sync for the SERNAPRED simulacros calendar."""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from typing import Any, Iterable

import httpx
from sqlalchemy import update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from app.config import settings
from app.models.simulacro import Simulacro
from app.services.simulacro_parsers import (
    _has_simulacro_detail_root,
    absolute_detail_url,
    parse_calendar_section,
    parse_detail_page,
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
) -> tuple[set[str], set[str]]:
    enriched_slugs: set[str] = set()
    unavailable_slugs: set[str] = set()
    for rec in records:
        slug = rec.get("slug")
        if not slug:
            continue
        detail_url = rec.get("detail_href") or absolute_detail_url(
            f"/simulacros_t/{slug}/"
        )
        if not detail_url:
            continue
        html = await _fetch_html(detail_url, client=client)
        if not html:
            continue
        try:
            parsed = parse_detail_page(html)
        except Exception as e:
            logger.debug("detail parse failed for %s: %s", slug, e)
            continue
        if not parsed.get("headline") and not parsed.get("body_blocks"):
            if not _has_simulacro_detail_root(html):
                rec["has_detail_page"] = False
                rec.pop("detail_href", None)
                unavailable_slugs.add(slug)
                logger.info("detail page unavailable for %s", slug)
            else:
                logger.warning("detail parse yielded no structure for %s", slug)
            continue

        rec["has_detail_page"] = True
        rec["detail_href"] = detail_url
        summary = parsed.get("summary")
        if summary:
            rec["summary"] = summary
        comunas = parsed.get("participating_comunas") or []
        if comunas:
            rec["participating_comunas"] = comunas
        if parsed.get("mensaje_sae"):
            rec["mensaje_sae"] = True
        rec["headline"] = parsed.get("headline")
        rec["schedule_note"] = parsed.get("schedule_note")
        rec["hero_image_url"] = parsed.get("hero_image_url")
        rec["detail_body"] = parsed.get("body_blocks") or []
        enriched_slugs.add(slug)
    return enriched_slugs, unavailable_slugs


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
        "summary": rec.get("summary") or rec.get("calendar_summary"),
        "detail_url": detail_url,
        "mensaje_sae": bool(rec.get("mensaje_sae", False)),
        "source": rec.get("source", "future"),
        "headline": rec.get("headline"),
        "schedule_note": rec.get("schedule_note"),
        "hero_image_url": rec.get("hero_image_url"),
        "detail_body": rec.get("detail_body") or [],
    }


async def _upsert_simulacros(
    session: AsyncSession,
    records: Iterable[dict],
    *,
    enriched_slugs: set[str],
    unavailable_slugs: set[str],
) -> int:
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
    detail_columns = {"headline", "schedule_note", "hero_image_url", "detail_body"}
    update_cols = {
        c.name: insert_stmt.excluded[c.name]
        for c in Simulacro.__table__.columns
        if c.name not in {"id", "slug", "synced_at"} | detail_columns
    }
    update_cols["synced_at"] = datetime.now(timezone.utc)
    upsert = insert_stmt.on_conflict_do_update(
        index_elements=["slug"],
        set_=update_cols,
    )
    await session.execute(upsert)
    for row in rows:
        slug = row["slug"]
        if slug in unavailable_slugs:
            detail_values = {
                "headline": None,
                "schedule_note": None,
                "hero_image_url": None,
                "detail_body": [],
            }
        elif slug in enriched_slugs:
            detail_values = {
                "headline": row["headline"],
                "schedule_note": row["schedule_note"],
                "hero_image_url": row["hero_image_url"],
                "detail_body": row["detail_body"],
            }
        else:
            continue
        await session.execute(
            update(Simulacro)
            .where(Simulacro.slug == slug)
            .values(**detail_values)
        )
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

    enriched_slugs: set[str] = set()
    unavailable_slugs: set[str] = set()
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
            enriched_slugs, unavailable_slugs = await _enrich_with_details(
                records, client
            )
        except Exception as e:
            logger.exception("simulacros detail enrichment failed: %s", e)

    return await _upsert_simulacros(
        session,
        records,
        enriched_slugs=enriched_slugs,
        unavailable_slugs=unavailable_slugs,
    )