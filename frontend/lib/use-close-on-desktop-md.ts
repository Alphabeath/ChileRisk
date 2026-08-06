"use client"

import { useEffect } from "react"

import { MAP_DESKTOP_MIN_QUERY } from "@/lib/citizen-layout"

/**
 * Close mobile UI (nav Sheet, map FABs) when the viewport reaches `md+`.
 * Hiding triggers with `md:hidden` does not unmount portaled Sheet content.
 */
export function useCloseOnDesktopMd(onClose: () => void) {
  useEffect(() => {
    const mq = window.matchMedia(MAP_DESKTOP_MIN_QUERY)
    const sync = () => {
      if (mq.matches) onClose()
    }
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [onClose])
}
