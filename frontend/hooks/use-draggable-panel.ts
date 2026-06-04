"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useDraggable, useDndMonitor } from "@dnd-kit/core"
import { MAP_PANEL_DEFAULT_TOP_PX } from "@/lib/citizen-layout"

export interface PanelPosition {
  x: number
  y: number
}

export type PanelCorner = "top-left" | "bottom-left" | "bottom-right"

export interface UseDraggablePanelOptions {
  id: string
  /** Fixed screen position (e.g. top-left under navbar). */
  defaultPosition?: PanelPosition
  /** Anchor to a viewport corner; recomputed on resize / panel size change. */
  corner?: PanelCorner
  cornerInset?: number
}

export interface UseDraggablePanelReturn {
  ref: (node: HTMLElement | null) => void
  handleProps: Record<string, unknown>
  style: React.CSSProperties
  isDragging: boolean
  isMoved: boolean
  resetPosition: () => void
}

const DEFAULT_FIXED: PanelPosition = { x: 16, y: MAP_PANEL_DEFAULT_TOP_PX }

function cornerPosition(
  node: HTMLElement,
  corner: PanelCorner,
  inset: number,
): PanelPosition {
  const w = node.offsetWidth
  const h = node.offsetHeight

  switch (corner) {
    case "top-left":
      return { x: inset, y: inset }
    case "bottom-left":
      return { x: inset, y: window.innerHeight - h - inset }
    case "bottom-right":
      return {
        x: window.innerWidth - w - inset,
        y: window.innerHeight - h - inset,
      }
  }
}

export function useDraggablePanel({
  id,
  defaultPosition = DEFAULT_FIXED,
  corner,
  cornerInset = 16,
}: UseDraggablePanelOptions): UseDraggablePanelReturn {
  const fixedPosition = useMemo(
    () => defaultPosition,
    [defaultPosition.x, defaultPosition.y],
  )
  const [pos, setPos] = useState<PanelPosition | null>(null)
  const [defaultPos, setDefaultPos] = useState<PanelPosition>(fixedPosition)
  const nodeRef = useRef<HTMLElement | null>(null)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })

  const measureDefault = useCallback(() => {
    const node = nodeRef.current
    if (!node || pos !== null) return
    if (corner) {
      setDefaultPos(cornerPosition(node, corner, cornerInset))
    } else {
      setDefaultPos(fixedPosition)
    }
  }, [corner, cornerInset, fixedPosition, pos])

  const ref = useCallback(
    (node: HTMLElement | null) => {
      nodeRef.current = node
      setNodeRef(node)
      if (node && pos === null) {
        if (corner) {
          setDefaultPos(cornerPosition(node, corner, cornerInset))
        } else {
          setDefaultPos(fixedPosition)
        }
      }
    },
    [corner, cornerInset, fixedPosition, pos, setNodeRef],
  )

  useLayoutEffect(() => {
    measureDefault()
  }, [measureDefault])

  useEffect(() => {
    if (pos !== null || !corner) return
    const node = nodeRef.current
    if (!node) return

    const ro = new ResizeObserver(() => measureDefault())
    ro.observe(node)
    const onResize = () => measureDefault()
    window.addEventListener("resize", onResize)

    return () => {
      ro.disconnect()
      window.removeEventListener("resize", onResize)
    }
  }, [corner, measureDefault, pos])

  useDndMonitor({
    onDragEnd: (event) => {
      if (event.active.id !== id) return
      if (event.delta.x === 0 && event.delta.y === 0) return
      const node = nodeRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      setPos({ x: rect.left, y: rect.top })
    },
  })

  const isMoved = pos !== null
  const currentPos = pos ?? defaultPos

  const resetPosition = useCallback(() => {
    setPos(null)
    requestAnimationFrame(() => {
      const node = nodeRef.current
      if (!node) return
      if (corner) {
        setDefaultPos(cornerPosition(node, corner, cornerInset))
      } else {
        setDefaultPos(fixedPosition)
      }
    })
  }, [corner, cornerInset, fixedPosition])

  const style: React.CSSProperties = {
    position: "fixed",
    left: currentPos.x,
    top: currentPos.y,
    right: "auto",
    bottom: "auto",
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  }

  return {
    ref,
    handleProps: { ...attributes, ...listeners },
    style,
    isDragging,
    isMoved,
    resetPosition,
  }
}