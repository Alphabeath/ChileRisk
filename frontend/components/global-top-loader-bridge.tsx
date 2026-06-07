"use client"

import { useTopLoader } from "nextjs-toploader"
import { useEffect } from "react"

import { useSyncGlobalLoading } from "@/hooks/use-sync-global-loading"
import { useGlobalLoadingVisible } from "@/stores/loading-store"

/**
 * Syncs async work into Zustand, then drives nprogress via useTopLoader.
 * (No <NextTopLoader /> — its navigation hooks call done() too early on /monitor.)
 */
export function GlobalTopLoaderBridge() {
  useSyncGlobalLoading()
  const visible = useGlobalLoadingVisible()
  const { start, done, isStarted } = useTopLoader()

  useEffect(() => {
    if (visible) {
      if (!isStarted()) start()
      return
    }
    if (isStarted()) done()
  }, [visible, start, done, isStarted])

  return null
}