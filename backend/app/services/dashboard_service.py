"""AI-generated citizen dashboard summary (DeepSeek)."""

import asyncio
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from cachetools import TTLCache
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.seismic_event import SeismicEvent
from app.schemas.dashboard import DashboardSummaryOut
from app.services.airechile_service import get_airechile_by_comuna
from app.services.alert_service import list_active_alerts
from app.services.daily_risk_service import get_national_risk_for_date
from app.services.deepseek_client import get_deepseek_client
from app.services.query_date_window import today_chile
from app.services.risk_service import get_latest_risk_for_comuna
from app.services.user_profile_service import get_user_profile

logger = logging.getLogger("chilerisk.dashboard")

# 15 min — aligned with the scheduler risk refresh cadence.
_summary_cache: TTLCache = TTLCache(maxsize=400, ttl=900)

_SYSTEM_PROMPT = (
    "Eres el resumidor de ChileRisk, una app de monitoreo de amenazas naturales en Chile. "
    "Escribe un resumen breve (máx. 120 palabras), en español, tono ciudadano claro y calmado, "
    "2 párrafos: (1) panorama nacional, (2) situación de la comuna del usuario si se entrega. "
    "Usa SOLO los datos JSON entregados; no inventes cifras ni alertas. No uses markdown."
)

_LLM_TIMEOUT_SECONDS = 20


async def get_dashboard_summary(session: AsyncSession, user_id: str) -> DashboardSummaryOut:
    profile = await get_user_profile(session, user_id)
    home_comuna_code = profile.home_comuna_code if profile else None
    home_comuna_name = profile.home_comuna_name if profile else None

    cache_key: int | str = home_comuna_code if home_comuna_code is not None else "national"
    if cache_key in _summary_cache:
        hit = _summary_cache[cache_key]
        return DashboardSummaryOut(
            summary=hit["summary"],
            generated_at=hit["generated_at"],
            cached=True,
            comuna_name=home_comuna_name,
        )

    today = today_chile()

    national = await get_national_risk_for_date(session, today)
    top_regions = sorted(national, key=lambda r: r["composite_score"], reverse=True)[:3]

    # Already severity-sorted by the service (roja → informativa).
    top_alerts = (await list_active_alerts(session, query_date=today))[:5]

    since = datetime.now(timezone.utc) - timedelta(hours=24)
    events = (
        (await session.execute(select(SeismicEvent).where(SeismicEvent.occurred_at >= since)))
        .scalars()
        .all()
    )
    max_event = max(events, key=lambda e: e.magnitude, default=None)
    max_location = None
    if max_event is not None:
        raw = max_event.raw_data or {}
        loc = raw.get("location")
        if isinstance(loc, str) and loc.strip():
            max_location = loc

    context: dict[str, Any] = {
        "nacional": {
            "top_regiones": [
                {
                    "nombre": r["name"],
                    "severidad": r["severity"],
                    "amenaza_dominante": r["dominant_hazard"],
                    "puntaje": r["composite_score"],
                }
                for r in top_regions
            ]
        },
        "alertas": [
            {"nivel": a.level, "titulo": a.title, "region": a.region_name} for a in top_alerts
        ],
        "sismos_24h": {
            "total": len(events),
            "magnitud_maxima": max_event.magnitude if max_event else None,
            "ubicacion_magnitud_maxima": max_location,
        },
    }

    if home_comuna_code is not None:
        comuna_section: dict[str, Any] = {"nombre": home_comuna_name}
        risk = await get_latest_risk_for_comuna(session, home_comuna_code)
        if risk is not None:
            comuna_section["puntaje"] = round(risk.composite_score, 1)
            comuna_section["severidad"] = risk.severity
            comuna_section["amenaza_dominante"] = risk.dominant_hazard
        aire = await get_airechile_by_comuna(
            session, cod_comuna=home_comuna_code, condition_date=today
        )
        if aire is not None:
            comuna_section["calidad_aire"] = aire.level
        context["comuna"] = comuna_section

    if not settings.deepseek_api_key.strip():
        raise HTTPException(status_code=503, detail="Resumen IA no disponible")

    try:
        client = get_deepseek_client()
        response = await asyncio.wait_for(
            client.chat.completions.create(
                model=settings.deepseek_model,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": json.dumps(context, ensure_ascii=False)},
                ],
                temperature=0.3,
            ),
            timeout=_LLM_TIMEOUT_SECONDS,
        )
        summary_text = (response.choices[0].message.content or "").strip()
        if not summary_text:
            raise ValueError("empty_summary")
    except Exception as exc:
        logger.warning("Dashboard summary LLM call failed: %s", exc)
        raise HTTPException(status_code=503, detail="Resumen IA no disponible") from exc

    generated_at = datetime.now(timezone.utc)
    _summary_cache[cache_key] = {"summary": summary_text, "generated_at": generated_at}
    return DashboardSummaryOut(
        summary=summary_text,
        generated_at=generated_at,
        cached=False,
        comuna_name=home_comuna_name,
    )
