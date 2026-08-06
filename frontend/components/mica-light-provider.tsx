"use client"

import { useEffect } from "react"
import {
  findMicaElement,
  resetMicaCoords,
  setMicaCoords,
} from "@/lib/use-mica-light"

/** Global cursor-following Mica light for `.surface-mica.interactive-mica`. */
export function MicaLightProvider() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (!window.matchMedia("(pointer: fine)").matches) return

    let frame = 0
    let pending: { el: HTMLElement; x: number; y: number } | null = null

    const flush = () => {
      frame = 0
      if (!pending) return
      setMicaCoords(pending.el, pending.x, pending.y)
      pending = null
    }

    const handleMove = (e: PointerEvent) => {
      const el = findMicaElement(e.target)
      if (!el) return
      pending = { el, x: e.clientX, y: e.clientY }
      if (!frame) frame = requestAnimationFrame(flush)
    }

    const handleOut = (e: PointerEvent) => {
      const el = findMicaElement(e.target)
      if (!el) return
      const related = e.relatedTarget
      if (related instanceof Node && el.contains(related)) return
      resetMicaCoords()
    }

    document.addEventListener("pointermove", handleMove, { passive: true })
    document.addEventListener("pointerout", handleOut)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      document.removeEventListener("pointermove", handleMove)
      document.removeEventListener("pointerout", handleOut)
    }
  }, [])

  return null
}
