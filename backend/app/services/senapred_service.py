import json
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.data.region_name_to_code import resolve as resolve_region_code
from app.models.senapred_alert import SenapredAlert
from app.services.aws_sigv4 import (
    CognitoIdentityClient,
    is_credential_error,
    sign_appsync_request,
)

logger = logging.getLogger(__name__)


_LEVEL_FROM_CODE: dict[str, str] = {
    "v": "preventiva",
    "a": "amarilla",
    "n": "naranja",
    "r": "roja",
}

_CANCEL_RE = re.compile(r"cancel", re.IGNORECASE)
_MONITOR_RE = re.compile(r"monitoreo", re.IGNORECASE)
_DECLARE_RE = re.compile(r"se\s+declara|se\s+actualiza", re.IGNORECASE)


_cognito_client: CognitoIdentityClient | None = None


def _get_cognito_client() -> CognitoIdentityClient:
    global _cognito_client
    if _cognito_client is None:
        _cognito_client = CognitoIdentityClient(
            identity_pool_id=settings.senapred_cognito_identity_pool_id,
            region=settings.senapred_aws_region,
        )
    return _cognito_client


def _map_level(codigo: str | None) -> str:
    if not codigo:
        return "preventiva"
    return _LEVEL_FROM_CODE.get(codigo.lower().strip(), "preventiva")


def _is_active(title: str, raw: dict) -> bool:
    if not raw.get("isActive", True):
        return False
    if not raw.get("isPrincipal", True):
        return False
    if raw.get("isDeleted", False):
        return False
    if _CANCEL_RE.search(title or ""):
        return False
    return True


def _is_monitor(title: str) -> bool:
    return bool(_MONITOR_RE.search(title or ""))


def _parse_alert(raw: dict) -> dict[str, Any] | None:
    senapred_id = raw.get("id")
    title = raw.get("titulo")
    if not senapred_id or not title:
        return None

    meta_str = raw.get("metaData") or "{}"
    try:
        meta = json.loads(meta_str) if isinstance(meta_str, str) else (meta_str or {})
    except (json.JSONDecodeError, TypeError):
        meta = {}

    region_name = (meta.get("regiones") or "").strip() or None
    region_code = resolve_region_code(region_name) if region_name else None

    issued_raw = raw.get("fechaHora")
    if isinstance(issued_raw, str):
        try:
            issued_at = datetime.fromisoformat(issued_raw.replace("Z", "+00:00"))
            if issued_at.tzinfo is None:
                issued_at = issued_at.replace(tzinfo=timezone.utc)
        except ValueError:
            issued_at = datetime.now(timezone.utc)
    elif isinstance(issued_raw, datetime):
        issued_at = issued_raw if issued_raw.tzinfo else issued_raw.replace(tzinfo=timezone.utc)
    else:
        issued_at = datetime.now(timezone.utc)

    return {
        "senapred_id": senapred_id,
        "kind": "alerta",
        "level": _map_level(meta.get("codigoAlertaEvento")),
        "title": title.strip()[:500],
        "content": raw.get("contenido"),
        "url_access": raw.get("urlAccess"),
        "category": (meta.get("nombreVariable") or "").strip()[:128] or None,
        "is_active": _is_active(title, raw),
        "is_monitor": _is_monitor(title),
        "parent_id": (raw.get("parentId") or None) if raw.get("parentId") not in (None, "parent") else None,
        "senapred_issued_at": issued_at,
        "region_code": region_code,
        "region_name": region_name,
        "meta_data": meta,
        "raw": raw,
    }


_LIST_QUERY = """
query ListAlertas($fechaHora: ModelStringKeyConditionInput, $filter: ModelAlertaFilterInput, $limit: Int, $nextToken: String, $sortDirection: ModelSortDirection) {
  alertasByDate(
    type: "Alerta"
    fechaHora: $fechaHora
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      titulo
      contenido
      fechaHora
      autor
      isActive
      isDeleted
      isPrincipal
      type
      urlAccess
      parentId
      tipoAlertaId
      variableRiesgoAlertasId
      regionesIds
      metaData
      createdAt
      updatedAt
    }
    nextToken
  }
}
"""


async def fetch_senapred_alerts(lookback_days: int = 7, max_pages: int = 20) -> list[dict]:
    cognito = _get_cognito_client()
    creds = await cognito.get_credentials()

    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime("%Y-%m-%dT%H:%M:%S.000Z")

    variables: dict[str, Any] = {
        "fechaHora": {"ge": cutoff_date},
        "filter": {"isDeleted": {"eq": False}},
        "sortDirection": "DESC",
        "limit": 100,
        "nextToken": None,
    }

    all_items: list[dict] = []
    endpoint = settings.senapred_appsync_endpoint

    async with httpx.AsyncClient(timeout=30.0) as client:
        for page in range(max_pages):
            payload = json.dumps({"query": _LIST_QUERY, "variables": variables}).encode()
            headers = sign_appsync_request(
                method="POST",
                url=endpoint,
                body=payload,
                credentials=creds,
                region=settings.senapred_aws_region,
            )
            try:
                resp = await client.post(endpoint, headers=headers, content=payload)
            except httpx.HTTPError as e:
                logger.error("SERNAPRED fetch HTTP error page %d: %s", page, e)
                break

            if resp.status_code != 200:
                logger.error("SERNAPRED fetch status %d page %d: %s", resp.status_code, page, resp.text[:300])
                break

            try:
                body = resp.json()
            except json.JSONDecodeError:
                logger.error("SERNAPRED fetch invalid JSON page %d: %s", page, resp.text[:200])
                break

            if is_credential_error(body):
                logger.warning("SERNAPRED returned credential error — forcing refresh")
                cognito._creds = None
                creds = await cognito.get_credentials()
                continue

            errors = body.get("errors")
            if errors:
                logger.error("SERNAPRED GraphQL errors page %d: %s", page, errors[:1])
                break

            page_data = (body.get("data") or {}).get("alertasByDate") or {}
            items = page_data.get("items") or []
            all_items.extend(items)
            logger.info("SERNAPRED page %d returned %d items", page, len(items))

            next_token = page_data.get("nextToken")
            if not next_token or not items:
                break
            variables["nextToken"] = next_token

    logger.info("SERNAPRED fetch total: %d raw items", len(all_items))
    return all_items


async def sync_senapred_alerts(session: AsyncSession) -> int:
    raws = await fetch_senapred_alerts(lookback_days=settings.senapred_lookback_days)
    if not raws:
        return 0

    parsed: list[dict] = []
    for r in raws:
        p = _parse_alert(r)
        if p:
            parsed.append(p)

    if not parsed:
        return 0

    dialect = session.bind.dialect.name if session.bind else "sqlite"
    insert_stmt = (
        pg_insert(SenapredAlert)
        if dialect == "postgresql"
        else sqlite_insert(SenapredAlert)
    )
    insert_stmt = insert_stmt.values(parsed)
    update_cols = {
        c.name: insert_stmt.excluded[c.name]
        for c in SenapredAlert.__table__.columns
        if c.name not in ("id", "senapred_id", "synced_at")
    }
    update_cols["synced_at"] = datetime.now(timezone.utc)
    upsert = insert_stmt.on_conflict_do_update(
        index_elements=["senapred_id"],
        set_=update_cols,
    )
    await session.execute(upsert)

    existing_ids = {p["senapred_id"] for p in parsed}
    result = await session.execute(
        select(SenapredAlert.senapred_id).where(
            SenapredAlert.senapred_issued_at
            >= datetime.now(timezone.utc) - timedelta(days=settings.senapred_lookback_days + 1)
        )
    )
    stale_ids = [r for r, in result.all() if r not in existing_ids]
    if stale_ids:
        from sqlalchemy import delete
        await session.execute(
            delete(SenapredAlert).where(SenapredAlert.senapred_id.in_(stale_ids))
        )
        logger.info("Pruned %d stale SERNAPRED alerts", len(stale_ids))

    await session.commit()
    logger.info("Upserted %d SERNAPRED alerts", len(parsed))
    return len(parsed)
