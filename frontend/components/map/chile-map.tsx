"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type * as maplibregl from "maplibre-gl"
import { Map, MapControls, useMap } from "@/components/ui/map"
import {
  useMapData,
  useMeteoChileZones,
  useQueryDate,
  useRecentEvents,
} from "@/hooks"
import { useMonitorLiveData } from "@/components/map/monitor-live-data"
import {
  CHILE_BOUNDS,
  ALERT_PULSE_FPS,
  ALERT_PULSE_TRANSITION_MS,
  COMUNAS_DATA_URL,
  COMUNAS_LABELS_DATA_URL,
  COMUNAS_MIN_ZOOM,
  MAP_FLY_DURATION_MS,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_THEME_COLORS,
  REGIONS_DATA_URL,
  airPulsePeriodMs,
  alertPulsePeriodMs,
  fillOpacityPaint,
  hideForeignLabels,
  type ComunaProperties,
  type RegionProperties,
} from "./map-config"
import {
  TerritoryDetailShell,
  type TerritorySelection,
} from "./territory-detail-shell"
import {
  SeismicEventShell,
  type SeismicEventSelection,
} from "./seismic-event-shell"
import {
  buildComunasByRegionIndex,
  computeComunaAlertLevels,
  computeRegionAlertLevels,
  filterActiveAlertsBySource,
} from "@/lib/alerts-display"
import {
  computeComunaAirLevels,
  computeRegionAirLevels,
} from "@/lib/air-quality-display"
import {
  mapAirFillColorExpression,
  mapAlertFillColorExpression,
} from "@/lib/risk-scale"
import { isWithinChileMapBounds } from "@/lib/evacuacion-popup"
import { getSeismicDetailUrl } from "@/lib/seismic"
import { useUIStore } from "@/stores/ui-store"
import type { ActiveAlert, AirQualityZone, SeismicEvent } from "@/lib/types"

type Position = [number, number]
type LinearRing = Position[]
type Polygon = LinearRing[]
type MultiPolygon = Polygon[]

interface RegionGeometry {
  type: string
  coordinates: Polygon | MultiPolygon
}

interface RegionFeature {
  type?: string
  properties: {
    codregion: number
    Region: string
    composite_score?: number
    severity?: string
    [key: string]: unknown
  }
  geometry: RegionGeometry
}

function getLargestRing(geometry: RegionGeometry): LinearRing | null {
  const parts: LinearRing[] =
    geometry.type === "Polygon"
      ? [(geometry.coordinates as Polygon)[0]]
      : (geometry.coordinates as MultiPolygon).map((p) => p[0])

  let best: LinearRing | null = null
  let bestArea = -1

  for (const ring of parts) {
    if (!ring || ring.length < 3) continue

    let area = 0
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      area += ring[i][0] * ring[j][1] - ring[j][0] * ring[i][1]
    }
    area = Math.abs(area) / 2
    if (area > bestArea) {
      bestArea = area
      best = ring
    }
  }
  return best
}

function getRegionLabelPoint(geometry: RegionGeometry): [number, number] {
  const ring = getLargestRing(geometry)
  if (!ring) return [-71, -36]

  let area = 0,
    cx = 0,
    cy = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0],
      yi = ring[i][1]
    const xj = ring[j][0],
      yj = ring[j][1]
    const f = xi * yj - xj * yi
    area += f
    cx += (xi + xj) * f
    cy += (yi + yj) * f
  }
  area = Math.abs(area) / 2
  const f = 1 / (6 * area)
  return [cx * f, cy * f]
}

type LabelFeature = {
  type: "Feature"
  properties: { name: string }
  geometry: { type: "Point"; coordinates: [number, number] }
}

/**
 * Precomputed comuna label points (`comunas_labels.geojson` — built by
 * `frontend/scripts/build-comunas-labels.mjs`). Fetched once and cached;
 * replaces the old idle `findPoleOfInaccessibility` pass over full rings.
 */
let cachedComunaLabelsUrl: string | null = null
let cachedComunaLabels: LabelFeature[] | null = null

async function loadComunaLabels(url: string): Promise<LabelFeature[]> {
  if (cachedComunaLabels && cachedComunaLabelsUrl === url) {
    return cachedComunaLabels
  }
  const res = await fetch(url)
  const fc = (await res.json()) as { features: LabelFeature[] }
  cachedComunaLabels = fc.features
  cachedComunaLabelsUrl = url
  return cachedComunaLabels
}

/** Per-source last-applied level state, so ticks skip unchanged feature ids. */
type LevelStateCache = {
  regions: Map<number, { alert_level: string; air_level: string }>
  comunas: Map<number, { alert_level: string; air_level: string }>
}

function emptyLevelStateCache(): LevelStateCache {
  return { regions: new globalThis.Map(), comunas: new globalThis.Map() }
}

/**
 * Apply alert/air levels to a source via feature-state (no re-tile).
 * `levels` maps feature id → level string; missing ids get `""` (unavailable
 * gray). `clearKey` zeroes the other mode's key so a mode switch never leaves
 * stale colors behind.
 */
function applySourceLevelState(
  map: maplibregl.Map,
  source: "regions" | "comunas",
  stateKey: "alert_level" | "air_level",
  levels: Map<number, string>,
  allIds: number[],
  clearKey: "alert_level" | "air_level",
  cache: LevelStateCache,
): void {
  const prevBySource = cache[source]
  for (const id of allIds) {
    const value = levels.get(id) ?? ""
    const prev = prevBySource.get(id)
    if (prev && prev[stateKey] === value && prev[clearKey] === "") continue
    const state =
      stateKey === "alert_level"
        ? { alert_level: value, air_level: "" }
        : { alert_level: "", air_level: value }
    prevBySource.set(id, state)
    map.setFeatureState({ source, id }, state)
  }
}

const PULSE_INTERVAL_MS = 1000 / ALERT_PULSE_FPS
const EMPTY_EVENTS: SeismicEvent[] = []
const EMPTY_AIR_ZONES: AirQualityZone[] = []

/**
 * True while the `earthquakes` source holds features. Gates pulsing-dot
 * animation: with zero quakes the dots render once statically and never
 * `triggerRepaint` (kills the idle repaint loop).
 */
let earthquakeDotsActive = false

function createPulsingDot(
  map: maplibregl.Map,
  color: { r: number; g: number; b: number },
): maplibregl.StyleImageInterface {
  // Size 64 (@2x → 128 canvas) — getImageData cost ~4× cheaper than the old 120.
  const size = 64
  let context: CanvasRenderingContext2D | null = null
  const data = new Uint8Array(size * size * 4)
  let staticDrawn = false

  return {
    width: size,
    height: size,
    data,
    onAdd() {
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      context = canvas.getContext("2d", { willReadFrequently: true })
    },
    render() {
      // No linked sismos → draw a static core once and stop scheduling
      // repaints (render returns false; no triggerRepaint). This is what
      // breaks the perpetual repaint loop when the layer is idle.
      if (!earthquakeDotsActive) {
        if (staticDrawn) return false
        staticDrawn = true
        const ctx = context!
        const center = size / 2
        ctx.clearRect(0, 0, size, size)
        ctx.beginPath()
        ctx.arc(center, center, center * 0.28, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        ctx.fill()
        ctx.stroke()
        data.set(ctx.getImageData(0, 0, size, size).data)
        return false
      }
      staticDrawn = false

      const duration = 3500
      const t = (performance.now() % duration) / duration
      const ctx = context!
      const center = size / 2
      const innerRadius = center * 0.28
      const outerRadius = center * 0.75 * t + innerRadius

      ctx.clearRect(0, 0, size, size)

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

      data.set(ctx.getImageData(0, 0, size, size).data)
      map.triggerRepaint()
      return true
    },
  }
}

export function ChileMap() {
  return (
    <Map
      className="h-full w-full"
      bounds={CHILE_BOUNDS}
      fitBoundsOptions={{ padding: 24, maxZoom: 5 }}
      maxBounds={[-120, -60, -30, -10]}
      minZoom={MAP_MIN_ZOOM}
      maxZoom={MAP_MAX_ZOOM}
    >
      <ChileLayers />
      <MapControls position="bottom-right" showCompass showLocate />
    </Map>
  )
}

function ChileLayers() {
  const { map, isLoaded, resolvedTheme } = useMap()
  const { selectedDate } = useQueryDate()
  const { loadRegions, loadComunas, refreshMapRisk } = useMapData()
  const { data: recentEventsData } = useRecentEvents()
  const { alerts: allAlerts, air: airQuality } = useMonitorLiveData()
  const airZones = airQuality?.items ?? EMPTY_AIR_ZONES
  const alertsFilter = useUIStore((s) => s.alertsFilter)
  const isAirMode = alertsFilter === "airechile"
  const showMeteoZones = alertsFilter === "meteochile"
  const { data: meteoZonesGeojson } = useMeteoChileZones({
    enabled: showMeteoZones,
  })
  const mapAlerts = useMemo(
    () => filterActiveAlertsBySource(allAlerts, alertsFilter),
    [allAlerts, alertsFilter],
  )
  /** MeteoChile paints DMC fringe polygons — exclude from region/comuna fill. */
  const choroplethAlerts = useMemo(
    () => mapAlerts.filter((a) => a.source !== "meteochile"),
    [mapAlerts],
  )
  const recentEvents = recentEventsData ?? EMPTY_EVENTS

  const hoveredRegionRef = useRef<number | null>(null)
  const hoveredComunaRef = useRef<number | null>(null)
  const selectedDateRef = useRef(selectedDate)
  const mapAlertsRef = useRef<ActiveAlert[]>(mapAlerts)
  const choroplethAlertsRef = useRef<ActiveAlert[]>(choroplethAlerts)
  const airZonesRef = useRef<AirQualityZone[]>(airZones)
  const isAirModeRef = useRef(isAirMode)
  const showMeteoZonesRef = useRef(showMeteoZones)
  const meteoZonesRef = useRef(meteoZonesGeojson)
  const mapReadyRef = useRef(false)
  /** Stops pulse + pins rest opacity when Meteo filter is on. */
  const syncMeteoPulseRef = useRef<(() => void) | null>(null)
  /** Geometry caches built once after first load (feature ids for state). */
  const allRegionIdsRef = useRef<number[]>([])
  const allComunaIdsRef = useRef<number[]>([])
  const comunasByRegionRef = useRef<Map<number, readonly number[]>>(
    new globalThis.Map(),
  )
  /** Last-applied feature-state per id (skip unchanged ids on ticks). */
  const levelStateRef = useRef<LevelStateCache>(emptyLevelStateCache())
  /** Last computed level maps — shared by init, choropleth, and date effects. */
  const lastLevelMapsRef = useRef<{
    region: Map<number, string>
    comuna: Map<number, string>
  }>({ region: new globalThis.Map(), comuna: new globalThis.Map() })
  /** Pulse period/need sync from the init effect's closure. */
  const pulseUpdateRef = useRef<((airMode: boolean) => void) | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [selection, setSelection] = useState<TerritorySelection | null>(null)
  const [seismicSelection, setSeismicSelection] =
    useState<SeismicEventSelection | null>(null)
  const [popupSeq, setPopupSeq] = useState(0)
  const recentEventsRef = useRef<SeismicEvent[]>(recentEvents)
  const openSeismicRef = useRef<(next: SeismicEventSelection) => void>(
    () => {},
  )

  useEffect(() => {
    selectedDateRef.current = selectedDate
  }, [selectedDate])

  useEffect(() => {
    mapAlertsRef.current = mapAlerts
  }, [mapAlerts])

  useEffect(() => {
    choroplethAlertsRef.current = choroplethAlerts
  }, [choroplethAlerts])

  useEffect(() => {
    airZonesRef.current = airZones
  }, [airZones])

  useEffect(() => {
    isAirModeRef.current = isAirMode
  }, [isAirMode])

  useEffect(() => {
    showMeteoZonesRef.current = showMeteoZones
  }, [showMeteoZones])

  useEffect(() => {
    meteoZonesRef.current = meteoZonesGeojson
  }, [meteoZonesGeojson])

  useEffect(() => {
    recentEventsRef.current = recentEvents
  }, [recentEvents])

  const openSelection = (next: TerritorySelection) => {
    setSeismicSelection(null)
    setPopupSeq((s) => s + 1)
    setSelection(next)
  }

  const openSeismic = (next: SeismicEventSelection) => {
    setSelection(null)
    setPopupSeq((s) => s + 1)
    setSeismicSelection(next)
  }

  useEffect(() => {
    openSeismicRef.current = openSeismic
  })

  // Init layers + first load. Theme colors come from resolvedTheme at the
  // moment isLoaded flips true after mapcn's style swap (do NOT list
  // resolvedTheme as a dep — that races setStyle and crashes on getImage).
  useEffect(() => {
    if (!isLoaded || !map) return

    const m = map
    const t = MAP_THEME_COLORS[resolvedTheme]

    hideForeignLabels(m)
    const alertFill = mapAlertFillColorExpression()
    let cancelled = false
    let ensureComunaLabelsFn: (() => void) | null = null
    let pulseRaf = 0
    let pulsePeriodMs = 3000
    let lastPulseApplyMs = 0
    let lastPulsed = -1
    /** False when no alert/air levels exist → no pulse at all (rest opacity). */
    let pulseNeeded = true
    let lastPulseZoomBand: "region" | "comuna" | null = null
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const opacityTransition = {
      duration: ALERT_PULSE_TRANSITION_MS,
      delay: 0,
    }

    const pulseZoomBand = (): "region" | "comuna" =>
      m.getZoom() >= COMUNAS_MIN_ZOOM ? "comuna" : "region"

    const setFillOpacity = (
      layer: "region-fill" | "comuna-fill",
      pulsed?: number,
    ) => {
      if (!m.getLayer(layer)) return
      const theme = layer === "region-fill" ? t.regionFillOpacity : t.comunaFillOpacity
      const hover =
        layer === "region-fill" ? t.regionFillOpacityHover : t.comunaFillOpacityHover
      m.setPaintProperty(
        layer,
        "fill-opacity",
        fillOpacityPaint(theme, hover, pulsed),
      )
    }

    /** True when the current meteo rest opacity is already painted (constant). */
    let lastMeteoRestOpacity: number | null = null
    /**
     * Pulse only the fill layer visible at the current zoom (region < 7,
     * comuna ≥ 7). On a zoom-band cross the leaving layer is settled to rest
     * opacity once; the other band's layer always pulses.
     */
    const applyFillOpacity = (pulsed?: number) => {
      const band = pulseZoomBand()
      if (band !== lastPulseZoomBand) {
        setFillOpacity(band === "comuna" ? "region-fill" : "comuna-fill")
        lastPulseZoomBand = band
      }
      setFillOpacity(band === "comuna" ? "comuna-fill" : "region-fill", pulsed)
      // Meteo fringes: always rest (min pulse) — never oscillate; write once.
      if (m.getLayer("meteochile-zone-fill")) {
        if (lastMeteoRestOpacity !== t.regionFillOpacity) {
          m.setPaintProperty(
            "meteochile-zone-fill",
            "fill-opacity",
            t.regionFillOpacity,
          )
          lastMeteoRestOpacity = t.regionFillOpacity
        }
      }
    }

    const stopAlertPulse = () => {
      if (pulseRaf) {
        cancelAnimationFrame(pulseRaf)
        pulseRaf = 0
      }
    }

    const ensureAlertPulse = () => {
      if (cancelled) return
      if (
        prefersReducedMotion ||
        showMeteoZonesRef.current ||
        !pulseNeeded
      ) {
        stopAlertPulse()
        lastPulsed = 0
        applyFillOpacity(0)
        return
      }
      if (pulseRaf) return
      const tick = (now: number) => {
        if (cancelled) return
        if (showMeteoZonesRef.current || !pulseNeeded) {
          stopAlertPulse()
          applyFillOpacity(0)
          return
        }
        pulseRaf = requestAnimationFrame(tick)
        if (now - lastPulseApplyMs < PULSE_INTERVAL_MS) return
        lastPulseApplyMs = now
        const u = (now % pulsePeriodMs) / pulsePeriodMs
        const pulsed = 0.5 - 0.5 * Math.cos(u * Math.PI * 2)
        if (Math.abs(pulsed - lastPulsed) < 0.004) return
        lastPulsed = pulsed
        applyFillOpacity(pulsed)
      }
      pulseRaf = requestAnimationFrame(tick)
    }

    const syncMeteoPulse = () => {
      if (showMeteoZonesRef.current || prefersReducedMotion) {
        stopAlertPulse()
        lastPulsed = 0
        applyFillOpacity(0)
      } else {
        ensureAlertPulse()
      }
    }
    syncMeteoPulseRef.current = syncMeteoPulse

    /** Recompute pulse period/need from the latest level maps (ref-driven). */
    const updatePulseFromLevels = (airMode: boolean) => {
      const { region, comuna } = lastLevelMapsRef.current
      const values = [...region.values(), ...comuna.values()]
      pulsePeriodMs = airMode
        ? airPulsePeriodMs(values)
        : alertPulsePeriodMs(values)
      pulseNeeded = region.size > 0 || comuna.size > 0
      if (pulseNeeded) {
        ensureAlertPulse()
      } else {
        stopAlertPulse()
        lastPulsed = 0
        applyFillOpacity(0)
      }
    }
    pulseUpdateRef.current = updatePulseFromLevels

    // Pause pulse entirely when the tab is hidden (rAF + paint writes are
    // wasted work); resume with the same cadence when visible again.
    const onVisibilityChange = () => {
      if (document.hidden) {
        stopAlertPulse()
        lastPulsed = 0
        applyFillOpacity(0)
      } else if (!prefersReducedMotion) {
        ensureAlertPulse()
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    m.addSource("regions", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      promoteId: "codregion",
    })

    m.addLayer({
      id: "region-fill",
      type: "fill",
      source: "regions",
      maxzoom: COMUNAS_MIN_ZOOM,
      filter: ["!=", ["get", "codregion"], 0],
      paint: {
        "fill-color": alertFill,
        "fill-opacity": fillOpacityPaint(
          t.regionFillOpacity,
          t.regionFillOpacityHover,
        ),
        "fill-opacity-transition": opacityTransition,
      },
    })

    m.addLayer({
      id: "region-line",
      type: "line",
      source: "regions",
      filter: ["!=", ["get", "codregion"], 0],
      paint: {
        "line-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          t.regionLineHover,
          t.regionLine,
        ],
        "line-width": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          3.5,
          2.5,
        ],
      },
    })

    m.addSource("meteochile-zones", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    })

    m.addLayer({
      id: "meteochile-zone-fill",
      type: "fill",
      source: "meteochile-zones",
      layout: { visibility: "none" },
      paint: {
        "fill-color": alertFill,
        "fill-opacity": t.regionFillOpacity,
        "fill-opacity-transition": opacityTransition,
      },
    })

    m.addLayer({
      id: "meteochile-zone-line",
      type: "line",
      source: "meteochile-zones",
      layout: { visibility: "none" },
      paint: {
        "line-color": alertFill,
        "line-width": 1.2,
        "line-opacity": 0.85,
      },
    })

    m.addSource("comunas", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      promoteId: "cod_comuna",
    })

    m.addLayer({
      id: "comuna-fill",
      type: "fill",
      source: "comunas",
      minzoom: COMUNAS_MIN_ZOOM,
      paint: {
        "fill-color": alertFill,
        "fill-opacity": fillOpacityPaint(
          t.comunaFillOpacity,
          t.comunaFillOpacityHover,
        ),
        "fill-opacity-transition": opacityTransition,
      },
    })

    m.addLayer({
      id: "comuna-line",
      type: "line",
      source: "comunas",
      minzoom: COMUNAS_MIN_ZOOM,
      paint: {
        "line-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          t.comunaLineHover,
          t.comunaLine,
        ],
        "line-width": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          2,
          0.7,
        ],
        "line-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.9,
          0.6,
        ],
      },
    })

    if (!m.hasImage("pulsing-dot-red")) {
      m.addImage(
        "pulsing-dot-red",
        createPulsingDot(m, { r: 218, g: 41, b: 28 }),
        { pixelRatio: 2 },
      )
      m.addImage(
        "pulsing-dot-orange",
        createPulsingDot(m, { r: 224, g: 112, b: 32 }),
        { pixelRatio: 2 },
      )
      m.addImage(
        "pulsing-dot-yellow",
        createPulsingDot(m, { r: 204, g: 158, b: 35 }),
        { pixelRatio: 2 },
      )
    }

    m.addSource("earthquakes", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    })

    m.addLayer({
      id: "earthquake-layer",
      type: "symbol",
      source: "earthquakes",
      layout: {
        "icon-image": [
          "case",
          [">=", ["get", "magnitude"], 5.5],
          "pulsing-dot-red",
          [">=", ["get", "magnitude"], 5],
          "pulsing-dot-orange",
          "pulsing-dot-yellow",
        ],
        "icon-size": 0.6,
        "icon-allow-overlap": true,
      },
    })

    async function initGeojson() {
      const date = selectedDateRef.current
      // Kick off both fetches; only regions gate first paint (comunas minzoom 7).
      const regionsPromise = loadRegions(REGIONS_DATA_URL, date)
      const comunasPromise = loadComunas(COMUNAS_DATA_URL, date)

      try {
        const regionsJson = await regionsPromise
        if (cancelled) return

        const airMode = isAirModeRef.current
        // Geometry setData once per load; level changes use feature-state.
        const regionsSource = m.getSource(
          "regions",
        ) as maplibregl.GeoJSONSource | undefined
        regionsSource?.setData(
          regionsJson as Parameters<maplibregl.GeoJSONSource["setData"]>[0],
        )

        const fillExpr = airMode
          ? mapAirFillColorExpression()
          : mapAlertFillColorExpression()
        if (m.getLayer("region-fill")) {
          m.setPaintProperty("region-fill", "fill-color", fillExpr)
        }
        if (m.getLayer("comuna-fill")) {
          m.setPaintProperty("comuna-fill", "fill-color", fillExpr)
        }

        const regionIds = (
          regionsJson.features as Array<{
            properties?: { codregion?: unknown } | null
          }>
        )
          .map((f) => f.properties?.codregion)
          .filter((v): v is number => typeof v === "number" && v !== 0)
        allRegionIdsRef.current = regionIds

        const regionLevels = airMode
          ? computeRegionAirLevels(airZonesRef.current)
          : computeRegionAlertLevels(choroplethAlertsRef.current)
        lastLevelMapsRef.current.region = regionLevels
        applySourceLevelState(
          m,
          "regions",
          airMode ? "air_level" : "alert_level",
          regionLevels,
          regionIds,
          airMode ? "alert_level" : "air_level",
          levelStateRef.current,
        )
        pulseUpdateRef.current?.(airMode)

        if (!cancelled && !m.getSource("region-labels")) {
          const labelFeatures = (
            regionsJson.features as unknown as RegionFeature[]
          )
            .filter(
              (f) => f.properties?.codregion && f.properties.codregion !== 0,
            )
            .map((f) => ({
              type: "Feature" as const,
              properties: {
                codregion: f.properties.codregion,
                name: f.properties.Region,
              },
              geometry: {
                type: "Point" as const,
                coordinates: getRegionLabelPoint(f.geometry),
              },
            }))

          m.addSource("region-labels", {
            type: "geojson",
            data: { type: "FeatureCollection", features: labelFeatures },
          })

          m.addLayer({
            id: "region-label-custom",
            type: "symbol",
            source: "region-labels",
            minzoom: 5,
            maxzoom: COMUNAS_MIN_ZOOM,
            layout: {
              "text-field": ["get", "name"],
              "text-size": ["step", ["zoom"], 10, 5, 10, 6, 11, 7, 12, 8, 13],
              "text-anchor": "center",
              "text-allow-overlap": false,
              "text-font": [
                "Montserrat Bold",
                "Open Sans Bold",
                "Montserrat Medium",
              ],
              "text-transform": "uppercase",
              "text-max-width": 12,
              "text-keep-upright": true,
              "text-offset": [0, 0.4],
            },
            paint: {
              "text-color": t.regionLabelColor,
              "text-halo-color": t.regionLabelHalo,
              "text-halo-width": 1,
            },
          })
        }

        if (m.getLayer("region-label-custom")) m.moveLayer("region-label-custom")
        if (m.getLayer("region-line")) m.moveLayer("region-line")
        if (m.getLayer("earthquake-layer")) m.moveLayer("earthquake-layer")

        mapReadyRef.current = true
        setMapReady(true)
      } catch (err) {
        console.warn("No se pudieron cargar regiones del mapa", err)
        return
      }

      try {
        const comunasJson = await comunasPromise
        if (cancelled) return

        const airMode = isAirModeRef.current
        const comunasSource = m.getSource(
          "comunas",
        ) as maplibregl.GeoJSONSource | undefined
        comunasSource?.setData(
          comunasJson as Parameters<maplibregl.GeoJSONSource["setData"]>[0],
        )

        const comunaIds = (
          comunasJson.features as Array<{
            properties?: { cod_comuna?: unknown } | null
          }>
        )
          .map((f) => f.properties?.cod_comuna)
          .filter((v): v is number => typeof v === "number")
        allComunaIdsRef.current = comunaIds
        comunasByRegionRef.current = buildComunasByRegionIndex(comunasJson)

        const comunaLevels = airMode
          ? computeComunaAirLevels(airZonesRef.current)
          : computeComunaAlertLevels(
              choroplethAlertsRef.current,
              comunasByRegionRef.current,
            )
        lastLevelMapsRef.current.comuna = comunaLevels
        applySourceLevelState(
          m,
          "comunas",
          airMode ? "air_level" : "alert_level",
          comunaLevels,
          comunaIds,
          airMode ? "alert_level" : "air_level",
          levelStateRef.current,
        )
        pulseUpdateRef.current?.(airMode)

        /** Attach label layer when cache is ready and zoom is high enough. */
        ensureComunaLabelsFn = () => {
          if (cancelled || m.getSource("comuna-labels")) return
          if (m.getZoom() < COMUNAS_MIN_ZOOM) return
          if (!cachedComunaLabels || cachedComunaLabelsUrl !== COMUNAS_LABELS_DATA_URL) {
            return
          }

          m.addSource("comuna-labels", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: cachedComunaLabels,
            },
          })

          m.addLayer({
            id: "comuna-label",
            type: "symbol",
            source: "comuna-labels",
            minzoom: COMUNAS_MIN_ZOOM,
            layout: {
              "text-field": ["get", "name"],
              "text-size": 11,
              "text-anchor": "center",
              "text-allow-overlap": false,
              "text-font": ["Open Sans Regular"],
            },
            paint: {
              "text-color": t.comunaLabelColor,
              "text-halo-color": t.comunaLabelHalo,
              "text-halo-width": 1.5,
            },
          })
        }

        // Precomputed label points (tiny file) — fetch async, attach when ready.
        void loadComunaLabels(COMUNAS_LABELS_DATA_URL).then(() => {
          if (!cancelled) ensureComunaLabelsFn?.()
        })

        if (m.getLayer("region-label-custom")) m.moveLayer("region-label-custom")
        if (m.getLayer("region-line")) m.moveLayer("region-line")
        if (m.getLayer("earthquake-layer")) m.moveLayer("earthquake-layer")
      } catch (err) {
        console.warn("No se pudieron cargar comunas del mapa", err)
      }
    }

    void initGeojson()

    const onRegionMouseMove = (e: maplibregl.MapLayerMouseEvent) => {
      if (m.getZoom() >= COMUNAS_MIN_ZOOM) {
        if (hoveredRegionRef.current !== null) {
          m.setFeatureState(
            { source: "regions", id: hoveredRegionRef.current },
            { hover: false },
          )
          hoveredRegionRef.current = null
        }
        return
      }
      if (!e.features?.length) return
      m.getCanvas().style.cursor = "pointer"
      const id = e.features[0].id as number
      if (
        hoveredRegionRef.current !== null &&
        hoveredRegionRef.current !== id
      ) {
        m.setFeatureState(
          { source: "regions", id: hoveredRegionRef.current },
          { hover: false },
        )
      }
      m.setFeatureState({ source: "regions", id }, { hover: true })
      hoveredRegionRef.current = id
    }

    const onRegionMouseLeave = () => {
      m.getCanvas().style.cursor = ""
      if (hoveredRegionRef.current !== null) {
        m.setFeatureState(
          { source: "regions", id: hoveredRegionRef.current },
          { hover: false },
        )
      }
      hoveredRegionRef.current = null
    }

    const onComunaMouseMove = (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features?.length) return
      m.getCanvas().style.cursor = "pointer"
      const id = e.features[0].id as number
      if (
        hoveredComunaRef.current !== null &&
        hoveredComunaRef.current !== id
      ) {
        m.setFeatureState(
          { source: "comunas", id: hoveredComunaRef.current },
          { hover: false },
        )
      }
      m.setFeatureState({ source: "comunas", id }, { hover: true })
      hoveredComunaRef.current = id
    }

    const onComunaMouseLeave = () => {
      m.getCanvas().style.cursor = ""
      if (hoveredComunaRef.current !== null) {
        m.setFeatureState(
          { source: "comunas", id: hoveredComunaRef.current },
          { hover: false },
        )
      }
      hoveredComunaRef.current = null
    }

    const onMoveEnd = () => {
      if (
        m.getZoom() >= COMUNAS_MIN_ZOOM &&
        hoveredRegionRef.current !== null
      ) {
        m.setFeatureState(
          { source: "regions", id: hoveredRegionRef.current },
          { hover: false },
        )
        hoveredRegionRef.current = null
      }
      ensureComunaLabelsFn?.()
    }

    const onZoomEnd = () => {
      ensureComunaLabelsFn?.()
    }

    const onRegionClick = (e: maplibregl.MapLayerMouseEvent) => {
      const quakeHit = m.queryRenderedFeatures(e.point, {
        layers: ["earthquake-layer"],
      })
      if (quakeHit.length > 0) return
      const props = e.features?.[0]?.properties as RegionProperties | undefined
      if (!props?.Region) return
      openSelection({
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        kind: "region",
        properties: props,
      })
    }
    const onComunaClick = (e: maplibregl.MapLayerMouseEvent) => {
      const quakeHit = m.queryRenderedFeatures(e.point, {
        layers: ["earthquake-layer"],
      })
      if (quakeHit.length > 0) return
      const props = e.features?.[0]?.properties as ComunaProperties | undefined
      if (!props?.Comuna) return
      openSelection({
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        kind: "comuna",
        properties: props,
      })
    }

    m.on("mousemove", "region-fill", onRegionMouseMove)
    m.on("mouseleave", "region-fill", onRegionMouseLeave)
    m.on("mousemove", "comuna-fill", onComunaMouseMove)
    m.on("mouseleave", "comuna-fill", onComunaMouseLeave)
    m.on("moveend", onMoveEnd)
    m.on("zoomend", onZoomEnd)
    m.on("click", "region-fill", onRegionClick)
    m.on("click", "comuna-fill", onComunaClick)

    const onEarthquakeClick = (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature || feature.geometry.type !== "Point") return

      const featureCoords = feature.geometry.coordinates as [number, number]
      const featurePixel = m.project(featureCoords)
      const dx = featurePixel.x - e.point.x
      const dy = featurePixel.y - e.point.y
      if (Math.sqrt(dx * dx + dy * dy) > 20) return

      const props = feature.properties as { event_id?: number } | null
      const eventId = props?.event_id
      if (typeof eventId !== "number") return
      const event = recentEventsRef.current.find((ev) => ev.id === eventId)
      if (!event) return

      openSeismicRef.current({
        event,
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
      })
      m.flyTo({
        center: [e.lngLat.lng, e.lngLat.lat],
        zoom: Math.max(6.5, m.getZoom()),
        duration: MAP_FLY_DURATION_MS,
      })
    }
    const onEarthquakeEnter = () => {
      m.getCanvas().style.cursor = "pointer"
    }
    const onEarthquakeLeave = () => {
      m.getCanvas().style.cursor = ""
    }
    m.on("click", "earthquake-layer", onEarthquakeClick)
    m.on("mouseenter", "earthquake-layer", onEarthquakeEnter)
    m.on("mouseleave", "earthquake-layer", onEarthquakeLeave)

    return () => {
      cancelled = true
      mapReadyRef.current = false
      setMapReady(false)
      syncMeteoPulseRef.current = null
      stopAlertPulse()
      document.removeEventListener("visibilitychange", onVisibilityChange)
      m.off("mousemove", "region-fill", onRegionMouseMove)
      m.off("mouseleave", "region-fill", onRegionMouseLeave)
      m.off("mousemove", "comuna-fill", onComunaMouseMove)
      m.off("mouseleave", "comuna-fill", onComunaMouseLeave)
      m.off("moveend", onMoveEnd)
      m.off("zoomend", onZoomEnd)
      m.off("click", "region-fill", onRegionClick)
      m.off("click", "comuna-fill", onComunaClick)
      m.off("click", "earthquake-layer", onEarthquakeClick)
      m.off("mouseenter", "earthquake-layer", onEarthquakeEnter)
      m.off("mouseleave", "earthquake-layer", onEarthquakeLeave)

      let styleOk = false
      try {
        styleOk = m.getStyle() != null
      } catch {
        styleOk = false
      }
      if (!styleOk) return

      try {
        const layerIds = [
          "earthquake-layer",
          "comuna-label",
          "comuna-line",
          "comuna-fill",
          "region-label-custom",
          "region-line",
          "region-fill",
        ]
        for (const id of layerIds) {
          if (m.getLayer(id)) m.removeLayer(id)
        }
        const sourceIds = [
          "earthquakes",
          "comunas",
          "comuna-labels",
          "region-labels",
          "regions",
        ]
        for (const id of sourceIds) {
          if (m.getSource(id)) m.removeSource(id)
        }
      } catch {
        // Style may tear down mid-cleanup during setStyle.
      }
    }
    // Theme remounts via mapcn isLoaded (style swap), not resolvedTheme.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map])

  // Center on the user's location on entry — only when geolocation was already
  // granted (no prompt; same policy as the evacuación map). Mirrors the
  // evacuación-map pattern: mount-time permission probe, latest-callback ref.
  const locateUser = useCallback(() => {
    if (!map || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords
        if (!isWithinChileMapBounds(longitude, latitude)) return
        map.flyTo({
          center: [longitude, latitude],
          zoom: Math.min(map.getMaxZoom(), 13),
          duration: MAP_FLY_DURATION_MS,
          essential: true,
        })
      },
      () => {},
      { enableHighAccuracy: true, timeout: 12_000 },
    )
  }, [map])

  const locateUserRef = useRef(locateUser)
  useEffect(() => {
    locateUserRef.current = locateUser
  }, [locateUser])

  // If the browser already granted geolocation, center on entry without a click.
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
        /* Permissions API unavailable — keep the initial Chile view. */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // Refresh region risk props (popup weather/hazard bars) when query date changes.
  // Regions setData is 16 features — cheap; level colors come from
  // feature-state, so re-assert region states after the swap.
  useEffect(() => {
    if (!map || !mapReadyRef.current) return
    let cancelled = false
    void (async () => {
      const regions = await refreshMapRisk(selectedDate)
      if (cancelled || !regions) return
      const src = map.getSource("regions") as
        | maplibregl.GeoJSONSource
        | undefined
      src?.setData(
        regions as Parameters<maplibregl.GeoJSONSource["setData"]>[0],
      )
      const airMode = isAirModeRef.current
      applySourceLevelState(
        map,
        "regions",
        airMode ? "air_level" : "alert_level",
        lastLevelMapsRef.current.region,
        allRegionIdsRef.current,
        airMode ? "alert_level" : "air_level",
        levelStateRef.current,
      )
    })()
    return () => {
      cancelled = true
    }
  }, [map, selectedDate, refreshMapRisk])

  // Choropleth: alert_level or air_level depending on alertsFilter.
  // Feature-state only — no setData, no re-tile, no geojson state deps.
  useEffect(() => {
    if (!map || !mapReady) return
    const fillExpr = isAirMode
      ? mapAirFillColorExpression()
      : mapAlertFillColorExpression()
    if (map.getLayer("region-fill")) {
      map.setPaintProperty("region-fill", "fill-color", fillExpr)
    }
    if (map.getLayer("comuna-fill")) {
      map.setPaintProperty("comuna-fill", "fill-color", fillExpr)
    }

    const regionLevels = isAirMode
      ? computeRegionAirLevels(airZones)
      : computeRegionAlertLevels(choroplethAlerts)
    const comunaLevels = isAirMode
      ? computeComunaAirLevels(airZones)
      : computeComunaAlertLevels(choroplethAlerts, comunasByRegionRef.current)

    lastLevelMapsRef.current.region = regionLevels
    lastLevelMapsRef.current.comuna = comunaLevels

    const stateKey = isAirMode ? "air_level" : "alert_level"
    const clearKey = isAirMode ? "alert_level" : "air_level"
    applySourceLevelState(
      map,
      "regions",
      stateKey,
      regionLevels,
      allRegionIdsRef.current,
      clearKey,
      levelStateRef.current,
    )
    applySourceLevelState(
      map,
      "comunas",
      stateKey,
      comunaLevels,
      allComunaIdsRef.current,
      clearKey,
      levelStateRef.current,
    )

    pulseUpdateRef.current?.(isAirMode)
  }, [map, mapReady, choroplethAlerts, airZones, isAirMode])

  // MeteoChile DMC fringe polygons (official AAA zones, not whole regions)
  useEffect(() => {
    if (!map || !mapReady) return
    const visibility = showMeteoZones && !isAirMode ? "visible" : "none"
    if (map.getLayer("meteochile-zone-fill")) {
      map.setLayoutProperty("meteochile-zone-fill", "visibility", visibility)
      map.setPaintProperty(
        "meteochile-zone-fill",
        "fill-color",
        mapAlertFillColorExpression(),
      )
    }
    if (map.getLayer("meteochile-zone-line")) {
      map.setLayoutProperty("meteochile-zone-line", "visibility", visibility)
      map.setPaintProperty(
        "meteochile-zone-line",
        "line-color",
        mapAlertFillColorExpression(),
      )
    }
    const src = map.getSource("meteochile-zones") as
      | maplibregl.GeoJSONSource
      | undefined
    const empty = { type: "FeatureCollection" as const, features: [] }
    src?.setData(
      (showMeteoZones && !isAirMode && meteoZonesGeojson
        ? meteoZonesGeojson
        : empty) as Parameters<maplibregl.GeoJSONSource["setData"]>[0],
    )
    syncMeteoPulseRef.current?.()
  }, [map, mapReady, showMeteoZones, isAirMode, meteoZonesGeojson])

  // Earthquake markers: only events linked to active sismo alerts
  useEffect(() => {
    if (!map || !mapReadyRef.current) return
    const sismoUrls = new Set(
      mapAlerts
        .filter((a) => a.hazard_type === "sismo" && a.external_url)
        .map((a) => a.external_url as string),
    )
    const features = recentEvents
      .filter((e) => {
        if (
          e.longitude == null ||
          e.latitude == null ||
          typeof e.magnitude !== "number"
        ) {
          return false
        }
        const detailUrl = getSeismicDetailUrl(e)
        return detailUrl != null && sismoUrls.has(detailUrl)
      })
      .map((ev) => ({
        type: "Feature" as const,
        properties: { magnitude: ev.magnitude, event_id: ev.id },
        geometry: {
          type: "Point" as const,
          coordinates: [ev.longitude, ev.latitude],
        },
      }))

    const source = map.getSource("earthquakes") as
      | maplibregl.GeoJSONSource
      | undefined
    source?.setData({ type: "FeatureCollection", features })
    // With zero features the pulsing-dot images render once statically and
    // stop scheduling repaints (no triggerRepaint loop while idle).
    earthquakeDotsActive = features.length > 0
  }, [map, recentEvents, mapAlerts])

  return (
    <>
      {selection ? (
        <TerritoryDetailShell
          selection={selection}
          popupKey={popupSeq}
          onClose={() => setSelection(null)}
        />
      ) : null}
      {seismicSelection ? (
        <SeismicEventShell
          selection={seismicSelection}
          popupKey={popupSeq}
          onClose={() => setSeismicSelection(null)}
        />
      ) : null}
    </>
  )
}
