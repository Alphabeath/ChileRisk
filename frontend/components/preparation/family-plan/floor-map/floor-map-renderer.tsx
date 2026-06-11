"use client"

import { FloorMapMarkerChip } from "@/components/preparation/family-plan/floor-map/floor-map-marker"
import { FloorMapRoutesLayer } from "@/components/preparation/family-plan/floor-map/floor-map-routes"
import { FloorMapRoomBlock } from "@/components/preparation/family-plan/floor-map/floor-map-room"
import { FloorMapZoneBlock } from "@/components/preparation/family-plan/floor-map/floor-map-zone"
import { FloorMapZonePatternDefs } from "@/components/preparation/family-plan/floor-map/floor-map-zone-pattern-defs"
import type { LayerVisibility } from "@/components/preparation/family-plan/floor-map-layer-toggles"
import {
  CANVAS_GRID_CLASS,
  CANVAS_H,
  CANVAS_W,
} from "@/lib/floor-map-constants"
import type { FloorMap, FloorMapPoint } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface FloorMapRendererProps {
  floorMap: FloorMap
  mode: "edit" | "readonly"
  visibility?: LayerVisibility
  routeDraft?: FloorMapPoint[]
  scale?: number
  canDrag?: boolean
  layoutLocked?: boolean
  className?: string
  canvasId?: string
  showCrosshair?: boolean
  onCanvasClick?: (e: React.MouseEvent<HTMLDivElement>) => void
  onRemoveRoom?: (id: string) => void
  onMoveRoom?: (id: string, next: { x: number; y: number }) => void
  onResizeRoom?: (id: string, next: { x: number; y: number; w: number; h: number }) => void
  onRemoveMarker?: (id: string) => void
  onMoveMarker?: (id: string, next: { x: number; y: number }) => void
  onRemoveZone?: (id: string) => void
  onMoveZone?: (id: string, next: { x: number; y: number }) => void
  onResizeZone?: (id: string, next: { x: number; y: number; w: number; h: number }) => void
  onRemoveRoute?: (id: string) => void
}

const DEFAULT_VISIBILITY: LayerVisibility = {
  rooms: true,
  markers: true,
  routes: true,
  zones: true,
}

function EmptyState() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[3] flex flex-col items-center justify-center gap-2 p-6 text-center">
      <svg
        viewBox="0 0 64 64"
        className="size-12 text-white/15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <rect x="6" y="14" width="22" height="14" />
        <rect x="30" y="14" width="14" height="14" />
        <rect x="46" y="14" width="12" height="14" />
        <rect x="6" y="32" width="18" height="22" />
        <rect x="26" y="32" width="32" height="22" />
        <circle cx="50" cy="42" r="2" fill="currentColor" />
      </svg>
      <p className="max-w-[220px] text-[12px] text-white/55">
        Elige una plantilla para ver la vista previa del plano.
      </p>
    </div>
  )
}

export function FloorMapRenderer({
  floorMap,
  mode,
  visibility = DEFAULT_VISIBILITY,
  routeDraft = [],
  scale = 1,
  canDrag = false,
  layoutLocked = false,
  className,
  canvasId = "floor-canvas",
  showCrosshair = false,
  onCanvasClick,
  onRemoveRoom,
  onMoveRoom,
  onResizeRoom,
  onRemoveMarker,
  onMoveMarker,
  onRemoveZone,
  onMoveZone,
  onResizeZone,
  onRemoveRoute,
}: FloorMapRendererProps) {
  const isEmpty =
    floorMap.rooms.length === 0 &&
    floorMap.markers.length === 0 &&
    floorMap.zones.length === 0 &&
    floorMap.routes.length === 0

  return (
    <div
      id={canvasId}
      data-floor-map-canvas
      className={cn(
        CANVAS_GRID_CLASS,
        mode === "edit" && showCrosshair && "cursor-crosshair",
        "absolute left-0 top-0 origin-top-left",
        className,
      )}
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        transform: `scale(${scale})`,
      }}
      onClick={mode === "edit" ? onCanvasClick : undefined}
      role={mode === "edit" ? "application" : "img"}
      aria-label="Mapa de vivienda"
    >
      {visibility.rooms
        ? floorMap.rooms.map((room) => (
            <FloorMapRoomBlock
              key={room.id}
              room={room}
              mode={layoutLocked ? "readonly" : mode}
              scale={scale}
              canDrag={layoutLocked ? false : canDrag}
              className={layoutLocked ? "pointer-events-none" : undefined}
              onRemove={layoutLocked ? undefined : onRemoveRoom}
              onMove={layoutLocked ? undefined : onMoveRoom}
              onResize={layoutLocked ? undefined : onResizeRoom}
            />
          ))
        : null}

      {visibility.markers
        ? floorMap.markers.map((marker) => (
            <FloorMapMarkerChip
              key={marker.id}
              marker={marker}
              mode={layoutLocked ? "readonly" : mode}
              scale={scale}
              canDrag={layoutLocked ? false : canDrag}
              className={layoutLocked ? "pointer-events-none" : undefined}
              onRemove={layoutLocked ? undefined : onRemoveMarker}
              onMove={layoutLocked ? undefined : onMoveMarker}
            />
          ))
        : null}

      {visibility.routes ? (
        <FloorMapRoutesLayer
          routes={floorMap.routes}
          routeDraft={routeDraft}
          mode={mode}
          onRemoveRoute={onRemoveRoute}
        />
      ) : null}

      {visibility.zones && mode === "readonly" ? (
        <svg
          className="pointer-events-none absolute inset-0 z-[14] size-full"
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <FloorMapZonePatternDefs />
          {floorMap.zones.map((zone) => (
            <FloorMapZoneBlock key={zone.id} zone={zone} mode="readonly" />
          ))}
        </svg>
      ) : null}

      {visibility.zones && mode === "edit"
        ? floorMap.zones.map((zone) => (
            <FloorMapZoneBlock
              key={zone.id}
              zone={zone}
              mode="edit"
              scale={scale}
              canDrag={canDrag}
              onRemove={onRemoveZone}
              onMove={onMoveZone}
              onResize={onResizeZone}
            />
          ))
        : null}

      {mode === "edit" && isEmpty ? <EmptyState /> : null}
    </div>
  )
}