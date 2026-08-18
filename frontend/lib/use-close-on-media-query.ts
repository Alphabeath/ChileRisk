"use client"

import { useEffect, useState } from "react"

/**
 * Closes responsive UI and bumps an epoch when a media query changes.
 * Consumers can use the epoch as a key to remount portaled content after a
 * breakpoint transition.
 */
export function useCloseOnMediaQuery(
  onClose: () => void,
  mediaQuery: string
): number {
  const [epoch, setEpoch] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia(mediaQuery)
    const sync = () => {
      if (mq.matches) onClose()
    }
    const onChange = () => {
      onClose()
      setEpoch((n) => n + 1)
    }
    sync()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [mediaQuery, onClose])

  return epoch
}
