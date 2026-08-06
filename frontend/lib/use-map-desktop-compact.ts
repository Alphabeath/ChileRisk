"use client"

import { useEffect, useState } from "react"

import { MAP_DESKTOP_COMPACT_QUERY } from "@/lib/citizen-layout"

/**
 * `md`–`lg` floating panels: collapse to a left rail until expanded.
 * `null` until mounted (avoid SSR/client width mismatch).
 */
export function useMapDesktopCompact(): boolean | null {
  const [compact, setCompact] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia(MAP_DESKTOP_COMPACT_QUERY)
    const sync = () => setCompact(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  return compact
}
