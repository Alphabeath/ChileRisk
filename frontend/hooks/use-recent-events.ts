import { useQuery } from "@tanstack/react-query"

import { useQueryDate } from "@/hooks/use-query-date"
import { getRecentEvents } from "@/lib/api"
import { STALE, staleTimeForLive } from "@/lib/query-cache"
import { queryKeys } from "@/lib/queries"

export function useRecentEvents(date?: string) {
  const { selectedDate } = useQueryDate()
  const resolved = date ?? selectedDate

  return useQuery({
    queryKey: queryKeys.recentEvents(resolved),
    queryFn: () => getRecentEvents(resolved),
    staleTime: staleTimeForLive(resolved, STALE.events),
  })
}
