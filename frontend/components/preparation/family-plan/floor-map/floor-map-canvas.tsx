"use client"

import { FloorMapRenderer } from "@/components/preparation/family-plan/floor-map/floor-map-renderer"
import {
  clientToCanvas,
  useFloorMapViewport,
} from "@/components/preparation/family-plan/floor-map/use-floor-map-viewport"
import { newId } from "@/components/preparation/family-plan/family-plan-field"
import type { LayerVisibility } from "@/components/preparation/family-plan/floor-map-layer-toggles"
import {
  CANVAS_H,
  CANVAS_W,
  DEFAULT_ROOM_H,
  DEFAULT_ROOM_W,
  DEFAULT_ZONE_SIZE,
  MARKER_SIZE,
  snap,
} from "@/lib/floor-map-constants"
import { isPlacementTool, type FloorMapTool } from "@/lib/floor-map-tools"
import type {
  FloorMap,
  FloorMapMarker,
  FloorMapPoint,
  FloorMapRoom,
  FloorMapZone,
} from "@/lib/types"
import { cn } from "@/lib/utils"

interface FloorMapCanvasProps {
  floorMap: FloorMap
  visibility: LayerVisibility
  routeDraft: FloorMapPoint[]
  activeTool: FloorMapTool
  readOnly?: boolean
  layoutLocked?: boolean
  className?: string
  onCanvasPlace: (coords: { x: number; y: number }) => void
  onUpdate: (updater: (prev: FloorMap) => FloorMap) => void
}

export function FloorMapCanvas({
  floorMap,
  visibility,
  routeDraft,
  activeTool,
  readOnly = false,
  layoutLocked = false,
  className,
  onCanvasPlace,
  onUpdate,
}: FloorMapCanvasProps) {
  const {
    containerRef,
    fitScale,
    containerHeight,
    contentWidth,
    contentHeight,
  } = useFloorMapViewport()

  const canDrag = !readOnly && activeTool.mode === "select"

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (readOnly) return
    if ((e.target as HTMLElement).closest("[data-floor-map-item]")) return
    const rect = e.currentTarget.getBoundingClientRect()
    const coords = clientToCanvas(e.clientX, e.clientY, rect)
    onCanvasPlace(coords)
  }

  function moveRoom(id: string, next: { x: number; y: number }) {
    onUpdate((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === id ? { ...r, ...next } : r)),
    }))
  }

  function resizeRoom(
    id: string,
    next: { x: number; y: number; w: number; h: number },
  ) {
    onUpdate((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === id ? { ...r, ...next } : r)),
    }))
  }

  function moveMarker(id: string, next: { x: number; y: number }) {
    onUpdate((prev) => ({
      ...prev,
      markers: prev.markers.map((m) => (m.id === id ? { ...m, ...next } : m)),
    }))
  }

  function moveZone(id: string, next: { x: number; y: number }) {
    onUpdate((prev) => ({
      ...prev,
      zones: prev.zones.map((z) => (z.id === id ? { ...z, ...next } : z)),
    }))
  }

  function removeRoom(id: string) {
    onUpdate((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((r) => r.id !== id),
    }))
  }

  function resizeZone(
    id: string,
    next: { x: number; y: number; w: number; h: number },
  ) {
    onUpdate((prev) => ({
      ...prev,
      zones: prev.zones.map((z) => (z.id === id ? { ...z, ...next } : z)),
    }))
  }

  function removeMarker(id: string) {
    onUpdate((prev) => ({
      ...prev,
      markers: prev.markers.filter((m) => m.id !== id),
    }))
  }

  function removeZone(id: string) {
    onUpdate((prev) => ({
      ...prev,
      zones: prev.zones.filter((z) => z.id !== id),
    }))
  }

  function removeRoute(id: string) {
    onUpdate((prev) => ({
      ...prev,
      routes: prev.routes.filter((r) => r.id !== id),
    }))
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-auto border border-white/15 bg-black/30",
        className,
      )}
      style={{ height: containerHeight }}
    >
      <div
        className="relative"
        style={{ width: contentWidth, height: contentHeight, minWidth: "100%", minHeight: "100%" }}
      >
        <FloorMapRenderer
          floorMap={floorMap}
          mode={readOnly ? "readonly" : "edit"}
          visibility={visibility}
          routeDraft={routeDraft}
          scale={fitScale}
          canDrag={canDrag}
          layoutLocked={layoutLocked}
          showCrosshair={!readOnly && isPlacementTool(activeTool)}
          onCanvasClick={handleCanvasClick}
          onRemoveRoom={removeRoom}
          onMoveRoom={moveRoom}
          onResizeRoom={resizeRoom}
          onRemoveMarker={removeMarker}
          onMoveMarker={moveMarker}
          onRemoveZone={removeZone}
          onMoveZone={moveZone}
          onResizeZone={resizeZone}
          onRemoveRoute={removeRoute}
        />
      </div>
    </div>
  )
}

export function createRoomAt(x: number, y: number, type: string): FloorMapRoom {
  return {
    id: newId(),
    type,
    x: snap(x - DEFAULT_ROOM_W / 2, CANVAS_W - DEFAULT_ROOM_W),
    y: snap(y - DEFAULT_ROOM_H / 2, CANVAS_H - DEFAULT_ROOM_H),
    w: DEFAULT_ROOM_W,
    h: DEFAULT_ROOM_H,
  }
}

export function createMarkerAt(x: number, y: number, type: string): FloorMapMarker {
  return {
    id: newId(),
    type,
    x: snap(x - MARKER_SIZE / 2, CANVAS_W - MARKER_SIZE),
    y: snap(y - MARKER_SIZE / 2, CANVAS_H - MARKER_SIZE),
  }
}

export function createZoneAt(
  x: number,
  y: number,
  type: FloorMapZone["type"],
): FloorMapZone {
  return {
    id: newId(),
    type,
    x: Math.max(0, snap(x - DEFAULT_ZONE_SIZE / 2, CANVAS_W - DEFAULT_ZONE_SIZE)),
    y: Math.max(0, snap(y - DEFAULT_ZONE_SIZE / 2, CANVAS_H - DEFAULT_ZONE_SIZE)),
    w: DEFAULT_ZONE_SIZE,
    h: DEFAULT_ZONE_SIZE,
  }
}