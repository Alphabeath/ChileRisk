"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useDraggable, useDndMonitor } from "@dnd-kit/core"
import { MAP_PANEL_DEFAULT_TOP_PX } from "@/lib/citizen-layout"
import { useUIStore, type PanelPosition } from "@/stores/ui-store"

export type { PanelPosition }

export type PanelCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"

export interface UseDraggablePanelOptions {
  id: string
  /** Fixed screen position (e.g. top-left under navbar). */
  defaultPosition?: PanelPosition
  /** Anchor to a viewport corner; recomputed on resize / panel size change. */
  corner?: PanelCorner
  cornerInset?: number
  /** In overlay column: relative layout until user drags (then fixed + saved). */
  flow?: boolean
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
    case "top-right":
      return {
        x: window.innerWidth - w - inset,
        y: MAP_PANEL_DEFAULT_TOP_PX,
      }
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
  flow = false,
}: UseDraggablePanelOptions): UseDraggablePanelReturn {
  const fixedPosition = useMemo(
    () => defaultPosition,
    [defaultPosition.x, defaultPosition.y],
  )
  const savedPosition = useUIStore((s) => s.panelPositions[id])
  const setPanelPosition = useUIStore((s) => s.setPanelPosition)
  const resetPanelPosition = useUIStore((s) => s.resetPanelPosition)
  const panelLayoutVersion = useUIStore((s) => s.panelLayoutVersion)

  const [defaultPos, setDefaultPos] = useState<PanelPosition>(fixedPosition)
  const nodeRef = useRef<HTMLElement | null>(null)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })

  const measureDefault = useCallback(() => {
    const node = nodeRef.current
    if (!node || savedPosition != null) return
    if (corner) {
      setDefaultPos(cornerPosition(node, corner, cornerInset))
    } else {
      setDefaultPos(fixedPosition)
    }
  }, [corner, cornerInset, fixedPosition, savedPosition])

  const ref = useCallback(
    (node: HTMLElement | null) => {
      nodeRef.current = node
      setNodeRef(node)
      if (node && savedPosition == null) {
        if (corner) {
          setDefaultPos(cornerPosition(node, corner, cornerInset))
        } else {
          setDefaultPos(fixedPosition)
        }
      }
    },
    [corner, cornerInset, fixedPosition, savedPosition, setNodeRef],
  )

  useLayoutEffect(() => {
    measureDefault()
  }, [measureDefault])

  useEffect(() => {
    if (savedPosition != null || !corner) return
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
  }, [corner, measureDefault, savedPosition])

  useEffect(() => {
    if (savedPosition != null) return
    requestAnimationFrame(() => measureDefault())
  }, [panelLayoutVersion, savedPosition, measureDefault])

  useDndMonitor({
    onDragEnd: (event) => {
      if (event.active.id !== id) return
      if (event.delta.x === 0 && event.delta.y === 0) return
      const node = nodeRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      setPanelPosition(id, { x: rect.left, y: rect.top })
    },
  })

  const isMoved = savedPosition != null
  const currentPos = savedPosition ?? defaultPos
  const useFlowLayout = flow && savedPosition == null

  const resetPosition = useCallback(() => {
    resetPanelPosition(id)
    requestAnimationFrame(() => {
      const node = nodeRef.current
      if (!node) return
      if (corner) {
        setDefaultPos(cornerPosition(node, corner, cornerInset))
      } else {
        setDefaultPos(fixedPosition)
      }
    })
  }, [corner, cornerInset, fixedPosition, id, resetPanelPosition])

  const dragTransform = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined

  const style: React.CSSProperties = useFlowLayout
    ? {
        position: "relative",
        transform: dragTransform,
      }
    : {
        position: "fixed",
        left: currentPos.x,
        top: currentPos.y,
        right: "auto",
        bottom: "auto",
        transform: dragTransform,
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