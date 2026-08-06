import { useQuery } from "@tanstack/react-query"

import { getNationalRisk } from "@/lib/api"
import { STALE, staleTimeForLive } from "@/lib/query-cache"
import { queryKeys } from "@/lib/queries"
import { todayIsoDate } from "@/lib/query-date"

export function useNationalRisk(date?: string) {
  const resolved = date ?? todayIsoDate()
  return useQuery({
    queryKey: queryKeys.nationalRisk(resolved),
    queryFn: () => getNationalRisk(resolved),
    staleTime: staleTimeForLive(resolved, STALE.risk),
  })
}
