import { useQuery } from "@tanstack/react-query"

import { useQueryDate } from "@/hooks/use-query-date"
import { getActiveAlerts } from "@/lib/api"
import { STALE, staleTimeForLive } from "@/lib/query-cache"
import { queryKeys } from "@/lib/queries"
import type { ActiveAlertParams } from "@/lib/types"

export function useActiveAlerts(params: ActiveAlertParams = {}) {
  const { selectedDate } = useQueryDate()
  const date = params.date ?? selectedDate
  const merged = { ...params, date }

  return useQuery({
    queryKey: [...queryKeys.activeAlerts(date), merged] as const,
    queryFn: () => getActiveAlerts(merged),
    staleTime: staleTimeForLive(date, STALE.alerts),
  })
}
