import { useQuery } from "@tanstack/react-query"

import { getNextSimulacro, getSimulacro, getSimulacros } from "@/lib/api"
import { STALE } from "@/lib/query-cache"
import { queryKeys } from "@/lib/queries"
import type { SimulacrosParams } from "@/lib/types"

export function useSimulacros(params: SimulacrosParams = {}) {
  return useQuery({
    queryKey: queryKeys.simulacros({ ...params }),
    queryFn: () => getSimulacros(params),
    staleTime: STALE.simulacros,
  })
}

export function useNextSimulacro() {
  return useQuery({
    queryKey: queryKeys.simulacroNext(),
    queryFn: () => getNextSimulacro(),
    staleTime: STALE.simulacroNext,
  })
}

export function useSimulacro(slug: string | null) {
  return useQuery({
    queryKey: queryKeys.simulacro(slug ?? ""),
    queryFn: () => getSimulacro(slug!),
    staleTime: STALE.simulacros,
    enabled: Boolean(slug),
  })
}
