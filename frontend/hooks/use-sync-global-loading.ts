"use client"

import { useIsFetching, useIsMutating } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { LOADING_SOURCE, useLoadingStore } from "@/stores/loading-store"

const MAP_ROUTE = "/map"

/** Pushes React Query + /map route session into the loading store. */
export function useSyncGlobalLoading() {
  const pathname = usePathname()
  const fetching = useIsFetching()
  const mutating = useIsMutating()
  const setSourceActive = useLoadingStore((s) => s.setSourceActive)
  const setMapInitialPending = useLoadingStore((s) => s.setMapInitialPending)

  const queryBusy = fetching > 0 || mutating > 0

  useEffect(() => {
    setSourceActive(LOADING_SOURCE.REACT_QUERY, queryBusy)
  }, [queryBusy, setSourceActive])

  useEffect(() => {
    if (pathname === MAP_ROUTE) {
      setMapInitialPending(true)
      return () => setMapInitialPending(false)
    }
    setMapInitialPending(false)
  }, [pathname, setMapInitialPending])
}