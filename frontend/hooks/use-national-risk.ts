import { useQuery } from "@tanstack/react-query"
import { getNationalRisk } from "@/lib/api"
import { queryKeys } from "@/lib/queries"
import { todayIsoDate } from "@/lib/query-date"

export function useNationalRisk(date?: string) {
  const resolved = date ?? todayIsoDate()
  return useQuery({
    queryKey: queryKeys.nationalRisk(resolved),
    queryFn: () => getNationalRisk(resolved),
    staleTime: 5 * 60 * 1000,
  })
}
