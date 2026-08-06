"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react"
import { useQueryClient } from "@tanstack/react-query"

import { useActiveAlerts, useAirQuality, useQueryDate } from "@/hooks"
import {
  getActiveAlerts,
  getAirQuality,
  getNationalRisk,
  getRecentEvents,
} from "@/lib/api"
import { STALE, staleTimeForLive } from "@/lib/query-cache"
import { queryKeys } from "@/lib/queries"
import type { ActiveAlert, AirQualityListResponse } from "@/lib/types"

type MonitorLiveDataValue = {
  alerts: ActiveAlert[]
  air: AirQualityListResponse | undefined
  alertsPending: boolean
  airPending: boolean
  isPending: boolean
}

const MonitorLiveDataContext = createContext<MonitorLiveDataValue | null>(null)

/**
 * Single TanStack Query subscriber for monitor alerts + air-quality.
 * Children read via {@link useMonitorLiveData} (no extra useQuery mounts).
 */
export function MonitorLiveDataProvider({ children }: { children: ReactNode }) {
  const { selectedDate } = useQueryDate()
  const queryClient = useQueryClient()
  const alertsQuery = useActiveAlerts()
  const airQuery = useAirQuality()

  // Prefetch sibling monitor queries when the query date changes.
  useEffect(() => {
    const date = selectedDate
    void queryClient.prefetchQuery({
      queryKey: [...queryKeys.activeAlerts(date), { date }] as const,
      queryFn: () => getActiveAlerts({ date }),
      staleTime: staleTimeForLive(date, STALE.alerts),
    })
    void queryClient.prefetchQuery({
      queryKey: queryKeys.airQuality(date, {
        region: undefined,
        episodeOnly: false,
      }),
      queryFn: () => getAirQuality({ date }),
      staleTime: staleTimeForLive(date, STALE.air),
    })
    void queryClient.prefetchQuery({
      queryKey: queryKeys.recentEvents(date),
      queryFn: () => getRecentEvents(date),
      staleTime: staleTimeForLive(date, STALE.events),
    })
    void queryClient.prefetchQuery({
      queryKey: queryKeys.nationalRisk(date),
      queryFn: () => getNationalRisk(date),
      staleTime: staleTimeForLive(date, STALE.risk),
    })
  }, [selectedDate, queryClient])

  const value = useMemo<MonitorLiveDataValue>(
    () => ({
      alerts: alertsQuery.data ?? [],
      air: airQuery.data,
      alertsPending: alertsQuery.isPending,
      airPending: airQuery.isPending,
      isPending: alertsQuery.isPending || airQuery.isPending,
    }),
    [
      alertsQuery.data,
      alertsQuery.isPending,
      airQuery.data,
      airQuery.isPending,
    ],
  )

  return (
    <MonitorLiveDataContext.Provider value={value}>
      {children}
    </MonitorLiveDataContext.Provider>
  )
}

export function useMonitorLiveData(): MonitorLiveDataValue {
  const ctx = useContext(MonitorLiveDataContext)
  if (!ctx) {
    throw new Error(
      "useMonitorLiveData must be used within MonitorLiveDataProvider",
    )
  }
  return ctx
}

/** Optional: territory/map may render outside provider in tests — fall back to empty. */
export function useMonitorLiveDataOptional(): MonitorLiveDataValue | null {
  return useContext(MonitorLiveDataContext)
}
