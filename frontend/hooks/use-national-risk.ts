import { useQuery } from "@tanstack/react-query"
import { getNationalRisk } from "@/lib/api"
import { queryKeys } from "@/lib/queries"

export function useNationalRisk() {
  return useQuery({
    queryKey: queryKeys.nationalRisk,
    queryFn: getNationalRisk,
    staleTime: 5 * 60 * 1000,
  })
}
