import { useQuery } from "@tanstack/react-query"
import { getRecentEvents } from "@/lib/api"
import { queryKeys } from "@/lib/queries"
import { useQueryDate } from "./use-query-date"

export function useRecentEvents(date?: string) {
  const { selectedDate } = useQueryDate()
  const resolved = date ?? selectedDate

  return useQuery({
    queryKey: queryKeys.recentEvents(resolved),
    queryFn: () => getRecentEvents(resolved),
    staleTime: 0,
  })
}