import { useQuery } from "@tanstack/react-query"
import { getComunaRisk } from "@/lib/api"
import { queryKeys } from "@/lib/queries"

export function useComunaRisk(codcomuna: number) {
  return useQuery({
    queryKey: queryKeys.comunaRisk(codcomuna),
    queryFn: () => getComunaRisk(codcomuna),
    enabled: codcomuna > 0,
    staleTime: 5 * 60 * 1000,
  })
}
