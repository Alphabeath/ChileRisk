"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchComunaCatalog } from "@/lib/comuna-catalog"
import { queryKeys } from "@/lib/queries"

/** Immutable-ish catalog of Chile's 346 comunas from local GeoJSON. */
export function useComunaCatalog() {
  return useQuery({
    queryKey: queryKeys.comunaCatalog(),
    queryFn: fetchComunaCatalog,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
