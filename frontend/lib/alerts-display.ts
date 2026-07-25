import type { ActiveAlert, AffectedScope, AlertLevel, AlertSource } from "@/lib/types"

const ALERT_SOURCES: AlertSource[] = ["senapred", "chilerisk", "sernageomin"]
const AFFECTED_SCOPES: AffectedScope[] = ["region", "comuna", "unknown"]

const ALERT_LEVELS: AlertLevel[] = [
  "preventiva",
  "amarilla",
  "naranja",
  "roja",
  "informativa",
]

/** Maps legacy API payloads (sin `source`, con `senapred_url`) al contrato unificado. */
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
    issued_at: typeof r.issued_at === "string" ? r.issued_at : new Date().toISOString(),
    synced_at: typeof r.synced_at === "string" ? r.synced_at : new Date().toISOString(),
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
    composite_score: typeof r.composite_score === "number" ? r.composite_score : null,
    dominant_hazard: typeof r.dominant_hazard === "string" ? r.dominant_hazard : null,
    severity: typeof r.severity === "string" ? r.severity : null,
    risk_detail: typeof r.risk_detail === "string" ? r.risk_detail : null,
    record_kind:
      r.record_kind === "evento" || r.record_kind === "alerta"
        ? r.record_kind
        : "alerta",
    hazard_type:
      typeof r.hazard_type === "string" ? r.hazard_type : null,
  }
}

export function normalizeActiveAlerts(raw: unknown): ActiveAlert[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeActiveAlert)
}

export const ALERT_LEVEL_META: Record<
  AlertLevel,
  { label: string; hex: string; badge: string }
> = {
  preventiva: {
    label: "Preventiva",
    hex: "#38bdf8",
    badge: "bg-sky-500/10 text-sky-300 border-sky-400/40",
  },
  amarilla: {
    label: "Amarilla",
    hex: "#fbbf24",
    badge: "bg-amber-500/10 text-amber-300 border-amber-400/40",
  },
  naranja: {
    label: "Naranja",
    hex: "#fb923c",
    badge: "bg-orange-500/10 text-orange-300 border-orange-400/40",
  },
  roja: {
    label: "Roja",
    hex: "#DA291C",
    badge: "bg-[#DA291C]/15 text-[#ff9a9a] border-[#DA291C]/45",
  },
  informativa: {
    label: "Informativo",
    hex: "#a78bfa",
    badge: "bg-violet-500/10 text-violet-300 border-violet-400/40",
  },
}

export const ALERT_SOURCE_META: Record<
  AlertSource,
  { label: string; badge: string }
> = {
  senapred: {
    label: "SERNAPRED",
    badge: "bg-white/[0.06] text-white/70 border-white/15",
  },
  chilerisk: {
    label: "ChileRisk",
    badge: "bg-[#0032A0]/25 text-blue-200/90 border-[#0032A0]/40",
  },
  sernageomin: {
    label: "SERNAGEOMIN",
    badge: "bg-amber-500/15 text-amber-200/90 border-amber-400/35",
  },
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

export const HAZARD_LABELS: Record<string, string> = {
  sismo: "Sismo",
  ola_calor: "Ola de calor",
  ola_frio: "Ola de frío",
  viento: "Viento",
}

export type ChileRiskSeverity = "critico" | "alto" | "moderado"

export const CHILERISK_SEVERITY_META: Record<
  ChileRiskSeverity,
  { label: string; hex: string; badge: string }
> = {
  critico: {
    label: "Crítico",
    hex: "#DA291C",
    badge: "bg-[#DA291C]/15 text-[#ff9a9a] border-[#DA291C]/45",
  },
  alto: {
    label: "Alto",
    hex: "#e07020",
    badge: "bg-orange-500/10 text-orange-300 border-orange-400/40",
  },
  moderado: {
    label: "Moderado",
    hex: "#cc9e23",
    badge: "bg-amber-500/10 text-amber-300 border-amber-400/40",
  },
}

const LEVEL_TO_SEVERITY: Record<AlertLevel, ChileRiskSeverity> = {
  roja: "critico",
  naranja: "alto",
  amarilla: "moderado",
  preventiva: "moderado",
  informativa: "moderado",
}

export function senapredSourceLabel(alert: ActiveAlert): string {
  if (alert.source !== "senapred") return ALERT_SOURCE_META.chilerisk.label
  return alert.record_kind === "evento"
    ? "SERNAPRED · Evento"
    : "SERNAPRED · Alerta"
}

export function formatHazardLabel(
  hazard: string | null | undefined,
  category?: string | null
): string {
  const key = hazard ?? category
  if (!key) return "Riesgo"
  return HAZARD_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function resolveChileRiskSeverity(alert: ActiveAlert): ChileRiskSeverity {
  const s = alert.severity
  if (s === "critico" || s === "alto" || s === "moderado") return s
  return LEVEL_TO_SEVERITY[alert.level] ?? "moderado"
}

/** Título sin prefijo legacy «Riesgo {grado} —». */
export function getChileRiskAlertTitle(alert: ActiveAlert): string {
  const stripped = alert.title.replace(/^Riesgo\s+[\wáéíóúñ]+\s*[—–-]\s*/i, "").trim()
  return stripped || shortenRegionName(alert.region_name) || "Región"
}

export function getChileRiskRiskDetail(alert: ActiveAlert): string | null {
  if (alert.risk_detail) return alert.risk_detail

  const hazard = alert.dominant_hazard ?? alert.category
  const score = alert.composite_score
  if (hazard === "sismo") {
    return null
  }
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
  const hazard = formatHazardLabel(alert.dominant_hazard, alert.category).toLowerCase()
  return `Alerta por ${hazard}`
}

/** Texto principal unificado para tarjetas ChileRisk (una sola línea de contenido). */
export function formatChileRiskAlertMainText(alert: ActiveAlert): string {
  const title = alert.title?.trim() ?? ""
  if (title.startsWith("Alerta por")) return title

  const headline = formatChileRiskAlertHeadline(alert)
  const detail = getChileRiskRiskDetail(alert)
  return detail ? `${headline}: ${detail}` : headline
}

/** Texto principal de la tarjeta (SERNAPRED y ChileRisk). */
export function getActiveAlertMainText(alert: ActiveAlert): string {
  if (alert.source === "chilerisk") return formatChileRiskAlertMainText(alert)
  return alert.title?.trim() || "Alerta"
}

/** @deprecated Use formatChileRiskAlertMainText */
export function formatChileRiskAlertSummary(alert: ActiveAlert): string {
  return formatChileRiskAlertMainText(alert)
}

export function formatAlertCategory(cat: string | null): string {
  if (!cat) return "—"
  return formatHazardLabel(null, cat)
}

export function shortenRegionName(name: string | null): string | null {
  if (!name) return null
  return name.replace(/^Regi[oó]n de( la| las| el| los)?\s+/i, "")
}

export function sortActiveAlerts(alerts: ActiveAlert[]): ActiveAlert[] {
  return [...alerts].sort(
    (a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
  )
}

/**
 * Sort by severity (gravedad): roja > naranja > amarilla > preventiva > informativa.
 * Ties broken by `issued_at` DESC (most recent first).
 */
export function sortActiveAlertsBySeverity(alerts: ActiveAlert[]): ActiveAlert[] {
  return [...alerts].sort((a, b) => {
    const pa = ALERT_LEVEL_PRIORITY[a.level] ?? 9
    const pb = ALERT_LEVEL_PRIORITY[b.level] ?? 9
    if (pa !== pb) return pa - pb
    return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
  })
}

export const POPUP_MAX_ALERTS = 3
export const POPUP_MAX_SEISMIC = 3

export function filterAlertsForRegion(
  alerts: ActiveAlert[],
  codregion: number
): ActiveAlert[] {
  return alerts.filter(
    (a) => a.region_code == null || a.region_code === codregion
  )
}

export function alertAppliesToComuna(
  alert: ActiveAlert,
  codregion: number,
  codComuna: number
): boolean {
  if (alert.region_code != null && alert.region_code !== codregion) return false
  if (alert.source === "chilerisk") {
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
  codComuna: number
): ActiveAlert[] {
  return alerts.filter((a) => alertAppliesToComuna(a, codregion, codComuna))
}

const ALERT_LEVEL_PRIORITY: Record<AlertLevel, number> = {
  roja: 0,
  naranja: 1,
  amarilla: 2,
  preventiva: 3,
  informativa: 4,
}

/** Returns the highest-priority alert level per region code. */
export function computeRegionAlertLevels(
  alerts: ActiveAlert[]
): Map<number, AlertLevel> {
  const result = new Map<number, AlertLevel>()
  for (const a of alerts) {
    if (a.region_code == null) continue
    const prev = result.get(a.region_code)
    if (!prev || ALERT_LEVEL_PRIORITY[a.level] < ALERT_LEVEL_PRIORITY[prev]) {
      result.set(a.region_code, a.level)
    }
  }
  return result
}

/**
 * Returns the highest-priority alert level per comuna code.
 *
 * Hybrid resolution (max priority between region-scope and comuna-scope):
 *   - If an alert has `affected_scope === "region"` it applies to ALL comunas
 *     of that region (uses the `comunasByRegion` index built from the GeoJSON).
 *   - If an alert has `affected_scope === "comuna"` it applies only to the
 *     comunas in `comuna_codes`.
 *   - If multiple alerts apply, the one with the highest priority (roja >
 *     naranja > amarilla > preventiva > informativa) wins.
 *   - Alerts with `affected_scope === "unknown"` are ignored (no geo info).
 */
export function computeComunaAlertLevels(
  alerts: ActiveAlert[],
  comunasByRegion: Map<number, readonly number[]>
): Map<number, AlertLevel> {
  const result = new Map<number, AlertLevel>()
  const upgrade = (codComuna: number, level: AlertLevel) => {
    const prev = result.get(codComuna)
    if (!prev || ALERT_LEVEL_PRIORITY[level] < ALERT_LEVEL_PRIORITY[prev]) {
      result.set(codComuna, level)
    }
  }

  for (const a of alerts) {
    if (a.region_code == null) continue
    const scope = a.affected_scope ?? "unknown"
    if (scope === "comuna") {
      for (const cod of a.comuna_codes ?? []) {
        upgrade(cod, a.level)
      }
    } else if (scope === "region") {
      const comunasInRegion = comunasByRegion.get(a.region_code) ?? []
      for (const cod of comunasInRegion) {
        upgrade(cod, a.level)
      }
    }
    // scope === "unknown": no geo info, skip
  }
  return result
}

/** Builds a `region_code → cod_comuna[]` index from a comunas GeoJSON. */
export function buildComunasByRegionIndex(
  geojson: { features: Array<{ properties?: Record<string, unknown> }> } | null
): Map<number, number[]> {
  const index = new Map<number, number[]>()
  if (!geojson?.features) return index
  for (const f of geojson.features) {
    const cod = f.properties?.cod_comuna as number | undefined
    const codregion = f.properties?.codregion as number | undefined
    if (cod == null || codregion == null) continue
    const list = index.get(codregion) ?? []
    list.push(cod)
    index.set(codregion, list)
  }
  return index
}

/** @deprecated Use sortActiveAlerts */
export const sortSenapredAlerts = sortActiveAlerts