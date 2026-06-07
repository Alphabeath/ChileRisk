"use client"

import { useEffect } from "react"
import {
  findMicaElement,
  resetMicaCoords,
  setMicaCoords,
} from "@/lib/use-mica-light"

/** Global cursor-following Mica light for all `.glass-mica.interactive-mica` surfaces. */
export function MicaLightProvider() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const handleMove = (e: MouseEvent) => {
      const el = findMicaElement(e.target)
      if (!el) return
      setMicaCoords(el, e.clientX, e.clientY)
    }

    const handleOut = (e: MouseEvent) => {
      const el = findMicaElement(e.target)
      if (!el) return
      const related = e.relatedTarget
      if (related instanceof Node && el.contains(related)) return
      resetMicaCoords(el)
    }

    document.addEventListener("mousemove", handleMove)
    document.addEventListener("mouseout", handleOut)

    return () => {
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseout", handleOut)
    }
  }, [])

  return null
}