"use client"

import { useCallback, useState } from "react"
import { useDraggable, useDndMonitor } from "@dnd-kit/core"

export interface PanelPosition {
  x: number
  y: number
}

export interface UseDraggablePanelOptions {
  id: string
  defaultPosition?: PanelPosition
}

export interface UseDraggablePanelReturn {
  ref: (node: HTMLElement | null) => void
  handleProps: Record<string, unknown>
  style: React.CSSProperties
  isDragging: boolean
  isMoved: boolean
  resetPosition: () => void
}

const DEFAULT_POSITION: PanelPosition = { x: 16, y: 80 }

export function useDraggablePanel({
  id,
  defaultPosition = DEFAULT_POSITION,
}: UseDraggablePanelOptions): UseDraggablePanelReturn {
  const [pos, setPos] = useState<PanelPosition | null>(null)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })

  useDndMonitor({
    onDragEnd: (event) => {
      if (event.active.id !== id) return
      const { x, y } = event.delta
      if (x === 0 && y === 0) return
      setPos((p) => {
        const base = p ?? defaultPosition
        return { x: base.x + x, y: base.y + y }
      })
    },
  })

  const currentPos = pos ?? defaultPosition
  const isMoved = pos !== null

  const resetPosition = useCallback(() => setPos(null), [])

  const style: React.CSSProperties = {
    left: currentPos.x,
    top: currentPos.y,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  }

  return {
    ref: setNodeRef,
    handleProps: { ...attributes, ...listeners },
    style,
    isDragging,
    isMoved,
    resetPosition,
  }
}
