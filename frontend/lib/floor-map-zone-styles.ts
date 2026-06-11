import type { FloorMapZone } from "@/lib/types"

export type ZoneVisualType = FloorMapZone["type"]

export const ZONE_VISUALS: Record<
  ZoneVisualType,
  {
    label: string
    stroke: string
    fill: string
    text: string
    border: string
    swatch: string
  }
> = {
  safe: {
    label: "Seguro",
    stroke: "#10b981",
    fill: "rgba(16,185,129,0.14)",
    text: "text-emerald-200",
    border: "border-emerald-500/70",
    swatch: "bg-emerald-500/25",
  },
  risk: {
    label: "Riesgo",
    stroke: "#ef4444",
    fill: "rgba(239,68,68,0.14)",
    text: "text-red-200",
    border: "border-red-500/70",
    swatch: "bg-red-500/25",
  },
}

export function zonePatternId(type: ZoneVisualType, suffix = ""): string {
  return `zone-hatch-${type}${suffix}`
}