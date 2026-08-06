import type { ExpressionSpecification } from "maplibre-gl"

import {
  AIR_QUALITY_LEVEL_META,
  AIR_QUALITY_UNCOVERED_HEX,
} from "@/lib/air-quality-display"

/**
 * ChileRisk alert levels (3) — same national scheme as SENAPRED
 * (preventiva / amarilla / roja). Product copy and tokens use “alerta”,
 * not “SENAPRED”. Naranja is SERNAGEOMIN (volcanoes) — not used here.
 */
export type AlertLevel = "preventiva" | "amarilla" | "roja"

/**
 * Canonical hex for UI (panels, badges). Keep in sync with `--alert-*` in `app/globals.css`.
 */
export const ALERT_HEX = {
  preventiva: "#4ade80",
  amarilla: "#fbbf24",
  roja: "#DA291C",
  unavailable: "#3a3f4a",
} as const

/**
 * Denser choropleth fills for MapLibre (light basemap washes pastel UI hexes).
 * Same alert levels; higher chroma / mid-tones. Preventiva = green (SENAPRED).
 */
export const ALERT_MAP_HEX = {
  preventiva: "#16a34a",
  amarilla: "#ca8a04",
  roja: "#DA291C",
  unavailable: "#64748b",
} as const

/** CSS `var(--alert-*)` for inline styles / non-Tailwind surfaces. */
export const ALERT_CSS_VAR = {
  preventiva: "var(--alert-preventiva)",
  amarilla: "var(--alert-amarilla)",
  roja: "var(--alert-roja)",
  unavailable: "var(--alert-unavailable)",
} as const

/** @deprecated Prefer `ALERT_HEX.unavailable` or `var(--alert-unavailable)`. */
export const MAP_RISK_UNAVAILABLE_HEX = ALERT_HEX.unavailable

export interface AlertBucket {
  level: AlertLevel
  /** Short label: Preventiva / Amarilla / Roja */
  label: string
  minScore: number
  maxScore: number
  /** UI / panel hex (`ALERT_HEX`) */
  hex: string
  /** MapLibre choropleth hex (`ALERT_MAP_HEX`) */
  mapHex: string
  /** `var(--alert-*)` — prefer for React/CSS */
  cssVar: string
  scoreRangeLabel: string
}

/**
 * Score → ChileRisk alert buckets (0–100 composite).
 * preventiva 0–34 · amarilla 35–54 · roja 55–100.
 * Colors: `--alert-*` in globals.css (+ Tailwind `bg-alert-*`).
 */
export const ALERT_BUCKETS: readonly AlertBucket[] = [
  {
    level: "preventiva",
    label: "Preventiva",
    minScore: 0,
    maxScore: 34,
    hex: ALERT_HEX.preventiva,
    mapHex: ALERT_MAP_HEX.preventiva,
    cssVar: ALERT_CSS_VAR.preventiva,
    scoreRangeLabel: "0–34",
  },
  {
    level: "amarilla",
    label: "Amarilla",
    minScore: 35,
    maxScore: 54,
    hex: ALERT_HEX.amarilla,
    mapHex: ALERT_MAP_HEX.amarilla,
    cssVar: ALERT_CSS_VAR.amarilla,
    scoreRangeLabel: "35–54",
  },
  {
    level: "roja",
    label: "Roja",
    minScore: 55,
    maxScore: 100,
    hex: ALERT_HEX.roja,
    mapHex: ALERT_MAP_HEX.roja,
    cssVar: ALERT_CSS_VAR.roja,
    scoreRangeLabel: "55–100",
  },
] as const

const BUCKET_BY_LEVEL: Record<AlertLevel, AlertBucket> = {
  preventiva: ALERT_BUCKETS[0],
  amarilla: ALERT_BUCKETS[1],
  roja: ALERT_BUCKETS[2],
}

/**
 * Legacy API severity strings → alert levels (until backend emits them).
 * Prefer score / alert level names when available.
 */
const LEGACY_SEVERITY_TO_ALERT: Record<string, AlertLevel> = {
  bajo: "preventiva",
  moderado: "amarilla",
  alto: "roja",
  critico: "roja",
}

/**
 * Map a 0–100 score to a ChileRisk alert gate level.
 * Used by the backend evaluator (and FE hazard bars) — not map fill color.
 */
export function alertLevelFromScore(score: number): AlertLevel {
  if (score >= 55) return "roja"
  if (score >= 35) return "amarilla"
  return "preventiva"
}

function resolveAlertLevel(
  levelOrSeverity?: string | null,
): AlertLevel | null {
  if (!levelOrSeverity) return null
  if (levelOrSeverity in BUCKET_BY_LEVEL) {
    return levelOrSeverity as AlertLevel
  }
  return LEGACY_SEVERITY_TO_ALERT[levelOrSeverity] ?? null
}

/** Resolve alert level string or score → bucket (falls back to preventiva). */
export function bucketForAlert(
  levelOrSeverity?: string | null,
  score?: number | null,
): AlertBucket {
  const fromLabel = resolveAlertLevel(levelOrSeverity)
  if (fromLabel) return BUCKET_BY_LEVEL[fromLabel]
  if (score != null) return BUCKET_BY_LEVEL[alertLevelFromScore(score)]
  return BUCKET_BY_LEVEL.preventiva
}

/**
 * MapLibre `match` for region/comuna fill from `alert_level`
 * (most severe active alert). No alert → unavailable gray.
 *
 * `composite_score` is backend-only for ChileRisk alert gating — never map fill.
 *
 * Reads `feature-state.alert_level` first (choropleth updates via
 * `setFeatureState`, no re-tiling), falling back to the stamped property
 * (risk-refresh `setData` path) and then `""` → unavailable gray.
 */
export function mapAlertFillColorExpression(): ExpressionSpecification {
  return [
    "match",
    ["coalesce", ["feature-state", "alert_level"], ["get", "alert_level"], ""],
    "roja",
    ALERT_MAP_HEX.roja,
    "naranja",
    "#ea580c",
    "amarilla",
    ALERT_MAP_HEX.amarilla,
    "preventiva",
    ALERT_MAP_HEX.preventiva,
    "informativa",
    "#7c3aed",
    ALERT_MAP_HEX.unavailable,
  ] as ExpressionSpecification
}

/**
 * MapLibre `match` for GEC air-quality level (`air_level` property).
 * Uncovered comunas/regions use a neutral gray.
 *
 * Reads `feature-state.air_level` first (live updates), falling back to the
 * stamped property and then `""` → uncovered gray.
 */
export function mapAirFillColorExpression(): ExpressionSpecification {
  return [
    "match",
    ["coalesce", ["feature-state", "air_level"], ["get", "air_level"], ""],
    "bueno",
    AIR_QUALITY_LEVEL_META.bueno.hex,
    "regular",
    AIR_QUALITY_LEVEL_META.regular.hex,
    "alerta",
    AIR_QUALITY_LEVEL_META.alerta.hex,
    "preemergencia",
    AIR_QUALITY_LEVEL_META.preemergencia.hex,
    "emergencia",
    AIR_QUALITY_LEVEL_META.emergencia.hex,
    AIR_QUALITY_UNCOVERED_HEX,
  ] as ExpressionSpecification
}
