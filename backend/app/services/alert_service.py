"""Active alerts: SERNAPRED (DB) + ChileRisk (per-hazard evaluation, computed on read)."""

from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.comuna import Comuna
from app.models.senapred_alert import SenapredAlert
from app.schemas.alert import ActiveAlertOut, AlertLevel, HazardType, RecordKind
from app.services.alert_evaluator import (
    HazardAlertEvaluation,
    evaluate_region_hazards,
)
from app.services.impact_service import get_max_seismic_metrics_by_region
from app.services.query_date_window import day_bounds_utc, today_chile
from app.services.region_service import get_all_regions_for_alerts
from app.services.senapred_service import (
    is_cancel_title,
    normalize_hazard_type,
    pick_latest_senapred_per_thread,
    senapred_thread_root,
)

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

def _severity_to_level(severity: str) -> AlertLevel | None:
    return SEVERITY_TO_LEVEL.get(severity)


def _senapred_external_url(row: SenapredAlert) -> str | None:
    if not row.url_access:
        return None
    base = (
        settings.senapred_event_base_url
        if row.kind == "evento"
        else settings.senapred_alert_base_url
    )
    return f"{base}{row.url_access}"


def _row_to_out(
    row: SenapredAlert, *, thread_root_id: str | None = None
) -> ActiveAlertOut:
    kind: RecordKind = "evento" if row.kind == "evento" else "alerta"
    hazard = normalize_hazard_type(row.category)
    return ActiveAlertOut(
        id=row.senapred_id,
        source="senapred",
        level=row.level if row.level in ("preventiva", "amarilla", "naranja", "roja", "informativa") else "informativa",
        category=row.category,
        title=row.title,
        content=row.content,
        url_access=row.url_access,
        external_url=_senapred_external_url(row),
        issued_at=row.senapred_issued_at,
        synced_at=row.synced_at,
        region_code=row.region_code,
        region_name=row.region_name,
        affected_scope=(
            row.affected_scope
            if row.affected_scope in ("region", "comuna", "unknown")
            else "unknown"
        ),
        comuna_codes=list(row.comuna_codes or []),
        is_monitor=row.is_monitor,
        parent_id=row.parent_id,
        thread_root_id=thread_root_id,
        record_kind=kind,
        hazard_type=hazard,
        composite_score=None,
        dominant_hazard=hazard,
        severity=None,
        risk_detail=None,
    )


def _hazard_score_for_display(region: dict, evaluation: HazardAlertEvaluation) -> float:
    if evaluation.hazard == "sismo":
        if evaluation.trigger_metric == "intensity":
            return evaluation.trigger_value
        return float(region.get("max_sismo_score") or region.get("sismo_score") or 0)
    return float(region.get(f"{evaluation.hazard}_score") or evaluation.trigger_value)


def _hazard_risk_detail(
    evaluation: HazardAlertEvaluation,
    region: dict,
    seismic: dict[str, float] | None,
) -> str:
    hazard = evaluation.hazard

    if hazard == "sismo":
        if seismic and seismic.get("max_magnitude"):
            mag_type = seismic.get("magnitude_type", "Ml")
            return f"cercano de magnitud {seismic['max_magnitude']:.1f} {mag_type}"
        if evaluation.trigger_metric == "magnitude":
            return f"cercano de magnitud {evaluation.trigger_value:.1f} Ml"
        score = float(region.get("max_sismo_score") or region.get("sismo_score") or 0)
        if score > 0:
            approx = (score / 100.0) * 10.0
            return f"intensidad referencial de {approx:.1f} (riesgo {score:.0f} de 100)"
        return "en monitoreo"

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


def filter_senapred_rows_for_active_list(
    rows: list[SenapredAlert], *, include_inactive: bool
) -> list[SenapredAlert]:
    """Dedupe by thread, drop pure cancels, then optionally drop inactive.

    Cancels are loaded even for \"today\" so a later cancel can close the thread
    (latest wins in dedupe, then the cancel row is discarded).
    """
    latest = pick_latest_senapred_per_thread(list(rows))
    out: list[SenapredAlert] = []
    for row in latest:
        if is_cancel_title(row.title):
            continue
        if not include_inactive and not row.is_active:
            continue
        out.append(row)
    return out


async def _senapred_rows_to_out(
    session: AsyncSession, *, query_date: date, include_inactive: bool = False
) -> list[ActiveAlertOut]:
    start, end = day_bounds_utc(query_date)
    # Always load inactive (incl. cancels) so thread dedupe can close a chain.
    stmt = (
        select(SenapredAlert)
        .where(
            SenapredAlert.senapred_issued_at >= start,
            SenapredAlert.senapred_issued_at < end,
        )
        .order_by(SenapredAlert.senapred_issued_at.desc())
    )
    rows = (await session.execute(stmt)).scalars().all()
    by_id = {r.senapred_id: r for r in rows}
    filtered = filter_senapred_rows_for_active_list(
        rows, include_inactive=include_inactive
    )
    return [
        _row_to_out(r, thread_root_id=senapred_thread_root(r, by_id))
        for r in filtered
    ]


async def _chilerisk_alerts_from_risk(
    session: AsyncSession, *, query_date: date
) -> list[ActiveAlertOut]:
    start, end = day_bounds_utc(query_date)
    regions = await get_all_regions_for_alerts(session)
    seismic_by_region = await get_max_seismic_metrics_by_region(
        session, start=start, end=end
    )
    fallback_now = datetime.now(timezone.utc)
    alerts: list[ActiveAlertOut] = []

    for r in regions:
        codregion = int(r["codregion"])
        seismic = seismic_by_region.get(codregion)
        max_intensity = seismic["max_intensity"] if seismic else None
        max_magnitude = seismic.get("max_magnitude") if seismic else None

        evaluations = evaluate_region_hazards(
            sismo_score=float(r.get("sismo_score") or 0),
            max_sismo_score=float(r.get("max_sismo_score") or 0),
            ola_calor_score=float(r.get("ola_calor_score") or 0),
            ola_frio_score=float(r.get("ola_frio_score") or 0),
            viento_score=float(r.get("viento_score") or 0),
            max_intensity=max_intensity,
            max_magnitude=max_magnitude,
        )

        if not evaluations:
            continue

        name = r.get("name") or f"Región {codregion}"
        issued_raw = r.get("risk_computed_at")
        if isinstance(issued_raw, datetime):
            issued_at = (
                issued_raw
                if issued_raw.tzinfo
                else issued_raw.replace(tzinfo=timezone.utc)
            )
        else:
            issued_at = fallback_now

        for evaluation in evaluations:
            level = _severity_to_level(evaluation.severity)
            if not level:
                continue

            hazard = evaluation.hazard
            hazard_label = HAZARD_LABELS.get(hazard, hazard.replace("_", " ").title())
            risk_detail = _hazard_risk_detail(evaluation, r, seismic)
            display_score = _hazard_score_for_display(r, evaluation)

            title = f"Alerta por {hazard_label.lower()} de {risk_detail}"

            csn_url = seismic.get("detail_url") if seismic and hazard == "sismo" else None

            alerts.append(
                ActiveAlertOut(
                    id=f"cr-region-{codregion}-{hazard}",
                    source="chilerisk",
                    level=level,
                    category=hazard,
                    title=title,
                    content=None,
                    url_access=None,
                    external_url=csn_url,
                    issued_at=issued_at,
                    synced_at=issued_at,
                    region_code=codregion,
                    region_name=name,
                    affected_scope="region",
                    comuna_codes=[],
                    is_monitor=False,
                    parent_id=None,
                    record_kind="alerta",
                    hazard_type=hazard,
                    composite_score=round(display_score, 1),
                    dominant_hazard=hazard,
                    severity=evaluation.severity,
                    risk_detail=risk_detail,
                )
            )

    return alerts


def _sort_alerts(alerts: list[ActiveAlertOut]) -> list[ActiveAlertOut]:
    level_rank = {
        "roja": 0,
        "naranja": 1,
        "amarilla": 2,
        "preventiva": 3,
        "informativa": 4,
    }
    kind_rank = {"alerta": 0, "evento": 1}

    def sort_key(a: ActiveAlertOut) -> tuple:
        return (
            level_rank.get(a.level, 9),
            kind_rank.get(a.record_kind, 9),
            -a.issued_at.timestamp(),
        )

    return sorted(alerts, key=sort_key)


def _alert_applies_to_comuna(
    alert: ActiveAlertOut, codregion: int, cod_comuna: int
) -> bool:
    if alert.region_code is not None and alert.region_code != codregion:
        return False
    if alert.source == "chilerisk":
        return alert.region_code is None or alert.region_code == codregion
    scope = alert.affected_scope or "unknown"
    if scope == "region":
        return alert.region_code is None or alert.region_code == codregion
    if scope == "comuna":
        return cod_comuna in (alert.comuna_codes or [])
    return False


def _matches_hazard_filter(hazard_type: str | None, hazard: HazardType) -> bool:
    if not hazard_type:
        return hazard == "otros"
    if hazard == "incendio":
        return hazard_type in ("incendio", "incendio_estructural")
    return hazard_type == hazard


async def list_active_alerts(
    session: AsyncSession,
    *,
    query_date: date | None = None,
    region: int | None = None,
    comuna: int | None = None,
    level: AlertLevel | None = None,
    record_kind: RecordKind | None = None,
    hazard: HazardType | None = None,
) -> list[ActiveAlertOut]:
    qd = query_date or today_chile()
    is_today = qd == today_chile()
    senapred = await _senapred_rows_to_out(
        session, query_date=qd, include_inactive=not is_today
    )
    chilerisk = await _chilerisk_alerts_from_risk(session, query_date=qd)
    merged = senapred + chilerisk

    if comuna is not None:
        row = await session.get(Comuna, comuna)
        if row is None:
            merged = []
        else:
            merged = [
                a
                for a in merged
                if _alert_applies_to_comuna(a, row.codregion, comuna)
            ]
    elif region is not None:
        merged = [
            a
            for a in merged
            if a.region_code is None or a.region_code == region
        ]
    if level is not None:
        merged = [a for a in merged if a.level == level]
    if record_kind is not None:
        merged = [a for a in merged if a.record_kind == record_kind]
    if hazard is not None:
        merged = [a for a in merged if _matches_hazard_filter(a.hazard_type, hazard)]

    return _sort_alerts(merged)[:200]