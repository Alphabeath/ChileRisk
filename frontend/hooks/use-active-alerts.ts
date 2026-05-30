import { useQuery } from "@tanstack/react-query"
import { getActiveAlerts } from "@/lib/api"
import { queryKeys } from "@/lib/queries"

export function useActiveAlerts() {
  return useQuery({
    queryKey: queryKeys.activeAlerts,
    queryFn: getActiveAlerts,
    staleTime: 1 * 60 * 1000,
  })
}
