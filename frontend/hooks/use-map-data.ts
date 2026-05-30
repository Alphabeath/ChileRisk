import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { getNationalRisk, getRegionRisk, getComunaRisk } from "@/lib/api"
import { queryKeys } from "@/lib/queries"
import type { NationalRisk, RegionRisk } from "@/lib/types"

type ComunaRiskItem = RegionRisk["comunas"][number]

interface EnrichedGeojson {
  type: string
  features: Array<{
    type: string
    properties: Record<string, unknown>
    geometry: unknown
  }>
}

export function useMapData() {
  const queryClient = useQueryClient()
  const [regionsGeojson, setRegionsGeojson] = useState<EnrichedGeojson | null>(null)
  const [comunasGeojson, setComunasGeojson] = useState<EnrichedGeojson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const loadedRef = useRef(false)

  const enrichWithRisk = useCallback(
    async (
      geojson: EnrichedGeojson,
      riskMap: Map<number, NationalRisk>
    ) => {
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
    },
    []
  )

  const enrichComunasWithRegionRisk = useCallback(
    async (geojson: EnrichedGeojson) => {
      if (!geojson.features) return

      const regionCodes = Array.from(
        new Set(
          geojson.features
            .map((f) => f.properties?.codregion as number | undefined)
            .filter(Boolean)
        )
      ) as number[]

      const results = await Promise.all(
        regionCodes.map((cod) =>
          queryClient.fetchQuery({
            queryKey: queryKeys.regionRisk(cod),
            queryFn: () => getRegionRisk(cod),
            staleTime: 5 * 60 * 1000,
          }).catch(() => null)
        )
      )

      const riskByComuna = new Map<number, ComunaRiskItem>()
      results.forEach((region) => {
        if (region?.comunas) {
          region.comunas.forEach((c) => riskByComuna.set(c.cod_comuna, c))
        }
      })

      for (const f of geojson.features) {
        const cod = f.properties?.cod_comuna as number | undefined
        const r = cod != null ? riskByComuna.get(cod) : undefined
        if (r) {
          f.properties.composite_score = r.composite_score
          f.properties.severity = r.severity
          f.properties.dominant_hazard = r.dominant_hazard
          f.properties.sismo_score = r.sismo_score
          f.properties.ola_calor_score = r.ola_calor_score
          f.properties.ola_frio_score = r.ola_frio_score
          f.properties.viento_score = r.viento_score
          if (r.temperature_c != null) f.properties.temperature_c = r.temperature_c
          if (r.wind_speed_kmh != null) f.properties.wind_speed_kmh = r.wind_speed_kmh
        }
      }
    },
    [queryClient]
  )

  const loadRegions = useCallback(
    async (regionsUrl: string) => {
      const riskData = await queryClient.fetchQuery({
        queryKey: queryKeys.nationalRisk,
        queryFn: getNationalRisk,
        staleTime: 5 * 60 * 1000,
      })

      const riskMap = new Map(riskData.map((r) => [r.codregion, r]))
      const res = await fetch(regionsUrl)
      const geojson = (await res.json()) as EnrichedGeojson

      await enrichWithRisk(geojson, riskMap)
      setRegionsGeojson(geojson)
      return geojson
    },
    [queryClient, enrichWithRisk]
  )

  const loadComunas = useCallback(
    async (comunasUrl: string) => {
      const res = await fetch(comunasUrl)
      const geojson = (await res.json()) as EnrichedGeojson

      await enrichComunasWithRegionRisk(geojson)
      setComunasGeojson(geojson)
      return geojson
    },
    [enrichComunasWithRegionRisk]
  )

  const prefetchAllRegionRisks = useCallback(
    async (regionCodes: number[]) => {
      await Promise.all(
        regionCodes.map((cod) =>
          queryClient.prefetchQuery({
            queryKey: queryKeys.regionRisk(cod),
            queryFn: () => getRegionRisk(cod),
            staleTime: 5 * 60 * 1000,
          })
        )
      )
    },
    [queryClient]
  )

  const fetchComunaRisk = useCallback(
    async (codcomuna: number) => {
      return queryClient.fetchQuery({
        queryKey: queryKeys.comunaRisk(codcomuna),
        queryFn: () => getComunaRisk(codcomuna),
        staleTime: 5 * 60 * 1000,
      })
    },
    [queryClient]
  )

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    setIsLoading(false)
  }, [])

  return {
    regionsGeojson,
    comunasGeojson,
    isLoading,
    loadRegions,
    loadComunas,
    prefetchAllRegionRisks,
    fetchComunaRisk,
  }
}
