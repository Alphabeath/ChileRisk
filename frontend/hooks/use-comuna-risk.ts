import { useQuery } from "@tanstack/react-query"
import { getComunaRisk } from "@/lib/api"
import { queryKeys } from "@/lib/queries"
import { useQueryDate } from "@/hooks/use-query-date"

export function useComunaRisk(codcomuna: number) {
  const { selectedDate } = useQueryDate()
  return useQuery({
    queryKey: queryKeys.comunaRisk(codcomuna, selectedDate),
    queryFn: () => getComunaRisk(codcomuna, selectedDate),
    enabled: codcomuna > 0,
  })
}