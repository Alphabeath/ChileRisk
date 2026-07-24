import type { ExpressionSpecification } from "maplibre-gl"
import { ALERT_LEVEL_META } from "@/lib/alerts-display"
import {
  AIR_QUALITY_LEVEL_META,
  AIR_QUALITY_UNCOVERED_HEX,
} from "@/lib/air-quality-display"

/** Map choropleth colors — must stay in sync with MapLibre `fill-color` step expressions. */

export const MAP_RISK_DEFAULT_SCORE = 35

export type MapRiskSeverity = "bajo" | "moderado" | "alto" | "critico"

export interface MapRiskBucket {
  severity: MapRiskSeverity
  label: string
  minScore: number
  maxScore: number
  color: string
  scoreRangeLabel: string
}

/** Ordered low → high (matches MapLibre step stops). */
export const MAP_RISK_BUCKETS: readonly MapRiskBucket[] = [
  {
    severity: "bajo",
    label: "Bajo",
    minScore: 0,
    maxScore: 34,
    color: "#085e08",
    scoreRangeLabel: "0–34",
  },
  {
    severity: "moderado",
    label: "Moderado",
    minScore: 35,
    maxScore: 54,
    color: "#cc9e23",
    scoreRangeLabel: "35–54",
  },
  {
    severity: "alto",
    label: "Alto",
    minScore: 55,
    maxScore: 74,
    color: "#e07020",
    scoreRangeLabel: "55–74",
  },
  {
    severity: "critico",
    label: "Crítico",
    minScore: 75,
    maxScore: 100,
    color: "#c23d3c",
    scoreRangeLabel: "75–100",
  },
] as const

/** MapLibre `step` expression for region/comuna fill from `composite_score`. */
export function mapRiskFillColorExpression(): ExpressionSpecification {
  const [bajo, moderado, alto, critico] = MAP_RISK_BUCKETS
  return [
    "step",
    ["coalesce", ["get", "composite_score"], MAP_RISK_DEFAULT_SCORE],
    bajo.color,
    moderado.minScore,
    moderado.color,
    alto.minScore,
    alto.color,
    critico.minScore,
    critico.color,
  ] as ExpressionSpecification
}

/**
 * MapLibre `match` expression for region/comuna fill from `alert_level`.
 * Used when `mapColorMode === "alerts"`. When a feature has no active alert,
 * the fill defaults to the "bajo" risk bucket color (green) so the map still
 * reads geographically and the user can see "no alert here".
 */
export function mapAlertFillColorExpression(): ExpressionSpecification {
  const bajo = MAP_RISK_BUCKETS[0]
  return [
    "match",
    ["get", "alert_level"],
    "roja", ALERT_LEVEL_META.roja.hex,
    "naranja", ALERT_LEVEL_META.naranja.hex,
    "amarilla", ALERT_LEVEL_META.amarilla.hex,
    "preventiva", ALERT_LEVEL_META.preventiva.hex,
    "informativa", ALERT_LEVEL_META.informativa.hex,
    /* default (sin alerta activa) */ bajo.color,
  ] as ExpressionSpecification
}

/**
 * MapLibre `match` for GEC air-quality level (`air_level` property).
 * Uncovered comunas/regions use a neutral gray.
 */
export function mapAirFillColorExpression(): ExpressionSpecification {
  return [
    "match",
    ["get", "air_level"],
    "bueno", AIR_QUALITY_LEVEL_META.bueno.hex,
    "regular", AIR_QUALITY_LEVEL_META.regular.hex,
    "alerta", AIR_QUALITY_LEVEL_META.alerta.hex,
    "preemergencia", AIR_QUALITY_LEVEL_META.preemergencia.hex,
    "emergencia", AIR_QUALITY_LEVEL_META.emergencia.hex,
    AIR_QUALITY_UNCOVERED_HEX,
  ] as ExpressionSpecification
}
