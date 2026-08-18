"use client"

import { Suspense, useCallback, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { Layers, MapPin } from "lucide-react"

import { EvacuationLayersLegend } from "@/components/evacuacion/evacuacion-layers-legend"
import { EvacuationNearestPointsPanel } from "@/components/evacuacion/evacuacion-nearest-points-panel"
import { MapBottomDrawer } from "@/components/map/map-bottom-drawer"
import type { BasemapMode } from "@/components/map/evacuacion-map"
import { useNearestMeetingPoints } from "@/hooks/use-nearest-meeting-points"
import {
  CITIZEN_NAVBAR_CLEARANCE_PX,
  MAP_PANEL_LEFT_POSITION_CLASS,
  MAP_WIDE_ONLY_CLASS,
} from "@/lib/citizen-layout"
import type {
  EvacuationLayerHandles,
  EvacuationLayerVisibility,
} from "@/lib/evacuacion-layers"
import {
  INITIAL_EVACUATION_USER_LOCATION_STATE,
  type EvacuationUserLocationState,
} from "@/lib/evacuacion-location-state"
import { extractMeetingPointsFromGeoJSON } from "@/lib/evacuacion-meeting-points"
import type { EvacuationMeetingPoint } from "@/lib/evacuacion-meeting-points"
import { cn } from "@/lib/utils"

const EvacuationMap = dynamic(
  () => import("@/components/map/evacuacion-map").then((m) => m.EvacuationMap),
  { ssr: false }
)

const initialVisibility: EvacuationLayerVisibility = {
  areas: true,
  routes: true,
  meetingPoints: true,
  volcanicRoutes: true,
  volcanicMeetingPointsPe: true,
  volcanicMeetingPointsPet: true,
  volcanoes: true,
  volcanicRadii: false,
  volcanicHazards: true,
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
  const [userLocationState, setUserLocationState] =
    useState<EvacuationUserLocationState>(
      INITIAL_EVACUATION_USER_LOCATION_STATE
    )
  const [userFocusPoint, setUserFocusPoint] = useState<{
    lng: number
    lat: number
    nonce: number
  } | null>(null)
  const [localPoints, setLocalPoints] = useState<
    Omit<EvacuationMeetingPoint, "distanceKm">[]
  >([])
  const [basemap, setBasemap] = useState<BasemapMode>("satellite")
  const [requestLocate, setRequestLocate] = useState(0)
  const [deepLinkNonce] = useState(() => Date.now())

  const originLat =
    userLocationState.status === "ready"
      ? userLocationState.lat
      : hasDeepOrigin
        ? deepLat!
        : null
  const originLon =
    userLocationState.status === "ready"
      ? userLocationState.lng
      : hasDeepOrigin
        ? deepLon!
        : null

  const nearestQuery = useNearestMeetingPoints({
    lat: originLat,
    lon: originLon,
    hazard,
    limit: 5,
    enabled: originLat != null && originLon != null,
  })

  const apiPoints: EvacuationMeetingPoint[] | null = useMemo(() => {
    if (nearestQuery.isError) return null
    if (!nearestQuery.data?.items?.length) return null
    return nearestQuery.data.items.map((item) => ({
      id: item.id,
      comuna: item.comuna || "—",
      provincia: item.provincia || "—",
      sector: item.sector || "—",
      lng: item.lng,
      lat: item.lat,
      distanceKm: item.distance_km ?? null,
    }))
  }, [nearestQuery.data, nearestQuery.isError])

  const deepLinkFocus = useMemo(() => {
    if (!hasDeepOrigin) return null
    const nearest = nearestQuery.data?.items?.[0]
    if (!nearest) return null
    return {
      lng: nearest.lng,
      lat: nearest.lat,
      nonce: deepLinkNonce,
    }
  }, [hasDeepOrigin, nearestQuery.data, deepLinkNonce])

  const focusMeetingPoint = userFocusPoint ?? deepLinkFocus

  const handleLayersReady = useCallback(
    (handles: EvacuationLayerHandles) => {
      setLayersReady(true)
      const tsunami = handles.tsunamiMeetingPoints
        ? extractMeetingPointsFromGeoJSON(
            handles.tsunamiMeetingPoints,
            "tsunami"
          )
        : []
      const volcanic = handles.volcanicMeetingPoints
        ? extractMeetingPointsFromGeoJSON(
            handles.volcanicMeetingPoints,
            "volcanic"
          )
        : []
      const preferred =
        hazard === "volcanic"
          ? volcanic.length > 0
            ? volcanic
            : tsunami
          : tsunami.length > 0
            ? tsunami
            : volcanic
      setLocalPoints(preferred)
    },
    [hazard]
  )

  const toggleLayer = useCallback((key: keyof EvacuationLayerVisibility) => {
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const focusNearest = useCallback((lng: number, lat: number) => {
    setUserFocusPoint({ lng, lat, nonce: Date.now() })
  }, [])

  const handleRequestLocate = useCallback(() => {
    setUserLocationState({ status: "pending" })
    setRequestLocate((n) => n + 1)
  }, [])

  const handleUserLocationState = useCallback(
    (state: EvacuationUserLocationState) => {
      setUserLocationState(state)
    },
    []
  )

  const panelTop = CITIZEN_NAVBAR_CLEARANCE_PX + 12

  return (
    <div className="map-bottom-drawer-layout relative h-dvh w-full overflow-hidden">
      <EvacuationMap
        layerVisibility={layerVisibility}
        onLayersReady={handleLayersReady}
        onUserLocationState={handleUserLocationState}
        focusMeetingPoint={focusMeetingPoint}
        basemap={basemap}
        onBasemapChange={setBasemap}
        requestLocate={requestLocate}
      />

      <div
        className={cn(
          MAP_WIDE_ONLY_CLASS,
          "absolute z-20 flex-col gap-2 overflow-hidden",
          MAP_PANEL_LEFT_POSITION_CLASS
        )}
        style={{
          top: panelTop,
          height: `calc(100dvh - ${panelTop}px - 12px)`,
        }}
      >
        <EvacuationNearestPointsPanel
          points={localPoints}
          userLocationState={userLocationState}
          layersReady={layersReady}
          onFocusPoint={(p) => focusNearest(p.lng, p.lat)}
          onRequestLocate={handleRequestLocate}
          apiPoints={apiPoints}
          apiPending={nearestQuery.isPending && originLat != null}
          apiFailed={nearestQuery.isError}
          className="max-h-[calc((100dvh-80px)/2)]"
        />
        <EvacuationLayersLegend
          visibility={layerVisibility}
          onToggle={toggleLayer}
          className="max-h-[calc((100dvh-80px)/2)]"
        />
      </div>
      <MapBottomDrawer
        id="evacuation-map-controls"
        title="Controles de evacuación"
        description="Puntos de encuentro y capas oficiales del mapa de evacuación."
        defaultValue="points"
        tabs={[
          {
            value: "points",
            label: "Puntos",
            icon: <MapPin aria-hidden />,
            meta: localPoints.length,
            render: (close) => (
              <EvacuationNearestPointsPanel
                points={localPoints}
                userLocationState={userLocationState}
                layersReady={layersReady}
                onFocusPoint={(p) => {
                  focusNearest(p.lng, p.lat)
                  close()
                }}
                onRequestLocate={() => {
                  handleRequestLocate()
                  close()
                }}
                embedded
                className="min-h-0 flex-1"
                apiPoints={apiPoints}
                apiPending={nearestQuery.isPending && originLat != null}
                apiFailed={nearestQuery.isError}
              />
            ),
          },
          {
            value: "layers",
            label: "Capas",
            icon: <Layers aria-hidden />,
            render: () => (
              <EvacuationLayersLegend
                visibility={layerVisibility}
                onToggle={toggleLayer}
                embedded
              />
            ),
          },
        ]}
      />
    </div>
  )
}

export function EvacuationPageShell() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center text-sm text-muted-foreground">
          Cargando mapa de evacuación…
        </div>
      }
    >
      <EvacuationPageShellInner />
    </Suspense>
  )
}
