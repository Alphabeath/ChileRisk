"use client"

import { useQuery } from "@tanstack/react-query"
import { getFamilyPlan } from "@/lib/api"
import {
  computeCompletionPct,
  getStepStatuses,
  type StepStatus,
} from "@/lib/family-plan-completion"
import { mergeFamilyPlanData } from "@/lib/family-plan-merge"
import { queryKeys } from "@/lib/queries"
import type { FamilyPlanData } from "@/lib/types"

const TOTAL_STEPS = 8

export interface UsePlanStatsResult {
  isLoading: boolean
  isError: boolean
  /** 0-100 percentage, derived from server data (no draft). */
  completionPct: number
  /** Number of incomplete steps (0-8). */
  pendingCount: number
  /** Step status per wizard step (1-8). */
  steps: StepStatus[]
  /** True once we have a non-null `data` payload. */
  hasData: boolean
}

/**
 * Read-only stats derived from the family plan query. Reuses the
 * `["familyPlan"]` React Query cache so the editing dashboard
 * (`useFamilyPlan`) and this hook share the same network response.
 */
export function usePlanStats(): UsePlanStatsResult {
  const query = useQuery({
    queryKey: queryKeys.familyPlan(),
    queryFn: getFamilyPlan,
    staleTime: 30_000,
  })

  const data: FamilyPlanData | null = query.data
    ? mergeFamilyPlanData(query.data.data)
    : null

  const steps: StepStatus[] = data
    ? getStepStatuses(data)
    : Array.from({ length: TOTAL_STEPS }, (_, i) => ({ step: i + 1, completed: false }))

  const completionPct = data ? computeCompletionPct(data) : 0
  const completedCount = steps.filter((s) => s.completed).length
  const pendingCount = TOTAL_STEPS - completedCount

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    completionPct,
    pendingCount,
    steps,
    hasData: !!data,
  }
}
