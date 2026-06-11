"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

import { useFloorMapDrag } from "@/components/preparation/family-plan/floor-map/use-floor-map-drag"
import { useFloorMapResize } from "@/components/preparation/family-plan/floor-map/use-floor-map-resize"
import {
  CANVAS_H,
  CANVAS_W,
  MIN_ROOM_H,
  MIN_ROOM_W,
} from "@/lib/floor-map-constants"
import { FloorMapZonePatternDefs } from "@/components/preparation/family-plan/floor-map/floor-map-zone-pattern-defs"
import { ZONE_VISUALS, zonePatternId } from "@/lib/floor-map-zone-styles"
import type { FloorMapZone } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FloorMapZoneBlockProps {
  zone: FloorMapZone
  mode: "edit" | "readonly"
  scale?: number
  canDrag?: boolean
  onRemove?: (id: string) => void
  onMove?: (id: string, next: { x: number; y: number }) => void
  onResize?: (id: string, next: { x: number; y: number; w: number; h: number }) => void
}

function isDragExcludedTarget(target: EventTarget | null): boolean {
  return !!(target as HTMLElement | null)?.closest(
    "[data-resize-handle], [data-delete-btn]",
  )
}

export function FloorMapZoneBlock({
  zone,
  mode,
  scale = 1,
  canDrag = false,
  onRemove,
  onMove,
  onResize,
}: FloorMapZoneBlockProps) {
  const [isDragging, setIsDragging] = useState(false)
  const zoneStyle = ZONE_VISUALS[zone.type]
  const patternId = zonePatternId(zone.type, `-${zone.id}`)
  const editable = mode === "edit"

  const { onDragPointerDown } = useFloorMapDrag({
    x: zone.x,
    y: zone.y,
    scale,
    maxX: CANVAS_W - zone.w,
    maxY: CANVAS_H - zone.h,
    disabled: !editable || !canDrag,
    onMove: (next) => onMove?.(zone.id, next),
  })

  const { onHandlePointerDown } = useFloorMapResize({
    x: zone.x,
    y: zone.y,
    w: zone.w,
    h: zone.h,
    scale,
    bounds: { minW: MIN_ROOM_W, minH: MIN_ROOM_H },
    onResize: (next) => onResize?.(zone.id, next),
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

  if (mode === "readonly") {
    return (
      <g>
        <rect
          x={zone.x}
          y={zone.y}
          width={zone.w}
          height={zone.h}
          fill={`url(#${zonePatternId(zone.type)})`}
          stroke={zoneStyle.stroke}
          strokeWidth={1}
        />
        <text
          x={zone.x + zone.w - 4}
          y={zone.y + zone.h - 4}
          textAnchor="end"
          dominantBaseline="auto"
          fill={zoneStyle.stroke}
          fontSize={8}
          fontWeight={600}
          style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
        >
          {zoneStyle.label}
        </text>
      </g>
    )
  }

  return (
    <div
      data-floor-map-item
      className={cn(
        "absolute z-[15] touch-none overflow-hidden border-2 border-dashed",
        zoneStyle.border,
        canDrag && "cursor-grab active:cursor-grabbing",
        isDragging && "z-[20] opacity-90",
      )}
      style={{
        left: zone.x,
        top: zone.y,
        width: zone.w,
        height: zone.h,
      }}
      onPointerDown={canDrag ? handleDragStart : undefined}
    >
      <svg
        className="pointer-events-none absolute inset-0 size-full"
        aria-hidden
      >
        <FloorMapZonePatternDefs suffix={`-${zone.id}`} />
        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
          stroke={zoneStyle.stroke}
          strokeWidth={1}
        />
      </svg>

      <span
        className={cn(
          "pointer-events-none absolute bottom-1 right-1 z-[1] text-[8px] font-semibold uppercase tracking-wide",
          zoneStyle.text,
        )}
      >
        {zoneStyle.label}
      </span>

      {onRemove ? (
        <button
          type="button"
          data-delete-btn
          className="absolute top-0.5 right-0.5 z-[1] text-white/45 hover:text-red-300"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(zone.id)
          }}
          aria-label={`Eliminar zona ${zoneStyle.label}`}
        >
          <Trash2 className="size-2.5" />
        </button>
      ) : null}

      {onResize ? (
        <>
          <ResizeHandle position="se" onPointerDown={onHandlePointerDown("se")} />
          <ResizeHandle position="sw" onPointerDown={onHandlePointerDown("sw")} />
          <ResizeHandle position="ne" onPointerDown={onHandlePointerDown("ne")} />
          <ResizeHandle position="nw" onPointerDown={onHandlePointerDown("nw")} />
        </>
      ) : null}
    </div>
  )
}

function ResizeHandle({
  position,
  onPointerDown,
}: {
  position: "se" | "sw" | "ne" | "nw"
  onPointerDown: (e: React.PointerEvent) => void
}) {
  const posClass =
    position === "se"
      ? "bottom-0 right-0 cursor-se-resize"
      : position === "sw"
        ? "bottom-0 left-0 cursor-sw-resize"
        : position === "ne"
          ? "top-0 right-0 cursor-ne-resize"
          : "top-0 left-0 cursor-nw-resize"

  return (
    <span
      role="presentation"
      data-resize-handle
      className={cn(
        "absolute z-10 size-2 border border-white/50 bg-white/35",
        posClass,
      )}
      onPointerDown={(e) => {
        e.stopPropagation()
        onPointerDown(e)
      }}
    />
  )
}