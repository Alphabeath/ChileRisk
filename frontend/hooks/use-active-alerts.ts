import { useQuery } from "@tanstack/react-query"
import { getActiveAlerts } from "@/lib/api"
import { queryKeys } from "@/lib/queries"
import type { ActiveAlertParams } from "@/lib/types"

export function useActiveAlerts(params: ActiveAlertParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.activeAlerts, params] as const,
    queryFn: () => getActiveAlerts(params),
    staleTime: 2 * 60 * 1000,
  })
}
