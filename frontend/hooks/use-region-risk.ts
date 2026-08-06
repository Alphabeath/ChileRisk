import { useQuery } from "@tanstack/react-query"

import { getRegionRisk } from "@/lib/api"
import { STALE } from "@/lib/query-cache"
import { queryKeys } from "@/lib/queries"

/** Region risk is live-only (no `?date=` on the endpoint). */
export function useRegionRisk(codregion: number) {
  return useQuery({
    queryKey: queryKeys.regionRisk(codregion),
    queryFn: () => getRegionRisk(codregion),
    enabled: codregion > 0,
    staleTime: STALE.risk,
  })
}
