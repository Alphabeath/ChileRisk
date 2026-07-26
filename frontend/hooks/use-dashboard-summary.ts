import { useQuery } from "@tanstack/react-query"
import { getDashboardSummary } from "@/lib/api"
import { queryKeys } from "@/lib/queries"

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary(),
    queryFn: getDashboardSummary,
    staleTime: 5 * 60_000,
    retry: 1,
  })
}
