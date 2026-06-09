import type { Feature, FeatureCollection, Geometry, Position } from "geojson"
import type maplibregl from "maplibre-gl"
import { fixMojibakeRecord } from "@/lib/fix-mojibake"
import {
  addFlatKmzLayer,
  removeFlatKmzLayer,
  setFlatKmzLayerVisibility,
  type FlatKmzLayerHandle,
} from "@/lib/kmz-flat-layer"
import {
  EVACUATION_AREAS_MIN_ZOOM,
  EVACUATION_LAYER_IDS,
  EVACUATION_MEETING_POINTS_MIN_ZOOM,
  EVACUATION_ROUTE_ARROWS_MIN_ZOOM,
  EVACUATION_ROUTES_MIN_ZOOM,
  EVACUATION_ROUTE_COLOR,
  EVACUATION_ROUTE_LINE_WIDTH,
  TSUNAMI_EVACUATION_AREAS_URL,
  TSUNAMI_EVACUATION_ROUTES_URL,
  TSUNAMI_MEETING_POINTS_URL,
  VOLCANIC_ACTIVE_VOLCANOES_URL,
  VOLCANIC_EVACUATION_MEETING_POINTS_URL,
  VOLCANIC_EVACUATION_ROUTES_URL,
  VOLCANIC_HAZARDS_URL,
  VOLCANIC_HAZARD_COLOR_ALTO,
  VOLCANIC_HAZARD_COLOR_BAJO,
  VOLCANIC_HAZARD_COLOR_MEDIO,
  VOLCANIC_HAZARD_LINE_COLOR_ALTO,
  VOLCANIC_HAZARD_LINE_COLOR_BAJO,
  VOLCANIC_HAZARD_LINE_COLOR_MEDIO,
  VOLCANIC_HAZARD_FILL_LAYER_IDS,
  VOLCANIC_HAZARD_LINE_LAYER_IDS,
  VOLCANIC_RADII_URL,
  VOLCANIC_ROUTE_COLOR,
  WILDFIRE_OCCURRENCE_URL,
  WILDFIRE_OCCURRENCE_MIN_ZOOM,
  WILDFIRE_COLOR_1,
  WILDFIRE_COLOR_2,
  WILDFIRE_COLOR_3,
  WILDFIRE_COLOR_4,
  WILDFIRE_COLOR_5,
  WILDFIRE_LINE_COLOR_1,
  WILDFIRE_LINE_COLOR_2,
  WILDFIRE_LINE_COLOR_3,
  WILDFIRE_LINE_COLOR_4,
  WILDFIRE_LINE_COLOR_5,
  WILDFIRE_FILL_LAYER_IDS,
  WILDFIRE_LINE_LAYER_IDS,
} from "@/components/map/map-config"

export interface EvacuationLayerVisibility {
  areas: boolean
  routes: boolean
  meetingPoints: boolean
  volcanicRoutes: boolean
  volcanicMeetingPoints: boolean
  volcanoes: boolean
  volcanicRadii: boolean
  volcanicHazards: boolean
  wildfireOccurrence: boolean
}

export interface EvacuationLayerHandles {
  routes: FlatKmzLayerHandle | null
  meetingPoints: FlatKmzLayerHandle | null
  volcanicRoutes: FlatKmzLayerHandle | null
  volcanicMeetingPoints: FlatKmzLayerHandle | null
}

function layerVisibility(visible: boolean): "visible" | "none" {
  return visible ? "visible" : "none"
}

function lineBearing(from: Position, to: Position): number {
  const [lng1, lat1] = from
  const [lng2, lat2] = to
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const lat1Rad = (lat1 * Math.PI) / 180
  const lat2Rad = (lat2 * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos(lat2Rad)
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

function lineStringArrow(coords: Position[]): { point: Position; bearing: number } | null {
  if (coords.length < 2) return null
  // SENAPRED KMZ stores lines destination-first; the evacuation terminus is coords[0].
  const point = coords[0]
  const approach = coords[1]
  return { point, bearing: lineBearing(approach, point) }
}

function endpointsFromGeometry(geometry: Geometry): { point: Position; bearing: number }[] {
  if (geometry.type === "LineString") {
    const arrow = lineStringArrow(geometry.coordinates)
    return arrow ? [arrow] : []
  }

  if (geometry.type === "MultiLineString") {
    return geometry.coordinates.flatMap((line) => {
      const arrow = lineStringArrow(line)
      return arrow ? [arrow] : []
    })
  }

  if (geometry.type === "GeometryCollection") {
    return geometry.geometries.flatMap((child) => endpointsFromGeometry(child))
  }

  return []
}

function buildRouteArrowPoints(features: Feature[]): FeatureCollection {
  const points: Feature[] = []

  for (const feature of features) {
    if (!feature.geometry) continue
    for (const { point, bearing } of endpointsFromGeometry(feature.geometry)) {
      points.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: point },
        properties: { bearing },
      })
    }
  }

  return { type: "FeatureCollection", features: points }
}

type RouteArrowConfig = {
  imageId: string
  sourceId: string
  layerId: string
  color: string
}

const TSUNAMI_ARROW_CONFIG: RouteArrowConfig = {
  imageId: EVACUATION_LAYER_IDS.routesArrowImage,
  sourceId: EVACUATION_LAYER_IDS.routesArrowsSource,
  layerId: EVACUATION_LAYER_IDS.routesArrows,
  color: EVACUATION_ROUTE_COLOR,
}

const VOLCANIC_ARROW_CONFIG: RouteArrowConfig = {
  imageId: EVACUATION_LAYER_IDS.volcanicRoutesArrowImage,
  sourceId: EVACUATION_LAYER_IDS.volcanicRoutesArrowsSource,
  layerId: EVACUATION_LAYER_IDS.volcanicRoutesArrows,
  color: VOLCANIC_ROUTE_COLOR,
}

function ensureRouteArrowImage(map: maplibregl.Map, imageId: string, color: string): void {
  if (map.hasImage(imageId)) return

  const size = 24
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = color

  ctx.beginPath()
  ctx.moveTo(size / 2, 3)
  ctx.lineTo(size - 4, size - 5)
  ctx.lineTo(size / 2, size - 9)
  ctx.lineTo(4, size - 5)
  ctx.closePath()
  ctx.fill()

  map.addImage(imageId, ctx.getImageData(0, 0, size, size), { pixelRatio: 2 })
}

function removeRouteDirectionArrows(map: maplibregl.Map, config: RouteArrowConfig = TSUNAMI_ARROW_CONFIG): void {
  if (map.getLayer(config.layerId)) {
    map.removeLayer(config.layerId)
  }
  if (map.getSource(config.sourceId)) {
    map.removeSource(config.sourceId)
  }
  if (map.hasImage(config.imageId)) {
    map.removeImage(config.imageId)
  }
}

function addRouteDirectionArrows(
  map: maplibregl.Map,
  routesHandle: FlatKmzLayerHandle,
  visible: boolean,
  config: RouteArrowConfig = TSUNAMI_ARROW_CONFIG,
): void {
  removeRouteDirectionArrows(map, config)

  const features = routesHandle.parseResult.features.features
  if (!features.length) return

  const arrowPoints = buildRouteArrowPoints(features)
  if (!arrowPoints.features.length) return

  ensureRouteArrowImage(map, config.imageId, config.color)

  map.addSource(config.sourceId, {
    type: "geojson",
    data: arrowPoints,
  })

  map.addLayer({
    id: config.layerId,
    type: "symbol",
    source: config.sourceId,
    minzoom: EVACUATION_ROUTE_ARROWS_MIN_ZOOM,
    layout: {
      visibility: layerVisibility(visible),
      "icon-image": config.imageId,
      "icon-size": 0.85,
      "icon-rotate": ["get", "bearing"],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-anchor": "center",
    },
  })
}

async function addAreasLayer(
  map: maplibregl.Map,
  visible: boolean,
): Promise<void> {
  const res = await fetch(TSUNAMI_EVACUATION_AREAS_URL)
  if (!res.ok) {
    throw new Error(`Failed to load evacuation areas (${res.status})`)
  }

  const raw = (await res.json()) as FeatureCollection
  const data: FeatureCollection = {
    ...raw,
    features: raw.features.map((feature) => ({
      ...feature,
      properties: fixMojibakeRecord(feature.properties as Record<string, unknown>),
    })),
  }

  if (map.getSource(EVACUATION_LAYER_IDS.areasSource)) {
    map.removeLayer(EVACUATION_LAYER_IDS.areasFill)
    map.removeLayer(EVACUATION_LAYER_IDS.areasLine)
    map.removeSource(EVACUATION_LAYER_IDS.areasSource)
  }

  map.addSource(EVACUATION_LAYER_IDS.areasSource, {
    type: "geojson",
    data,
  })

  map.addLayer({
    id: EVACUATION_LAYER_IDS.areasFill,
    type: "fill",
    source: EVACUATION_LAYER_IDS.areasSource,
    minzoom: EVACUATION_AREAS_MIN_ZOOM,
    layout: { visibility: layerVisibility(visible) },
    paint: {
      "fill-color": "#ef4444",
      "fill-opacity": 0.35,
    },
  })

  map.addLayer({
    id: EVACUATION_LAYER_IDS.areasLine,
    type: "line",
    source: EVACUATION_LAYER_IDS.areasSource,
    minzoom: EVACUATION_AREAS_MIN_ZOOM,
    layout: { visibility: layerVisibility(visible) },
    paint: {
      "line-color": "#ef4444",
      "line-width": 1.5,
      "line-opacity": 0.85,
    },
  })
}

function ensureVolcanoMarkerImage(map: maplibregl.Map): void {
  const imageId = EVACUATION_LAYER_IDS.volcanoesIconImage
  if (map.hasImage(imageId)) return

  const size = 32
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = "#ffffff"
  ctx.beginPath()
  ctx.moveTo(size / 2, 5)
  ctx.lineTo(size - 6, size - 7)
  ctx.lineTo(6, size - 7)
  ctx.closePath()
  ctx.fill()

  map.addImage(imageId, ctx.getImageData(0, 0, size, size), { sdf: true, pixelRatio: 2 })
}

const VOLCANO_ICON_COLOR_EXPR: maplibregl.ExpressionSpecification = [
  "match",
  ["get", "categoria"],
  "Muy Alta",
  "#b91c1c",
  "Alta",
  "#ea580c",
  "Moderada",
  "#f59e0b",
  "Baja",
  "#84cc16",
  "Muy Baja",
  "#22c55e",
  "Sin ranking",
  "#64748b",
  "#64748b",
]

async function addVolcanoesLayer(map: maplibregl.Map, visible: boolean): Promise<void> {
  const res = await fetch(VOLCANIC_ACTIVE_VOLCANOES_URL)
  if (!res.ok) {
    throw new Error(`Failed to load active volcanoes (${res.status})`)
  }

  const raw = (await res.json()) as FeatureCollection
  const data: FeatureCollection = {
    ...raw,
    features: raw.features.map((feature) => ({
      ...feature,
      properties: fixMojibakeRecord(feature.properties as Record<string, unknown>),
    })),
  }

  removeVolcanoesLayer(map)

  map.addSource(EVACUATION_LAYER_IDS.volcanoesSource, {
    type: "geojson",
    data,
  })

  ensureVolcanoMarkerImage(map)

  map.addLayer({
    id: EVACUATION_LAYER_IDS.volcanoes,
    type: "symbol",
    source: EVACUATION_LAYER_IDS.volcanoesSource,
    minzoom: 5,
    layout: {
      visibility: layerVisibility(visible),
      "icon-image": EVACUATION_LAYER_IDS.volcanoesIconImage,
      "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 0.65, 8, 0.85, 12, 1],
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-anchor": "bottom",
    },
    paint: {
      "icon-color": VOLCANO_ICON_COLOR_EXPR,
      "icon-halo-color": "#ffffff",
      "icon-halo-width": 1.25,
      "icon-opacity": 0.95,
    },
  })

  map.addLayer({
    id: EVACUATION_LAYER_IDS.volcanoesLabels,
    type: "symbol",
    source: EVACUATION_LAYER_IDS.volcanoesSource,
    minzoom: 6,
    layout: {
      visibility: layerVisibility(visible),
      "text-field": ["get", "volcan"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 6, 10, 10, 11, 13, 12],
      "text-anchor": "top",
      "text-offset": [0, 0.35],
      "text-max-width": 10,
      "text-allow-overlap": false,
      "text-optional": true,
      "text-font": ["Open Sans Bold"],
    },
    paint: {
      "text-color": "#f8fafc",
      "text-halo-color": "#0f172a",
      "text-halo-width": 1.5,
      "text-opacity": 0.92,
    },
  })
}

function removeVolcanoesLayer(map: maplibregl.Map): void {
  for (const layerId of [EVACUATION_LAYER_IDS.volcanoes, EVACUATION_LAYER_IDS.volcanoesLabels]) {
    if (map.getLayer(layerId)) map.removeLayer(layerId)
  }
  if (map.getSource(EVACUATION_LAYER_IDS.volcanoesSource)) {
    map.removeSource(EVACUATION_LAYER_IDS.volcanoesSource)
  }
  if (map.hasImage(EVACUATION_LAYER_IDS.volcanoesIconImage)) {
    map.removeImage(EVACUATION_LAYER_IDS.volcanoesIconImage)
  }
}

async function addVolcanicRadiiLayer(map: maplibregl.Map, visible: boolean): Promise<void> {
  const res = await fetch(VOLCANIC_RADII_URL)
  if (!res.ok) {
    throw new Error(`Failed to load volcanic radii (${res.status})`)
  }
  const raw = (await res.json()) as FeatureCollection
  const data: FeatureCollection = {
    ...raw,
    features: raw.features.map((f) => ({
      ...f,
      properties: fixMojibakeRecord(f.properties as Record<string, unknown>),
    })),
  }

  if (map.getSource(EVACUATION_LAYER_IDS.volcanicRadiiSource)) {
    if (map.getLayer(EVACUATION_LAYER_IDS.volcanicRadii)) map.removeLayer(EVACUATION_LAYER_IDS.volcanicRadii)
    map.removeSource(EVACUATION_LAYER_IDS.volcanicRadiiSource)
  }

  map.addSource(EVACUATION_LAYER_IDS.volcanicRadiiSource, { type: "geojson", data })

  map.addLayer({
    id: EVACUATION_LAYER_IDS.volcanicRadii,
    type: "line",
    source: EVACUATION_LAYER_IDS.volcanicRadiiSource,
    minzoom: EVACUATION_ROUTES_MIN_ZOOM,
    layout: { visibility: layerVisibility(visible) },
    paint: {
      "line-color": VOLCANIC_ROUTE_COLOR,
      "line-width": ["match", ["get", "distance"], 5, 1.5, 10, 2, 15, 2.5, 20, 3, 40, 3.5, 2],
      "line-opacity": 0.7,
      "line-dasharray": [2, 1],
    },
  })
}

function removeVolcanicRadiiLayer(map: maplibregl.Map): void {
  if (map.getLayer(EVACUATION_LAYER_IDS.volcanicRadii)) map.removeLayer(EVACUATION_LAYER_IDS.volcanicRadii)
  if (map.getSource(EVACUATION_LAYER_IDS.volcanicRadiiSource)) map.removeSource(EVACUATION_LAYER_IDS.volcanicRadiiSource)
}

const VOLCANIC_HAZARD_TIERS = [
  {
    peligro: "Bajo",
    fillId: EVACUATION_LAYER_IDS.volcanicHazardsBajoFill,
    lineId: EVACUATION_LAYER_IDS.volcanicHazardsBajoLine,
    fillColor: VOLCANIC_HAZARD_COLOR_BAJO,
    lineColor: VOLCANIC_HAZARD_LINE_COLOR_BAJO,
  },
  {
    peligro: "Medio",
    fillId: EVACUATION_LAYER_IDS.volcanicHazardsMedioFill,
    lineId: EVACUATION_LAYER_IDS.volcanicHazardsMedioLine,
    fillColor: VOLCANIC_HAZARD_COLOR_MEDIO,
    lineColor: VOLCANIC_HAZARD_LINE_COLOR_MEDIO,
  },
  {
    peligro: "Alto",
    fillId: EVACUATION_LAYER_IDS.volcanicHazardsAltoFill,
    lineId: EVACUATION_LAYER_IDS.volcanicHazardsAltoLine,
    fillColor: VOLCANIC_HAZARD_COLOR_ALTO,
    lineColor: VOLCANIC_HAZARD_LINE_COLOR_ALTO,
  },
] as const

async function addVolcanicHazardsLayer(map: maplibregl.Map, visible: boolean): Promise<void> {
  const res = await fetch(VOLCANIC_HAZARDS_URL)
  if (!res.ok) {
    throw new Error(`Failed to load volcanic hazards (${res.status})`)
  }
  const raw = (await res.json()) as FeatureCollection
  const data: FeatureCollection = {
    ...raw,
    features: raw.features.map((f) => ({
      ...f,
      properties: fixMojibakeRecord(f.properties as Record<string, unknown>),
    })),
  }

  removeVolcanicHazardsLayer(map)

  map.addSource(EVACUATION_LAYER_IDS.volcanicHazardsSource, { type: "geojson", data })

  for (const tier of VOLCANIC_HAZARD_TIERS) {
    map.addLayer({
      id: tier.fillId,
      type: "fill",
      source: EVACUATION_LAYER_IDS.volcanicHazardsSource,
      filter: ["==", ["get", "peligro"], tier.peligro],
      minzoom: 7,
      layout: { visibility: layerVisibility(visible) },
      paint: {
        "fill-color": tier.fillColor,
        "fill-opacity": 0.4,
      },
    })

    map.addLayer({
      id: tier.lineId,
      type: "line",
      source: EVACUATION_LAYER_IDS.volcanicHazardsSource,
      filter: ["==", ["get", "peligro"], tier.peligro],
      minzoom: 7,
      layout: { visibility: layerVisibility(visible) },
      paint: {
        "line-color": tier.lineColor,
        "line-width": 1,
        "line-opacity": 0.6,
      },
    })
  }
}

function removeVolcanicHazardsLayer(map: maplibregl.Map): void {
  for (const layerId of [...VOLCANIC_HAZARD_FILL_LAYER_IDS, ...VOLCANIC_HAZARD_LINE_LAYER_IDS]) {
    if (map.getLayer(layerId)) map.removeLayer(layerId)
  }
  if (map.getSource(EVACUATION_LAYER_IDS.volcanicHazardsSource)) {
    map.removeSource(EVACUATION_LAYER_IDS.volcanicHazardsSource)
  }
}

const WILDFIRE_TIERS = [
  {
    gridcode: 1,
    fillId: EVACUATION_LAYER_IDS.wildfireOccurrenceFill1,
    lineId: EVACUATION_LAYER_IDS.wildfireOccurrenceLine1,
    fillColor: WILDFIRE_COLOR_1,
    lineColor: WILDFIRE_LINE_COLOR_1,
  },
  {
    gridcode: 2,
    fillId: EVACUATION_LAYER_IDS.wildfireOccurrenceFill2,
    lineId: EVACUATION_LAYER_IDS.wildfireOccurrenceLine2,
    fillColor: WILDFIRE_COLOR_2,
    lineColor: WILDFIRE_LINE_COLOR_2,
  },
  {
    gridcode: 3,
    fillId: EVACUATION_LAYER_IDS.wildfireOccurrenceFill3,
    lineId: EVACUATION_LAYER_IDS.wildfireOccurrenceLine3,
    fillColor: WILDFIRE_COLOR_3,
    lineColor: WILDFIRE_LINE_COLOR_3,
  },
  {
    gridcode: 4,
    fillId: EVACUATION_LAYER_IDS.wildfireOccurrenceFill4,
    lineId: EVACUATION_LAYER_IDS.wildfireOccurrenceLine4,
    fillColor: WILDFIRE_COLOR_4,
    lineColor: WILDFIRE_LINE_COLOR_4,
  },
  {
    gridcode: 5,
    fillId: EVACUATION_LAYER_IDS.wildfireOccurrenceFill5,
    lineId: EVACUATION_LAYER_IDS.wildfireOccurrenceLine5,
    fillColor: WILDFIRE_COLOR_5,
    lineColor: WILDFIRE_LINE_COLOR_5,
  },
] as const

async function addWildfireOccurrenceLayer(map: maplibregl.Map, visible: boolean): Promise<void> {
  const res = await fetch(WILDFIRE_OCCURRENCE_URL)
  if (!res.ok) {
    throw new Error(`Failed to load wildfire occurrence data (${res.status})`)
  }

  const data = (await res.json()) as FeatureCollection

  removeWildfireOccurrenceLayer(map)

  map.addSource(EVACUATION_LAYER_IDS.wildfireOccurrenceSource, { type: "geojson", data })

  for (const tier of WILDFIRE_TIERS) {
    map.addLayer({
      id: tier.fillId,
      type: "fill",
      source: EVACUATION_LAYER_IDS.wildfireOccurrenceSource,
      filter: ["==", ["get", "gridcode"], tier.gridcode],
      minzoom: WILDFIRE_OCCURRENCE_MIN_ZOOM,
      layout: { visibility: layerVisibility(visible) },
      paint: {
        "fill-color": tier.fillColor,
        "fill-opacity": 0.45,
      },
    })

    map.addLayer({
      id: tier.lineId,
      type: "line",
      source: EVACUATION_LAYER_IDS.wildfireOccurrenceSource,
      filter: ["==", ["get", "gridcode"], tier.gridcode],
      minzoom: WILDFIRE_OCCURRENCE_MIN_ZOOM,
      layout: { visibility: layerVisibility(visible) },
      paint: {
        "line-color": tier.lineColor,
        "line-width": 0.5,
        "line-opacity": 0.5,
      },
    })
  }
}

function removeWildfireOccurrenceLayer(map: maplibregl.Map): void {
  for (const layerId of [...WILDFIRE_FILL_LAYER_IDS, ...WILDFIRE_LINE_LAYER_IDS]) {
    if (map.getLayer(layerId)) map.removeLayer(layerId)
  }
  if (map.getSource(EVACUATION_LAYER_IDS.wildfireOccurrenceSource)) {
    map.removeSource(EVACUATION_LAYER_IDS.wildfireOccurrenceSource)
  }
}

/** Load wildfire occurrence polygons on demand (~4.5MB — skipped on initial map paint). */
export async function ensureWildfireOccurrenceLayer(
  map: maplibregl.Map,
  visible: boolean,
): Promise<void> {
  if (!map.getSource(EVACUATION_LAYER_IDS.wildfireOccurrenceSource)) {
    if (!visible) return
    await addWildfireOccurrenceLayer(map, true)
    return
  }

  for (const layerId of [...WILDFIRE_FILL_LAYER_IDS, ...WILDFIRE_LINE_LAYER_IDS]) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", layerVisibility(visible))
    }
  }
}

let heavyLayersLoadId = 0

async function scheduleHeavyEvacuationLayers(
  map: maplibregl.Map,
  visibility: EvacuationLayerVisibility,
): Promise<void> {
  const loadId = ++heavyLayersLoadId

  try {
    const tasks: Promise<void>[] = []
    if (visibility.areas) tasks.push(addAreasLayer(map, visibility.areas))
    if (visibility.volcanicRadii) tasks.push(addVolcanicRadiiLayer(map, visibility.volcanicRadii))
    await Promise.all(tasks)

    if (loadId !== heavyLayersLoadId) return
    if (visibility.volcanicHazards) {
      await addVolcanicHazardsLayer(map, true)
    }
  } catch (error) {
    if (loadId !== heavyLayersLoadId) return
    console.error("Failed to load deferred evacuation layers", error)
  }
}

/** Load hazard polygons on demand (20MB — skipped on initial map paint). */
export async function ensureVolcanicHazardsLayer(
  map: maplibregl.Map,
  visible: boolean,
): Promise<void> {
  if (!map.getSource(EVACUATION_LAYER_IDS.volcanicHazardsSource)) {
    if (!visible) return
    await addVolcanicHazardsLayer(map, true)
    return
  }

  for (const layerId of [...VOLCANIC_HAZARD_FILL_LAYER_IDS, ...VOLCANIC_HAZARD_LINE_LAYER_IDS]) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", layerVisibility(visible))
    }
  }
}

export async function addEvacuationLayers(
  map: maplibregl.Map,
  visibility: EvacuationLayerVisibility,
): Promise<EvacuationLayerHandles> {
  heavyLayersLoadId += 1

  await addVolcanoesLayer(map, visibility.volcanoes)

  const [routes, meetingPoints, volcanicRoutes, volcanicMeetingPoints] = await Promise.all([
    addFlatKmzLayer(map, {
      id: EVACUATION_LAYER_IDS.routes,
      url: TSUNAMI_EVACUATION_ROUTES_URL,
      visible: visibility.routes,
      minzoom: EVACUATION_ROUTES_MIN_ZOOM,
      mode: "lines",
      defaultLineColor: EVACUATION_ROUTE_COLOR,
      defaultLineWidth: EVACUATION_ROUTE_LINE_WIDTH,
    }),
    addFlatKmzLayer(map, {
      id: EVACUATION_LAYER_IDS.meetingPoints,
      url: TSUNAMI_MEETING_POINTS_URL,
      visible: visibility.meetingPoints,
      minzoom: EVACUATION_MEETING_POINTS_MIN_ZOOM,
      mode: "points",
    }),
    addFlatKmzLayer(map, {
      id: EVACUATION_LAYER_IDS.volcanicRoutes,
      url: VOLCANIC_EVACUATION_ROUTES_URL,
      visible: visibility.volcanicRoutes,
      minzoom: EVACUATION_ROUTES_MIN_ZOOM,
      mode: "lines",
      defaultLineColor: VOLCANIC_ROUTE_COLOR,
      defaultLineWidth: EVACUATION_ROUTE_LINE_WIDTH,
    }),
    addFlatKmzLayer(map, {
      id: EVACUATION_LAYER_IDS.volcanicMeetingPoints,
      url: VOLCANIC_EVACUATION_MEETING_POINTS_URL,
      visible: visibility.volcanicMeetingPoints,
      minzoom: EVACUATION_MEETING_POINTS_MIN_ZOOM,
      mode: "points",
    }),
  ])

  addRouteDirectionArrows(map, routes, visibility.routes)
  addRouteDirectionArrows(map, volcanicRoutes, visibility.volcanicRoutes, VOLCANIC_ARROW_CONFIG)

  await scheduleHeavyEvacuationLayers(map, visibility)

  return { routes, meetingPoints, volcanicRoutes, volcanicMeetingPoints }
}

export function setEvacuationLayerVisibility(
  map: maplibregl.Map,
  handles: EvacuationLayerHandles,
  visibility: EvacuationLayerVisibility,
): void {
  for (const layerId of [EVACUATION_LAYER_IDS.areasFill, EVACUATION_LAYER_IDS.areasLine]) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", layerVisibility(visibility.areas))
    }
  }

  if (handles.routes) {
    setFlatKmzLayerVisibility(map, handles.routes, visibility.routes)
    if (map.getLayer(EVACUATION_LAYER_IDS.routesArrows)) {
      map.setLayoutProperty(
        EVACUATION_LAYER_IDS.routesArrows,
        "visibility",
        layerVisibility(visibility.routes),
      )
    }
  }

  if (handles.meetingPoints) {
    setFlatKmzLayerVisibility(map, handles.meetingPoints, visibility.meetingPoints)
  }

  if (handles.volcanicRoutes) {
    setFlatKmzLayerVisibility(map, handles.volcanicRoutes, visibility.volcanicRoutes)
    if (map.getLayer(EVACUATION_LAYER_IDS.volcanicRoutesArrows)) {
      map.setLayoutProperty(
        EVACUATION_LAYER_IDS.volcanicRoutesArrows,
        "visibility",
        layerVisibility(visibility.volcanicRoutes),
      )
    }
  }

  if (handles.volcanicMeetingPoints) {
    setFlatKmzLayerVisibility(map, handles.volcanicMeetingPoints, visibility.volcanicMeetingPoints)
  }

  for (const layerId of [EVACUATION_LAYER_IDS.volcanoes, EVACUATION_LAYER_IDS.volcanoesLabels]) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", layerVisibility(visibility.volcanoes))
    }
  }

  for (const lid of [EVACUATION_LAYER_IDS.volcanicRadii]) {
    if (map.getLayer(lid)) {
      map.setLayoutProperty(lid, "visibility", layerVisibility(visibility.volcanicRadii))
    }
  }
  for (const lid of [...VOLCANIC_HAZARD_FILL_LAYER_IDS, ...VOLCANIC_HAZARD_LINE_LAYER_IDS]) {
    if (map.getLayer(lid)) {
      map.setLayoutProperty(lid, "visibility", layerVisibility(visibility.volcanicHazards))
    }
  }
  for (const lid of [...WILDFIRE_FILL_LAYER_IDS, ...WILDFIRE_LINE_LAYER_IDS]) {
    if (map.getLayer(lid)) {
      map.setLayoutProperty(lid, "visibility", layerVisibility(visibility.wildfireOccurrence))
    }
  }
}

export function removeEvacuationLayers(
  map: maplibregl.Map,
  handles: EvacuationLayerHandles,
): void {
  heavyLayersLoadId += 1

  if (handles.routes) removeFlatKmzLayer(map, handles.routes)
  if (handles.meetingPoints) removeFlatKmzLayer(map, handles.meetingPoints)
  if (handles.volcanicRoutes) removeFlatKmzLayer(map, handles.volcanicRoutes)
  if (handles.volcanicMeetingPoints) removeFlatKmzLayer(map, handles.volcanicMeetingPoints)

  removeRouteDirectionArrows(map) // tsunami
  removeRouteDirectionArrows(map, VOLCANIC_ARROW_CONFIG) // volcanic

  for (const layerId of [EVACUATION_LAYER_IDS.areasFill, EVACUATION_LAYER_IDS.areasLine]) {
    if (map.getLayer(layerId)) map.removeLayer(layerId)
  }

  if (map.getSource(EVACUATION_LAYER_IDS.areasSource)) {
    map.removeSource(EVACUATION_LAYER_IDS.areasSource)
  }

  removeVolcanoesLayer(map)
  removeVolcanicRadiiLayer(map)
  removeVolcanicHazardsLayer(map)
  removeWildfireOccurrenceLayer(map)
}