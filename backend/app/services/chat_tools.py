"""Tool registry + executors for the ChileRisk citizen assistant."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comuna import Comuna
from app.models.seismic_event import SeismicEvent
from app.schemas.chat import ToolCallTrace
from app.services.airechile_service import get_airechile_by_comuna
from app.services.alert_service import list_active_alerts
from app.services.disaster_guide_service import get_disaster_guide, list_disaster_guides
from app.services.family_plan_service import get_family_plan
from app.services.meeting_point_service import (
    find_nearest_meeting_points,
    google_maps_directions_url,
    google_maps_place_url,
)
from app.services.query_date_window import clamp_query_date, day_bounds_utc, today_chile
from app.services.risk_service import get_latest_risk_for_comuna
from app.services.seismic_event_utils import event_to_response as event_to_response_async
from app.services.simulacro_service import get_next_simulacro, list_simulacros
from app.services.user_profile_service import get_user_profile

logger = logging.getLogger("chilerisk.chat_tools")


TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "get_family_plan",
            "description": (
                "Obtiene un resumen del Plan Familia Preparada del usuario autenticado "
                "(miembros, zonas seguras, punto de encuentro, contactos, kit, simulaciones)."
            ),
            "parameters": {"type": "object", "properties": {}, "additionalProperties": False},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_active_alerts",
            "description": (
                "Lista alertas SERNAPRED/ChileRisk activas. Filtra por comuna CUT o región "
                "(1-16). Si omites comuna_code, usa la comuna del contexto GPS del usuario. "
                "No uses get_user_profile para ubicar."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "comuna_code": {
                        "type": "integer",
                        "description": "Código CUT de comuna (ej. 13101 Santiago)",
                    },
                    "region_code": {
                        "type": "integer",
                        "description": "Código de región 1-16",
                    },
                    "hazard": {
                        "type": "string",
                        "description": "Tipo de amenaza opcional (earthquake, tsunami, etc.)",
                    },
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_simulacros",
            "description": "Lista simulacros SERNAPRED próximos (calendario oficial).",
            "parameters": {
                "type": "object",
                "properties": {
                    "region_code": {"type": "integer", "description": "Región 1-16"},
                    "limit": {"type": "integer", "description": "Máx. resultados (default 10)"},
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_comuna_risk",
            "description": (
                "Obtiene el vector de riesgo multi-amenaza de una comuna. "
                "Si omites comuna_code, usa la comuna del contexto GPS."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "comuna_code": {
                        "type": "integer",
                        "description": "Código CUT de comuna (opcional si hay GPS)",
                    }
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recent_events",
            "description": "Lista sismos del día calendario Chile (CSN).",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "description": "Máx. eventos (default 15)"},
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_air_quality",
            "description": (
                "Calidad del aire / episodio GEC Aire Chile. "
                "Si omites comuna_code, usa la comuna del contexto GPS."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "comuna_code": {
                        "type": "integer",
                        "description": "Código CUT (opcional si hay GPS)",
                    },
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_nearest_meeting_point",
            "description": (
                "Puntos de encuentro oficiales más cercanos (tsunami o volcanic). "
                "Si omites lat/lon, usa las coordenadas GPS del contexto. "
                "Cada ítem incluye maps_url y maps_directions_url (Google Maps): "
                "preséntalos como enlaces Markdown al usuario."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {"type": "number"},
                    "lon": {"type": "number"},
                    "hazard": {
                        "type": "string",
                        "enum": ["tsunami", "volcanic"],
                        "description": "Tipo de punto de encuentro",
                    },
                    "limit": {"type": "integer"},
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_disaster_guide",
            "description": (
                "Guía de preparación ante un tipo de desastre "
                "(antes/durante/después). Slugs: sismos, tsunami, volcanes, etc."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "slug": {
                        "type": "string",
                        "description": "Slug del desastre (ej. sismos, tsunami, inundaciones)",
                    }
                },
                "required": ["slug"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_profile",
            "description": (
                "Perfil del usuario (email, nombre). NO usar para resolver ubicación ni comuna; "
                "la ubicación viene del GPS en el contexto del sistema."
            ),
            "parameters": {"type": "object", "properties": {}, "additionalProperties": False},
        },
    },
]


@dataclass
class ToolContext:
    session: AsyncSession
    user_id: str
    comuna_code: int | None = None
    region_code: int | None = None
    lat: float | None = None
    lon: float | None = None
    traces: list[ToolCallTrace] = field(default_factory=list)


def _summarize_family_plan(plan) -> dict[str, Any]:
    data = plan.data
    safe_zones = [
        {
            "emergency": z.emergency,
            "safe_place": z.safe_place,
            "evacuation_route": z.evacuation_route,
            "safe_zone": z.safe_zone,
            "meeting_point": z.meeting_point,
        }
        for z in data.safe_zones
        if any(
            [
                z.safe_place.strip(),
                z.meeting_point.strip(),
                z.evacuation_route.strip(),
                z.safe_zone.strip(),
            ]
        )
    ]
    members = [
        {
            "name": f"{m.first_name} {m.last_name}".strip(),
            "phone": m.phone,
            "medical_conditions": m.medical_conditions,
            "special_needs": m.special_needs,
        }
        for m in data.members
        if m.first_name.strip()
    ]
    contacts = [
        {"type": c.type, "name": c.name, "phone": c.phone}
        for c in data.contacts
        if c.name.strip()
    ]
    kit = data.emergency_kit
    kit_checked = sum(
        1
        for section in (kit.base, kit.infant, kit.pregnant, kit.tea, kit.pets)
        for v in section.values()
        if v
    )
    drills = [
        {
            "date": d.date,
            "emergency_type": d.emergency_type,
            "outcome": d.outcome,
            "improvements": d.improvements,
        }
        for d in data.drills
        if d.date.strip() or d.emergency_type.strip()
    ]
    threats = [
        {
            "risk": t.risk,
            "selected": t.selected,
            "probability": t.probability,
            "impact": t.impact,
        }
        for t in data.threats
        if t.selected
    ]
    return {
        "completion_pct": plan.completion_pct,
        "members": members[:20],
        "threats": threats,
        "safe_zones": safe_zones,
        "contacts": contacts[:20],
        "emergency_kit_checked_items": kit_checked,
        "drills": drills[:10],
        "app_path": "/preparation",
    }


async def _resolve_comuna(ctx: ToolContext, args: dict[str, Any]) -> int | None:
    if "comuna_code" in args and args["comuna_code"] is not None:
        return int(args["comuna_code"])
    return ctx.comuna_code


async def execute_tool(ctx: ToolContext, name: str, arguments: dict[str, Any]) -> str:
    try:
        result, summary, ok = await _dispatch(ctx, name, arguments)
    except Exception as exc:
        logger.exception("tool %s failed", name)
        result = {"error": str(exc)}
        summary = f"Error en {name}"
        ok = False

    ctx.traces.append(
        ToolCallTrace(name=name, arguments=arguments, ok=ok, summary=summary)
    )
    return json.dumps(result, ensure_ascii=False, default=str)


async def _dispatch(
    ctx: ToolContext, name: str, args: dict[str, Any]
) -> tuple[Any, str, bool]:
    session = ctx.session

    if name == "get_family_plan":
        plan = await get_family_plan(session, ctx.user_id)
        payload = _summarize_family_plan(plan)
        return payload, f"Plan familia ({payload['completion_pct']}% completo)", True

    if name == "get_active_alerts":
        comuna = await _resolve_comuna(ctx, args)
        region = args.get("region_code") or ctx.region_code
        if comuna is None and region is None:
            return (
                {
                    "error": "missing_location",
                    "message": "Indica comuna_code o region_code, o activa GPS para detectar tu comuna.",
                },
                "Falta ubicación para alertas",
                False,
            )
        hazard_raw = args.get("hazard")
        hazard = hazard_raw if hazard_raw in (
            "sismo",
            "volcan",
            "incendio",
            "incendio_estructural",
            "remocion",
            "otros",
        ) else None
        alerts = await list_active_alerts(
            session,
            comuna=comuna,
            region=int(region) if region is not None else None,
            hazard=hazard,
        )
        items = [
            {
                "level": a.level,
                "title": a.title,
                "region_name": a.region_name,
                "region_code": a.region_code,
                "hazard_type": a.hazard_type,
                "comuna_codes": a.comuna_codes,
                "external_url": a.external_url,
            }
            for a in alerts[:30]
        ]
        return (
            {"count": len(items), "items": items},
            f"{len(items)} alertas activas",
            True,
        )

    if name == "list_simulacros":
        region = args.get("region_code") or ctx.region_code
        limit = int(args.get("limit") or 10)
        today = date.today()
        rows, total, _ = await list_simulacros(
            session,
            from_date=today,
            region=int(region) if region is not None else None,
            limit=min(limit, 30),
            offset=0,
        )
        next_one = await get_next_simulacro(session)
        items = [
            {
                "slug": r.slug,
                "title": r.title,
                "drill_date": r.drill_date.isoformat() if r.drill_date else None,
                "region_code": r.region_code,
                "drill_type": r.drill_type,
                "participating_comunas": (r.participating_comunas or [])[:15],
                "app_path": "/simulacros",
            }
            for r in rows
        ]
        next_payload = None
        if next_one is not None:
            next_payload = {
                "slug": next_one.slug,
                "title": next_one.title,
                "drill_date": next_one.drill_date.isoformat()
                if next_one.drill_date
                else None,
            }
        return (
            {"total": total, "items": items, "next": next_payload},
            f"{len(items)} simulacros próximos",
            True,
        )

    if name == "get_comuna_risk":
        comuna_code = await _resolve_comuna(ctx, args)
        if comuna_code is None:
            return (
                {
                    "error": "missing_comuna",
                    "message": "Necesito comuna_code o GPS activo en el contexto.",
                },
                "Falta comuna",
                False,
            )
        score = await get_latest_risk_for_comuna(session, comuna_code)
        comuna = await session.get(Comuna, comuna_code)
        if score is None:
            return (
                {"error": "not_found", "comuna_code": comuna_code},
                "Sin datos de riesgo",
                False,
            )
        payload = {
            "comuna_code": comuna_code,
            "name": comuna.name if comuna else None,
            "composite_score": float(score.composite_score),
            "sismo_score": float(score.sismo_score),
            "ola_calor_score": float(score.ola_calor_score),
            "ola_frio_score": float(score.ola_frio_score),
            "viento_score": float(score.viento_score),
            "dominant_hazard": score.dominant_hazard,
            "severity": score.severity,
            "app_path": "/monitor",
        }
        return payload, f"Riesgo {payload['name'] or comuna_code}", True

    if name == "get_recent_events":
        limit = int(args.get("limit") or 15)
        query_date = clamp_query_date(today_chile())
        start, end = day_bounds_utc(query_date)
        result = await session.execute(
            select(SeismicEvent)
            .where(SeismicEvent.occurred_at >= start, SeismicEvent.occurred_at < end)
            .order_by(SeismicEvent.occurred_at.desc())
            .limit(min(limit, 40))
        )
        events = result.scalars().all()
        items = []
        for e in events:
            resp = await event_to_response_async(e, session)
            items.append(resp.model_dump())
        return (
            {"date": query_date.isoformat(), "count": len(items), "items": items},
            f"{len(items)} sismos del día",
            True,
        )

    if name == "get_air_quality":
        comuna_code = await _resolve_comuna(ctx, args)
        if comuna_code is None:
            return (
                {
                    "error": "missing_comuna",
                    "message": "Necesito comuna_code o GPS activo en el contexto.",
                },
                "Falta comuna",
                False,
            )
        query_date = clamp_query_date(today_chile())
        row = await get_airechile_by_comuna(
            session, cod_comuna=comuna_code, condition_date=query_date
        )
        if row is None:
            return (
                {
                    "error": "not_covered",
                    "message": "La comuna no está en una zona PPDA de Aire Chile.",
                    "comuna_code": comuna_code,
                },
                "Sin cobertura Aire Chile",
                False,
            )
        payload = {
            "zone_slug": row.zone_slug,
            "zone_name": row.zone_name,
            "level": row.level,
            "forecast_level": row.forecast_level,
            "pm25_range_label": row.pm25_range_label,
            "measures_current": row.measures_current,
            "external_url": row.external_url,
            "condition_date": query_date.isoformat(),
        }
        return payload, f"Aire: {row.level}", True

    if name == "find_nearest_meeting_point":
        lat = float(args.get("lat") if args.get("lat") is not None else ctx.lat or 0)
        lon = float(args.get("lon") if args.get("lon") is not None else ctx.lon or 0)
        if args.get("lat") is None and ctx.lat is None:
            return (
                {
                    "error": "missing_coordinates",
                    "message": "Necesito lat/lon (geolocalización) para el punto de encuentro.",
                },
                "Faltan coordenadas",
                False,
            )
        hazard = args.get("hazard")
        limit = int(args.get("limit") or 5)
        items, total = await find_nearest_meeting_points(
            session, lat=lat, lon=lon, hazard=hazard, limit=limit
        )

        enriched = []
        for i in items:
            data = i.model_dump()
            data["maps_url"] = google_maps_place_url(lat=i.lat, lng=i.lng)
            data["maps_directions_url"] = google_maps_directions_url(
                origin_lat=lat,
                origin_lng=lon,
                dest_lat=i.lat,
                dest_lng=i.lng,
            )
            enriched.append(data)
        return (
            {
                "origin": {"lat": lat, "lon": lon},
                "total_candidates": total,
                "items": enriched,
                "app_path": "/evacuation",
                "presentation_hint": (
                    "Lista cada punto con sector, distancia_km y un enlace Markdown "
                    "usando maps_directions_url (texto: Abrir en Google Maps)."
                ),
            },
            f"{len(items)} puntos cercanos",
            True,
        )

    if name == "get_disaster_guide":
        slug = str(args.get("slug") or "").strip()
        guide = get_disaster_guide(slug)
        if guide is None:
            available = [g.slug for g in list_disaster_guides()]
            return (
                {"error": "not_found", "slug": slug, "available": available},
                "Guía no encontrada",
                False,
            )
        return guide.model_dump(), f"Guía {guide.title}", True

    if name == "get_user_profile":
        profile = await get_user_profile(session, ctx.user_id)
        if profile is None:
            return {"error": "not_found"}, "Usuario no encontrado", False
        return profile.model_dump(), "Perfil de usuario", True

    return {"error": f"unknown_tool:{name}"}, f"Tool desconocida: {name}", False


def sources_from_traces(traces: list[ToolCallTrace]) -> list[str]:
    labels = {
        "get_family_plan": "Plan Familia",
        "get_active_alerts": "Alertas activas",
        "list_simulacros": "Simulacros SERNAPRED",
        "get_comuna_risk": "Riesgo comunal",
        "get_recent_events": "Sismos CSN",
        "get_air_quality": "Aire Chile",
        "find_nearest_meeting_point": "Puntos de encuentro",
        "get_disaster_guide": "Guía de desastre",
        "get_user_profile": "Perfil",
    }
    seen: list[str] = []
    for t in traces:
        if not t.ok:
            continue
        label = labels.get(t.name, t.name)
        if label not in seen:
            seen.append(label)
    return seen
