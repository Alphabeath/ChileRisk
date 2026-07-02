import json
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.data.region_name_to_code import resolve as resolve_region_code, resolve_all as resolve_all_region_codes
from app.data.region_name_to_code import official_name as resolve_region_name
from app.services.mercalli_utils import extract_max_mercalli_from_html
from app.services.senapred_geography import infer_geography
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
    "az": "informativa",
}

_CANCEL_RE = re.compile(r"^se cancel(?!.*\bdeclara\b)", re.IGNORECASE)
_MONITOR_RE = re.compile(r"monitoreo", re.IGNORECASE)

_cognito_client: CognitoIdentityClient | None = None


def _get_cognito_client() -> CognitoIdentityClient:
    global _cognito_client
    if _cognito_client is None:
        _cognito_client = CognitoIdentityClient(
            identity_pool_id=settings.senapred_cognito_identity_pool_id,
            region=settings.senapred_aws_region,
        )
    return _cognito_client


def _map_level(codigo: str | None, *, kind: str = "alerta") -> str:
    if not codigo:
        return "informativa" if kind == "evento" else "preventiva"
    code = codigo.lower().strip()
    if code in _LEVEL_FROM_CODE:
        return _LEVEL_FROM_CODE[code]
    return "informativa" if kind == "evento" else "preventiva"


def normalize_hazard_type(category: str | None) -> str | None:
    if not category:
        return None
    c = category.lower()
    if "sismo" in c or "sísm" in c:
        return "sismo"
    if "volcan" in c or "volcán" in c:
        return "volcan"
    if "incendio" in c:
        return "incendio_estructural" if "estructural" in c else "incendio"
    if "remoci" in c or "desliz" in c:
        return "remocion"
    return "otros"


def _is_active(title: str, raw: dict, *, kind: str = "alerta") -> bool:
    if not raw.get("isActive", True):
        return False
    if raw.get("isDeleted", False):
        return False
    if _CANCEL_RE.search(title or ""):
        return False
    if kind == "alerta" and not raw.get("isPrincipal", True):
        return False
    return True


def _is_monitor(title: str) -> bool:
    return bool(_MONITOR_RE.search(title or ""))


def _parse_issued_at(raw: dict) -> datetime:
    issued_raw = raw.get("fechaHora")
    if isinstance(issued_raw, str):
        try:
            issued_at = datetime.fromisoformat(issued_raw.replace("Z", "+00:00"))
            if issued_at.tzinfo is None:
                issued_at = issued_at.replace(tzinfo=timezone.utc)
            return issued_at
        except ValueError:
            pass
    elif isinstance(issued_raw, datetime):
        return issued_raw if issued_raw.tzinfo else issued_raw.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc)


def _parse_meta(raw: dict) -> dict:
    meta_str = raw.get("metaData") or "{}"
    try:
        return json.loads(meta_str) if isinstance(meta_str, str) else (meta_str or {})
    except (json.JSONDecodeError, TypeError):
        return {}


def _parse_record(raw: dict, *, kind: str) -> list[dict[str, Any]]:
    senapred_id = raw.get("id")
    title = raw.get("titulo")
    if not senapred_id or not title:
        return []

    meta = _parse_meta(raw)
    region_name_raw = (meta.get("regiones") or "").strip() or None
    region_codes = resolve_all_region_codes(region_name_raw) if region_name_raw else []
    primary_code = region_codes[0] if region_codes else None
    title_stripped = title.strip()
    content_raw = raw.get("contenido")
    content_str = content_raw if isinstance(content_raw, str) else None
    category = (meta.get("nombreVariable") or "").strip()[:128] or None
    url_access = raw.get("urlAccess")
    if isinstance(url_access, str):
        url_access = url_access[:512] or None

    if content_str and category and category.lower() == "sismo":
        mercalli = extract_max_mercalli_from_html(content_str)
        if mercalli:
            meta["max_mercalli"], meta["mercalli_by_city"] = mercalli

    is_active = _is_active(title, raw, kind=kind)
    is_monitor = _is_monitor(title)
    parent_id = (raw.get("parentId") or None) if raw.get("parentId") not in (None, "parent") else None
    issued_at = _parse_issued_at(raw)

    base = {
        "kind": kind,
        "level": _map_level(meta.get("codigoAlertaEvento"), kind=kind),
        "title": title_stripped[:500],
        "content": content_raw,
        "url_access": url_access,
        "category": category,
        "is_active": is_active,
        "is_monitor": is_monitor,
        "parent_id": parent_id,
        "senapred_issued_at": issued_at,
        "meta_data": meta,
        "raw": raw,
    }

    if len(region_codes) <= 1:
        region_name = region_name_raw[:128] if region_name_raw else None
        affected_scope, comuna_codes = infer_geography(
            title_stripped, content_str, primary_code
        )
        return [{**base, "senapred_id": senapred_id, "region_code": primary_code,
                 "region_name": region_name, "affected_scope": affected_scope,
                 "comuna_codes": comuna_codes}]

    records = []
    for code in region_codes:
        name = resolve_region_name(code) or region_name_raw
        affected_scope, comuna_codes = infer_geography(
            title_stripped, content_str, code
        )
        records.append({**base, "senapred_id": f"{senapred_id}-{code}",
                        "region_code": code, "region_name": name[:128] if name else None,
                        "affected_scope": affected_scope, "comuna_codes": comuna_codes})
    return records


def _parse_alert(raw: dict) -> list[dict[str, Any]]:
    return _parse_record(raw, kind="alerta")


def _parse_evento(raw: dict) -> list[dict[str, Any]]:
    return _parse_record(raw, kind="evento")


_REGION_CODES = list(range(1, 17))


def senapred_thread_root(
    row: SenapredAlert, by_id: dict[str, SenapredAlert]
) -> str:
    """Oldest senapred_id in an update chain (parentId links versiones sucesivas).

    Handles expanded multi-region records whose parent_id points to an
    original (unsuffixed) ID that was replaced by suffixed variants
    (e.g. ``uuid-5``, ``uuid-13``).
    """
    root_id = row.senapred_id
    parent_id = row.parent_id
    seen: set[str] = {root_id}
    while parent_id and parent_id not in seen:
        seen.add(parent_id)
        if parent_id in by_id:
            root_id = parent_id
            parent_id = by_id[parent_id].parent_id
        else:
            # Parent not in by_id — may have been replaced by expanded
            # records with region-code suffixes. Try each variant.
            expanded_id: str | None = None
            for code in _REGION_CODES:
                candidate = f"{parent_id}-{code}"
                if candidate in by_id:
                    expanded_id = candidate
                    break
            if expanded_id and expanded_id not in seen:
                seen.add(expanded_id)
                root_id = expanded_id
                parent_id = by_id[expanded_id].parent_id
            else:
                root_id = parent_id
                break
    return root_id


def pick_latest_senapred_per_thread(
    rows: list[SenapredAlert],
) -> list[SenapredAlert]:
    """Una fila por hilo de actualización: conserva la versión con issued_at más reciente."""
    if len(rows) <= 1:
        return list(rows)
    by_id = {r.senapred_id: r for r in rows}
    best: dict[tuple[str, str], SenapredAlert] = {}
    for row in rows:
        key = (row.kind, senapred_thread_root(row, by_id))
        prev = best.get(key)
        if prev is None or row.senapred_issued_at > prev.senapred_issued_at:
            best[key] = row
    return list(best.values())


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

_LIST_EVENTOS_QUERY = """
query ListEventos($fechaHora: ModelStringKeyConditionInput, $filter: ModelEventoFilterInput, $limit: Int, $nextToken: String, $sortDirection: ModelSortDirection) {
  eventosByDate(
    type: "Evento"
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
      metaData
      createdAt
      updatedAt
    }
    nextToken
  }
}
"""


async def _fetch_paginated(
    *,
    query: str,
    data_key: str,
    lookback_days: int,
    max_pages: int,
) -> list[dict]:
    cognito = _get_cognito_client()
    creds = await cognito.get_credentials()
    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime(
        "%Y-%m-%dT%H:%M:%S.000Z"
    )
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
            payload = json.dumps({"query": query, "variables": variables}).encode()
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
                logger.error("SERNAPRED fetch HTTP error page %d (%s): %s", page, data_key, e)
                break

            if resp.status_code != 200:
                logger.error(
                    "SERNAPRED fetch status %d page %d (%s): %s",
                    resp.status_code,
                    page,
                    data_key,
                    resp.text[:300],
                )
                break

            try:
                body = resp.json()
            except json.JSONDecodeError:
                logger.error("SERNAPRED invalid JSON page %d (%s)", page, data_key)
                break

            if is_credential_error(body):
                logger.warning("SERNAPRED credential error (%s) — refresh", data_key)
                cognito._creds = None
                creds = await cognito.get_credentials()
                continue

            errors = body.get("errors")
            if errors:
                logger.error("SERNAPRED GraphQL errors (%s): %s", data_key, errors[:1])
                break

            page_data = (body.get("data") or {}).get(data_key) or {}
            items = page_data.get("items") or []
            all_items.extend(items)
            logger.info("SERNAPRED %s page %d: %d items", data_key, page, len(items))

            next_token = page_data.get("nextToken")
            if not next_token or not items:
                break
            variables["nextToken"] = next_token

    logger.info("SERNAPRED %s total: %d raw items", data_key, len(all_items))
    return all_items


async def fetch_senapred_alerts(lookback_days: int = 30, max_pages: int = 40) -> list[dict]:
    return await _fetch_paginated(
        query=_LIST_QUERY,
        data_key="alertasByDate",
        lookback_days=lookback_days,
        max_pages=max_pages,
    )


async def fetch_senapred_eventos(lookback_days: int = 30, max_pages: int = 40) -> list[dict]:
    return await _fetch_paginated(
        query=_LIST_EVENTOS_QUERY,
        data_key="eventosByDate",
        lookback_days=lookback_days,
        max_pages=max_pages,
    )


async def _upsert_parsed(session: AsyncSession, parsed: list[dict]) -> None:
    if not parsed:
        return
    dialect = session.bind.dialect.name if session.bind else "sqlite"
    insert_stmt = (
        pg_insert(SenapredAlert) if dialect == "postgresql" else sqlite_insert(SenapredAlert)
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


async def _prune_stale(
    session: AsyncSession,
    *,
    kind: str,
    existing_ids: set[str],
    lookback_days: int,
) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=lookback_days + 1)
    result = await session.execute(
        select(SenapredAlert.senapred_id).where(
            SenapredAlert.kind == kind,
            SenapredAlert.senapred_issued_at >= cutoff,
        )
    )
    stale_ids = [r for r, in result.all() if r not in existing_ids]
    if stale_ids:
        await session.execute(
            delete(SenapredAlert).where(SenapredAlert.senapred_id.in_(stale_ids))
        )
        logger.info("Pruned %d stale SERNAPRED %s records", len(stale_ids), kind)
    return len(stale_ids)


async def sync_senapred_alerts(session: AsyncSession) -> tuple[int, int]:
    """Sync alertas (ATP) and eventos (Sismos y otros). Returns (n_alertas, n_eventos)."""
    lookback = settings.senapred_lookback_days

    alert_raws = await fetch_senapred_alerts(lookback_days=lookback)
    evento_raws = await fetch_senapred_eventos(lookback_days=lookback)

    alert_parsed: list[dict[str, Any]] = [
        p for r in alert_raws for p in _parse_alert(r)
    ]
    evento_parsed: list[dict[str, Any]] = [
        p for r in evento_raws for p in _parse_evento(r)
    ]

    await _upsert_parsed(session, alert_parsed + evento_parsed)

    if alert_parsed:
        await _prune_stale(
            session,
            kind="alerta",
            existing_ids={p["senapred_id"] for p in alert_parsed},
            lookback_days=lookback,
        )
    if evento_parsed:
        await _prune_stale(
            session,
            kind="evento",
            existing_ids={p["senapred_id"] for p in evento_parsed},
            lookback_days=lookback,
        )

    await session.commit()
    logger.info(
        "Upserted %d SERNAPRED alertas + %d eventos",
        len(alert_parsed),
        len(evento_parsed),
    )
    return len(alert_parsed), len(evento_parsed)