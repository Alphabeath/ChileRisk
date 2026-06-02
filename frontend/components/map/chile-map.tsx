"use client"

import { useEffect, useRef, useCallback } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import {
  MAP_STYLE,
  CHILE_BOUNDS,
  COMUNAS_MIN_ZOOM,
  REGION_LINE_COLOR,
  REGION_LINE_HOVER,
  COMUNA_LINE_COLOR,
  COMUNA_LINE_HOVER,
  REGIONS_DATA_URL,
  COMUNAS_DATA_URL,
  hideForeignLabels,
  type RegionProperties,
  type ComunaProperties,
} from "./map-config"
import { MAP_FIT_BOUNDS_PADDING, MAP_POPUP_OPTIONS } from "./map-popup-options"
import {
  createPopupContent,
  ComunaPopupContent,
  RegionPopupContent,
  SeismicEventPopupContent,
} from "./map-popup"
import { useMapData } from "@/hooks/use-map-data"
import { useActiveAlerts, useRecentEvents } from "@/hooks"
import { filterAlertsForRegion, sortSenapredAlerts } from "@/lib/senapred-display"
import {
  buildPopupSeismicItems,
  filterRecentEventsInGeometry,
} from "@/lib/seismic-events"
import { formatMagnitude, formatDepth } from "@/lib/format"
import { getSeismicAccentColor } from "@/lib/seismic"
import type { SeismicEvent } from "@/lib/types"

type Position = [number, number]
type LinearRing = Position[]
type Polygon = LinearRing[]
type MultiPolygon = Polygon[]

interface RegionGeometry {
  type: string
  coordinates: Polygon | MultiPolygon
}

interface RegionFeature {
  properties: { codregion: number; Region: string }
  geometry: RegionGeometry
}

function getRegionLabelPoint(geometry: RegionGeometry): [number, number] {
  const parts: LinearRing[] = geometry.type === "Polygon"
    ? [(geometry.coordinates as Polygon)[0]]
    : (geometry.coordinates as MultiPolygon).map((p) => p[0])

  let best: [number, number] = [-71, -36]
  let bestArea = -1

  for (const ring of parts) {
    if (!ring || ring.length < 3) continue

    let area = 0, cx = 0, cy = 0
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1]
      const xj = ring[j][0], yj = ring[j][1]
      const f = xi * yj - xj * yi
      area += f
      cx += (xi + xj) * f
      cy += (yi + yj) * f
    }
    area = Math.abs(area) / 2
    if (area > bestArea) {
      bestArea = area
      const f = 1 / (6 * area)
      best = [cx * f, cy * f]
    }
  }
  return best
}

/** MapLibre popups live inside `.maplibregl-map` (overflow:hidden), which blocks backdrop-filter. */
function addPopupToOverlay(map: maplibregl.Map, popup: maplibregl.Popup): maplibregl.Popup {
  popup.addTo(map)
  const el = popup.getElement()
  const overlay = map.getContainer().parentElement
  if (el && overlay && el.parentElement !== overlay) {
    overlay.appendChild(el)
  }
  return popup
}

function getFeatureBounds(geometry: unknown): maplibregl.LngLatBounds | null {
  const bounds = new maplibregl.LngLatBounds()
  const visit = (coords: unknown): void => {
    if (!coords) return
    if (Array.isArray(coords) && typeof coords[0] === "number") {
      bounds.extend(coords as [number, number])
    } else if (Array.isArray(coords)) {
      coords.forEach(visit)
    }
  }
  const g = geometry as { coordinates?: unknown } | undefined
  visit(g?.coordinates)
  return bounds.isEmpty() ? null : bounds
}

export function ChileMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const hoveredRegionRef = useRef<number | null>(null)
  const hoveredComunaRef = useRef<number | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const popupDestroyRef = useRef<(() => void) | null>(null)
  const sizeObserverRef = useRef<ResizeObserver | null>(null)

  // Earthquake (high-intensity sismo) pulsing markers
  const eventMarkersRef = useRef<maplibregl.Marker[]>([])
  const eventPopupsRef = useRef<maplibregl.Popup[]>([])
  const latestEventsRef = useRef<SeismicEvent[]>([])

  const { loadRegions, loadComunas, isComunasLoading, fetchComunaRisk } = useMapData()

  const { data: recentEvents = [] } = useRecentEvents(24)
  const { data: allAlerts = [], isLoading: alertsLoading } = useActiveAlerts()

  const allAlertsRef = useRef(allAlerts)
  const recentEventsRef = useRef(recentEvents)
  const alertsLoadingRef = useRef(alertsLoading)
  useEffect(() => {
    allAlertsRef.current = allAlerts
    recentEventsRef.current = recentEvents
    alertsLoadingRef.current = alertsLoading
  }, [allAlerts, recentEvents, alertsLoading])

  const attachComunaListeners = useCallback((map: maplibregl.Map) => {
    const fillLayer = "comuna-fill"
    const sourceId = "comunas"

    map.on("mousemove", fillLayer, (e) => {
      if (!e.features?.length) return
      map.getCanvas().style.cursor = "pointer"
      const id = e.features[0].id as number
      if (hoveredComunaRef.current !== null && hoveredComunaRef.current !== id) {
        map.setFeatureState({ source: sourceId, id: hoveredComunaRef.current }, { hover: false })
      }
      map.setFeatureState({ source: sourceId, id }, { hover: true })
      hoveredComunaRef.current = id
    })

    map.on("mouseleave", fillLayer, () => {
      map.getCanvas().style.cursor = ""
      if (hoveredComunaRef.current !== null) {
        map.setFeatureState({ source: sourceId, id: hoveredComunaRef.current }, { hover: false })
      }
      hoveredComunaRef.current = null
    })

    map.on("click", fillLayer, async (e) => {
      const props = e.features?.[0]?.properties as ComunaProperties | undefined
      if (!props) return
      if (popupRef.current) popupRef.current.remove()
      if (popupDestroyRef.current) {
        popupDestroyRef.current()
        popupDestroyRef.current = null
      }

      let comunaWithRisk: ComunaProperties = props
      try {
        const risk = await fetchComunaRisk(props.cod_comuna)
        comunaWithRisk = {
          ...props,
          composite_score: risk.composite_score,
          severity: risk.severity,
          dominant_hazard: risk.dominant_hazard,
          sismo_score: risk.sismo_score,
          ola_calor_score: risk.ola_calor_score,
          ola_frio_score: risk.ola_frio_score,
          viento_score: risk.viento_score,
          temperature_c: risk.temperature_c,
          wind_speed_kmh: risk.wind_speed_kmh,
          seismic_impact: risk.seismic_impact,
        }
      } catch {}

      const geometry = e.features?.[0]?.geometry
      const regionAlerts = sortSenapredAlerts(
        filterAlertsForRegion(allAlertsRef.current, comunaWithRisk.codregion)
      )
      const eventsInZone = filterRecentEventsInGeometry(recentEventsRef.current, geometry)
      const seismicItems = buildPopupSeismicItems(eventsInZone, comunaWithRisk.seismic_impact)

      const dismissPopup = () => popupRef.current?.remove()
      const { element, destroy } = createPopupContent(
        <ComunaPopupContent
          properties={comunaWithRisk}
          alerts={regionAlerts}
          seismicItems={seismicItems}
          alertsLoading={alertsLoadingRef.current}
          onClose={dismissPopup}
        />
      )
      popupDestroyRef.current = destroy
      popupRef.current = addPopupToOverlay(
        map,
        new maplibregl.Popup(MAP_POPUP_OPTIONS)
          .setLngLat(e.lngLat)
          .setDOMContent(element)
      )
      popupRef.current.on("close", () => {
        destroy()
        popupDestroyRef.current = null
        popupRef.current = null
      })
    })
  }, [fetchComunaRisk])

  const handleRegionClick = useCallback(
    (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      const props = e.features?.[0]?.properties as RegionProperties | undefined
      const geometry = e.features?.[0]?.geometry
      if (!props || !mapRef.current) return

      if (popupRef.current) popupRef.current.remove()
      if (popupDestroyRef.current) {
        popupDestroyRef.current()
        popupDestroyRef.current = null
      }
      const regionAlerts = sortSenapredAlerts(
        filterAlertsForRegion(allAlertsRef.current, props.codregion)
      )
      const eventsInZone = filterRecentEventsInGeometry(recentEventsRef.current, geometry)
      const seismicItems = buildPopupSeismicItems(eventsInZone)

      const dismissPopup = () => popupRef.current?.remove()
      const { element, destroy } = createPopupContent(
        <RegionPopupContent
          properties={props}
          alerts={regionAlerts}
          seismicItems={seismicItems}
          alertsLoading={alertsLoadingRef.current}
          onClose={dismissPopup}
          onViewDetail={() => {
            dismissPopup()
            const map = mapRef.current
            if (map && geometry) {
              const bounds = getFeatureBounds(geometry)
              if (bounds) {
                map.fitBounds(bounds, { padding: 30, duration: 700 })
                setTimeout(() => {
                  const m = mapRef.current
                  if (!m) return
                  const z = m.getZoom()
                  if (z < COMUNAS_MIN_ZOOM + 0.2) {
                    m.easeTo({ zoom: COMUNAS_MIN_ZOOM + 0.6, duration: 500, padding: 30 })
                  }
                }, 800)
              }
            }
          }}
        />
      )
      popupDestroyRef.current = destroy
      const map = mapRef.current
      popupRef.current = addPopupToOverlay(
        map,
        new maplibregl.Popup(MAP_POPUP_OPTIONS)
          .setLngLat(e.lngLat)
          .setDOMContent(element)
      )
      popupRef.current.on("close", () => {
        destroy()
        popupDestroyRef.current = null
        popupRef.current = null
      })
    },
    []
  )

  // Clear any existing earthquake markers and their popups
  const clearEventMarkers = useCallback(() => {
    eventMarkersRef.current.forEach((m) => m.remove())
    eventMarkersRef.current = []
    eventPopupsRef.current.forEach((p) => p.remove())
    eventPopupsRef.current = []
  }, [])

  // Create classic "punto con ondas que parpadea" markers for high-intensity recent sismos (M>=4.5)
  const renderEarthquakeMarkers = useCallback(
    (map: maplibregl.Map, events: SeismicEvent[]) => {
      clearEventMarkers()

      const strongEvents = events.filter(
        (e) => typeof e.magnitude === "number" && e.magnitude >= 4.5 && e.longitude != null && e.latitude != null
      )

      strongEvents.forEach((ev) => {
        const mag = ev.magnitude
        const color = getSeismicAccentColor(mag)
        // Larger marker for higher magnitude
        const size = Math.min(48, 20 + (mag - 4) * 6)

        const el = document.createElement("div")
        el.className = "earthquake-marker"
        el.style.width = `${size}px`
        el.style.height = `${size}px`
        el.style.setProperty("--eq-color", color)

        // 5 staggered ripples for the "ondas"
        for (let i = 0; i < 5; i++) {
          const ripple = document.createElement("div")
          ripple.className = "earthquake-ripple"
          ripple.style.animationDelay = `-${i * 0.875}s`
          el.appendChild(ripple)
        }

        const core = document.createElement("div")
        core.className = "earthquake-core"
        el.appendChild(core)

        core.title = `${formatMagnitude(mag)} · ${formatDepth(ev.depth_km)}`

        core.onclick = (e) => {
          e.stopPropagation()
          eventPopupsRef.current.forEach((p) => p.remove())
          eventPopupsRef.current = []

          const popup = new maplibregl.Popup(MAP_POPUP_OPTIONS)
          const dismissPopup = () => popup.remove()
          const { element, destroy } = createPopupContent(
            <SeismicEventPopupContent event={ev} onClose={dismissPopup} />
          )
          const lngLat: [number, number] = [ev.longitude, ev.latitude]

          addPopupToOverlay(map, popup.setLngLat(lngLat).setDOMContent(element))

          popup.on("close", () => {
            destroy()
          })
          eventPopupsRef.current.push(popup)

          map.flyTo({
            center: lngLat,
            zoom: Math.max(6.5, map.getZoom()),
            duration: 420,
          })
        }

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([ev.longitude, ev.latitude])
          .addTo(map)

        eventMarkersRef.current.push(marker)
      })
    },
    [clearEventMarkers]
  )

  // Ref to current render fn so the map-init effect doesn't depend on it (avoids remounting map on data refresh)
  const renderRef = useRef(renderEarthquakeMarkers)
  useEffect(() => {
    renderRef.current = renderEarthquakeMarkers
  }, [renderEarthquakeMarkers])

  // Keep latest events for races between map load and query
  useEffect(() => {
    latestEventsRef.current = recentEvents
  }, [recentEvents])

  // Re-render markers when recent strong events update (and map exists)
  useEffect(() => {
    const map = mapRef.current
    if (map && recentEvents.length > 0) {
      renderEarthquakeMarkers(map, recentEvents)
    }
  }, [recentEvents, renderEarthquakeMarkers])

  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return

    container.innerHTML = ''

    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE,
      bounds: CHILE_BOUNDS,
      fitBoundsOptions: { padding: MAP_FIT_BOUNDS_PADDING, maxZoom: 5 },
      maxBounds: [-120, -60, -30, -10],
      minZoom: 3,
      maxZoom: 12,
    })

    map.addControl(new maplibregl.NavigationControl(), "top-right")
    mapRef.current = map

    const ro = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize()
    })
    ro.observe(container)
    sizeObserverRef.current = ro

    requestAnimationFrame(() => {
      if (mapRef.current) mapRef.current.resize()
    })

    map.on("load", async () => {
      if (mapRef.current) mapRef.current.resize()
      hideForeignLabels(map)

      const regionsGeojson = await loadRegions(REGIONS_DATA_URL)
      if (!regionsGeojson) return

      map.addSource("regions", { type: "geojson", data: regionsGeojson as Parameters<typeof map.addSource>[1] extends { data: infer D } ? D : never, generateId: true })

      map.addLayer({
        id: "region-fill",
        type: "fill",
        source: "regions",
        maxzoom: COMUNAS_MIN_ZOOM,
        paint: {
          "fill-color": [
            "step",
            ["coalesce", ["get", "composite_score"], 35],
            "#085e08",
            35,
            "#cc9e23",
            55,
            "#e07020",
            75,
            "#c23d3c",
          ],
          "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.98, 0.65],
        },
        filter: ["!=", ["get", "codregion"], 0],
      })

      map.addLayer({
        id: "region-line",
        type: "line",
        source: "regions",
        paint: {
          "line-color": ["case", ["boolean", ["feature-state", "hover"], false], REGION_LINE_HOVER, REGION_LINE_COLOR],
          "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2.5, 1.5],
        },
        filter: ["!=", ["get", "codregion"], 0],
      })

      const labelFeatures = (regionsGeojson.features as unknown as RegionFeature[])
        .filter((f) => f.properties?.codregion && f.properties.codregion !== 0)
        .map((f) => ({
          type: "Feature" as const,
          properties: { codregion: f.properties.codregion, name: f.properties.Region },
          geometry: { type: "Point" as const, coordinates: getRegionLabelPoint(f.geometry) },
        }))

      map.addSource("region-labels", {
        type: "geojson",
        data: { type: "FeatureCollection", features: labelFeatures },
      })

      map.addLayer({
        id: "region-label-custom",
        type: "symbol",
        source: "region-labels",
        minzoom: 5,
        maxzoom: COMUNAS_MIN_ZOOM,
        layout: {
          "text-field": ["get", "name"],
          "text-size": [
            "step",
            ["zoom"],
            10,
            5, 10,
            6, 11,
            7, 12,
            8, 13
          ],
          "text-anchor": "center",
          "text-allow-overlap": false,
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular"
          ],
          "text-transform": "uppercase",
          "text-max-width": 12,
          "text-keep-upright": true,
          "text-offset": [0, 0.4]
        },
        paint: {
          "text-color": "rgba(168, 176, 180, 1)",
          "text-halo-color": "#222",
          "text-halo-width": 1
        }
      })

      map.on("mousemove", "region-fill", (e) => {
        if (map.getZoom() >= COMUNAS_MIN_ZOOM) {
          if (hoveredRegionRef.current !== null) {
            map.setFeatureState({ source: "regions", id: hoveredRegionRef.current }, { hover: false })
            hoveredRegionRef.current = null
          }
          return
        }
        if (!e.features?.length) return
        map.getCanvas().style.cursor = "pointer"
        const id = e.features[0].id as number
        if (hoveredRegionRef.current !== null && hoveredRegionRef.current !== id) {
          map.setFeatureState({ source: "regions", id: hoveredRegionRef.current }, { hover: false })
        }
        map.setFeatureState({ source: "regions", id }, { hover: true })
        hoveredRegionRef.current = id
      })

      map.on("mouseleave", "region-fill", () => {
        map.getCanvas().style.cursor = ""
        if (hoveredRegionRef.current !== null) {
          map.setFeatureState({ source: "regions", id: hoveredRegionRef.current }, { hover: false })
        }
        hoveredRegionRef.current = null
      })

      map.on("click", "region-fill", handleRegionClick)

      loadComunas(COMUNAS_DATA_URL).then((comunasData) => {
        if (!comunasData || map.getSource("comunas")) return

        map.addSource("comunas", { type: "geojson", data: comunasData as Parameters<typeof map.addSource>[1] extends { data: infer D } ? D : never, generateId: true })
        map.addLayer({ id: "comuna-fill", type: "fill", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, paint: { "fill-color": ["step", ["coalesce", ["get", "composite_score"], 35], "#085e08", 35, "#cc9e23", 55, "#e07020", 75, "#c23d3c"], "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.95, 0.55] } })
        map.addLayer({ id: "comuna-line", type: "line", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, paint: { "line-color": ["case", ["boolean", ["feature-state", "hover"], false], COMUNA_LINE_HOVER, COMUNA_LINE_COLOR], "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2, 0.7], "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.9, 0.6] } })
        map.addLayer({ id: "comuna-label", type: "symbol", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, layout: { "text-field": ["get", "Comuna"], "text-size": 11, "text-anchor": "center", "text-allow-overlap": false, "text-font": ["Open Sans Regular"] }, paint: { "text-color": "#e2e8f0", "text-halo-color": "#1e293b", "text-halo-width": 1.5 } })
        if (map.getLayer("region-line")) {
          map.moveLayer("region-line")
        }
        attachComunaListeners(map)

        // Render high-intensity earthquake markers once comunas (and base layers) are ready
        const evs = latestEventsRef.current
        if (evs.length > 0) {
          renderRef.current(map, evs)
        }
      })

      map.on("moveend", () => {
        if (map.getZoom() >= COMUNAS_MIN_ZOOM && hoveredRegionRef.current !== null) {
          map.setFeatureState({ source: "regions", id: hoveredRegionRef.current }, { hover: false })
          hoveredRegionRef.current = null
        }
      })
    })

    return () => {
      if (sizeObserverRef.current) {
        sizeObserverRef.current.disconnect()
        sizeObserverRef.current = null
      }
      if (popupDestroyRef.current) {
        popupDestroyRef.current()
        popupDestroyRef.current = null
      }
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      clearEventMarkers()
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [handleRegionClick, attachComunaListeners, loadRegions, loadComunas, clearEventMarkers])

  return (
    <div className="relative h-dvh w-full">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label="Mapa interactivo de regiones y comunas de Chile"
      />
      {isComunasLoading && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-lg bg-slate-900/90 px-4 py-2 text-sm text-slate-200 shadow-lg backdrop-blur-sm transition-opacity duration-300">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Cargando comunas...
        </div>
      )}
    </div>
  )
}
