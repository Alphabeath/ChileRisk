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
import { computeCompletionPct } from "@/lib/family-plan-completion"
import { mergeFamilyPlanData } from "@/lib/family-plan-merge"
import { queryKeys } from "@/lib/queries"
import type { FamilyPlan, FamilyPlanData } from "@/lib/types"

const FLOOR_MAP_BACKUP_KEY = "chilerisk.floorMapBackup"

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

function saveFloorMapBackup(floorMap: FamilyPlanData["floor_map"]): void {
  try {
    localStorage.setItem(
      FLOOR_MAP_BACKUP_KEY,
      JSON.stringify({ floor_map: floorMap, ts: Date.now() }),
    )
  } catch {}
}

function loadFloorMapBackup(): {
  floor_map: FamilyPlanData["floor_map"]
  ts: number
} | null {
  try {
    const raw = localStorage.getItem(FLOOR_MAP_BACKUP_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { floor_map: FamilyPlanData["floor_map"]; ts: number }
  } catch {
    return null
  }
}

function clearFloorMapBackup(): void {
  try {
    localStorage.removeItem(FLOOR_MAP_BACKUP_KEY)
  } catch {}
}

function useFamilyPlanState(): FamilyPlanContextValue {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<FamilyPlanData | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<FamilyPlanData | null>(null)
  const draftRef = useRef<FamilyPlanData | null>(null)
  const flushSaveRef = useRef<(next: FamilyPlanData) => void>(() => {})

  const query = useQuery({
    queryKey: queryKeys.familyPlan(),
    queryFn: getFamilyPlan,
  })

  const baseData = useMemo(
    () => (query.data ? mergeFamilyPlanData(query.data.data) : null),
    [query.data],
  )

  // Restore floor map from localStorage backup if server data lost it
  const restoredBaseData = useMemo(() => {
    if (!baseData) return null
    const backup = loadFloorMapBackup()
    if (!backup?.floor_map?.rooms?.length) return baseData
    // Restore if server has no rooms or no saved_at (save didn't persist)
    if (
      baseData.floor_map.rooms.length === 0 ||
      (baseData.floor_map.saved_at === null && backup.floor_map.saved_at !== null)
    ) {
      return { ...baseData, floor_map: backup.floor_map }
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
      setSaveStatus("saving")
      syncCache(variables)
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(queryKeys.familyPlan(), {
        ...result,
        data: mergeFamilyPlanData(variables),
        completion_pct: computeCompletionPct(variables),
      })
      clearFloorMapBackup()
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
    onError: () => setSaveStatus("error"),
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
      saveFloorMapBackup(next.floor_map)
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

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // beforeunload: warn if save in-flight or pending changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (mutation.isPending || pendingRef.current) {
        e.preventDefault()
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