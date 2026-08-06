import { useQuery } from "@tanstack/react-query"

import { useQueryDate } from "@/hooks/use-query-date"
import { getComunaRisk } from "@/lib/api"
import { STALE, staleTimeForLive } from "@/lib/query-cache"
import { queryKeys } from "@/lib/queries"

export function useComunaRisk(codcomuna: number) {
  const { selectedDate } = useQueryDate()
  return useQuery({
    queryKey: queryKeys.comunaRisk(codcomuna, selectedDate),
    queryFn: () => getComunaRisk(codcomuna, selectedDate),
    enabled: codcomuna > 0,
    staleTime: staleTimeForLive(selectedDate, STALE.risk),
  })
}
