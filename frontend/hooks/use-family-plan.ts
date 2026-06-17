"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { getFamilyPlan, updateFamilyPlan } from "@/lib/api"
import { computeCompletionPct, getStepStatuses } from "@/lib/family-plan-completion"
import { mergeFamilyPlanData } from "@/lib/family-plan-merge"
import { queryKeys } from "@/lib/queries"
import type { FamilyPlan, FamilyPlanData } from "@/lib/types"

const FAMILY_PLAN_BACKUP_KEY = "chilerisk.familyPlanBackup"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

type FamilyPlanContextValue = {
  plan: FamilyPlan | null
  data: FamilyPlanData | null
  isLoading: boolean
  isError: boolean
  saveStatus: SaveStatus
  updateData: (updater: (prev: FamilyPlanData) => FamilyPlanData) => void
  saveNow: (override?: FamilyPlanData) => void
  refetch: () => void
}

const FamilyPlanContext = createContext<FamilyPlanContextValue | null>(null)

function saveFamilyPlanBackup(data: FamilyPlanData): void {
  try {
    localStorage.setItem(
      FAMILY_PLAN_BACKUP_KEY,
      JSON.stringify({ data, ts: Date.now() }),
    )
  } catch {}
}

function loadFamilyPlanBackup(): {
  data: FamilyPlanData
  ts: number
} | null {
  try {
    const raw = localStorage.getItem(FAMILY_PLAN_BACKUP_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { data: FamilyPlanData; ts: number }
  } catch {
    return null
  }
}

function clearFamilyPlanBackup(): void {
  try {
    localStorage.removeItem(FAMILY_PLAN_BACKUP_KEY)
  } catch {}
}

function countCompletedSteps(data: FamilyPlanData): number {
  return getStepStatuses(data).filter((s) => s.completed).length
}

function useFamilyPlanState(): FamilyPlanContextValue {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<FamilyPlanData | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<FamilyPlanData | null>(null)
  const draftRef = useRef<FamilyPlanData | null>(null)
  const flushSaveRef = useRef<(next: FamilyPlanData) => void>(() => {})
  const mountedRef = useRef(true)

  const query = useQuery({
    queryKey: queryKeys.familyPlan(),
    queryFn: getFamilyPlan,
  })

  const baseData = useMemo(
    () => (query.data ? mergeFamilyPlanData(query.data.data) : null),
    [query.data],
  )

  // Restore from localStorage backup when server data lost fields the user
  // previously completed (e.g. safe_zones with safe_place, or floor_map with
  // saved_at). This protects against debounced saves that were cancelled by
  // navigation, and against the saved_at-reset bug in step-floor-map.
  const restoredBaseData = useMemo(() => {
    if (!baseData) return null
    const backup = loadFamilyPlanBackup()
    if (!backup?.data) return baseData

    const serverSteps = countCompletedSteps(baseData)
    const backupSteps = countCompletedSteps(backup.data)

    // Whole-plan replacement: backup has strictly more completed steps
    if (backupSteps > serverSteps) {
      return backup.data
    }

    // Field-level merge: only restore floor_map if server lost saved_at
    const floorMapLooksLost =
      baseData.floor_map.rooms.length === 0 ||
      (baseData.floor_map.saved_at === null &&
        backup.data.floor_map.saved_at !== null)
    if (floorMapLooksLost) {
      return { ...baseData, floor_map: backup.data.floor_map }
    }

    return baseData
  }, [baseData])

  const data = draft ?? restoredBaseData

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  const syncCache = useCallback(
    (next: FamilyPlanData) => {
      const previous = queryClient.getQueryData<FamilyPlan>(queryKeys.familyPlan())
      queryClient.setQueryData(queryKeys.familyPlan(), {
        id: previous?.id ?? null,
        data: mergeFamilyPlanData(next),
        completion_pct: computeCompletionPct(next),
        updated_at: previous?.updated_at ?? null,
      })
    },
    [queryClient],
  )

  const mutation = useMutation({
    mutationFn: updateFamilyPlan,
    onMutate: (variables) => {
      if (!mountedRef.current) return
      setSaveStatus("saving")
      syncCache(variables)
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(queryKeys.familyPlan(), {
        ...result,
        data: mergeFamilyPlanData(variables),
        completion_pct: computeCompletionPct(variables),
      })
      clearFamilyPlanBackup()
      if (!mountedRef.current) return
      const pending = pendingRef.current
      if (pending) {
        setDraft(pending)
        setSaveStatus("idle")
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          if (pendingRef.current) flushSaveRef.current(pendingRef.current)
        }, 1500)
      } else {
        setDraft(null)
        setSaveStatus("saved")
      }
    },
    onError: () => {
      if (!mountedRef.current) return
      setSaveStatus("error")
    },
  })

  const flushSave = useCallback(
    (next: FamilyPlanData) => {
      pendingRef.current = null
      mutation.mutate(next)
    },
    [mutation],
  )

  useEffect(() => {
    flushSaveRef.current = flushSave
  }, [flushSave])

  const updateData = useCallback(
    (updater: (prev: FamilyPlanData) => FamilyPlanData) => {
      const current = draftRef.current ?? restoredBaseData
      if (!current) return
      const next = updater(current)
      pendingRef.current = next
      draftRef.current = next
      setDraft(next)
      syncCache(next)
      saveFamilyPlanBackup(next)
      setSaveStatus("idle")
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        if (pendingRef.current) flushSave(pendingRef.current)
      }, 1500)
    },
    [restoredBaseData, flushSave, syncCache],
  )

  const saveNow = useCallback(
    (override?: FamilyPlanData) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      const current = override ?? pendingRef.current ?? draftRef.current ?? restoredBaseData
      if (current) flushSave(current)
    },
    [restoredBaseData, flushSave],
  )

  // Cleanup: flush pending save on unmount so a navigation away during the
  // 1500ms debounce window doesn't drop the user's changes.
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      if (pendingRef.current) {
        flushSaveRef.current(pendingRef.current)
      }
    }
  }, [])

  // beforeunload: warn if save in-flight or pending changes; also try
  // sendBeacon as a last-resort flush for tab close.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (mutation.isPending || pendingRef.current) {
        e.preventDefault()
        if (pendingRef.current && typeof navigator !== "undefined" && navigator.sendBeacon) {
          try {
            const blob = new Blob(
              [JSON.stringify({ data: pendingRef.current })],
              { type: "application/json" },
            )
            navigator.sendBeacon("/api/backend/api/v1/family-plan", blob)
          } catch {}
        }
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [mutation.isPending])

  return {
    plan: query.data ?? null,
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    saveStatus,
    updateData,
    saveNow,
    refetch: query.refetch,
  }
}

export function FamilyPlanProvider({ children }: { children: React.ReactNode }) {
  const value = useFamilyPlanState()
  return createElement(FamilyPlanContext.Provider, { value }, children)
}

export function useFamilyPlan(): FamilyPlanContextValue {
  const context = useContext(FamilyPlanContext)
  if (context) return context
  return useFamilyPlanState()
}
