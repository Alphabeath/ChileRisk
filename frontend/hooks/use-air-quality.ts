import { useQuery } from "@tanstack/react-query"
import { getAirQuality, getAirQualityZone } from "@/lib/api"
import { queryKeys } from "@/lib/queries"
import { useQueryDate } from "./use-query-date"

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
    queryFn: () =>
      getAirQuality({ date, region, episode_only: episodeOnly }),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAirQualityZone(slug: string | null, date?: string) {
  const { selectedDate } = useQueryDate()
  const d = date ?? selectedDate

  return useQuery({
    queryKey: queryKeys.airQualityZone(slug ?? "", d),
    queryFn: () => getAirQualityZone(slug!, d),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  })
}
