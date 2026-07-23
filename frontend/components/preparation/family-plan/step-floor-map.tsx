"use client"

import { useMemo, useState } from "react"

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
import {
  FamilyPlanStatusBanner,
  FamilyPlanStatusChip,
  FamilyPlanStepRoot,
} from "@/components/preparation/family-plan/family-plan-layout"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import {
  FLOOR_MAP_TEMPLATES,
  type FloorMapTemplate,
} from "@/lib/floor-map-templates"
import {
  FLOOR_MAP_PHASES,
  floorMapPhaseIndex,
  type FloorMapPhase,
} from "@/lib/floor-map-phases"
import {
  FLOOR_MAP_SELECT_TOOL,
  type FloorMapTool,
} from "@/lib/floor-map-tools"
import type { FloorMap, FloorMapRoom } from "@/lib/types"
import { Check, Map } from "lucide-react"
import { cn } from "@/lib/utils"

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

function FloorMapChromeBanner({
  phase,
  saved,
  roomCount,
  zoneCount,
}: {
  phase?: FloorMapPhase
  saved?: boolean
  roomCount: number
  zoneCount: number
}) {
  const phaseMeta = phase
    ? FLOOR_MAP_PHASES.find((p) => p.id === phase)
    : null
  const stepIndex = phase ? floorMapPhaseIndex(phase) + 1 : 3
  const pct = Math.round((stepIndex / FLOOR_MAP_PHASES.length) * 100)

  return (
    <FamilyPlanStatusBanner>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center border",
            saved
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
              : "border-white/20 bg-white/10 text-white",
          )}
          aria-hidden
        >
          {saved ? <Check className="size-4" /> : <Map className="size-4" />}
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/85">
            {saved ? "Plano guardado" : "Mapa de la vivienda"}
          </p>
          <p className="mt-0.5 text-[11.5px] text-white/55">
            {saved
              ? `${roomCount} habitaciones · ${zoneCount} zonas`
              : phaseMeta
                ? `Fase ${phaseMeta.step} de ${FLOOR_MAP_PHASES.length}: ${phaseMeta.label} — ${phaseMeta.description}`
                : "Representa tu hogar paso a paso"}
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[10rem] sm:items-end">
        {!saved ? (
          <div className="relative h-1.5 w-full border border-white/10 bg-white/5 sm:max-w-xs">
            <span
              className="block h-full bg-cyan-400/70 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-1.5">
          {saved ? (
            <FamilyPlanStatusChip tone="complete">Listo</FamilyPlanStatusChip>
          ) : (
            <FamilyPlanStatusChip tone="started">
              {phaseMeta?.label ?? "Edición"}
            </FamilyPlanStatusChip>
          )}
          <FamilyPlanStatusChip tone={roomCount > 0 ? "started" : "empty"}>
            {roomCount} hab.
          </FamilyPlanStatusChip>
          <FamilyPlanStatusChip tone={zoneCount > 0 ? "started" : "empty"}>
            {zoneCount} zonas
          </FamilyPlanStatusChip>
        </div>
      </div>
    </FamilyPlanStatusBanner>
  )
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
  const defaultSavedView =
    data != null &&
    data.floor_map.saved_at !== null &&
    data.floor_map.rooms.length > 0

  type ViewMode = "saved" | "editing"
  const [viewOverride, setViewOverride] = useState<ViewMode | null>(null)
  const viewMode: ViewMode = viewOverride ?? (defaultSavedView ? "saved" : "editing")
  const setViewMode = (mode: ViewMode) => setViewOverride(mode)

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
    updateData((prev) => {
      const next = updater(prev.floor_map)
      if (options?.keepSaved) {
        return { ...prev, floor_map: next }
      }
      return {
        ...prev,
        floor_map: {
          ...next,
          saved_at: prev.floor_map.saved_at,
        },
      }
    })
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
      <FamilyPlanStepRoot>
        <FloorMapChromeBanner
          saved
          roomCount={floorMap.rooms.length}
          zoneCount={floorMap.zones.length}
        />
        <div className="border border-white/15">
          <FloorMapReviewStep
            floorMap={floorMap}
            saveStatus={saveStatus}
            onEdit={startEditing}
          />
        </div>
      </FamilyPlanStepRoot>
    )
  }

  return (
    <FamilyPlanStepRoot>
      <FloorMapChromeBanner
        phase={phase}
        roomCount={floorMap.rooms.length}
        zoneCount={floorMap.zones.length}
      />

      <details className="border border-white/15 bg-white/[0.04] px-4 py-3 open:bg-white/[0.05]">
        <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[1.2px] text-white/70">
          Cómo editar el plano
        </summary>
        <p className="mt-2 text-[12.5px] leading-snug text-white/55">
          Elige una plantilla, luego habitaciones y zonas. En móvil la barra de
          herramientas queda arriba del plano: activa una herramienta y toca el
          mapa para colocar elementos.
        </p>
      </details>

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
    </FamilyPlanStepRoot>
  )
}