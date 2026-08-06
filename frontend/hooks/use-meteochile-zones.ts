import { useQuery } from "@tanstack/react-query"

import { useQueryDate } from "@/hooks/use-query-date"
import { getMeteoChileZones } from "@/lib/api"
import { STALE, staleTimeForLive } from "@/lib/query-cache"
import { queryKeys } from "@/lib/queries"

export function useMeteoChileZones(opts?: { date?: string; enabled?: boolean }) {
  const { selectedDate } = useQueryDate()
  const date = opts?.date ?? selectedDate
  const enabled = opts?.enabled ?? true

  return useQuery({
    queryKey: queryKeys.meteoChileZones(date),
    queryFn: () => getMeteoChileZones(date),
    enabled,
    staleTime: staleTimeForLive(date, STALE.alerts),
  })
}
