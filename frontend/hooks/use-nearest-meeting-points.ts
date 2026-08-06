import { useQuery } from "@tanstack/react-query"

import { getNearestMeetingPoints } from "@/lib/api"
import { STALE } from "@/lib/query-cache"
import { queryKeys } from "@/lib/queries"

export function useNearestMeetingPoints(params: {
  lat: number | null
  lon: number | null
  hazard?: "tsunami" | "volcanic"
  limit?: number
  enabled?: boolean
}) {
  const { lat, lon, hazard, limit = 5, enabled = true } = params
  const ready = lat != null && lon != null && enabled

  return useQuery({
    queryKey: queryKeys.nearestMeetingPoints({
      lat: lat ?? 0,
      lon: lon ?? 0,
      hazard,
      limit,
    }),
    queryFn: () =>
      getNearestMeetingPoints({
        lat: lat!,
        lon: lon!,
        hazard,
        limit,
      }),
    enabled: ready,
    staleTime: STALE.risk,
  })
}
