"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

import { useFloorMapDrag } from "@/components/preparation/family-plan/floor-map/use-floor-map-drag"
import { EMERGENCY_MARKER_TYPES } from "@/lib/family-plan-defaults"
import {
  CANVAS_H,
  CANVAS_W,
  DEFAULT_MARKER_STYLE,
  MARKER_SIZE,
  MARKER_STYLES,
} from "@/lib/floor-map-constants"
import type { FloorMapMarker } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FloorMapMarkerChipProps {
  marker: FloorMapMarker
  mode: "edit" | "readonly"
  scale?: number
  canDrag?: boolean
  onRemove?: (id: string) => void
  onMove?: (id: string, next: { x: number; y: number }) => void
  className?: string
}

function markerLabel(type: string): string {
  return EMERGENCY_MARKER_TYPES.find((m) => m.id === type)?.label ?? type
}

function isDragExcludedTarget(target: EventTarget | null): boolean {
  return !!(target as HTMLElement | null)?.closest("[data-delete-btn]")
}

export function FloorMapMarkerChip({
  marker,
  mode,
  scale = 1,
  canDrag = false,
  onRemove,
  onMove,
  className,
}: FloorMapMarkerChipProps) {
  const [isDragging, setIsDragging] = useState(false)
  const style = MARKER_STYLES[marker.type] ?? DEFAULT_MARKER_STYLE
  const Icon = style.icon
  const editable = mode === "edit"
  const label = markerLabel(marker.type)

  const { onDragPointerDown } = useFloorMapDrag({
    x: marker.x,
    y: marker.y,
    scale,
    maxX: CANVAS_W - MARKER_SIZE,
    maxY: CANVAS_H - MARKER_SIZE,
    disabled: !editable || !canDrag,
    onMove: (next) => onMove?.(marker.id, next),
  })

  function handleDragStart(e: React.PointerEvent) {
    if (isDragExcludedTarget(e.target)) return
    setIsDragging(true)
    onDragPointerDown(e)
    const onUp = () => {
      setIsDragging(false)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointerup", onUp)
  }

  return (
    <div
      data-floor-map-item
      data-floor-map-marker={marker.type}
      className={cn(
        "absolute z-[10] flex min-w-[52px] touch-none flex-col items-center justify-center border px-1.5 py-1",
        style.bg,
        style.border,
        canDrag && "cursor-grab active:cursor-grabbing",
        isDragging && "z-30 opacity-90",
        className,
      )}
      style={{
        left: marker.x,
        top: marker.y,
        minHeight: MARKER_SIZE,
        maxWidth: 120,
      }}
      onPointerDown={canDrag ? handleDragStart : undefined}
    >
      <div className={cn("flex flex-col items-center gap-0.5 text-center", style.text)}>
        <Icon className="size-3 shrink-0" aria-hidden />
        <span className="max-w-[88px] truncate text-[8px] font-medium leading-tight">
          {label}
        </span>
      </div>

      {editable && onRemove ? (
        <button
          type="button"
          data-delete-btn
          className="mt-0.5 text-white/45 hover:text-red-300"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(marker.id)
          }}
          aria-label={`Eliminar ${label}`}
        >
          <Trash2 className="size-2.5" />
        </button>
      ) : null}
    </div>
  )
}