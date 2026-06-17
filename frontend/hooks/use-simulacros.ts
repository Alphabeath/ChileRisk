"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getNextSimulacro,
  getSimulacro,
  listSimulacros,
} from "@/lib/api"
import { queryKeys } from "@/lib/queries"
import type { SimulacrosParams } from "@/lib/types"

export function useSimulacros(params: SimulacrosParams = {}) {
  return useQuery({
    queryKey: queryKeys.simulacros(params as Record<string, unknown>),
    queryFn: () => listSimulacros(params),
    staleTime: 30 * 60 * 1000,
  })
}

export function useNextSimulacro() {
  return useQuery({
    queryKey: queryKeys.nextSimulacro(),
    queryFn: () => getNextSimulacro(),
    staleTime: 30 * 60 * 1000,
  })
}

export function useSimulacro(slug: string | null) {
  return useQuery({
    queryKey: slug ? queryKeys.simulacro(slug) : ["simulacro", "none"],
    queryFn: () => (slug ? getSimulacro(slug) : Promise.resolve(null)),
    enabled: Boolean(slug),
    staleTime: 30 * 60 * 1000,
  })
}
