import { useQuery } from "@tanstack/react-query"

import { useQueryDate } from "@/hooks/use-query-date"
import {
  getAirQuality,
  getAirQualityByComuna,
  getAirQualityZone,
} from "@/lib/api"
import { STALE, staleTimeForLive } from "@/lib/query-cache"
import { queryKeys } from "@/lib/queries"

export function useAirQuality(opts?: {
  date?: string
  region?: number
  episodeOnly?: boolean
}) {
  const { selectedDate } = useQueryDate()
  const date = opts?.date ?? selectedDate
  const region = opts?.region
  const episodeOnly = opts?.episodeOnly ?? false

  return useQuery({
    queryKey: queryKeys.airQuality(date, { region, episodeOnly }),
    queryFn: () => getAirQuality({ date, region, episode_only: episodeOnly }),
    staleTime: staleTimeForLive(date, STALE.air),
  })
}

export function useAirQualityByComuna(codComuna: number, date?: string) {
  const { selectedDate } = useQueryDate()
  const d = date ?? selectedDate

  return useQuery({
    queryKey: queryKeys.airQualityByComuna(codComuna, d),
    queryFn: () => getAirQualityByComuna(codComuna, d),
    enabled: codComuna > 0,
    staleTime: staleTimeForLive(d, STALE.air),
  })
}

export function useAirQualityZone(slug: string | null, date?: string) {
  const { selectedDate } = useQueryDate()
  const d = date ?? selectedDate

  return useQuery({
    queryKey: queryKeys.airQualityZone(slug ?? "", d),
    queryFn: () => getAirQualityZone(slug!, d),
    enabled: Boolean(slug),
    staleTime: staleTimeForLive(d, STALE.air),
  })
}
