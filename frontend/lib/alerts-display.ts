import { ALERT_CSS_VAR, ALERT_HEX } from "@/lib/risk-scale"
import type {
  ActiveAlert,
  AffectedScope,
  AlertFilter,
  AlertLevel,
  AlertSource,
  UnifiedAlertLevel,
} from "@/lib/types"

const ALERT_SOURCES: AlertSource[] = [
  "senapred",
  "chilerisk",
  "sernageomin",
  "meteochile",
]
const AFFECTED_SCOPES: AffectedScope[] = ["region", "comuna", "unknown"]
const ALERT_LEVELS: AlertLevel[] = [
  "preventiva",
  "amarilla",
  "naranja",
  "roja",
  "informativa",
]

/** Maps legacy API payloads to the unified ActiveAlert contract. */
export function normalizeActiveAlert(raw: unknown): ActiveAlert {
  const r = (raw ?? {}) as Record<string, unknown>
  const id = String(r.id ?? "")

  let source: AlertSource = "senapred"
  if (ALERT_SOURCES.includes(r.source as AlertSource)) {
    source = r.source as AlertSource
  } else if (id.startsWith("cr-region-")) {
    source = "chilerisk"
  } else if (id.startsWith("sernageomin:")) {
    source = "sernageomin"
  } else if (id.startsWith("meteochile:")) {
    source = "meteochile"
  }

  const level = ALERT_LEVELS.includes(r.level as AlertLevel)
    ? (r.level as AlertLevel)
    : "preventiva"

  const external =
    (typeof r.external_url === "string" ? r.external_url : null) ??
    (typeof r.senapred_url === "string" ? r.senapred_url : null)

  return {
    id,
    source,
    level,
    category: typeof r.category === "string" ? r.category : null,
    title: typeof r.title === "string" ? r.title : "Alerta",
    content: typeof r.content === "string" ? r.content : null,
    url_access: typeof r.url_access === "string" ? r.url_access : null,
    external_url: external,
    issued_at:
      typeof r.issued_at === "string" ? r.issued_at : new Date().toISOString(),
    synced_at:
      typeof r.synced_at === "string" ? r.synced_at : new Date().toISOString(),
    region_code: typeof r.region_code === "number" ? r.region_code : null,
    region_name: typeof r.region_name === "string" ? r.region_name : null,
    affected_scope: AFFECTED_SCOPES.includes(r.affected_scope as AffectedScope)
      ? (r.affected_scope as AffectedScope)
      : "unknown",
    comuna_codes: Array.isArray(r.comuna_codes)
      ? r.comuna_codes.filter((c): c is number => typeof c === "number")
      : [],
    is_monitor: Boolean(r.is_monitor),
    parent_id: typeof r.parent_id === "string" ? r.parent_id : null,
    thread_root_id:
      typeof r.thread_root_id === "string" ? r.thread_root_id : null,
    composite_score:
      typeof r.composite_score === "number" ? r.composite_score : null,
    dominant_hazard:
      typeof r.dominant_hazard === "string" ? r.dominant_hazard : null,
    severity: typeof r.severity === "string" ? r.severity : null,
    risk_detail: typeof r.risk_detail === "string" ? r.risk_detail : null,
    record_kind:
      r.record_kind === "evento" || r.record_kind === "alerta"
        ? r.record_kind
        : "alerta",
    hazard_type: typeof r.hazard_type === "string" ? r.hazard_type : null,
  }
}

export function normalizeActiveAlerts(raw: unknown): ActiveAlert[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeActiveAlert)
}

export const ALERT_LEVEL_META: Record<
  UnifiedAlertLevel,
  { label: string; hex: string; cssVar: string }
> = {
  preventiva: {
    label: "Preventiva",
    hex: ALERT_HEX.preventiva,
    cssVar: ALERT_CSS_VAR.preventiva,
  },
  amarilla: {
    label: "Amarilla",
    hex: ALERT_HEX.amarilla,
    cssVar: ALERT_CSS_VAR.amarilla,
  },
  naranja: {
    label: "Naranja",
    hex: "#fb923c",
    cssVar: "#fb923c",
  },
  roja: {
    label: "Roja",
    hex: ALERT_HEX.roja,
    cssVar: ALERT_CSS_VAR.roja,
  },
  informativa: {
    label: "Informativa",
    hex: "#a78bfa",
    cssVar: "#a78bfa",
  },
}

export const ALERT_SOURCE_META: Record<AlertSource, { label: string }> = {
  senapred: { label: "SENAPRED" },
  chilerisk: { label: "ChileRisk" },
  sernageomin: { label: "SERNAGEOMIN" },
  meteochile: { label: "MeteoChile" },
}

const ALERT_LEVEL_PRIORITY: Record<UnifiedAlertLevel, number> = {
  roja: 0,
  naranja: 1,
  amarilla: 2,
  preventiva: 3,
  informativa: 4,
}

export const HAZARD_LABELS: Record<string, string> = {
  sismo: "Sismo",
  ola_calor: "Ola de calor",
  ola_frio: "Ola de frío",
  viento: "Viento",
  inundacion: "Inundación",
}

/** Dark ink on preventiva / amarilla / naranja / informativa; white on roja. */
export function alertLevelUsesDarkInk(level: UnifiedAlertLevel): boolean {
  return level !== "roja"
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 60_000) return "ahora"
  const m = Math.floor(ms / 60_000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function shortenRegionName(name: string | null): string | null {
  if (!name) return null
  return name.replace(/^Regi[oó]n de( la| las| el| los)?\s+/i, "")
}

export function senapredSourceLabel(alert: ActiveAlert): string {
  if (alert.source !== "senapred") return ALERT_SOURCE_META.chilerisk.label
  return alert.record_kind === "evento"
    ? "SENAPRED · Evento"
    : "SENAPRED · Alerta"
}

export function formatHazardLabel(
  hazard: string | null | undefined,
  category?: string | null,
): string {
  const key = hazard ?? category
  if (!key) return "Riesgo"
  return (
    HAZARD_LABELS[key] ??
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

export function getChileRiskRiskDetail(alert: ActiveAlert): string | null {
  if (alert.risk_detail) return alert.risk_detail

  const hazard = alert.dominant_hazard ?? alert.category
  const score = alert.composite_score
  if (hazard === "sismo") return null
  if (hazard === "ola_calor" && score != null) {
    return `índice calor ${score.toFixed(0)}/100`
  }
  if (hazard === "ola_frio" && score != null) {
    return `índice frío ${score.toFixed(0)}/100`
  }
  if (hazard === "viento" && score != null) {
    return `índice viento ${score.toFixed(0)}/100`
  }
  return score != null ? `índice ${score.toFixed(1)}/100` : null
}

export function formatChileRiskAlertHeadline(alert: ActiveAlert): string {
  const hazard = formatHazardLabel(
    alert.dominant_hazard,
    alert.category,
  ).toLowerCase()
  return `Alerta por ${hazard}`
}

export function formatChileRiskAlertMainText(alert: ActiveAlert): string {
  const title = alert.title?.trim() ?? ""
  if (title.startsWith("Alerta por")) return title

  const headline = formatChileRiskAlertHeadline(alert)
  const detail = getChileRiskRiskDetail(alert)
  return detail ? `${headline}: ${detail}` : headline
}

export function getActiveAlertMainText(alert: ActiveAlert): string {
  if (alert.source === "chilerisk") return formatChileRiskAlertMainText(alert)
  return alert.title?.trim() || "Alerta"
}

export function sortActiveAlertsBySeverity(alerts: ActiveAlert[]): ActiveAlert[] {
  return [...alerts].sort((a, b) => {
    const pa = ALERT_LEVEL_PRIORITY[a.level] ?? 9
    const pb = ALERT_LEVEL_PRIORITY[b.level] ?? 9
    if (pa !== pb) return pa - pb
    return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
  })
}

/** Cap for territory popup alert list (scroll if more). */
export const POPUP_MAX_ALERTS = 8

export function filterAlertsForRegion(
  alerts: ActiveAlert[],
  codregion: number,
): ActiveAlert[] {
  return alerts.filter(
    (a) => a.region_code == null || a.region_code === codregion,
  )
}

export function alertAppliesToComuna(
  alert: ActiveAlert,
  codregion: number,
  codComuna: number,
): boolean {
  if (alert.region_code != null && alert.region_code !== codregion) return false
  if (alert.source === "chilerisk") {
    const scope = alert.affected_scope ?? "region"
    if (scope === "comuna") {
      return (alert.comuna_codes ?? []).includes(codComuna)
    }
    return alert.region_code == null || alert.region_code === codregion
  }
  const scope = alert.affected_scope ?? "unknown"
  if (scope === "region") {
    return alert.region_code == null || alert.region_code === codregion
  }
  if (scope === "comuna") {
    return (alert.comuna_codes ?? []).includes(codComuna)
  }
  return false
}

export function filterAlertsForComuna(
  alerts: ActiveAlert[],
  codregion: number,
  codComuna: number,
): ActiveAlert[] {
  return alerts.filter((a) => alertAppliesToComuna(a, codregion, codComuna))
}

/**
 * Panel / map source filter. `airechile` has no ActiveAlert rows → empty list
 * (air zones are filtered separately in the panel).
 */
export function filterActiveAlertsBySource(
  alerts: ActiveAlert[],
  filter: AlertFilter,
): ActiveAlert[] {
  if (filter === "all") return alerts
  if (filter === "airechile") return []
  return alerts.filter((a) => a.source === filter)
}

/** Most severe level among alerts, or null if empty. */
export function mostSevereAlertLevel(
  alerts: ActiveAlert[],
): UnifiedAlertLevel | null {
  if (alerts.length === 0) return null
  return sortActiveAlertsBySeverity(alerts)[0]!.level
}

/** Highest-priority alert level per `region_code` (roja wins). */
export function computeRegionAlertLevels(
  alerts: ActiveAlert[],
): Map<number, UnifiedAlertLevel> {
  const result = new Map<number, UnifiedAlertLevel>()
  for (const a of alerts) {
    if (a.region_code == null) continue
    const prev = result.get(a.region_code)
    if (
      !prev ||
      ALERT_LEVEL_PRIORITY[a.level] < ALERT_LEVEL_PRIORITY[prev]
    ) {
      result.set(a.region_code, a.level)
    }
  }
  return result
}

/** Builds `codregion → cod_comuna[]` from comunas GeoJSON. */
export function buildComunasByRegionIndex(
  geojson: {
    features: Array<{ properties?: Record<string, unknown> | null }>
  } | null,
): Map<number, number[]> {
  const index = new Map<number, number[]>()
  if (!geojson?.features) return index
  for (const f of geojson.features) {
    const cod = f.properties?.cod_comuna
    const codregion = f.properties?.codregion
    if (typeof cod !== "number" || typeof codregion !== "number") continue
    const list = index.get(codregion) ?? []
    list.push(cod)
    index.set(codregion, list)
  }
  return index
}

/**
 * Highest-priority alert level per comuna.
 * Scope rules match `alertAppliesToComuna` (ChileRisk: missing/unknown → region;
 * other sources: region/comuna only; unknown → skip).
 */
export function computeComunaAlertLevels(
  alerts: ActiveAlert[],
  comunasByRegion: Map<number, readonly number[]>,
): Map<number, UnifiedAlertLevel> {
  const result = new Map<number, UnifiedAlertLevel>()
  const upgrade = (codComuna: number, level: UnifiedAlertLevel) => {
    const prev = result.get(codComuna)
    if (!prev || ALERT_LEVEL_PRIORITY[level] < ALERT_LEVEL_PRIORITY[prev]) {
      result.set(codComuna, level)
    }
  }

  for (const a of alerts) {
    if (a.region_code == null) continue
    const scope = a.affected_scope ?? "unknown"
    const treatAsRegion =
      scope === "region" ||
      (a.source === "chilerisk" && scope !== "comuna")

    if (scope === "comuna") {
      for (const cod of a.comuna_codes ?? []) {
        upgrade(cod, a.level)
      }
    } else if (treatAsRegion) {
      for (const cod of comunasByRegion.get(a.region_code) ?? []) {
        upgrade(cod, a.level)
      }
    }
  }
  return result
}
