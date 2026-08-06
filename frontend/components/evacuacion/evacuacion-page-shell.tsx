"use client"

import { Suspense, useCallback, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { Layers, MapPin } from "lucide-react"

import { EvacuationLayersLegend } from "@/components/evacuacion/evacuacion-layers-legend"
import { EvacuationNearestPointsPanel } from "@/components/evacuacion/evacuacion-nearest-points-panel"
import type { BasemapMode } from "@/components/map/evacuacion-map"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useNearestMeetingPoints } from "@/hooks/use-nearest-meeting-points"
import {
  CITIZEN_NAVBAR_CLEARANCE_PX,
  MAP_DESKTOP_ONLY_CLASS,
  MAP_MOBILE_ONLY_CLASS,
  MAP_PANEL_LEFT_POSITION_CLASS,
} from "@/lib/citizen-layout"
import type { EvacuationLayerHandles, EvacuationLayerVisibility } from "@/lib/evacuacion-layers"
import {
  INITIAL_EVACUATION_USER_LOCATION_STATE,
  type EvacuationUserLocationState,
} from "@/lib/evacuacion-location-state"
import { extractMeetingPointsFromGeoJSON } from "@/lib/evacuacion-meeting-points"
import type { EvacuationMeetingPoint } from "@/lib/evacuacion-meeting-points"
import { SURFACE_PANEL_SHELL_CLASS } from "@/lib/surface"
import { cn } from "@/lib/utils"

const EvacuationMap = dynamic(
  () =>
    import("@/components/map/evacuacion-map").then((m) => m.EvacuationMap),
  { ssr: false },
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
    useState<EvacuationUserLocationState>(INITIAL_EVACUATION_USER_LOCATION_STATE)
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
  const [mobileTab, setMobileTab] = useState<"points" | "layers" | null>(null)
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
        ? extractMeetingPointsFromGeoJSON(handles.tsunamiMeetingPoints, "tsunami")
        : []
      const volcanic = handles.volcanicMeetingPoints
        ? extractMeetingPointsFromGeoJSON(
            handles.volcanicMeetingPoints,
            "volcanic",
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
    [hazard],
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
    [],
  )

  const panelTop = CITIZEN_NAVBAR_CLEARANCE_PX + 12

  return (
    <div className="relative h-dvh w-full overflow-hidden">
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
          MAP_DESKTOP_ONLY_CLASS,
          "absolute z-20 flex flex-col gap-2 overflow-hidden",
          MAP_PANEL_LEFT_POSITION_CLASS,
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

      <div
        className={cn(
          MAP_MOBILE_ONLY_CLASS,
          "absolute bottom-4 left-3 z-20 flex flex-col gap-2",
        )}
      >
        <button
          type="button"
          className={cn(
            SURFACE_PANEL_SHELL_CLASS,
            "inline-flex h-11 items-center gap-2 px-3",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30",
          )}
          onClick={() => setMobileTab("points")}
        >
          <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
            Puntos
          </span>
        </button>
        <button
          type="button"
          className={cn(
            SURFACE_PANEL_SHELL_CLASS,
            "inline-flex h-11 items-center gap-2 px-3",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30",
          )}
          onClick={() => setMobileTab("layers")}
        >
          <Layers className="size-3.5 text-muted-foreground" aria-hidden />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
            Capas
          </span>
        </button>
      </div>

      <Sheet
        open={mobileTab != null}
        onOpenChange={(open) => {
          if (!open) setMobileTab(null)
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className={cn(
            SURFACE_PANEL_SHELL_CLASS,
            "max-h-[70dvh] gap-0 overflow-hidden rounded-none p-0 sm:max-w-none",
          )}
        >
          <SheetHeader className="relative z-10 border-b border-border px-3 py-2">
            <SheetTitle className="font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
              {mobileTab === "layers" ? "Capas" : "Puntos cercanos"}
            </SheetTitle>
          </SheetHeader>
          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
            {mobileTab === "layers" ? (
              <EvacuationLayersLegend
                visibility={layerVisibility}
                onToggle={toggleLayer}
                embedded
              />
            ) : (
              <EvacuationNearestPointsPanel
                points={localPoints}
                userLocationState={userLocationState}
                layersReady={layersReady}
                onFocusPoint={(p) => {
                  focusNearest(p.lng, p.lat)
                  setMobileTab(null)
                }}
                onRequestLocate={() => {
                  handleRequestLocate()
                  setMobileTab(null)
                }}
                embedded
                apiPoints={apiPoints}
                apiPending={nearestQuery.isPending && originLat != null}
                apiFailed={nearestQuery.isError}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
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
