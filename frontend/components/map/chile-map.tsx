"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import {
  getMapFitBoundsPadding,
  getMapPopupOptions,
} from "./map-popup-options"
import { MapNavigationControl } from "./map-navigation-control"
import {
  createPopupContent,
  ComunaPopupContent,
  RegionPopupContent,
  SeismicEventPopupContent,
} from "./map-popup"
import { useMapData } from "@/hooks/use-map-data"
import { useActiveAlerts, useAirQuality, useQueryDate, useRecentEvents } from "@/hooks"
import {
  buildComunasByRegionIndex,
  computeComunaAlertLevels,
  computeRegionAlertLevels,
  filterAlertsForComuna,
  filterAlertsForRegion,
  sortActiveAlerts,
} from "@/lib/alerts-display"
import {
  computeComunaAirLevels,
  computeRegionAirLevels,
  filterZonesForComuna,
  filterZonesForRegion,
  sortZonesBySeverity,
} from "@/lib/air-quality-display"
import {
  buildPopupSeismicItems,
  filterRecentEventsInGeometry,
} from "@/lib/seismic-events"
import {
  mapAirFillColorExpression,
  mapAlertFillColorExpression,
  mapRiskFillColorExpression,
} from "@/lib/risk-scale"

function fillColorForMode(mode: "risk" | "alerts" | "air") {
  if (mode === "alerts") return mapAlertFillColorExpression()
  if (mode === "air") return mapAirFillColorExpression()
  return mapRiskFillColorExpression()
}
import { getSeismicDetailUrl } from "@/lib/seismic"
import { useLoadingStore } from "@/stores/loading-store"
import { useUIStore } from "@/stores/ui-store"
import type { SeismicEvent } from "@/lib/types"

const EMPTY_SEISMIC_EVENTS: SeismicEvent[] = []

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
  const eventPopupsRef = useRef<maplibregl.Popup[]>([])
  const latestEventsRef = useRef<SeismicEvent[]>([])
  const mapReadyRef = useRef(false)
  const alertAnimFrameRef = useRef<number>(0)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null)

  const dismissAllPopups = useCallback(() => {
    if (popupRef.current) {
      popupRef.current.remove()
      popupRef.current = null
    }
    if (popupDestroyRef.current) {
      popupDestroyRef.current()
      popupDestroyRef.current = null
    }
    eventPopupsRef.current.forEach((p) => p.remove())
    eventPopupsRef.current = []
  }, [])

  const startAlertPulse = useCallback(() => {
    if (alertAnimFrameRef.current) {
      cancelAnimationFrame(alertAnimFrameRef.current)
      alertAnimFrameRef.current = 0
    }

    const map = mapRef.current
    if (!map) return

    // Respect prefers-reduced-motion: skip animation, leave fills at base opacity.
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      if (map.getLayer("region-fill")) {
        map.setPaintProperty("region-fill", "fill-opacity", ["case", ["boolean", ["feature-state", "hover"], false], 0.98, 0.65])
      }
      if (map.getLayer("comuna-fill")) {
        map.setPaintProperty("comuna-fill", "fill-opacity", ["case", ["boolean", ["feature-state", "hover"], false], 0.95, 0.55])
      }
      return
    }

    const levels = regionAlertLevelsRef.current
    if (levels.size === 0 && comunaAlertLevelsRef.current.size === 0) {
      if (map.getLayer("region-fill")) {
        map.setPaintProperty("region-fill", "fill-opacity", ["case", ["boolean", ["feature-state", "hover"], false], 0.98, 0.65])
      }
      if (map.getLayer("comuna-fill")) {
        map.setPaintProperty("comuna-fill", "fill-opacity", ["case", ["boolean", ["feature-state", "hover"], false], 0.95, 0.55])
      }
      return
    }

    const SPEED: Record<string, number> = { roja: 3000, naranja: 4000, amarilla: 5000, preventiva: 6000, informativa: 6000 }
    let max = 3000
    const consider = (lv: string) => {
      const s = SPEED[lv]
      if (s && s < max) max = s
    }
    for (const lv of levels.values()) consider(lv)
    for (const lv of comunaAlertLevelsRef.current.values()) consider(lv)
    const period = max

    const tick = () => {
      const t = (Date.now() % period) / period
      // Pulse: region 0.50–0.70, comuna 0.40–0.65 (range wider, max lower).
      const regionOp = 0.60 + 0.10 * Math.sin(t * Math.PI * 2)
      const comunaOp = 0.525 + 0.125 * Math.sin(t * Math.PI * 2)
      const m = mapRef.current
      if (m) {
        if (m.getLayer("region-fill")) {
          m.setPaintProperty("region-fill", "fill-opacity", regionOp)
        }
        if (m.getLayer("comuna-fill")) {
          m.setPaintProperty("comuna-fill", "fill-opacity", comunaOp)
        }
      }
      alertAnimFrameRef.current = requestAnimationFrame(tick)
    }
    alertAnimFrameRef.current = requestAnimationFrame(tick)
  }, [])

  const {
    regionsGeojson,
    comunasGeojson,
    loadRegions,
    loadComunas,
    refreshMapRisk,
    fetchComunaRisk,
  } = useMapData()
  const { selectedDate } = useQueryDate()

  const { data: recentEventsData, isFetching: eventsFetching } = useRecentEvents()
  const recentEvents = recentEventsData ?? EMPTY_SEISMIC_EVENTS
  const { data: allAlerts = [], isLoading: alertsLoading } = useActiveAlerts()
  const { data: airQuality } = useAirQuality()
  const airZones = useMemo(() => airQuality?.items ?? [], [airQuality?.items])
  const regionAlertLevels = useMemo(() => computeRegionAlertLevels(allAlerts), [allAlerts])
  const regionAlertLevelsRef = useRef(new Map<number, string>())
  useEffect(() => {
    // Sync latest alert levels for MapLibre paint callbacks (imperative, not render).
    // eslint-disable-next-line react-hooks/immutability -- intentional ref mirror for map callbacks
    regionAlertLevelsRef.current = regionAlertLevels
  }, [regionAlertLevels])

  const regionAirLevels = useMemo(() => computeRegionAirLevels(airZones), [airZones])
  const regionAirLevelsRef = useRef(new Map<number, string>())
  useEffect(() => {
    regionAirLevelsRef.current = regionAirLevels
  }, [regionAirLevels])

  const mapColorMode = useUIStore((s) => s.mapColorMode)
  const mapColorModeRef = useRef(mapColorMode)
  useEffect(() => {
    mapColorModeRef.current = mapColorMode
  }, [mapColorMode])

  const comunasByRegionIndex = useMemo(
    () => buildComunasByRegionIndex(comunasGeojson),
    [comunasGeojson]
  )
  const comunaAlertLevels = useMemo(
    () => computeComunaAlertLevels(allAlerts, comunasByRegionIndex),
    [allAlerts, comunasByRegionIndex]
  )
  const comunaAlertLevelsRef = useRef(new Map<number, string>())
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- intentional ref mirror for map callbacks
    comunaAlertLevelsRef.current = comunaAlertLevels
  }, [comunaAlertLevels])

  const comunaAirLevels = useMemo(() => computeComunaAirLevels(airZones), [airZones])
  const comunaAirLevelsRef = useRef(new Map<number, string>())
  useEffect(() => {
    comunaAirLevelsRef.current = comunaAirLevels
  }, [comunaAirLevels])

  const mapDataRefreshNonce = useUIStore((s) => s.mapDataRefreshNonce)
  const selectedDateRef = useRef(selectedDate)
  const refreshMapRiskRef = useRef(refreshMapRisk)
  useEffect(() => {
    selectedDateRef.current = selectedDate
  }, [selectedDate])
  useEffect(() => {
    refreshMapRiskRef.current = refreshMapRisk
  }, [refreshMapRisk])

  const applyMapRiskToSources = useCallback((date: string) => {
    const map = mapRef.current
    if (!mapReadyRef.current || !map) return () => {}

    let cancelled = false
    void refreshMapRiskRef.current(date).then((result) => {
      if (cancelled || !result) return
      const regionsSource = map.getSource("regions") as maplibregl.GeoJSONSource | undefined
      if (regionsSource && result.regions) {
        const alertMap = regionAlertLevelsRef.current
        const airMap = regionAirLevelsRef.current
        for (const f of result.regions.features) {
          const cod = f.properties?.codregion as number | undefined
          const level = cod != null ? alertMap.get(cod) : undefined
          const air = cod != null ? airMap.get(cod) : undefined
          f.properties.alert_level = level ?? ""
          f.properties.air_level = air ?? ""
        }
        regionsSource.setData(
          result.regions as Parameters<maplibregl.GeoJSONSource["setData"]>[0]
        )
      }
      const comunasSource = map.getSource("comunas") as maplibregl.GeoJSONSource | undefined
      if (comunasSource && result.comunas) {
        const comunaMap = comunaAlertLevelsRef.current
        const airMap = comunaAirLevelsRef.current
        for (const f of result.comunas.features) {
          const cod = f.properties?.cod_comuna as number | undefined
          const level = cod != null ? comunaMap.get(cod) : undefined
          const air = cod != null ? airMap.get(cod) : undefined
          f.properties.alert_level = level ?? ""
          f.properties.air_level = air ?? ""
        }
        comunasSource.setData(
          result.comunas as Parameters<maplibregl.GeoJSONSource["setData"]>[0]
        )
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => applyMapRiskToSources(selectedDate), [selectedDate, applyMapRiskToSources])

  const mapDataRefreshNonceRef = useRef(mapDataRefreshNonce)
  useEffect(() => {
    if (mapDataRefreshNonce === mapDataRefreshNonceRef.current) return
    mapDataRefreshNonceRef.current = mapDataRefreshNonce
    if (mapDataRefreshNonce === 0) return
    return applyMapRiskToSources(selectedDate)
  }, [mapDataRefreshNonce, selectedDate, applyMapRiskToSources])

  const allAlertsRef = useRef(allAlerts)
  const airZonesRef = useRef(airZones)
  const recentEventsRef = useRef(recentEvents)
  const alertsLoadingRef = useRef(alertsLoading)
  const sismoAlertUrlsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    allAlertsRef.current = allAlerts
    airZonesRef.current = airZones
    recentEventsRef.current = recentEvents
    alertsLoadingRef.current = alertsLoading
    sismoAlertUrlsRef.current = new Set(
      allAlerts
        .filter((a) => a.hazard_type === "sismo" && a.external_url)
        .map((a) => a.external_url!)
    )
  }, [allAlerts, airZones, recentEvents, alertsLoading])

  // Re-inject alert_level / air_level into region features when data or date change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReadyRef.current) return
    const source = map.getSource("regions") as maplibregl.GeoJSONSource | undefined
    if (!source) return

    const base = regionsGeojson
    if (!base?.features) return

    const geojson = structuredClone(base) as typeof base
    for (const f of geojson.features) {
      const cod = f.properties?.codregion as number | undefined
      const level = cod != null ? regionAlertLevels.get(cod) : undefined
      const air = cod != null ? regionAirLevels.get(cod) : undefined
      f.properties.alert_level = level ?? ""
      f.properties.air_level = air ?? ""
    }
    source.setData(geojson as Parameters<maplibregl.GeoJSONSource["setData"]>[0])
  }, [regionAlertLevels, regionAirLevels, regionsGeojson, selectedDate])

  // Re-inject alert_level / air_level into comuna features when data or date change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReadyRef.current) return
    const source = map.getSource("comunas") as maplibregl.GeoJSONSource | undefined
    if (!source) return

    const base = comunasGeojson
    if (!base?.features) return

    const geojson = structuredClone(base) as typeof base
    for (const f of geojson.features) {
      const cod = f.properties?.cod_comuna as number | undefined
      const level = cod != null ? comunaAlertLevels.get(cod) : undefined
      const air = cod != null ? comunaAirLevels.get(cod) : undefined
      f.properties.alert_level = level ?? ""
      f.properties.air_level = air ?? ""
    }
    source.setData(geojson as Parameters<maplibregl.GeoJSONSource["setData"]>[0])
  }, [comunaAlertLevels, comunaAirLevels, comunasGeojson, selectedDate])

  // Restart pulse when alerts change (region or comuna) or map color mode changes
  useEffect(() => {
    if (!mapReadyRef.current) return
    if (mapColorMode !== "alerts") {
      if (alertAnimFrameRef.current) {
        cancelAnimationFrame(alertAnimFrameRef.current)
        alertAnimFrameRef.current = 0
      }
      const map = mapRef.current
      if (map?.getLayer("region-fill")) {
        map.setPaintProperty("region-fill", "fill-opacity", ["case", ["boolean", ["feature-state", "hover"], false], 0.98, 0.65])
      }
      if (map?.getLayer("comuna-fill")) {
        map.setPaintProperty("comuna-fill", "fill-opacity", ["case", ["boolean", ["feature-state", "hover"], false], 0.95, 0.55])
      }
      return
    }
    startAlertPulse()
  }, [regionAlertLevels, comunaAlertLevels, mapColorMode, mapLoaded, startAlertPulse])

  // Switch fill-color expression + remove/keep region-alert-line based on mapColorMode
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReadyRef.current) return

    const fill = fillColorForMode(mapColorMode)
    if (map.getLayer("region-fill")) {
      map.setPaintProperty("region-fill", "fill-color", fill)
    }
    if (map.getLayer("comuna-fill")) {
      map.setPaintProperty("comuna-fill", "fill-color", fill)
    }
    if (map.getLayer("region-alert-line")) {
      map.removeLayer("region-alert-line")
    }
  }, [mapColorMode, mapLoaded])

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
      // Skip if clicking on an earthquake point
      const earthquakeFeatures = mapRef.current?.queryRenderedFeatures(e.point, { layers: ["earthquake-layer"] })
      if (earthquakeFeatures && earthquakeFeatures.length > 0) return

      const props = e.features?.[0]?.properties as ComunaProperties | undefined
      if (!props) return
      dismissAllPopups()

      let comunaWithRisk: ComunaProperties = props
      try {
        const risk = await fetchComunaRisk(
          props.cod_comuna,
          selectedDateRef.current
        )
        comunaWithRisk = {
          ...props,
          composite_score: risk.composite_score,
          severity: risk.severity,
          dominant_hazard: risk.dominant_hazard,
          sismo_score: risk.sismo_score,
          ola_calor_score: risk.ola_calor_score,
          ola_frio_score: risk.ola_frio_score,
          viento_score: risk.viento_score,
          inundacion_score: risk.inundacion_score,
          temperature_c: risk.temperature_c,
          wind_speed_kmh: risk.wind_speed_kmh,
          seismic_impact: risk.seismic_impact,
        }
      } catch {}

      const geometry = e.features?.[0]?.geometry
      const comunaAlerts = sortActiveAlerts(
        filterAlertsForComuna(
          allAlertsRef.current,
          comunaWithRisk.codregion,
          comunaWithRisk.cod_comuna
        )
      )
      const comunaAirZones = sortZonesBySeverity(
        filterZonesForComuna(airZonesRef.current, comunaWithRisk.cod_comuna)
      )
      const eventsInZone = filterRecentEventsInGeometry(recentEventsRef.current, geometry, undefined, sismoAlertUrlsRef.current)
      const seismicItems = buildPopupSeismicItems(eventsInZone, comunaWithRisk.seismic_impact)

      const dismissPopup = () => popupRef.current?.remove()
      const { element, destroy } = createPopupContent(
        <ComunaPopupContent
          properties={comunaWithRisk}
          alerts={comunaAlerts}
          airZones={comunaAirZones}
          seismicItems={seismicItems}
          alertsLoading={alertsLoadingRef.current}
          queryDate={selectedDateRef.current}
          onClose={dismissPopup}
        />
      )
      popupDestroyRef.current = destroy
      popupRef.current = addPopupToOverlay(
        map,
        new maplibregl.Popup(getMapPopupOptions())
          .setLngLat(e.lngLat)
          .setDOMContent(element)
      )
      popupRef.current.on("close", () => {
        destroy()
        popupDestroyRef.current = null
        popupRef.current = null
      })
      map.flyTo({ center: e.lngLat, zoom: Math.max(7, map.getZoom()), duration: 420 })
    })
  }, [fetchComunaRisk])

  const handleRegionClick = useCallback(
    (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      // Skip if clicking on an earthquake point
      const earthquakeFeatures = mapRef.current?.queryRenderedFeatures(e.point, { layers: ["earthquake-layer"] })
      if (earthquakeFeatures && earthquakeFeatures.length > 0) return

      const props = e.features?.[0]?.properties as RegionProperties | undefined
      const geometry = e.features?.[0]?.geometry
      if (!props || !mapRef.current) return

      dismissAllPopups()
      const regionAlerts = sortActiveAlerts(
        filterAlertsForRegion(allAlertsRef.current, props.codregion)
      )
      const regionAirZones = sortZonesBySeverity(
        filterZonesForRegion(airZonesRef.current, props.codregion)
      )
      const eventsInZone = filterRecentEventsInGeometry(recentEventsRef.current, geometry, undefined, sismoAlertUrlsRef.current)
      const seismicItems = buildPopupSeismicItems(eventsInZone)

      const dismissPopup = () => popupRef.current?.remove()
      const { element, destroy } = createPopupContent(
        <RegionPopupContent
          properties={props}
          alerts={regionAlerts}
          airZones={regionAirZones}
          seismicItems={seismicItems}
          alertsLoading={alertsLoadingRef.current}
          queryDate={selectedDateRef.current}
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
        new maplibregl.Popup(getMapPopupOptions())
          .setLngLat(e.lngLat)
          .setDOMContent(element)
      )
      popupRef.current.on("close", () => {
        destroy()
        popupDestroyRef.current = null
        popupRef.current = null
      })
      map.flyTo({ center: e.lngLat, zoom: Math.max(5.5, map.getZoom()), duration: 420 })
    },
    []
  )

  // Update earthquake source with filtered events (only sismos with active alerts)
  const renderEarthquakeMarkers = useCallback(
    (map: maplibregl.Map, events: SeismicEvent[]) => {
      const sismoUrls = sismoAlertUrlsRef.current
      const markerEvents = events.filter((e) => {
        if (e.longitude == null || e.latitude == null || typeof e.magnitude !== "number") {
          return false
        }
        const detailUrl = getSeismicDetailUrl(e)
        return detailUrl != null && sismoUrls.has(detailUrl)
      })

      const features: GeoJSON.Feature[] = markerEvents.map((ev) => ({
        type: "Feature",
        properties: {
          magnitude: ev.magnitude,
          event_id: ev.id,
        },
        geometry: {
          type: "Point",
          coordinates: [ev.longitude, ev.latitude],
        },
      }))

      const source = map.getSource("earthquakes") as maplibregl.GeoJSONSource | undefined
      source?.setData({ type: "FeatureCollection", features })
    },
    []
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

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReadyRef.current) return
    renderEarthquakeMarkers(map, recentEvents)
  }, [recentEventsData, selectedDate, eventsFetching, renderEarthquakeMarkers, allAlerts])

  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return

    container.innerHTML = ''

    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE,
      bounds: CHILE_BOUNDS,
      fitBoundsOptions: {
        padding: getMapFitBoundsPadding(),
        maxZoom: 5,
      },
      maxBounds: [-120, -60, -30, -10],
      minZoom: 3,
      maxZoom: 12,
      attributionControl: false,
    })

    mapRef.current = map
    setMapInstance(map)

    const ro = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize()
    })
    ro.observe(container)
    sizeObserverRef.current = ro

    requestAnimationFrame(() => {
      if (mapRef.current) mapRef.current.resize()
    })

    map.on("load", async () => {
      try {
        if (mapRef.current) mapRef.current.resize()
        // Re-fit after real container size — desktop L/R padding breaks mobile centering.
        map.fitBounds(CHILE_BOUNDS, {
          padding: getMapFitBoundsPadding(),
          maxZoom: 5,
          duration: 0,
        })
        hideForeignLabels(map)
        mapReadyRef.current = true
        setMapLoaded(true)

        // Register pulsing dot images for earthquake markers
        const PULSING_DOT_SIZE = 120
        const PULSING_COLORS = {
          red: { r: 218, g: 41, b: 28 },
          orange: { r: 224, g: 112, b: 32 },
          yellow: { r: 204, g: 158, b: 35 },
        }

        function createPulsingDot(color: { r: number; g: number; b: number }): maplibregl.StyleImageInterface {
          let context: CanvasRenderingContext2D | null = null
          const data = new Uint8Array(PULSING_DOT_SIZE * PULSING_DOT_SIZE * 4)

          return {
            width: PULSING_DOT_SIZE,
            height: PULSING_DOT_SIZE,
            data,

            onAdd() {
              const canvas = document.createElement("canvas")
              canvas.width = PULSING_DOT_SIZE
              canvas.height = PULSING_DOT_SIZE
              context = canvas.getContext("2d", { willReadFrequently: true })
            },

            render() {
              const duration = 3500
              const t = (performance.now() % duration) / duration
              const ctx = context!
              const center = PULSING_DOT_SIZE / 2
              const innerRadius = center * 0.28
              const outerRadius = center * 0.75 * t + innerRadius

              ctx.clearRect(0, 0, PULSING_DOT_SIZE, PULSING_DOT_SIZE)

              ctx.beginPath()
              ctx.arc(center, center, outerRadius, 0, Math.PI * 2)
              ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.6 * (1 - t)})`
              ctx.fill()

              ctx.beginPath()
              ctx.arc(center, center, outerRadius, 0, Math.PI * 2)
              ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.8 * (1 - t)})`
              ctx.lineWidth = 2
              ctx.stroke()

              ctx.beginPath()
              ctx.arc(center, center, innerRadius, 0, Math.PI * 2)
              ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`
              ctx.strokeStyle = "white"
              ctx.lineWidth = 2 + 3 * (1 - t)
              ctx.fill()
              ctx.stroke()

              const imageData = ctx.getImageData(0, 0, PULSING_DOT_SIZE, PULSING_DOT_SIZE)
              data.set(imageData.data)
              map.triggerRepaint()
              return true
            }
          }
        }

        map.addImage("pulsing-dot-red", createPulsingDot(PULSING_COLORS.red), { pixelRatio: 2 })
        map.addImage("pulsing-dot-orange", createPulsingDot(PULSING_COLORS.orange), { pixelRatio: 2 })
        map.addImage("pulsing-dot-yellow", createPulsingDot(PULSING_COLORS.yellow), { pixelRatio: 2 })

        const regionsGeojson = await loadRegions(
          REGIONS_DATA_URL,
          selectedDateRef.current
        )
        if (!regionsGeojson) return

        const alertMap = regionAlertLevelsRef.current
        for (const f of regionsGeojson.features) {
          const cod = f.properties?.codregion as number | undefined
          const level = cod != null ? alertMap.get(cod) : undefined
          f.properties.alert_level = level ?? ""
        }

      map.addSource("regions", { type: "geojson", data: regionsGeojson as Parameters<typeof map.addSource>[1] extends { data: infer D } ? D : never, generateId: true })

      map.addLayer({
        id: "region-fill",
        type: "fill",
        source: "regions",
        maxzoom: COMUNAS_MIN_ZOOM,
        paint: {
          "fill-color": fillColorForMode(mapColorModeRef.current),
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
          "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 3.5, 2.5],
        },
        filter: ["!=", ["get", "codregion"], 0],
      })

      // region-alert-line removed: alert color now drives the FILL (oscillating)
      // and the border stays white. See setMapColorMode effect above.

      // Earthquake pulsing dot layer
      map.addSource("earthquakes", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })

      map.addLayer({
        id: "earthquake-layer",
        type: "symbol",
        source: "earthquakes",
        layout: {
          "icon-image": [
            "case",
            [">=", ["get", "magnitude"], 5.5], "pulsing-dot-red",
            [">=", ["get", "magnitude"], 5], "pulsing-dot-orange",
            "pulsing-dot-yellow"
          ],
          "icon-size": 0.6,
          "icon-allow-overlap": true,
        },
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

      const comunasData = await loadComunas(
        COMUNAS_DATA_URL,
        selectedDateRef.current
      )
      if (comunasData && !map.getSource("comunas")) {
        map.addSource("comunas", { type: "geojson", data: comunasData as Parameters<typeof map.addSource>[1] extends { data: infer D } ? D : never, generateId: true })
        map.addLayer({ id: "comuna-fill", type: "fill", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, paint: { "fill-color": fillColorForMode(mapColorModeRef.current), "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.95, 0.55] } })
        map.addLayer({ id: "comuna-line", type: "line", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, paint: { "line-color": ["case", ["boolean", ["feature-state", "hover"], false], COMUNA_LINE_HOVER, COMUNA_LINE_COLOR], "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2, 0.7], "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.9, 0.6] } })
        map.addLayer({ id: "comuna-label", type: "symbol", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, layout: { "text-field": ["get", "Comuna"], "text-size": 11, "text-anchor": "center", "text-allow-overlap": false, "text-font": ["Open Sans Regular"] }, paint: { "text-color": "#e2e8f0", "text-halo-color": "#1e293b", "text-halo-width": 1.5 } })
        if (map.getLayer("region-label-custom")) {
          map.moveLayer("region-label-custom")
        }
        if (map.getLayer("region-line")) {
          map.moveLayer("region-line")
        }

        // Move earthquake layer on top of comunas
        if (map.getLayer("earthquake-layer")) {
          map.moveLayer("earthquake-layer")
        }

        // Start alert pulse animation now that layers exist
        startAlertPulse()

        attachComunaListeners(map)
        renderRef.current(map, latestEventsRef.current)

        // Earthquake click handler
        map.on("click", "earthquake-layer", (e) => {
          const feature = e.features?.[0]
          if (!feature) return

          // Only trigger if clicking near the center dot (not the ripples)
          const featureCoords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
          const featurePixel = map.project(featureCoords)
          const clickPixel = e.point
          const dx = featurePixel.x - clickPixel.x
          const dy = featurePixel.y - clickPixel.y
          const distancePx = Math.sqrt(dx * dx + dy * dy)
          // Inner radius is ~28% of 150px icon * 0.6 scale ≈ 25px, use 20px for tight hitbox
          if (distancePx > 20) return

          const props = feature.properties as { magnitude: number; event_id: number }
          const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat]
          const event = latestEventsRef.current.find((ev) => ev.id === props.event_id)
          if (!event) return

          dismissAllPopups()

          const popup = new maplibregl.Popup(getMapPopupOptions())
          const dismissPopup = () => popup.remove()
          const { element, destroy } = createPopupContent(
            <SeismicEventPopupContent event={event} onClose={dismissPopup} />
          )
          addPopupToOverlay(map, popup.setLngLat(coords).setDOMContent(element))
          popup.on("close", () => destroy())
          eventPopupsRef.current.push(popup)
          map.flyTo({ center: coords, zoom: Math.max(6.5, map.getZoom()), duration: 420 })
        })

        map.on("mouseenter", "earthquake-layer", () => {
          map.getCanvas().style.cursor = "pointer"
        })
        map.on("mouseleave", "earthquake-layer", () => {
          map.getCanvas().style.cursor = ""
        })
      }

        map.on("moveend", () => {
          if (map.getZoom() >= COMUNAS_MIN_ZOOM && hoveredRegionRef.current !== null) {
            map.setFeatureState(
              { source: "regions", id: hoveredRegionRef.current },
              { hover: false }
            )
            hoveredRegionRef.current = null
          }
        })
      } finally {
        useLoadingStore.getState().setMapInitialPending(false)
      }
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
      eventPopupsRef.current.forEach((p) => p.remove())
      eventPopupsRef.current = []
      if (alertAnimFrameRef.current) {
        cancelAnimationFrame(alertAnimFrameRef.current)
        alertAnimFrameRef.current = 0
      }
      mapReadyRef.current = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      setMapInstance(null)
    }
  }, [handleRegionClick, attachComunaListeners, loadRegions, loadComunas])

  return (
    <div className="cr-map relative h-dvh w-full">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label="Mapa interactivo de regiones y comunas de Chile"
      />
      <MapNavigationControl map={mapInstance} />
    </div>
  )
}
