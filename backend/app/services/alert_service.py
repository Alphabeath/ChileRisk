"""Active alerts: SERNAPRED (DB) + ChileRisk (risk algorithm, computed on read)."""

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.comuna import Comuna
from app.models.senapred_alert import SenapredAlert
from app.models.seismic_event import SeismicEvent
from app.schemas.alert import ActiveAlertOut, AlertLevel
from app.services.region_service import get_all_regions_aggregated
from app.services.seismic_service import estimate_intensity, haversine_km

HAZARD_LABELS: dict[str, str] = {
    "sismo": "Sismo",
    "ola_calor": "Ola de calor",
    "ola_frio": "Ola de frío",
    "viento": "Viento",
}

SEVERITY_TO_LEVEL: dict[str, AlertLevel] = {
    "critico": "roja",
    "alto": "naranja",
    "moderado": "amarilla",
}

MIN_CHILERISK_SEVERITY = {"moderado", "alto", "critico"}
SEISMIC_LOOKBACK_HOURS = 24


def _severity_to_level(severity: str) -> AlertLevel | None:
    return SEVERITY_TO_LEVEL.get(severity)


def _hazard_risk_detail(hazard: str, region: dict, seismic: dict[str, float] | None) -> str:
    """Texto corto con la magnitud física dominante para la tarjeta de alerta."""
    codregion = int(region["codregion"])

    if hazard == "sismo":
        if seismic:
            parts = [f"intensidad estimada de {seismic['max_intensity']:.1f}"]
            if seismic.get("max_magnitude"):
                parts.append(f"magnitud máxima de {seismic['max_magnitude']:.1f}")
            return " y ".join(parts)
        score = float(region.get("sismo_score") or 0)
        approx = (score / 100.0) * 10.0
        return f"intensidad referencial de {approx:.1f} (riesgo {score:.0f} de 100)"

    if hazard == "ola_calor":
        temp = region.get("avg_temperature_c")
        if temp is not None:
            return f"temperatura media {float(temp):.1f} °C"
        score = float(region.get("ola_calor_score") or 0)
        return f"índice calor {score:.0f}/100"

    if hazard == "ola_frio":
        temp = region.get("avg_temperature_c")
        if temp is not None:
            return f"temperatura media {float(temp):.1f} °C"
        score = float(region.get("ola_frio_score") or 0)
        return f"índice frío {score:.0f}/100"

    if hazard == "viento":
        wind = region.get("avg_wind_speed_kmh")
        if wind is not None:
            return f"viento medio {float(wind):.1f} km/h"
        score = float(region.get("viento_score") or 0)
        return f"índice viento {score:.0f}/100"

    score = float(region.get("composite_score") or 0)
    return f"índice compuesto {score:.1f}/100"


async def _seismic_metrics_by_region(
    session: AsyncSession,
) -> dict[int, dict[str, float]]:
    """Máxima intensidad/M por región según eventos recientes y centroides comunales."""
    since = datetime.now(timezone.utc) - timedelta(hours=SEISMIC_LOOKBACK_HOURS)

    events_rows = (
        await session.execute(
            select(SeismicEvent).where(SeismicEvent.occurred_at >= since)
        )
    ).scalars().all()
    if not events_rows:
        return {}

    events = [
        {
            "latitude": e.latitude,
            "longitude": e.longitude,
            "magnitude": e.magnitude,
            "depth_km": e.depth_km or 30.0,
        }
        for e in events_rows
    ]

    comuna_rows = (
        await session.execute(
            select(Comuna.codregion, Comuna.latitude, Comuna.longitude).where(
                Comuna.latitude.isnot(None),
                Comuna.longitude.isnot(None),
            )
        )
    ).all()

    comunas_by_region: dict[int, list[tuple[float, float]]] = defaultdict(list)
    for codregion, lat, lon in comuna_rows:
        comunas_by_region[int(codregion)].append((float(lat), float(lon)))

    metrics: dict[int, dict[str, float]] = {}
    for codregion, points in comunas_by_region.items():
        max_intensity = 0.0
        max_magnitude = 0.0
        for lat, lon in points:
            for ev in events:
                dist = haversine_km(lat, lon, ev["latitude"], ev["longitude"])
                intensity = estimate_intensity(
                    ev["magnitude"], dist, ev["depth_km"]
                )
                if intensity > max_intensity:
                    max_intensity = intensity
                    max_magnitude = ev["magnitude"]
        if max_intensity > 0:
            metrics[codregion] = {
                "max_intensity": round(max_intensity, 1),
                "max_magnitude": round(max_magnitude, 1),
            }

    return metrics


async def _senapred_rows_to_out(session: AsyncSession) -> list[ActiveAlertOut]:
    stmt = (
        select(SenapredAlert)
        .where(SenapredAlert.is_active.is_(True))
        .order_by(SenapredAlert.senapred_issued_at.desc())
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [
        ActiveAlertOut(
            id=r.senapred_id,
            source="senapred",
            level=r.level,
            category=r.category,
            title=r.title,
            content=r.content,
            url_access=r.url_access,
            external_url=(
                f"{settings.senapred_alert_base_url}{r.url_access}"
                if r.url_access
                else None
            ),
            issued_at=r.senapred_issued_at,
            synced_at=r.synced_at,
            region_code=r.region_code,
            region_name=r.region_name,
            is_monitor=r.is_monitor,
            parent_id=r.parent_id,
            composite_score=None,
            dominant_hazard=None,
            severity=None,
            risk_detail=None,
        )
        for r in rows
    ]


async def _chilerisk_alerts_from_risk(session: AsyncSession) -> list[ActiveAlertOut]:
    regions = await get_all_regions_aggregated(session)
    seismic_by_region = await _seismic_metrics_by_region(session)
    fallback_now = datetime.now(timezone.utc)
    alerts: list[ActiveAlertOut] = []

    for r in regions:
        severity = r.get("severity") or "bajo"
        if severity not in MIN_CHILERISK_SEVERITY:
            continue
        level = _severity_to_level(severity)
        if not level:
            continue

        codregion = int(r["codregion"])
        hazard = r.get("dominant_hazard") or "sismo"
        hazard_label = HAZARD_LABELS.get(hazard, hazard.replace("_", " ").title())
        score = float(r.get("composite_score") or 0)
        name = r.get("name") or f"Región {codregion}"
        seismic = seismic_by_region.get(codregion)
        risk_detail = _hazard_risk_detail(hazard, r, seismic)
        issued_raw = r.get("risk_computed_at")
        if isinstance(issued_raw, datetime):
            issued_at = (
                issued_raw
                if issued_raw.tzinfo
                else issued_raw.replace(tzinfo=timezone.utc)
            )
        else:
            issued_at = fallback_now

        hazard_phrase = hazard_label.lower()
        main_text = f"Alerta por {hazard_phrase}: {risk_detail}"

        alerts.append(
            ActiveAlertOut(
                id=f"cr-region-{codregion}",
                source="chilerisk",
                level=level,
                category=hazard,
                title=main_text,
                content=None,
                url_access=None,
                external_url=None,
                issued_at=issued_at,
                synced_at=issued_at,
                region_code=codregion,
                region_name=name,
                is_monitor=False,
                parent_id=None,
                composite_score=score,
                dominant_hazard=hazard,
                severity=severity,
                risk_detail=risk_detail,
            )
        )

    return alerts


def _sort_alerts(alerts: list[ActiveAlertOut]) -> list[ActiveAlertOut]:
    return sorted(alerts, key=lambda a: a.issued_at, reverse=True)


async def list_active_alerts(
    session: AsyncSession,
    *,
    region: int | None = None,
    level: AlertLevel | None = None,
) -> list[ActiveAlertOut]:
    senapred = await _senapred_rows_to_out(session)
    chilerisk = await _chilerisk_alerts_from_risk(session)
    merged = senapred + chilerisk

    if region is not None:
        merged = [
            a
            for a in merged
            if a.region_code is None or a.region_code == region
        ]
    if level is not None:
        merged = [a for a in merged if a.level == level]

    return _sort_alerts(merged)[:200]