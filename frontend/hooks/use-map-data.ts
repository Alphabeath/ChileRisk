import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { getNationalRisk, getComunaMapScores, getComunaRisk } from "@/lib/api"
import { queryKeys } from "@/lib/queries"
import { todayIsoDate } from "@/lib/query-date"
import { LOADING_SOURCE, useLoadingStore } from "@/stores/loading-store"
import type { NationalRisk, ComunaMapScore } from "@/lib/types"

interface EnrichedGeojson {
  type: string
  features: Array<{
    type: string
    properties: Record<string, unknown>
    geometry: unknown
  }>
}

function applyNationalRiskToRegions(
  geojson: EnrichedGeojson,
  riskMap: Map<number, NationalRisk>
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
      if (r.avg_temperature_c != null) f.properties.avg_temperature_c = r.avg_temperature_c
      if (r.avg_wind_speed_kmh != null) f.properties.avg_wind_speed_kmh = r.avg_wind_speed_kmh
    }
  }
}

function applyComunaScoresToGeojson(
  geojson: EnrichedGeojson,
  scoreMap: Map<number, number>
) {
  if (!geojson.features) return
  for (const f of geojson.features) {
    const cod = f.properties?.cod_comuna as number | undefined
    const cs = cod != null ? scoreMap.get(cod) : undefined
    if (cs != null) {
      f.properties.composite_score = cs
    }
  }
}

export function useMapData() {
  const queryClient = useQueryClient()
  const [regionsGeojson, setRegionsGeojson] = useState<EnrichedGeojson | null>(null)
  const [comunasGeojson, setComunasGeojson] = useState<EnrichedGeojson | null>(null)
  const [regionsBaseGeojson, setRegionsBaseGeojson] = useState<EnrichedGeojson | null>(null)
  const [comunasBaseGeojson, setComunasBaseGeojson] = useState<EnrichedGeojson | null>(null)

  const fetchRiskForDate = useCallback(
    async (date: string) => {
      const resolved = date || todayIsoDate()
      const [national, comunaScores] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: queryKeys.nationalRisk(resolved),
          queryFn: () => getNationalRisk(resolved),
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.fetchQuery({
          queryKey: queryKeys.comunaMapScores(resolved),
          queryFn: () => getComunaMapScores(resolved),
          staleTime: 5 * 60 * 1000,
        }),
      ])
      return {
        nationalMap: new Map(national.map((r) => [r.codregion, r])),
        comunaMap: new Map(
          comunaScores.map((s: ComunaMapScore) => [s.cod_comuna, s.composite_score])
        ),
      }
    },
    [queryClient]
  )

  const withMapLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    const { track, untrack } = useLoadingStore.getState()
    track(LOADING_SOURCE.MAP_DATA)
    try {
      return await fn()
    } finally {
      untrack(LOADING_SOURCE.MAP_DATA)
    }
  }, [])

  const loadRegions = useCallback(
    async (regionsUrl: string, date: string) => {
      return withMapLoading(async () => {
        const res = await fetch(regionsUrl)
        const base = (await res.json()) as EnrichedGeojson
        const geojson = structuredClone(base) as EnrichedGeojson

        const { nationalMap } = await fetchRiskForDate(date)
        applyNationalRiskToRegions(geojson, nationalMap)

        setRegionsBaseGeojson(base)
        setRegionsGeojson(geojson)
        return geojson
      })
    },
    [fetchRiskForDate, withMapLoading]
  )

  const loadComunas = useCallback(
    async (comunasUrl: string, date: string) => {
      return withMapLoading(async () => {
        const res = await fetch(comunasUrl)
        const base = (await res.json()) as EnrichedGeojson
        const geojson = structuredClone(base) as EnrichedGeojson

        const { comunaMap } = await fetchRiskForDate(date)
        applyComunaScoresToGeojson(geojson, comunaMap)

        setComunasBaseGeojson(base)
        setComunasGeojson(geojson)
        return geojson
      })
    },
    [fetchRiskForDate, withMapLoading]
  )

  const refreshMapRisk = useCallback(
    async (date: string) => {
      if (!regionsBaseGeojson && !comunasBaseGeojson) return null

      return withMapLoading(async () => {
        const { nationalMap, comunaMap } = await fetchRiskForDate(date)

        let nextRegions: EnrichedGeojson | null = null
        let nextComunas: EnrichedGeojson | null = null

        if (regionsBaseGeojson) {
          nextRegions = structuredClone(regionsBaseGeojson) as EnrichedGeojson
          applyNationalRiskToRegions(nextRegions, nationalMap)
          setRegionsGeojson(nextRegions)
        }

        if (comunasBaseGeojson) {
          nextComunas = structuredClone(comunasBaseGeojson) as EnrichedGeojson
          applyComunaScoresToGeojson(nextComunas, comunaMap)
          setComunasGeojson(nextComunas)
        }

        return { regions: nextRegions, comunas: nextComunas }
      })
    },
    [regionsBaseGeojson, comunasBaseGeojson, fetchRiskForDate, withMapLoading]
  )

  const fetchComunaRisk = useCallback(
    async (codcomuna: number, date: string) => {
      return queryClient.fetchQuery({
        queryKey: queryKeys.comunaRisk(codcomuna, date),
        queryFn: () => getComunaRisk(codcomuna, date),
        staleTime: 5 * 60 * 1000,
      })
    },
    [queryClient]
  )

  return {
    regionsGeojson,
    comunasGeojson,
    loadRegions,
    loadComunas,
    refreshMapRisk,
    fetchComunaRisk,
  }
}