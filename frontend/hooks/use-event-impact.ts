import { useQuery } from "@tanstack/react-query"
import { getEventImpact } from "@/lib/api"
import { queryKeys } from "@/lib/queries"

export function useEventImpact(eventId: number) {
  return useQuery({
    queryKey: queryKeys.eventImpact(eventId),
    queryFn: () => getEventImpact(eventId),
    enabled: eventId > 0,
    staleTime: 10 * 60 * 1000,
  })
}
