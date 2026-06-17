"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { Map, Satellite } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CHILE_BOUNDS,
  EVACUATION_LAYER_IDS,
  EVACUATION_SATELLITE_STYLE,
  EVACUATION_STREETS_STYLE,
  isVolcanicHazardLayer,
  isVolcanoLayer,
  isWildfireLayer,
  WILDFIRE_COLOR_1,
  WILDFIRE_COLOR_2,
  WILDFIRE_COLOR_3,
  WILDFIRE_COLOR_4,
  WILDFIRE_COLOR_5,
} from "./map-config"
import { MAP_FIT_BOUNDS_PADDING, MAP_POPUP_OPTIONS } from "./map-popup-options"
import {
  addPopupToOverlay,
  createPopupContent,
  EvacuationAreaPopupContent,
  EvacuationKmzPopupContent,
} from "./map-popup"
import {
  buildGoogleMapsPlaceUrl,
  evacuationAreaFields,
  evacuationKmzFields,
  fieldOrDash,
  getDisasterGuideHref,
  getDisasterGuideLabel,
  getEvacuationClickLayerIds,
  getEvacuationPopupMeta,
  isEvacuationMeetingPointLayer,
  isWithinChileMapBounds,
} from "@/lib/evacuation-popup"
import {
  dismissEvacuationLocationPrompt,
  EvacuationLocationPrompt,
  getGeolocationPermissionState,
  wasEvacuationLocationDismissed,
  type EvacuationLocationPromptStatus,
} from "@/components/evacuation/evacuation-location-prompt"
import {
  addEvacuationLayers,
  ensureVolcanicHazardsLayer,
  ensureWildfireOccurrenceLayer,
  removeEvacuationLayers,
  setEvacuationLayerVisibility,
  type EvacuationLayerHandles,
  type EvacuationLayerVisibility,
} from "@/lib/evacuation-layers"
import type { EvacuationUserLocationState } from "@/lib/evacuation-location-state"

type BasemapMode = "satellite" | "streets"

export interface EvacuationMapProps {
  layerVisibility?: EvacuationLayerVisibility
  onLayersReady?: (handles: EvacuationLayerHandles) => void
  onUserLocationState?: (state: EvacuationUserLocationState) => void
  focusMeetingPoint?: { lng: number; lat: number } | null
  onLocationPromptVisibleChange?: (visible: boolean) => void
}

const DEFAULT_LAYER_VISIBILITY: EvacuationLayerVisibility = {
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

const USER_LOCATION_ZOOM = 13

export function EvacuationMap({
  layerVisibility = DEFAULT_LAYER_VISIBILITY,
  onLayersReady,
  onUserLocationState,
  focusMeetingPoint = null,
  onLocationPromptVisibleChange,
}: EvacuationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const layerHandlesRef = useRef<EvacuationLayerHandles | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const popupDestroyRef = useRef<(() => void) | null>(null)
  const sizeObserverRef = useRef<ResizeObserver | null>(null)
  const visibilityRef = useRef(layerVisibility)
  const isFirstBasemapRef = useRef(true)
  const layersLoadIdRef = useRef(0)
  const layersReadyRef = useRef(false)
  const locationOfferedMapRef = useRef<maplibregl.Map | null>(null)

  const [basemap, setBasemap] = useState<BasemapMode>("satellite")
  const [layersError, setLayersError] = useState<string | null>(null)
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)
  const [locationPromptStatus, setLocationPromptStatus] =
    useState<EvacuationLocationPromptStatus>("idle")

  useEffect(() => {
    visibilityRef.current = layerVisibility
  }, [layerVisibility])

  const getStyle = useCallback((mode: BasemapMode) => {
    return mode === "satellite" ? EVACUATION_SATELLITE_STYLE : EVACUATION_STREETS_STYLE
  }, [])

  const dismissPopup = useCallback(() => {
    popupRef.current?.remove()
    popupRef.current = null
    popupDestroyRef.current?.()
    popupDestroyRef.current = null
  }, [])

  const showPopup = useCallback(
    (map: maplibregl.Map, lngLat: maplibregl.LngLatLike, content: ReactNode) => {
      dismissPopup()

      const { element, destroy } = createPopupContent(content)
      popupDestroyRef.current = destroy
      popupRef.current = addPopupToOverlay(
        map,
        new maplibregl.Popup(MAP_POPUP_OPTIONS)
          .setLngLat(lngLat)
          .setDOMContent(element),
      )
      popupRef.current.on("close", () => {
        destroy()
        popupDestroyRef.current = null
        popupRef.current = null
      })
    },
    [dismissPopup],
  )

  const flyToUserLocation = useCallback(
    (
      map: maplibregl.Map,
      handlers?: {
        onStart?: () => void
        onSuccess?: () => void
        onOutOfBounds?: () => void
        onError?: (code: number) => void
      },
    ) => {
      if (!navigator.geolocation) {
        onUserLocationState?.({ status: "unavailable", reason: "unsupported" })
        handlers?.onError?.(0)
        return
      }

      onUserLocationState?.({ status: "pending" })
      handlers?.onStart?.()

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords
          if (!isWithinChileMapBounds(longitude, latitude)) {
            onUserLocationState?.({ status: "unavailable", reason: "out-of-bounds" })
            handlers?.onOutOfBounds?.()
            return
          }

          map.flyTo({
            center: [longitude, latitude],
            zoom: USER_LOCATION_ZOOM,
            duration: 1400,
          })
          onUserLocationState?.({ status: "ready", lng: longitude, lat: latitude })
          handlers?.onSuccess?.()
        },
        (error) => {
          onUserLocationState?.({
            status: "unavailable",
            reason: error.code === GeolocationPositionError.PERMISSION_DENIED ? "denied" : "error",
          })
          handlers?.onError?.(error.code)
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 300_000 },
      )
    },
    [onUserLocationState],
  )

  const offerUserLocation = useCallback(
    async (map: maplibregl.Map) => {
      const permission = await getGeolocationPermissionState()

      if (permission === "granted") {
        flyToUserLocation(map)
        return
      }

      if (permission === "denied") {
        if (!wasEvacuationLocationDismissed()) {
          onUserLocationState?.({ status: "pending" })
          setLocationPromptStatus("denied")
          setShowLocationPrompt(true)
        } else {
          onUserLocationState?.({ status: "unavailable", reason: "denied" })
        }
        return
      }

      if (!wasEvacuationLocationDismissed()) {
        onUserLocationState?.({ status: "pending" })
        setLocationPromptStatus("idle")
        setShowLocationPrompt(true)
      } else {
        onUserLocationState?.({ status: "unavailable", reason: "dismissed" })
      }
    },
    [flyToUserLocation, onUserLocationState],
  )

  const acceptUserLocation = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    flyToUserLocation(map, {
      onStart: () => setLocationPromptStatus("loading"),
      onSuccess: () => {
        dismissEvacuationLocationPrompt()
        setShowLocationPrompt(false)
        setLocationPromptStatus("idle")
      },
      onOutOfBounds: () => {
        setLocationPromptStatus("out-of-bounds")
        onUserLocationState?.({ status: "pending" })
      },
      onError: (code) => {
        setLocationPromptStatus(
          code === GeolocationPositionError.PERMISSION_DENIED ? "denied" : "unavailable",
        )
        onUserLocationState?.({ status: "pending" })
      },
    })
  }, [flyToUserLocation, onUserLocationState])

  const dismissLocationPrompt = useCallback(() => {
    dismissEvacuationLocationPrompt()
    setShowLocationPrompt(false)
    setLocationPromptStatus("idle")
    onUserLocationState?.({ status: "unavailable", reason: "dismissed" })
  }, [onUserLocationState])

  const attachMapInteractions = useCallback(
    (map: maplibregl.Map) => {
      const clickableLayers = getEvacuationClickLayerIds().filter((layerId) => map.getLayer(layerId))

      const onEnter = () => {
        map.getCanvas().style.cursor = "pointer"
      }
      const onLeave = () => {
        map.getCanvas().style.cursor = ""
      }

      const onClick = (
        e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] },
      ) => {
        const feature = e.features?.[0]
        if (!feature?.layer?.id) return

        const layerId = feature.layer.id
        const properties = (feature.properties ?? {}) as Record<string, unknown>
        const dismiss = () => popupRef.current?.remove()

        if (layerId === EVACUATION_LAYER_IDS.areasFill) {
          const fields = evacuationAreaFields(properties)
          showPopup(
            map,
            e.lngLat,
            <EvacuationAreaPopupContent {...fields} onClose={dismiss} />,
          )
          return
        }

        if (isVolcanoLayer(layerId)) {
          const meta = getEvacuationPopupMeta(layerId)
          const v = properties
          const rows = [
            { label: "Volcán", value: fieldOrDash(v.volcan) },
            { label: "Categoría", value: fieldOrDash(v.categoria) },
            { label: "Región", value: fieldOrDash(v.region) },
          ].filter((row): row is { label: string; value: string } => row.value !== "—")

          if (rows.length) {
            showPopup(
              map,
              e.lngLat,
              <EvacuationKmzPopupContent
                title={meta.title}
                badge={meta.badge}
                accentColor={meta.accentColor}
                fields={rows}
                routeHref={getDisasterGuideHref(layerId)}
                routeLabel={getDisasterGuideLabel(layerId)}
                onClose={dismiss}
              />,
            )
          }
          return
        }

        if (layerId === EVACUATION_LAYER_IDS.volcanicRadii) {
          const meta = getEvacuationPopupMeta(layerId)
          const p = properties
          const rows = [
            { label: "Distancia (km)", value: fieldOrDash(p.distance) },
          ].filter((row): row is { label: string; value: string } => row.value !== "—")

          if (rows.length) {
            showPopup(
              map,
              e.lngLat,
              <EvacuationKmzPopupContent
                title={meta.title}
                badge={meta.badge}
                accentColor={meta.accentColor}
                fields={rows}
                routeHref={getDisasterGuideHref(layerId)}
                routeLabel={getDisasterGuideLabel(layerId)}
                onClose={dismiss}
              />,
            )
          }
          return
        }

        if (isVolcanicHazardLayer(layerId)) {
          const meta = getEvacuationPopupMeta(layerId)
          const p = properties
          const rows = [
            { label: "Volcán", value: fieldOrDash(p.volcan) },
            { label: "Peligro", value: fieldOrDash(p.peligro) },
          ].filter((row): row is { label: string; value: string } => row.value !== "—")

          if (rows.length) {
            showPopup(
              map,
              e.lngLat,
              <EvacuationKmzPopupContent
                title={meta.title}
                badge={meta.badge}
                accentColor={meta.accentColor}
                fields={rows}
                routeHref={getDisasterGuideHref(layerId)}
                routeLabel={getDisasterGuideLabel(layerId)}
                onClose={dismiss}
              />,
            )
          }
          return
        }

        if (isWildfireLayer(layerId)) {
          const meta = getEvacuationPopupMeta(layerId)
          const gridcode = Number(properties.gridcode)
          const wildfireLabels: Record<number, string> = {
            1: "Muy baja (<1)",
            2: "Baja (1-3)",
            3: "Media (3-5)",
            4: "Alta (5-10)",
            5: "Muy alta (>10)",
          }
          const wildfireColors: Record<number, string> = {
            1: WILDFIRE_COLOR_1,
            2: WILDFIRE_COLOR_2,
            3: WILDFIRE_COLOR_3,
            4: WILDFIRE_COLOR_4,
            5: WILDFIRE_COLOR_5,
          }
          const rows = [
            { label: "Densidad", value: fieldOrDash(wildfireLabels[gridcode] ?? gridcode) },
          ].filter((row): row is { label: string; value: string } => row.value !== "—")

          if (rows.length) {
            showPopup(
              map,
              e.lngLat,
              <EvacuationKmzPopupContent
                title={meta.title}
                badge={meta.badge}
                accentColor={wildfireColors[gridcode] ?? meta.accentColor}
                fields={rows}
                routeHref={getDisasterGuideHref(layerId)}
                routeLabel={getDisasterGuideLabel(layerId)}
                onClose={dismiss}
              />,
            )
          }
          return
        }

        const kmzFields = evacuationKmzFields(properties)
        const meta = getEvacuationPopupMeta(layerId)
        const rows = [
          kmzFields.comuna !== "—" ? { label: "Comuna", value: kmzFields.comuna } : null,
          kmzFields.provincia !== "—" ? { label: "Provincia", value: kmzFields.provincia } : null,
          kmzFields.sector !== "—" ? { label: "Sector", value: kmzFields.sector } : null,
          kmzFields.volcan !== "—" ? { label: "Volcán", value: kmzFields.volcan } : null,
        ].filter((row): row is { label: string; value: string } => row != null)

        if (!rows.length) return

        let googleMapsHref: string | undefined
        if (isEvacuationMeetingPointLayer(layerId)) {
          const geom = feature.geometry
          const lng = geom?.type === "Point" ? geom.coordinates[0] : e.lngLat.lng
          const lat = geom?.type === "Point" ? geom.coordinates[1] : e.lngLat.lat
          googleMapsHref = buildGoogleMapsPlaceUrl(lat, lng)
        }

        showPopup(
          map,
          e.lngLat,
          <EvacuationKmzPopupContent
            title={meta.title}
            badge={meta.badge}
            accentColor={meta.accentColor}
            fields={rows}
            routeHref={getDisasterGuideHref(layerId)}
            routeLabel={getDisasterGuideLabel(layerId)}
            detailHref={googleMapsHref}
            detailLabel="Abrir en Google Maps"
            onClose={dismiss}
          />,
        )
      }

      for (const layerId of clickableLayers) {
        map.on("mouseenter", layerId, onEnter)
        map.on("mouseleave", layerId, onLeave)
        map.on("click", layerId, onClick)
      }

      return () => {
        for (const layerId of clickableLayers) {
          map.off("mouseenter", layerId, onEnter)
          map.off("mouseleave", layerId, onLeave)
          map.off("click", layerId, onClick)
        }
      }
    },
    [showPopup],
  )

  const loadLayers = useCallback(async (map: maplibregl.Map) => {
    const loadId = ++layersLoadIdRef.current

    if (layerHandlesRef.current) {
      removeEvacuationLayers(map, layerHandlesRef.current)
      layerHandlesRef.current = null
      layersReadyRef.current = false
    }

    try {
      const handles = await addEvacuationLayers(map, visibilityRef.current)
      if (loadId !== layersLoadIdRef.current) {
        removeEvacuationLayers(map, handles)
        return
      }

      layerHandlesRef.current = handles
      layersReadyRef.current = true
      setLayersError(null)
      onLayersReady?.(handles)
      return handles
    } catch (error) {
      if (loadId !== layersLoadIdRef.current) return

      layersReadyRef.current = false
      setLayersError(
        error instanceof Error ? error.message : "No se pudieron cargar las capas de evacuación",
      )
    }
  }, [onLayersReady])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const map = new maplibregl.Map({
      container,
      style: getStyle("satellite"),
      bounds: CHILE_BOUNDS,
      fitBoundsOptions: { padding: MAP_FIT_BOUNDS_PADDING, maxZoom: 5 },
      maxBounds: [-120, -60, -30, -10],
      minZoom: 3,
      maxZoom: 18,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right")
    mapRef.current = map

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(container)
    sizeObserverRef.current = ro

    let detachInteractions: (() => void) | undefined

    const onStyleReady = () => {
      void loadLayers(map).then(() => {
        detachInteractions?.()
        detachInteractions = attachMapInteractions(map)
      })
      if (locationOfferedMapRef.current !== map) {
        locationOfferedMapRef.current = map
        void offerUserLocation(map)
      }
      map.resize()
    }

    map.on("style.load", onStyleReady)

    requestAnimationFrame(() => map.resize())

    return () => {
      layersLoadIdRef.current += 1
      isFirstBasemapRef.current = true
      if (locationOfferedMapRef.current === map) {
        locationOfferedMapRef.current = null
      }
      detachInteractions?.()
      dismissPopup()
      ro.disconnect()
      if (layerHandlesRef.current) {
        removeEvacuationLayers(map, layerHandlesRef.current)
        layerHandlesRef.current = null
      }
      map.remove()
      mapRef.current = null
      layersReadyRef.current = false
    }
  }, [attachMapInteractions, dismissPopup, getStyle, loadLayers, offerUserLocation])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (isFirstBasemapRef.current) {
      isFirstBasemapRef.current = false
      return
    }

    const nextStyle = getStyle(basemap)
    const applyStyle = () => {
      if (mapRef.current !== map) return
      map.setStyle(nextStyle)
    }

    if (map.isStyleLoaded()) {
      applyStyle()
      return
    }

    map.once("load", applyStyle)
    return () => {
      map.off("load", applyStyle)
    }
  }, [basemap, getStyle])

  useEffect(() => {
    const map = mapRef.current
    const handles = layerHandlesRef.current
    if (!map || !handles || !layersReadyRef.current) return

    setEvacuationLayerVisibility(map, handles, layerVisibility)
    void ensureVolcanicHazardsLayer(map, layerVisibility.volcanicHazards)
    void ensureWildfireOccurrenceLayer(map, layerVisibility.wildfireOccurrence)
  }, [layerVisibility])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !focusMeetingPoint) return

    map.flyTo({
      center: [focusMeetingPoint.lng, focusMeetingPoint.lat],
      zoom: 15,
      duration: 1200,
    })
  }, [focusMeetingPoint])

  useEffect(() => {
    onLocationPromptVisibleChange?.(showLocationPrompt)
  }, [showLocationPrompt, onLocationPromptVisibleChange])

  const toggleBasemap = useCallback(() => {
    setBasemap((prev) => (prev === "satellite" ? "streets" : "satellite"))
  }, [])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {layersError ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-14 border border-red-500/30 bg-black/70 px-3 py-2 text-[11px] text-red-200/90 backdrop-blur-sm">
          {layersError}
        </div>
      ) : null}

      {showLocationPrompt ? (
        <EvacuationLocationPrompt
          status={locationPromptStatus}
          onAccept={acceptUserLocation}
          onDismiss={dismissLocationPrompt}
        />
      ) : null}

      {!showLocationPrompt ? (
        <button
          type="button"
          onClick={toggleBasemap}
          className={cn(
            "absolute bottom-3 right-3 z-10 flex items-center gap-2 px-3 py-2",
            "border border-white/10 bg-black/60 shadow-lg shadow-black/30 backdrop-blur-xl",
            "font-mono text-[10px] font-semibold uppercase tracking-[1.1px] text-white/90",
            "transition-colors hover:border-white/20 hover:bg-black/70 hover:text-white",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
          )}
          aria-label={
            basemap === "satellite" ? "Cambiar vista a calles" : "Cambiar vista a satelital"
          }
        >
        {basemap === "satellite" ? (
          <>
            <Map className="size-3.5 shrink-0" aria-hidden />
            <span>Cambiar vista a calles</span>
          </>
        ) : (
          <>
            <Satellite className="size-3.5 shrink-0" aria-hidden />
            <span>Cambiar vista a satelital</span>
          </>
        )}
      </button>
      ) : null}
    </div>
  )
}