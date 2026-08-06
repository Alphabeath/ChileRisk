import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useRef } from "react"

import { getComunaRisk, getNationalRisk } from "@/lib/api"
import {
  prepareComunasGeojson,
  type ComunaFeatureCollection,
} from "@/lib/comunas-geojson"
import { STALE, staleTimeForLive } from "@/lib/query-cache"
import { queryKeys } from "@/lib/queries"
import { todayIsoDate } from "@/lib/query-date"
import type { NationalRisk } from "@/lib/types"

export interface EnrichedGeojson {
  type: string
  features: Array<{
    type: string
    properties: Record<string, unknown>
    geometry: unknown
  }>
}

/**
 * Stamp regional risk metrics onto region features for territory popups
 * (weather / hazard bars). Map choropleth uses `alert_level`, not scores.
 */
function applyNationalRiskToRegions(
  geojson: EnrichedGeojson,
  riskMap: Map<number, NationalRisk>,
) {
  if (!geojson.features) return
  for (const f of geojson.features) {
    const codregion = f.properties?.codregion as number | undefined
    const r = codregion != null ? riskMap.get(codregion) : undefined
    if (r) {
      f.properties.composite_score = r.composite_score
      f.properties.severity = r.severity
      f.properties.dominant_hazard = r.dominant_hazard
      f.properties.sismo_score = r.sismo_score
      f.properties.ola_calor_score = r.ola_calor_score
      f.properties.ola_frio_score = r.ola_frio_score
      f.properties.viento_score = r.viento_score
      f.properties.inundacion_score = r.inundacion_score
      if (r.avg_temperature_c != null)
        f.properties.avg_temperature_c = r.avg_temperature_c
      if (r.avg_wind_speed_kmh != null)
        f.properties.avg_wind_speed_kmh = r.avg_wind_speed_kmh
    }
  }
}

let cachedRegionsUrl: string | null = null
let cachedRegionsBase: EnrichedGeojson | null = null
let cachedComunasUrl: string | null = null
let cachedComunasPrepared: ComunaFeatureCollection | null = null

/**
 * Geometry loading for the monitor map. FeatureCollections live in refs /
 * module caches — NOT React state — so choropleth refreshes never re-render
 * the map tree or re-tile sources (feature-state carries level changes).
 */
export function useMapData() {
  const queryClient = useQueryClient()
  const regionsBaseRef = useRef<EnrichedGeojson | null>(null)

  const fetchNationalRiskMap = useCallback(
    async (date: string) => {
      const resolved = date || todayIsoDate()
      const national = await queryClient.fetchQuery({
        queryKey: queryKeys.nationalRisk(resolved),
        queryFn: () => getNationalRisk(resolved),
        staleTime: staleTimeForLive(resolved, STALE.risk),
      })
      return new Map(national.map((r) => [r.codregion, r]))
    },
    [queryClient],
  )

  /**
   * Fetch (cached) region geometry and stamp national-risk props for popups.
   * Caller `setData`s the returned FC once per date — never on alert ticks.
   */
  const loadRegions = useCallback(
    async (regionsUrl: string, date: string) => {
      let base = cachedRegionsUrl === regionsUrl ? cachedRegionsBase : null
      if (!base) {
        const res = await fetch(regionsUrl)
        base = (await res.json()) as EnrichedGeojson
        cachedRegionsUrl = regionsUrl
        cachedRegionsBase = base
      }
      const geojson = structuredClone(base) as EnrichedGeojson
      const nationalMap = await fetchNationalRiskMap(date)
      applyNationalRiskToRegions(geojson, nationalMap)
      regionsBaseRef.current = base
      return geojson
    },
    [fetchNationalRiskMap],
  )

  /** Fetch (cached) comuna geometry, prepared for `promoteId: cod_comuna`. */
  const loadComunas = useCallback(async (comunasUrl: string, date: string) => {
    void date
    let prepared =
      cachedComunasUrl === comunasUrl ? cachedComunasPrepared : null
    if (!prepared) {
      const res = await fetch(comunasUrl)
      const raw = (await res.json()) as Parameters<
        typeof prepareComunasGeojson
      >[0]
      prepared = prepareComunasGeojson(raw)
      cachedComunasUrl = comunasUrl
      cachedComunasPrepared = prepared
    }
    // Keep prepared FC as the base — feature-state stamps levels, never props.
    return prepared as unknown as EnrichedGeojson
  }, [])

  /**
   * Re-stamp national risk props for a new date. Returns the regions FC for
   * the caller to `setData` (16 features — cheap); null when regions never
   * loaded. Comunas geometry is never re-set on date change.
   */
  const refreshMapRisk = useCallback(
    async (date: string): Promise<EnrichedGeojson | null> => {
      const regionsBase = regionsBaseRef.current
      if (!regionsBase) return null

      const nationalMap = await fetchNationalRiskMap(date)
      const nextRegions = structuredClone(regionsBase) as EnrichedGeojson
      applyNationalRiskToRegions(nextRegions, nationalMap)
      return nextRegions
    },
    [fetchNationalRiskMap],
  )

  const fetchComunaRisk = useCallback(
    async (codcomuna: number, date: string) => {
      return queryClient.fetchQuery({
        queryKey: queryKeys.comunaRisk(codcomuna, date),
        queryFn: () => getComunaRisk(codcomuna, date),
        staleTime: staleTimeForLive(date, STALE.risk),
      })
    },
    [queryClient],
  )

  return {
    loadRegions,
    loadComunas,
    refreshMapRisk,
    fetchComunaRisk,
  }
}
