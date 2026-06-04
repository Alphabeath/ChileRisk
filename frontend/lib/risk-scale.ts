import type { ExpressionSpecification } from "maplibre-gl"

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