/** Aire Chile GEC level labels, colors, and map helpers. */

import type { AirQualityLevel, AirQualityZone } from "@/lib/types"

export const AIR_QUALITY_LEVEL_META: Record<
  AirQualityLevel,
  { label: string; hex: string; short: string; badge: string }
> = {
  bueno: {
    label: "Bueno",
    hex: "#2eae00",
    short: "Bueno",
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-400/40",
  },
  regular: {
    label: "Regular",
    hex: "#f5d400",
    short: "Regular",
    badge: "bg-amber-500/10 text-amber-300 border-amber-400/40",
  },
  alerta: {
    label: "Alerta",
    hex: "#ff9800",
    short: "Alerta",
    badge: "bg-orange-500/10 text-orange-300 border-orange-400/40",
  },
  preemergencia: {
    label: "Preemergencia",
    hex: "#e65100",
    short: "Preemerg.",
    badge: "bg-orange-600/15 text-orange-200 border-orange-500/45",
  },
  emergencia: {
    label: "Emergencia",
    hex: "#c62828",
    short: "Emerg.",
    badge: "bg-[#DA291C]/15 text-[#ff9a9a] border-[#DA291C]/45",
  },
}

/** Higher = worse (for max-severity aggregation). */
export const AIR_QUALITY_LEVEL_RANK: Record<AirQualityLevel, number> = {
  bueno: 0,
  regular: 1,
  alerta: 2,
  preemergencia: 3,
  emergencia: 4,
}

export const AIR_QUALITY_LEVELS: AirQualityLevel[] = [
  "bueno",
  "regular",
  "alerta",
  "preemergencia",
  "emergencia",
]

/** Neutral fill when comuna/region has no GEC coverage. */
export const AIR_QUALITY_UNCOVERED_HEX = "#3a3f4a"

export function isAirQualityLevel(value: string): value is AirQualityLevel {
  return value in AIR_QUALITY_LEVEL_META
}

/** Highest severity per CUT comuna from zone snapshots. */
export function computeComunaAirLevels(
  zones: AirQualityZone[],
): Map<number, AirQualityLevel> {
  const result = new Map<number, AirQualityLevel>()
  for (const z of zones) {
    for (const cod of z.comuna_codes) {
      const prev = result.get(cod)
      if (
        !prev ||
        AIR_QUALITY_LEVEL_RANK[z.level] > AIR_QUALITY_LEVEL_RANK[prev]
      ) {
        result.set(cod, z.level)
      }
    }
  }
  return result
}

/** Highest severity per region among covered comunas. */
export function computeRegionAirLevels(
  zones: AirQualityZone[],
): Map<number, AirQualityLevel> {
  const result = new Map<number, AirQualityLevel>()
  for (const z of zones) {
    if (z.region_code == null) continue
    const prev = result.get(z.region_code)
    if (
      !prev ||
      AIR_QUALITY_LEVEL_RANK[z.level] > AIR_QUALITY_LEVEL_RANK[prev]
    ) {
      result.set(z.region_code, z.level)
    }
  }
  return result
}

export function sortZonesBySeverity(zones: AirQualityZone[]): AirQualityZone[] {
  return [...zones].sort((a, b) => {
    const d = AIR_QUALITY_LEVEL_RANK[b.level] - AIR_QUALITY_LEVEL_RANK[a.level]
    if (d !== 0) return d
    return a.zone_name.localeCompare(b.zone_name, "es")
  })
}

/** Zonas GEC que cubren la región (por `region_code`). */
export function filterZonesForRegion(
  zones: AirQualityZone[],
  regionCode: number,
): AirQualityZone[] {
  return zones.filter((z) => z.region_code === regionCode)
}

/** Zonas GEC que incluyen la comuna en `comuna_codes`. */
export function filterZonesForComuna(
  zones: AirQualityZone[],
  comunaCode: number,
): AirQualityZone[] {
  return zones.filter((z) => z.comuna_codes.includes(comunaCode))
}
