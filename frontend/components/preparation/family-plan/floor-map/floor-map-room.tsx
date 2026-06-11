"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

import { useFloorMapDrag } from "@/components/preparation/family-plan/floor-map/use-floor-map-drag"
import { useFloorMapResize } from "@/components/preparation/family-plan/floor-map/use-floor-map-resize"
import { ROOM_TYPES } from "@/lib/family-plan-defaults"
import {
  CANVAS_H,
  CANVAS_W,
  DEFAULT_ROOM_STYLE,
  MIN_ROOM_H,
  MIN_ROOM_W,
  ROOM_STYLES,
} from "@/lib/floor-map-constants"
import type { FloorMapRoom } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FloorMapRoomBlockProps {
  room: FloorMapRoom
  mode: "edit" | "readonly"
  scale?: number
  canDrag?: boolean
  onRemove?: (id: string) => void
  onMove?: (id: string, next: { x: number; y: number }) => void
  onResize?: (id: string, next: { x: number; y: number; w: number; h: number }) => void
  className?: string
}

function roomLabel(type: string): string {
  return ROOM_TYPES.find((r) => r.id === type)?.label ?? type
}

function isDragExcludedTarget(target: EventTarget | null): boolean {
  return !!(target as HTMLElement | null)?.closest(
    "[data-resize-handle], [data-delete-btn]",
  )
}

export function FloorMapRoomBlock({
  room,
  mode,
  scale = 1,
  canDrag = false,
  onRemove,
  onMove,
  onResize,
  className,
}: FloorMapRoomBlockProps) {
  const [isDragging, setIsDragging] = useState(false)
  const style = ROOM_STYLES[room.type] ?? DEFAULT_ROOM_STYLE
  const Icon = style.icon
  const editable = mode === "edit"
  const label = roomLabel(room.type)

  const { onDragPointerDown } = useFloorMapDrag({
    x: room.x,
    y: room.y,
    scale,
    maxX: CANVAS_W - room.w,
    maxY: CANVAS_H - room.h,
    disabled: !editable || !canDrag,
    onMove: (next) => onMove?.(room.id, next),
  })

  const { onHandlePointerDown } = useFloorMapResize({
    x: room.x,
    y: room.y,
    w: room.w,
    h: room.h,
    scale,
    bounds: { minW: MIN_ROOM_W, minH: MIN_ROOM_H },
    onResize: (next) => onResize?.(room.id, next),
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
      data-floor-map-room={room.type}
      className={cn(
        "absolute z-[10] flex touch-none flex-col items-center justify-center border p-1",
        style.bg,
        style.border,
        canDrag && "cursor-grab active:cursor-grabbing",
        isDragging && "z-30 opacity-90",
        className,
      )}
      style={{
        left: room.x,
        top: room.y,
        width: room.w,
        height: room.h,
      }}
      onPointerDown={canDrag ? handleDragStart : undefined}
    >
      <div className={cn("flex flex-col items-center gap-0.5 text-center", style.text)}>
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="max-w-full truncate px-1 text-[9px] font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>

      {editable && onRemove ? (
        <button
          type="button"
          data-delete-btn
          className="mt-1 text-white/45 hover:text-red-300"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(room.id)
          }}
          aria-label={`Eliminar ${label}`}
        >
          <Trash2 className="size-3" />
        </button>
      ) : null}

      {editable && onResize ? (
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
        "absolute z-10 size-2.5 border border-white/50 bg-white/35",
        posClass,
      )}
      onPointerDown={(e) => {
        e.stopPropagation()
        onPointerDown(e)
      }}
    />
  )
}