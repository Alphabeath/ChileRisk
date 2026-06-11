"use client"

import { useCallback, useEffect, useRef } from "react"

import {
  CANVAS_H,
  CANVAS_W,
  GRID_SIZE,
  snap,
} from "@/lib/floor-map-constants"

export type ResizeHandle = "se" | "sw" | "ne" | "nw"

interface ResizeBounds {
  minW: number
  minH: number
}

interface UseFloorMapResizeOptions {
  x: number
  y: number
  w: number
  h: number
  scale?: number
  bounds?: ResizeBounds
  onResize: (next: { x: number; y: number; w: number; h: number }) => void
}

export function useFloorMapResize({
  x,
  y,
  w,
  h,
  scale = 1,
  bounds = { minW: 60, minH: 60 },
  onResize,
}: UseFloorMapResizeOptions) {
  const dimsRef = useRef({ x, y, w, h })
  const scaleRef = useRef(scale)
  const boundsRef = useRef(bounds)
  const onResizeRef = useRef(onResize)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    dimsRef.current = { x, y, w, h }
    scaleRef.current = scale
    boundsRef.current = bounds
    onResizeRef.current = onResize
  }, [x, y, w, h, scale, bounds, onResize])

  useEffect(() => () => cleanupRef.current?.(), [])

  const startResize = useCallback(
    (
      handle: ResizeHandle,
      clientX: number,
      clientY: number,
      pointerId: number,
      captureEl: HTMLElement,
    ) => {
      cleanupRef.current?.()

      const base = { ...dimsRef.current }
      const startX = clientX
      const startY = clientY
      const scaleFactor = scaleRef.current
      const boundsLocal = boundsRef.current

      try {
        captureEl.setPointerCapture(pointerId)
      } catch {
        // ignore unsupported capture
      }

      function apply(dx: number, dy: number) {
        let nextX = base.x
        let nextY = base.y
        let nextW = base.w
        let nextH = base.h

        if (handle.includes("e")) {
          nextW = snap(base.w + dx, CANVAS_W - base.x, boundsLocal.minW)
        }
        if (handle.includes("w")) {
          const rawX = base.x + dx
          const snappedX = snap(rawX, base.x + base.w - boundsLocal.minW)
          nextW = base.x + base.w - snappedX
          nextX = snappedX
        }
        if (handle.includes("s")) {
          nextH = snap(base.h + dy, CANVAS_H - base.y, boundsLocal.minH)
        }
        if (handle.includes("n")) {
          const rawY = base.y + dy
          const snappedY = snap(rawY, base.y + base.h - boundsLocal.minH)
          nextH = base.y + base.h - snappedY
          nextY = snappedY
        }

        nextW = Math.max(boundsLocal.minW, nextW)
        nextH = Math.max(boundsLocal.minH, nextH)
        nextX = Math.max(0, Math.min(nextX, CANVAS_W - nextW))
        nextY = Math.max(0, Math.min(nextY, CANVAS_H - nextH))
        nextW = Math.min(nextW, CANVAS_W - nextX)
        nextH = Math.min(nextH, CANVAS_H - nextY)

        onResizeRef.current({ x: nextX, y: nextY, w: nextW, h: nextH })
      }

      function onMove(e: PointerEvent) {
        if (e.pointerId !== pointerId) return
        apply(
          (e.clientX - startX) / scaleFactor,
          (e.clientY - startY) / scaleFactor,
        )
      }

      function cleanup(e?: PointerEvent) {
        if (e && e.pointerId !== pointerId) return
        window.removeEventListener("pointermove", onMove)
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

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", cleanup)
      window.addEventListener("pointercancel", cleanup)
    },
    [],
  )

  const onHandlePointerDown = useCallback(
    (handle: ResizeHandle) => (e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      startResize(
        handle,
        e.clientX,
        e.clientY,
        e.pointerId,
        e.currentTarget as HTMLElement,
      )
    },
    [startResize],
  )

  return { onHandlePointerDown }
}

export function snapPoint(value: number, max: number): number {
  return snap(value, max)
}

export function snapSize(value: number, min: number, max: number): number {
  const snapped = Math.round(value / GRID_SIZE) * GRID_SIZE
  return Math.max(min, Math.min(max, snapped))
}