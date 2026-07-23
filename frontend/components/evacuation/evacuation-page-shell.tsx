"use client"

import { useCallback, useMemo, useState } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import { EvacuationMap } from "@/components/map/evacuation-map"
import { EvacuationLeftPanelsColumn } from "@/components/evacuation/evacuation-left-panels-column"
import { EvacuationMobileDrawer } from "@/components/evacuation/evacuation-mobile-drawer"
import { MAP_DESKTOP_ONLY_CONTENTS_CLASS } from "@/lib/citizen-layout"
import type { EvacuationLayerHandles, EvacuationLayerVisibility } from "@/lib/evacuation-layers"
import {
  INITIAL_EVACUATION_USER_LOCATION_STATE,
  type EvacuationUserLocationState,
} from "@/lib/evacuation-location-state"
import { extractMeetingPoints } from "@/lib/evacuation-meeting-points"

export const EVACUATION_DND_CONTEXT_ID = "chilerisk-evacuation-panels"

const initialVisibility: EvacuationLayerVisibility = {
  areas: true,
  routes: true,
  meetingPoints: true,
  volcanicRoutes: true,
  volcanicMeetingPoints: true,
  volcanoes: true,
  volcanicRadii: true,
  volcanicHazards: false,
  wildfireOccurrence: false,
}

export function EvacuationPageShell() {
  const [layerVisibility, setLayerVisibility] =
    useState<EvacuationLayerVisibility>(initialVisibility)
  const [layersReady, setLayersReady] = useState(false)
  const [userLocationState, setUserLocationState] = useState<EvacuationUserLocationState>(
    INITIAL_EVACUATION_USER_LOCATION_STATE,
  )
  const [focusMeetingPoint, setFocusMeetingPoint] = useState<{
    lng: number
    lat: number
    nonce: number
  } | null>(null)
  const [meetingPointSource, setMeetingPointSource] = useState<
    ReturnType<typeof extractMeetingPoints>
  >([])
  const [locationPromptActive, setLocationPromptActive] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  const meetingPoints = useMemo(() => meetingPointSource, [meetingPointSource])

  const handleLayersReady = useCallback((handles: EvacuationLayerHandles) => {
    setLayersReady(true)
    if (handles.meetingPoints) {
      setMeetingPointSource(extractMeetingPoints(handles.meetingPoints.parseResult))
    }
  }, [])

  const toggleLayer = useCallback((key: keyof EvacuationLayerVisibility) => {
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleFocusPoint = useCallback((point: { lng: number; lat: number }) => {
    setFocusMeetingPoint({ ...point, nonce: Date.now() })
  }, [])

  return (
    <div className="relative h-dvh max-h-dvh w-full overflow-hidden overscroll-none">
      <EvacuationMap
        layerVisibility={layerVisibility}
        onLayersReady={handleLayersReady}
        onUserLocationState={setUserLocationState}
        focusMeetingPoint={focusMeetingPoint}
        onLocationPromptVisibleChange={setLocationPromptActive}
      />

      <div className={MAP_DESKTOP_ONLY_CONTENTS_CLASS}>
        <DndContext
          id={EVACUATION_DND_CONTEXT_ID}
          sensors={sensors}
          modifiers={[restrictToWindowEdges]}
        >
          <EvacuationLeftPanelsColumn
            layerVisibility={layerVisibility}
            onToggleLayer={toggleLayer}
            meetingPoints={meetingPoints}
            userLocationState={userLocationState}
            layersReady={layersReady}
            onFocusPoint={handleFocusPoint}
            locationPromptActive={locationPromptActive}
          />
        </DndContext>
      </div>

      <EvacuationMobileDrawer
        layerVisibility={layerVisibility}
        onToggleLayer={toggleLayer}
        meetingPoints={meetingPoints}
        userLocationState={userLocationState}
        layersReady={layersReady}
        onFocusPoint={handleFocusPoint}
        locationPromptActive={locationPromptActive}
      />

      <p className="pointer-events-none absolute inset-x-0 bottom-2 z-10 hidden text-center text-[10px] text-white/35 md:block">
        SENAPRED · Evacuación por tsunami y actividad volcánica
      </p>
    </div>
  )
}
