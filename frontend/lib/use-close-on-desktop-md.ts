"use client"

import { useEffect, useState } from "react"

import { MAP_DESKTOP_MIN_QUERY } from "@/lib/citizen-layout"

/**
 * Close mobile UI (nav Sheet, map FABs) when the viewport reaches `md+`.
 * Hiding triggers with `md:hidden` does not unmount portaled Sheet content —
 * and Floating UI dismiss/focus state can go stale across breakpoint changes.
 *
 * Returns a monotonically increasing epoch bumped on every `md` cross so
 * callers can `key={epoch}` remount the Sheet/portal for a clean mobile open.
 */
export function useCloseOnDesktopMd(onClose: () => void): number {
  const [epoch, setEpoch] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia(MAP_DESKTOP_MIN_QUERY)
    const sync = () => {
      if (mq.matches) onClose()
    }
    const onChange = () => {
      // Always dismiss when crossing either direction; remount so the next
      // mobile open does not reuse a trigger that was `display:none` on md+.
      onClose()
      setEpoch((n) => n + 1)
    }
    sync()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [onClose])

  return epoch
}
