"use client"

import { useEffect, useRef, useState } from "react"

import { CANVAS_H, CANVAS_W } from "@/lib/floor-map-constants"

export function useFloorMapViewport() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function update() {
      const width = el?.clientWidth ?? CANVAS_W
      setFitScale(width / CANVAS_W)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return {
    containerRef,
    fitScale,
    containerHeight: CANVAS_H * fitScale,
    contentWidth: CANVAS_W * fitScale,
    contentHeight: CANVAS_H * fitScale,
  }
}

export function clientToCanvas(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): { x: number; y: number } {
  return {
    x: ((clientX - rect.left) / rect.width) * CANVAS_W,
    y: ((clientY - rect.top) / rect.height) * CANVAS_H,
  }
}