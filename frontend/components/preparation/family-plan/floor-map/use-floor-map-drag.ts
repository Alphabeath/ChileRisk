"use client"

import { useCallback, useEffect, useRef } from "react"

import { snap } from "@/lib/floor-map-constants"

interface UseFloorMapDragOptions {
  x: number
  y: number
  scale: number
  maxX: number
  maxY: number
  disabled?: boolean
  onMove: (next: { x: number; y: number }) => void
}

export function useFloorMapDrag({
  x,
  y,
  scale,
  maxX,
  maxY,
  disabled = false,
  onMove,
}: UseFloorMapDragOptions) {
  const posRef = useRef({ x, y })
  const scaleRef = useRef(scale)
  const maxRef = useRef({ maxX, maxY })
  const onMoveRef = useRef(onMove)
  const disabledRef = useRef(disabled)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    posRef.current = { x, y }
    scaleRef.current = scale
    maxRef.current = { maxX, maxY }
    onMoveRef.current = onMove
    disabledRef.current = disabled
  }, [x, y, scale, maxX, maxY, onMove, disabled])

  useEffect(() => () => cleanupRef.current?.(), [])

  const onDragPointerDown = useCallback((e: React.PointerEvent) => {
    if (disabledRef.current) return
    e.stopPropagation()
    e.preventDefault()

    cleanupRef.current?.()

    const base = { ...posRef.current }
    const startX = e.clientX
    const startY = e.clientY
    const pointerId = e.pointerId
    const captureEl = e.currentTarget as HTMLElement

    try {
      captureEl.setPointerCapture(pointerId)
    } catch {
      // ignore unsupported capture
    }

    function onPointerMove(ev: PointerEvent) {
      if (ev.pointerId !== pointerId) return
      const { maxX: limitX, maxY: limitY } = maxRef.current
      const dx = (ev.clientX - startX) / scaleRef.current
      const dy = (ev.clientY - startY) / scaleRef.current
      onMoveRef.current({
        x: snap(base.x + dx, limitX),
        y: snap(base.y + dy, limitY),
      })
    }

    function cleanup(ev?: PointerEvent) {
      if (ev && ev.pointerId !== pointerId) return
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", cleanup)
      window.removeEventListener("pointercancel", cleanup)
      try {
        if (captureEl.hasPointerCapture(pointerId)) {
          captureEl.releasePointerCapture(pointerId)
        }
      } catch {
        // ignore
      }
      cleanupRef.current = null
    }

    cleanupRef.current = () => cleanup()

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", cleanup)
    window.addEventListener("pointercancel", cleanup)
  }, [])

  return { onDragPointerDown }
}