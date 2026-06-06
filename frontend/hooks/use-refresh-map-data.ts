"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { queryKeys } from "@/lib/queries"
import { useQueryDate } from "./use-query-date"
import { useUIStore } from "@/stores/ui-store"

export function useRefreshMapData() {
  const queryClient = useQueryClient()
  const { selectedDate } = useQueryDate()
  const requestMapDataRefresh = useUIStore((s) => s.requestMapDataRefresh)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.activeAlerts(selectedDate),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.recentEvents(selectedDate),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.nationalRisk(selectedDate),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.comunaMapScores(selectedDate),
        }),
      ])
      requestMapDataRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }, [queryClient, requestMapDataRefresh, selectedDate])

  return { refresh, isRefreshing }
}