import { useQuery } from "@tanstack/react-query"
import { getRegionRisk } from "@/lib/api"
import { queryKeys } from "@/lib/queries"

export function useRegionRisk(codregion: number) {
  return useQuery({
    queryKey: queryKeys.regionRisk(codregion),
    queryFn: () => getRegionRisk(codregion),
    enabled: codregion > 0,
    staleTime: 5 * 60 * 1000,
  })
}
