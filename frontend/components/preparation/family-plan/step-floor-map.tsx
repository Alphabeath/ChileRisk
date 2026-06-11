"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import {
  createMarkerAt,
  createRoomAt,
  createZoneAt,
  FloorMapCanvas,
} from "@/components/preparation/family-plan/floor-map/floor-map-canvas"
import { FloorMapPhaseNav } from "@/components/preparation/family-plan/floor-map/floor-map-phase-nav"
import { FloorMapReviewStep } from "@/components/preparation/family-plan/floor-map/floor-map-review-step"
import { FloorMapTemplateStep } from "@/components/preparation/family-plan/floor-map/floor-map-template-step"
import { FloorMapToolBadge } from "@/components/preparation/family-plan/floor-map/floor-map-tool-badge"
import { FloorMapToolbar } from "@/components/preparation/family-plan/floor-map/floor-map-toolbar"
import type { LayerVisibility } from "@/components/preparation/family-plan/floor-map-layer-toggles"
import { newId } from "@/components/preparation/family-plan/family-plan-field"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import {
  FLOOR_MAP_TEMPLATES,
  type FloorMapTemplate,
} from "@/lib/floor-map-templates"
import {
  floorMapPhaseIndex,
  type FloorMapPhase,
} from "@/lib/floor-map-phases"
import {
  FLOOR_MAP_SELECT_TOOL,
  type FloorMapTool,
} from "@/lib/floor-map-tools"
import type { FloorMap, FloorMapRoom } from "@/lib/types"

const DEFAULT_PREVIEW =
  FLOOR_MAP_TEMPLATES.find((t) => t.id === "apartment-1b") ?? FLOOR_MAP_TEMPLATES[1]

function initialEditPhase(hasRooms: boolean, hasZones: boolean): FloorMapPhase {
  if (!hasRooms) return "template"
  if (!hasZones) return "layout"
  return "zones"
}

function initialMaxPhase(hasRooms: boolean, hasZones: boolean): FloorMapPhase {
  if (hasZones) return "zones"
  if (hasRooms) return "layout"
  return "template"
}

function visibilityForPhase(phase: FloorMapPhase): LayerVisibility {
  return {
    rooms: true,
    markers: phase !== "template",
    routes: phase === "zones",
    zones: phase === "zones",
  }
}

function previewRooms(template: FloorMapTemplate): FloorMapRoom[] {
  return template.rooms.map((r, i) => ({
    ...r,
    id: `preview-${i}`,
  }))
}

export function StepFloorMap() {
  const { data, updateData, saveNow, saveStatus } = useFamilyPlan()
  const hasRooms = (data?.floor_map.rooms.length ?? 0) > 0
  const hasZones = (data?.floor_map.zones.length ?? 0) > 0
  const isSaved = data?.floor_map.saved_at !== null

  type ViewMode = "saved" | "editing"
  const [viewMode, setViewMode] = useState<ViewMode>("editing")
  const didInitView = useRef(false)

  useEffect(() => {
    if (didInitView.current || !data) return
    didInitView.current = true
    if (data.floor_map.saved_at !== null && data.floor_map.rooms.length > 0) {
      setViewMode("saved")
    }
  }, [data])

  const showSavedView = hasRooms && viewMode === "saved"
  const [activeTool, setActiveTool] = useState<FloorMapTool>(FLOOR_MAP_SELECT_TOOL)
  const [routePoints, setRoutePoints] = useState<{ x: number; y: number }[]>([])
  const [previewTemplate, setPreviewTemplate] = useState<FloorMapTemplate>(DEFAULT_PREVIEW)
  const [phase, setPhase] = useState<FloorMapPhase>(() =>
    initialEditPhase(hasRooms, hasZones),
  )
  const [maxPhase, setMaxPhase] = useState<FloorMapPhase>(() =>
    initialMaxPhase(hasRooms, hasZones),
  )
  const [visibility, setVisibility] = useState<LayerVisibility>(() =>
    visibilityForPhase(initialEditPhase(hasRooms, hasZones)),
  )

  const floorMap = data?.floor_map

  const canvasFloorMap = useMemo<FloorMap>(() => {
    if (!floorMap) {
      return {
        rooms: [],
        markers: [],
        routes: [],
        zones: [],
        active_layer: "safe",
        saved_at: null,
      }
    }
    if (phase !== "template") return floorMap
    return {
      ...floorMap,
      rooms: previewRooms(previewTemplate),
      markers: [],
      zones: [],
      routes: [],
    }
  }, [floorMap, phase, previewTemplate])

  if (!data || !floorMap) return null

  function updateFloorMap(
    updater: (prev: FloorMap) => FloorMap,
    options?: { keepSaved?: boolean },
  ) {
    updateData((prev) => ({
      ...prev,
      floor_map: (() => {
        const next = updater(prev.floor_map)
        if (options?.keepSaved) return next
        return { ...next, saved_at: null }
      })(),
    }))
  }

  function handleCanvasPlace(coords: { x: number; y: number }) {
    const { x, y } = coords

    if (phase === "layout") {
      if (activeTool.mode === "room") {
        updateFloorMap((prev) => ({
          ...prev,
          rooms: [...prev.rooms, createRoomAt(x, y, activeTool.type)],
        }))
        setActiveTool(FLOOR_MAP_SELECT_TOOL)
      } else if (activeTool.mode === "marker") {
        updateFloorMap((prev) => ({
          ...prev,
          markers: [...prev.markers, createMarkerAt(x, y, activeTool.type)],
        }))
        setActiveTool(FLOOR_MAP_SELECT_TOOL)
      }
      return
    }

    if (phase === "zones") {
      if (activeTool.mode === "route") {
        const next = [...routePoints, { x, y }]
        setRoutePoints(next)
        if (next.length >= 2) {
          updateFloorMap((prev) => ({
            ...prev,
            routes: [...prev.routes, { id: newId(), points: next }],
          }))
          setRoutePoints([])
          setActiveTool(FLOOR_MAP_SELECT_TOOL)
        }
        return
      }

      if (activeTool.mode === "safe" || activeTool.mode === "risk") {
        const zone = createZoneAt(x, y, activeTool.mode === "safe" ? "safe" : "risk")
        updateFloorMap((prev) => ({
          ...prev,
          zones: [...prev.zones, zone],
        }))
        setActiveTool(FLOOR_MAP_SELECT_TOOL)
      }
    }
  }

  function handleToolChange(tool: FloorMapTool) {
    setActiveTool(tool)
    if (tool.mode !== "route") setRoutePoints([])
  }

  function undoRoutePoint() {
    setRoutePoints((prev) => prev.slice(0, -1))
  }

  function applyTemplate(template: FloorMapTemplate) {
    const seeded: FloorMapRoom[] = template.rooms.map((r) => ({
      ...r,
      id: newId(),
    }))
    updateFloorMap((prev) => ({
      ...prev,
      rooms: seeded,
      markers: [],
      zones: [],
      routes: [],
    }))
    setViewMode("editing")
  }

  function clearDataThroughPhase(target: FloorMapPhase) {
    updateFloorMap((prev) => {
      const next = { ...prev }
      if (floorMapPhaseIndex(target) <= floorMapPhaseIndex("layout")) {
        next.zones = []
        next.routes = []
      }
      if (floorMapPhaseIndex(target) <= floorMapPhaseIndex("template")) {
        next.markers = []
      }
      return next
    })
  }

  function goToPhase(next: FloorMapPhase) {
    setViewMode("editing")
    const goingBack = floorMapPhaseIndex(next) < floorMapPhaseIndex(phase)
    if (goingBack) {
      clearDataThroughPhase(next)
      if (floorMapPhaseIndex(next) < floorMapPhaseIndex(maxPhase)) {
        setMaxPhase(next)
      }
    }
    setPhase(next)
    setVisibility(visibilityForPhase(next))
    setActiveTool(FLOOR_MAP_SELECT_TOOL)
    if (next !== "zones") setRoutePoints([])
  }

  function handleTemplateSelect(template: FloorMapTemplate) {
    applyTemplate(template)
    setPhase("layout")
    setMaxPhase("layout")
    setVisibility(visibilityForPhase("layout"))
    setActiveTool(FLOOR_MAP_SELECT_TOOL)
  }

  function handleLayoutContinue() {
    setPhase("zones")
    setMaxPhase("zones")
    setVisibility(visibilityForPhase("zones"))
    setActiveTool(FLOOR_MAP_SELECT_TOOL)
  }

  function handleSaveFloorMap() {
    const savedAt = new Date().toISOString()
    setViewMode("saved")
    updateFloorMap((prev) => ({ ...prev, saved_at: savedAt }), { keepSaved: true })
    saveNow()
  }

  function startEditing() {
    setViewMode("editing")
    const editPhase = initialMaxPhase(hasRooms, hasZones)
    setPhase(editPhase)
    setMaxPhase(editPhase)
    setVisibility(visibilityForPhase(editPhase))
    setActiveTool(FLOOR_MAP_SELECT_TOOL)
    setRoutePoints([])
  }

  const counts = {
    rooms: floorMap.rooms.length,
    markers: floorMap.markers.length,
    routes: floorMap.routes.length,
    zones: floorMap.zones.length,
  }

  const canGoBack = phase === "layout" || phase === "zones"
  const canContinue = phase === "template" || phase === "layout"
  const isEditingPhase = phase === "layout" || phase === "zones"

  function handleBack() {
    if (phase === "layout") goToPhase("template")
    else if (phase === "zones") goToPhase("layout")
  }

  function handleContinue() {
    if (phase === "template") handleTemplateSelect(previewTemplate)
    else handleLayoutContinue()
  }

  const continueLabel =
    phase === "template" ? "Usar plantilla y continuar" : "Ir a zonas"

  if (showSavedView) {
    return (
      <div className="flex flex-col gap-3 border border-white/15">
        <FloorMapReviewStep
          floorMap={floorMap}
          saveStatus={saveStatus}
          onEdit={startEditing}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <FloorMapPhaseNav
        current={phase}
        maxReached={maxPhase}
        onSelect={goToPhase}
        onBack={canGoBack ? handleBack : undefined}
        onContinue={canContinue ? handleContinue : undefined}
        continueLabel={continueLabel}
        onSave={phase === "zones" ? handleSaveFloorMap : undefined}
        saveLabel={floorMap.saved_at ? "Actualizar plano" : "Guardar plano"}
      />

      <div className="flex flex-col border border-white/15">
        {isEditingPhase ? (
          <FloorMapToolbar
            phase={phase}
            activeTool={activeTool}
            onToolChange={handleToolChange}
            visibility={visibility}
            onToggleVisibility={(key, value) =>
              setVisibility((prev) => ({ ...prev, [key]: value }))
            }
            counts={counts}
            routeDraftLength={routePoints.length}
            onUndoRoutePoint={undoRoutePoint}
          />
        ) : null}

        <div className="relative">
          <FloorMapCanvas
            floorMap={canvasFloorMap}
            visibility={visibility}
            routeDraft={routePoints}
            activeTool={activeTool}
            readOnly={phase === "template"}
            layoutLocked={phase === "zones"}
            className="border-0"
            onCanvasPlace={handleCanvasPlace}
            onUpdate={updateFloorMap}
          />

          {isEditingPhase ? (
            <FloorMapToolBadge
              activeTool={activeTool}
              className="absolute top-2 left-1/2 z-10 -translate-x-1/2"
            />
          ) : null}

          {phase === "template" ? (
            <div className="absolute inset-0 z-20 flex min-h-0 flex-col bg-black/80 p-3 backdrop-blur-md sm:p-4">
              <FloorMapTemplateStep
                className="flex min-h-0 flex-1 flex-col overflow-hidden border-0 bg-black/50 shadow-none"
                onPreviewChange={setPreviewTemplate}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}