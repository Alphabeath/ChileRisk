import { useQuery } from "@tanstack/react-query"
import { getActiveAlerts } from "@/lib/api"
import { queryKeys } from "@/lib/queries"
import { useQueryDate } from "./use-query-date"
import type { ActiveAlertParams } from "@/lib/types"

export function useActiveAlerts(params: ActiveAlertParams = {}) {
  const { selectedDate } = useQueryDate()
  const date = params.date ?? selectedDate
  const merged = { ...params, date }

  return useQuery({
    queryKey: [...queryKeys.activeAlerts(date), merged] as const,
    queryFn: () => getActiveAlerts(merged),
    staleTime: 2 * 60 * 1000,
  })
}