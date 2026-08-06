"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type * as maplibregl from "maplibre-gl"
import { Map as MapIcon, Satellite } from "lucide-react"

import {
  CHILE_BOUNDS,
  EVACUATION_MAP_MAX_ZOOM,
  EVACUATION_MAP_MIN_ZOOM,
  EVACUATION_MEETING_POINTS_MIN_ZOOM,
  EVACUATION_STREETS_STYLES,
  MAP_FLY_DURATION_MS,
} from "@/components/map/evacuacion-config"
import { EvacuationPopupShell } from "@/components/evacuacion/evacuacion-popup-shell"
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  useMap,
} from "@/components/ui/map"
import {
  addEvacuationLayers,
  removeEvacuationLayers,
  setEvacuationLayerVisibility,
  type EvacuationLayerHandles,
  type EvacuationLayerVisibility,
} from "@/lib/evacuacion-layers"
import type { EvacuationUserLocationState } from "@/lib/evacuacion-location-state"
import {
  getEvacuationClickLayerIds,
  isWithinChileMapBounds,
} from "@/lib/evacuacion-popup"
import {
  SURFACE_MICA_INTERACTIVE_CLASS,
  SURFACE_PANEL_SHELL_CLASS,
} from "@/lib/surface"
import { cn } from "@/lib/utils"

export type BasemapMode = "satellite" | "streets"

export interface EvacuationMapProps {
  layerVisibility: EvacuationLayerVisibility
  onLayersReady?: (handles: EvacuationLayerHandles) => void
  onUserLocationState?: (state: EvacuationUserLocationState) => void
  focusMeetingPoint?: { lng: number; lat: number; nonce: number } | null
  basemap?: BasemapMode
  onBasemapChange?: (mode: BasemapMode) => void
  requestLocate?: number
}

const DEFAULT_VISIBILITY: EvacuationLayerVisibility = {
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

const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "ESRI World Imagery",
    },
  },
  layers: [{ id: "esri", type: "raster", source: "esri" }],
}

type PopupState = {
  lng: number
  lat: number
  layerId: string
  properties: Record<string, unknown>
  key: number
}

export function EvacuationMap({
  layerVisibility = DEFAULT_VISIBILITY,
  onLayersReady,
  onUserLocationState,
  focusMeetingPoint = null,
  basemap = "satellite",
  onBasemapChange,
  requestLocate = 0,
}: EvacuationMapProps) {
  const styles = useMemo(
    () =>
      basemap === "satellite"
        ? { light: SATELLITE_STYLE, dark: SATELLITE_STYLE }
        : {
            light: EVACUATION_STREETS_STYLES.light,
            dark: EVACUATION_STREETS_STYLES.dark,
          },
    [basemap],
  )

  return (
    <Map
      className="h-full w-full"
      bounds={CHILE_BOUNDS}
      fitBoundsOptions={{ padding: 24, maxZoom: 5 }}
      maxBounds={[-120, -60, -30, -10]}
      minZoom={EVACUATION_MAP_MIN_ZOOM}
      maxZoom={EVACUATION_MAP_MAX_ZOOM}
      styles={styles}
    >
      <EvacuationLayers
        layerVisibility={layerVisibility}
        onLayersReady={onLayersReady}
        onUserLocationState={onUserLocationState}
        focusMeetingPoint={focusMeetingPoint}
        basemap={basemap}
        onBasemapChange={onBasemapChange}
        requestLocate={requestLocate}
      />
    </Map>
  )
}

function EvacuationLayers({
  layerVisibility,
  onLayersReady,
  onUserLocationState,
  focusMeetingPoint,
  basemap,
  onBasemapChange,
  requestLocate,
}: EvacuationMapProps) {
  const { map, isLoaded } = useMap()
  const visibilityRef = useRef(layerVisibility)
  const loadedRef = useRef(false)
  const [popup, setPopup] = useState<PopupState | null>(null)
  const [userLoc, setUserLoc] = useState<{ lng: number; lat: number } | null>(
    null,
  )
  const [showUserDot, setShowUserDot] = useState(
    () => (map?.getZoom() ?? 0) >= EVACUATION_MEETING_POINTS_MIN_ZOOM,
  )
  const [layersError, setLayersError] = useState<string | null>(null)

  useEffect(() => {
    if (!map) return
    const onZoom = () =>
      setShowUserDot(map.getZoom() >= EVACUATION_MEETING_POINTS_MIN_ZOOM)
    onZoom()
    // `zoom` fires continuously during animated zooms, so the dot mounts the
    // same frame the minzoom-11 layers appear mid-fly — not at fly end.
    map.on("zoom", onZoom)
    return () => {
      map.off("zoom", onZoom)
    }
  }, [map])

  useEffect(() => {
    visibilityRef.current = layerVisibility
  }, [layerVisibility])

  useEffect(() => {
    if (!map || !isLoaded || loadedRef.current) return
    let cancelled = false
    loadedRef.current = true

    void addEvacuationLayers(map, visibilityRef.current)
      .then((handles) => {
        if (cancelled) return
        onLayersReady?.(handles)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        loadedRef.current = false
        setLayersError(
          err instanceof Error ? err.message : "Error al cargar capas",
        )
      })

    return () => {
      cancelled = true
      removeEvacuationLayers(map)
      loadedRef.current = false
    }
  }, [map, isLoaded, onLayersReady])

  useEffect(() => {
    if (!map || !loadedRef.current) return
    void setEvacuationLayerVisibility(map, layerVisibility)
  }, [map, layerVisibility])

  useEffect(() => {
    if (!map || !isLoaded) return

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: getEvacuationClickLayerIds().filter((id) => map.getLayer(id)),
      })
      const feature = features[0]
      if (!feature?.layer?.id) {
        setPopup(null)
        return
      }
      setPopup({
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        layerId: feature.layer.id,
        properties: (feature.properties ?? {}) as Record<string, unknown>,
        key: Date.now(),
      })
    }

    map.on("click", onClick)
    return () => {
      map.off("click", onClick)
    }
  }, [map, isLoaded])

  useEffect(() => {
    if (!map || !focusMeetingPoint) return
    map.flyTo({
      center: [focusMeetingPoint.lng, focusMeetingPoint.lat],
      zoom: Math.max(map.getZoom(), 13),
      duration: MAP_FLY_DURATION_MS,
      essential: true,
    })
  }, [map, focusMeetingPoint])

  const applyUserLocation = useCallback(
    (lng: number, lat: number, fly: boolean) => {
      if (!isWithinChileMapBounds(lng, lat)) {
        onUserLocationState?.({
          status: "unavailable",
          reason: "out-of-bounds",
        })
        return
      }
      setUserLoc({ lng, lat })
      onUserLocationState?.({ status: "ready", lng, lat })
      if (fly) {
        map?.flyTo({
          center: [lng, lat],
          zoom: 13,
          duration: MAP_FLY_DURATION_MS,
          essential: true,
        })
      }
    },
    [map, onUserLocationState],
  )

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      onUserLocationState?.({ status: "unavailable", reason: "unsupported" })
      return
    }
    onUserLocationState?.({ status: "pending" })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyUserLocation(pos.coords.longitude, pos.coords.latitude, true)
      },
      (err) => {
        onUserLocationState?.({
          status: "unavailable",
          reason: err.code === err.PERMISSION_DENIED ? "denied" : "error",
        })
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    )
  }, [applyUserLocation, onUserLocationState])

  const locateUserRef = useRef(locateUser)
  useEffect(() => {
    locateUserRef.current = locateUser
  }, [locateUser])

  // Only re-run on explicit locate requests — not when locateUser identity churns.
  useEffect(() => {
    if ((requestLocate ?? 0) > 0) locateUserRef.current()
  }, [requestLocate])

  // If the browser already granted geolocation, resolve coords without a click.
  useEffect(() => {
    if (!navigator.geolocation) return
    let cancelled = false

    void (async () => {
      try {
        if (!navigator.permissions?.query) return
        const status = await navigator.permissions.query({
          name: "geolocation",
        })
        if (cancelled || status.state !== "granted") return
        locateUserRef.current()
      } catch {
        /* Permissions API unavailable — stay idle until user clicks. */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      {userLoc && showUserDot ? (
        <MapMarker longitude={userLoc.lng} latitude={userLoc.lat}>
          <MarkerContent>
            <span
              className="relative flex size-10 items-center justify-center"
              aria-label="Tu ubicación actual"
            >
              <span
                className="absolute size-10 animate-ping rounded-full bg-sky-400/45"
                aria-hidden
              />
              <span
                className="absolute size-6 rounded-full bg-sky-500/25 ring-1 ring-sky-300/60"
                aria-hidden
              />
              <span
                className="relative size-3.5 rounded-full border-2 border-white bg-sky-500 shadow-md"
                aria-hidden
              />
            </span>
            <MarkerLabel
              position="bottom"
              className="rounded-none border border-border/60 bg-background/80 px-1.5 py-0.5 font-semibold uppercase tracking-[1.2px] backdrop-blur-sm"
            >
              Tu ubicación
            </MarkerLabel>
          </MarkerContent>
        </MapMarker>
      ) : null}

      {popup ? (
        <EvacuationPopupShell
          selection={{
            lng: popup.lng,
            lat: popup.lat,
            layerId: popup.layerId,
            properties: popup.properties,
          }}
          popupKey={popup.key}
          onClose={() => setPopup(null)}
        />
      ) : null}

      <MapControls
        position="bottom-right"
        showCompass
        showLocate
        showZoom
        onLocate={({ longitude, latitude }) => {
          // MapControls already flies to the coords.
          applyUserLocation(longitude, latitude, false)
        }}
      >
        <div
          className={cn(
            "border-border bg-background/80 flex w-fit overflow-hidden rounded-none border shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/70",
            SURFACE_MICA_INTERACTIVE_CLASS,
          )}
          role="group"
          aria-label="Tipo de vista del mapa"
        >
          <button
            type="button"
            className={cn(
              "inline-flex h-8 items-center gap-1 border-r border-border px-2 font-mono text-[9px] font-semibold uppercase tracking-[1.1px] transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring/30",
              basemap === "satellite"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            onClick={() => onBasemapChange?.("satellite")}
            aria-pressed={basemap === "satellite"}
          >
            <Satellite className="size-3.5" aria-hidden />
            Satélite
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex h-8 items-center gap-1 px-2 font-mono text-[9px] font-semibold uppercase tracking-[1.1px] transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring/30",
              basemap === "streets"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            onClick={() => onBasemapChange?.("streets")}
            aria-pressed={basemap === "streets"}
          >
            <MapIcon className="size-3.5" aria-hidden />
            Calle
          </button>
        </div>
      </MapControls>

      {layersError ? (
        <div
          className={cn(
            SURFACE_PANEL_SHELL_CLASS,
            "absolute bottom-20 left-1/2 z-20 max-w-sm -translate-x-1/2 px-3 py-2 text-xs text-destructive",
          )}
        >
          {layersError}
        </div>
      ) : null}
    </>
  )
}

