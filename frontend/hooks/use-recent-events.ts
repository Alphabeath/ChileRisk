import { useQuery } from "@tanstack/react-query"
import { getRecentEvents } from "@/lib/api"
import { queryKeys } from "@/lib/queries"

export function useRecentEvents(hours = 48) {
  return useQuery({
    queryKey: queryKeys.recentEvents(hours),
    queryFn: () => getRecentEvents(hours),
    staleTime: 2 * 60 * 1000,
  })
}
