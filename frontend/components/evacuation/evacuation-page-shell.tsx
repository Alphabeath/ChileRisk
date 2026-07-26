"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
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
import { getNearestMeetingPoints } from "@/lib/api"
import { MAP_DESKTOP_ONLY_CONTENTS_CLASS } from "@/lib/citizen-layout"
import type { EvacuationLayerHandles, EvacuationLayerVisibility } from "@/lib/evacuation-layers"
import {
  INITIAL_EVACUATION_USER_LOCATION_STATE,
  type EvacuationUserLocationState,
} from "@/lib/evacuation-location-state"
import {
  extractMeetingPoints,
  nearestMeetingPoints,
} from "@/lib/evacuation-meeting-points"

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

function parseCoord(raw: string | null): number | null {
  if (raw == null || raw === "") return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function EvacuationPageShellInner() {
  const searchParams = useSearchParams()
  const hazardParam = searchParams.get("hazard")
  const hazard =
    hazardParam === "volcanic" || hazardParam === "tsunami"
      ? hazardParam
      : undefined
  const deepLat = parseCoord(searchParams.get("lat"))
  const deepLon = parseCoord(searchParams.get("lon"))
  const hasDeepOrigin = deepLat != null && deepLon != null

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
  const deepLinkFocusedRef = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  const meetingPoints = useMemo(() => meetingPointSource, [meetingPointSource])

  const focusNearest = useCallback((lng: number, lat: number) => {
    setFocusMeetingPoint({ lng, lat, nonce: Date.now() })
  }, [])

  const handleLayersReady = useCallback((handles: EvacuationLayerHandles) => {
    setLayersReady(true)
    const tsunami = handles.meetingPoints
      ? extractMeetingPoints(handles.meetingPoints.parseResult)
      : []
    const volcanic = handles.volcanicMeetingPoints
      ? extractMeetingPoints(handles.volcanicMeetingPoints.parseResult)
      : []
    const preferred =
      hazard === "volcanic"
        ? volcanic.length > 0
          ? volcanic
          : tsunami
        : tsunami.length > 0
          ? tsunami
          : volcanic
    setMeetingPointSource(preferred)
  }, [hazard])

  const toggleLayer = useCallback((key: keyof EvacuationLayerVisibility) => {
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleFocusPoint = useCallback((point: { lng: number; lat: number }) => {
    setFocusMeetingPoint({ ...point, nonce: Date.now() })
  }, [])

  // Deep-link: prefer API nearest when lat/lon present
  useEffect(() => {
    if (!hasDeepOrigin || deepLinkFocusedRef.current) return
    let cancelled = false

    void getNearestMeetingPoints({
      lat: deepLat!,
      lon: deepLon!,
      hazard,
      limit: 1,
    })
      .then((res) => {
        if (cancelled || deepLinkFocusedRef.current) return
        const nearest = res.items[0]
        if (!nearest) return
        deepLinkFocusedRef.current = true
        focusNearest(nearest.lng, nearest.lat)
      })
      .catch(() => {
        /* fall through to KMZ nearest below */
      })

    return () => {
      cancelled = true
    }
  }, [deepLat, deepLon, focusNearest, hasDeepOrigin, hazard])

  // Fallback: KMZ points + deep origin or GPS-ready location
  useEffect(() => {
    if (deepLinkFocusedRef.current) return
    if (meetingPointSource.length === 0) return

    const origin =
      hasDeepOrigin
        ? { lat: deepLat!, lng: deepLon! }
        : userLocationState.status === "ready"
          ? { lat: userLocationState.lat, lng: userLocationState.lng }
          : null

    if (!origin) return
    if (!hasDeepOrigin && !hazard) return

    const nearest = nearestMeetingPoints(meetingPointSource, origin, 1)[0]
    if (!nearest) return
    deepLinkFocusedRef.current = true
    const id = window.setTimeout(() => {
      focusNearest(nearest.lng, nearest.lat)
    }, 0)
    return () => window.clearTimeout(id)
  }, [
    deepLat,
    deepLon,
    focusNearest,
    hasDeepOrigin,
    hazard,
    meetingPointSource,
    userLocationState,
  ])

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

export function EvacuationPageShell() {
  return (
    <Suspense
      fallback={
        <div className="relative h-dvh max-h-dvh w-full overflow-hidden bg-black" />
      }
    >
      <EvacuationPageShellInner />
    </Suspense>
  )
}
