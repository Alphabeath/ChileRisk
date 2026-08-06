import type { Feature, FeatureCollection, Geometry, Position } from "geojson"
import type * as maplibregl from "maplibre-gl"

import {
  EVACUATION_AREAS_MIN_ZOOM,
  EVACUATION_ICON_URLS,
  EVACUATION_LAYER_IDS,
  EVACUATION_MEETING_POINT_ICON_SIZE,
  EVACUATION_MEETING_POINTS_MIN_ZOOM,
  EVACUATION_PMTILES_SOURCE_LAYER,
  EVACUATION_ROUTE_ARROWS_MIN_ZOOM,
  EVACUATION_ROUTE_COLOR,
  EVACUATION_ROUTE_LINE_WIDTH,
  EVACUATION_ROUTES_MIN_ZOOM,
  EVACUATION_URLS,
  VOLCANIC_HAZARD_COLOR_ALTO,
  VOLCANIC_HAZARD_COLOR_BAJO,
  VOLCANIC_HAZARD_COLOR_MEDIO,
  VOLCANIC_HAZARD_FILL_LAYER_IDS,
  VOLCANIC_HAZARD_LINE_COLOR_ALTO,
  VOLCANIC_HAZARD_LINE_COLOR_BAJO,
  VOLCANIC_HAZARD_LINE_COLOR_MEDIO,
  VOLCANIC_HAZARD_LINE_LAYER_IDS,
  VOLCANIC_ROUTE_COLOR,
  WILDFIRE_COLOR_1,
  WILDFIRE_COLOR_2,
  WILDFIRE_COLOR_3,
  WILDFIRE_COLOR_4,
  WILDFIRE_COLOR_5,
  WILDFIRE_FILL_LAYER_IDS,
  WILDFIRE_LINE_COLOR_1,
  WILDFIRE_LINE_COLOR_2,
  WILDFIRE_LINE_COLOR_3,
  WILDFIRE_LINE_COLOR_4,
  WILDFIRE_LINE_COLOR_5,
  WILDFIRE_LINE_LAYER_IDS,
  WILDFIRE_OCCURRENCE_MIN_ZOOM,
} from "@/components/map/evacuacion-config"
import { fixMojibakeRecord } from "@/lib/fix-mojibake"
import { assetExists, ensurePmtilesProtocol } from "@/lib/pmtiles-protocol"

export interface EvacuationLayerVisibility {
  areas: boolean
  routes: boolean
  meetingPoints: boolean
  volcanicRoutes: boolean
  volcanicMeetingPointsPe: boolean
  volcanicMeetingPointsPet: boolean
  volcanoes: boolean
  volcanicRadii: boolean
  volcanicHazards: boolean
  wildfireOccurrence: boolean
}

export interface EvacuationLayerHandles {
  tsunamiMeetingPoints: FeatureCollection | null
  volcanicMeetingPoints: FeatureCollection | null
}

function layerVisibility(visible: boolean): "visible" | "none" {
  return visible ? "visible" : "none"
}

async function fetchGeoJSON(url: string): Promise<FeatureCollection> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`)
  const raw = (await res.json()) as FeatureCollection
  return {
    ...raw,
    features: raw.features.map((feature) => ({
      ...feature,
      properties: fixMojibakeRecord(
        feature.properties as Record<string, unknown>,
      ),
    })),
  }
}

async function addPmtilesVectorSource(
  map: maplibregl.Map,
  opts: {
    sourceId: string
    pmtilesUrl: string
  },
): Promise<void> {
  if (map.getSource(opts.sourceId)) return
  if (!(await assetExists(opts.pmtilesUrl))) {
    throw new Error(`Missing evacuation PMTiles: ${opts.pmtilesUrl}`)
  }
  ensurePmtilesProtocol()
  map.addSource(opts.sourceId, {
    type: "vector",
    url: `pmtiles://${window.location.origin}${opts.pmtilesUrl}`,
  })
}

function vectorSourceLayer(sourceLayer: string): { "source-layer": string } {
  return { "source-layer": sourceLayer }
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

function lineStringArrow(
  coords: Position[],
): { point: Position; bearing: number } | null {
  if (coords.length < 2) return null
  // Arrow at the route end (evacuation direction along the line).
  const point = coords[coords.length - 1]
  const approach = coords[coords.length - 2]
  return { point, bearing: lineBearing(approach, point) }
}

function endpointsFromGeometry(
  geometry: Geometry,
): { point: Position; bearing: number }[] {
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

function ensureRouteArrowImage(
  map: maplibregl.Map,
  imageId: string,
  color: string,
): void {
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

function addRouteArrows(
  map: maplibregl.Map,
  features: Feature[],
  visible: boolean,
  config: { imageId: string; sourceId: string; layerId: string; color: string },
): void {
  if (map.getLayer(config.layerId)) map.removeLayer(config.layerId)
  if (map.getSource(config.sourceId)) map.removeSource(config.sourceId)

  const arrowPoints = buildRouteArrowPoints(features)
  if (!arrowPoints.features.length) return

  ensureRouteArrowImage(map, config.imageId, config.color)
  map.addSource(config.sourceId, { type: "geojson", data: arrowPoints })
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
  map.addImage(imageId, ctx.getImageData(0, 0, size, size), {
    sdf: true,
    pixelRatio: 2,
  })
}

async function ensureMeetingPointIcons(map: maplibregl.Map): Promise<void> {
  const entries = [
    [
      EVACUATION_LAYER_IDS.meetingPointPeImage,
      EVACUATION_ICON_URLS.meetingPointPe,
    ],
    [
      EVACUATION_LAYER_IDS.meetingPointPetImage,
      EVACUATION_ICON_URLS.meetingPointPet,
    ],
    [
      EVACUATION_LAYER_IDS.meetingPointTsunamiPeImage,
      EVACUATION_ICON_URLS.meetingPointTsunamiPe,
    ],
  ] as const

  await Promise.all(
    entries.map(async ([imageId, url]) => {
      if (map.hasImage(imageId)) return
      try {
        const image = await map.loadImage(url)
        if (!map.hasImage(imageId)) {
          // Native pixel ratio — these PNGs are already ~40px; pixelRatio:2 halves them.
          map.addImage(imageId, image.data)
        }
      } catch (err) {
        console.warn(`Failed to load meeting-point icon ${url}`, err)
      }
    }),
  )
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

/** Style may be null mid-setStyle / after map.remove(); MapLibre then throws on getImage/getLayer. */
function canMutateStyle(map: maplibregl.Map): boolean {
  try {
    return map.getStyle() != null
  } catch {
    return false
  }
}

function removeLayersByIds(map: maplibregl.Map, ids: readonly string[]): void {
  if (!canMutateStyle(map)) return
  for (const id of ids) {
    if (map.getLayer(id)) map.removeLayer(id)
  }
}

export async function addEvacuationLayers(
  map: maplibregl.Map,
  visibility: EvacuationLayerVisibility,
): Promise<EvacuationLayerHandles> {
  ensurePmtilesProtocol()

  // --- Tsunami areas (PMTiles only) ---
  if (!map.getSource(EVACUATION_LAYER_IDS.areasSource)) {
    await addPmtilesVectorSource(map, {
      sourceId: EVACUATION_LAYER_IDS.areasSource,
      pmtilesUrl: EVACUATION_URLS.tsunamiAreasPmtiles,
    })
    const sl = vectorSourceLayer(EVACUATION_PMTILES_SOURCE_LAYER.tsunamiAreas)
    map.addLayer({
      id: EVACUATION_LAYER_IDS.areasFill,
      type: "fill",
      source: EVACUATION_LAYER_IDS.areasSource,
      ...sl,
      minzoom: EVACUATION_AREAS_MIN_ZOOM,
      layout: { visibility: layerVisibility(visibility.areas) },
      paint: { "fill-color": "#ef4444", "fill-opacity": 0.35 },
    })
    map.addLayer({
      id: EVACUATION_LAYER_IDS.areasLine,
      type: "line",
      source: EVACUATION_LAYER_IDS.areasSource,
      ...sl,
      minzoom: EVACUATION_AREAS_MIN_ZOOM,
      layout: { visibility: layerVisibility(visibility.areas) },
      paint: {
        "line-color": "#ef4444",
        "line-width": 1.5,
        "line-opacity": 0.85,
      },
    })
  }

  // --- Tsunami routes ---
  const tsunamiRoutes = await fetchGeoJSON(EVACUATION_URLS.tsunamiRoutes)
  if (!map.getSource(EVACUATION_LAYER_IDS.routesSource)) {
    map.addSource(EVACUATION_LAYER_IDS.routesSource, {
      type: "geojson",
      data: tsunamiRoutes,
    })
    map.addLayer({
      id: EVACUATION_LAYER_IDS.routes,
      type: "line",
      source: EVACUATION_LAYER_IDS.routesSource,
      minzoom: EVACUATION_ROUTES_MIN_ZOOM,
      layout: {
        visibility: layerVisibility(visibility.routes),
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": EVACUATION_ROUTE_COLOR,
        "line-width": EVACUATION_ROUTE_LINE_WIDTH,
        "line-opacity": 0.9,
      },
    })
    addRouteArrows(map, tsunamiRoutes.features, visibility.routes, {
      imageId: EVACUATION_LAYER_IDS.routesArrowImage,
      sourceId: EVACUATION_LAYER_IDS.routesArrowsSource,
      layerId: EVACUATION_LAYER_IDS.routesArrows,
      color: EVACUATION_ROUTE_COLOR,
    })
  }

  // --- Tsunami meeting points (original PE icon from KMZ) ---
  const tsunamiMeetingPoints = await fetchGeoJSON(
    EVACUATION_URLS.tsunamiMeetingPoints,
  )
  await ensureMeetingPointIcons(map)
  if (!map.getSource(EVACUATION_LAYER_IDS.meetingPointsSource)) {
    map.addSource(EVACUATION_LAYER_IDS.meetingPointsSource, {
      type: "geojson",
      data: tsunamiMeetingPoints,
    })
    map.addLayer({
      id: EVACUATION_LAYER_IDS.meetingPoints,
      type: "symbol",
      source: EVACUATION_LAYER_IDS.meetingPointsSource,
      minzoom: EVACUATION_MEETING_POINTS_MIN_ZOOM,
      layout: {
        visibility: layerVisibility(visibility.meetingPoints),
        "icon-image": EVACUATION_LAYER_IDS.meetingPointTsunamiPeImage,
        "icon-size": EVACUATION_MEETING_POINT_ICON_SIZE,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-anchor": "center",
      },
    })
  }

  // --- Volcanoes ---
  if (!map.getSource(EVACUATION_LAYER_IDS.volcanoesSource)) {
    const volcanoes = await fetchGeoJSON(EVACUATION_URLS.activeVolcanoes)
    map.addSource(EVACUATION_LAYER_IDS.volcanoesSource, {
      type: "geojson",
      data: volcanoes,
    })
    ensureVolcanoMarkerImage(map)
    map.addLayer({
      id: EVACUATION_LAYER_IDS.volcanoes,
      type: "symbol",
      source: EVACUATION_LAYER_IDS.volcanoesSource,
      minzoom: 5,
      layout: {
        visibility: layerVisibility(visibility.volcanoes),
        "icon-image": EVACUATION_LAYER_IDS.volcanoesIconImage,
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          0.65,
          8,
          0.85,
          12,
          1,
        ],
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
        visibility: layerVisibility(visibility.volcanoes),
        "text-field": ["get", "volcan"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          6,
          10,
          10,
          11,
          13,
          12,
        ],
        "text-anchor": "top",
        "text-offset": [0, 0.35],
        "text-max-width": 10,
        "text-optional": true,
      },
      paint: {
        "text-color": "#f8fafc",
        "text-halo-color": "#0f172a",
        "text-halo-width": 1.5,
        "text-opacity": 0.92,
      },
    })
  }

  // --- Volcanic routes ---
  const volcanicRoutes = await fetchGeoJSON(EVACUATION_URLS.volcanicRoutes)
  if (!map.getSource(EVACUATION_LAYER_IDS.volcanicRoutesSource)) {
    map.addSource(EVACUATION_LAYER_IDS.volcanicRoutesSource, {
      type: "geojson",
      data: volcanicRoutes,
    })
    map.addLayer({
      id: EVACUATION_LAYER_IDS.volcanicRoutes,
      type: "line",
      source: EVACUATION_LAYER_IDS.volcanicRoutesSource,
      minzoom: EVACUATION_ROUTES_MIN_ZOOM,
      layout: {
        visibility: layerVisibility(visibility.volcanicRoutes),
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": VOLCANIC_ROUTE_COLOR,
        "line-width": EVACUATION_ROUTE_LINE_WIDTH,
        "line-opacity": 0.9,
      },
    })
    addRouteArrows(map, volcanicRoutes.features, visibility.volcanicRoutes, {
      imageId: EVACUATION_LAYER_IDS.volcanicRoutesArrowImage,
      sourceId: EVACUATION_LAYER_IDS.volcanicRoutesArrowsSource,
      layerId: EVACUATION_LAYER_IDS.volcanicRoutesArrows,
      color: VOLCANIC_ROUTE_COLOR,
    })
  }

  // --- Volcanic meeting points PE / PET (original KMZ icons) ---
  const volcanicMeetingPoints = await fetchGeoJSON(
    EVACUATION_URLS.volcanicMeetingPoints,
  )
  await ensureMeetingPointIcons(map)
  if (!map.getSource(EVACUATION_LAYER_IDS.volcanicMeetingPointsSource)) {
    map.addSource(EVACUATION_LAYER_IDS.volcanicMeetingPointsSource, {
      type: "geojson",
      data: volcanicMeetingPoints,
    })
    map.addLayer({
      id: EVACUATION_LAYER_IDS.volcanicMeetingPointsPe,
      type: "symbol",
      source: EVACUATION_LAYER_IDS.volcanicMeetingPointsSource,
      minzoom: EVACUATION_MEETING_POINTS_MIN_ZOOM,
      filter: ["==", ["upcase", ["to-string", ["get", "tipo"]]], "PE"],
      layout: {
        visibility: layerVisibility(visibility.volcanicMeetingPointsPe),
        "icon-image": EVACUATION_LAYER_IDS.meetingPointPeImage,
        "icon-size": EVACUATION_MEETING_POINT_ICON_SIZE,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-anchor": "center",
      },
    })
    map.addLayer({
      id: EVACUATION_LAYER_IDS.volcanicMeetingPointsPet,
      type: "symbol",
      source: EVACUATION_LAYER_IDS.volcanicMeetingPointsSource,
      minzoom: EVACUATION_MEETING_POINTS_MIN_ZOOM,
      filter: ["==", ["upcase", ["to-string", ["get", "tipo"]]], "PET"],
      layout: {
        visibility: layerVisibility(visibility.volcanicMeetingPointsPet),
        "icon-image": EVACUATION_LAYER_IDS.meetingPointPetImage,
        "icon-size": EVACUATION_MEETING_POINT_ICON_SIZE,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-anchor": "center",
      },
    })
  }

  // --- Volcanic radii ---
  if (!map.getSource(EVACUATION_LAYER_IDS.volcanicRadiiSource)) {
    const radii = await fetchGeoJSON(EVACUATION_URLS.volcanicRadii)
    map.addSource(EVACUATION_LAYER_IDS.volcanicRadiiSource, {
      type: "geojson",
      data: radii,
    })
    map.addLayer({
      id: EVACUATION_LAYER_IDS.volcanicRadii,
      type: "line",
      source: EVACUATION_LAYER_IDS.volcanicRadiiSource,
      minzoom: EVACUATION_ROUTES_MIN_ZOOM,
      layout: { visibility: layerVisibility(visibility.volcanicRadii) },
      paint: {
        "line-color": VOLCANIC_ROUTE_COLOR,
        "line-width": [
          "match",
          ["get", "distance"],
          5,
          1.5,
          10,
          2,
          15,
          2.5,
          20,
          3,
          40,
          3.5,
          2,
        ],
        "line-opacity": 0.7,
        "line-dasharray": [2, 1],
      },
    })
  }

  if (visibility.volcanicHazards) {
    await ensureVolcanicHazardsLayer(map, true)
  }
  if (visibility.wildfireOccurrence) {
    await ensureWildfireOccurrenceLayer(map, true)
  }

  return {
    tsunamiMeetingPoints,
    volcanicMeetingPoints,
  }
}

export async function ensureVolcanicHazardsLayer(
  map: maplibregl.Map,
  visible: boolean,
): Promise<void> {
  if (map.getSource(EVACUATION_LAYER_IDS.volcanicHazardsSource)) {
    setLayerIdsVisibility(
      map,
      [...VOLCANIC_HAZARD_FILL_LAYER_IDS, ...VOLCANIC_HAZARD_LINE_LAYER_IDS],
      visible,
    )
    return
  }

  await addPmtilesVectorSource(map, {
    sourceId: EVACUATION_LAYER_IDS.volcanicHazardsSource,
    pmtilesUrl: EVACUATION_URLS.volcanicHazardsPmtiles,
  })
  const sl = vectorSourceLayer(EVACUATION_PMTILES_SOURCE_LAYER.volcanicHazards)

  const levels = [
    {
      filter: ["==", ["get", "peligro"], "Bajo"] as maplibregl.FilterSpecification,
      fill: EVACUATION_LAYER_IDS.volcanicHazardsBajoFill,
      line: EVACUATION_LAYER_IDS.volcanicHazardsBajoLine,
      fillColor: VOLCANIC_HAZARD_COLOR_BAJO,
      lineColor: VOLCANIC_HAZARD_LINE_COLOR_BAJO,
    },
    {
      filter: ["==", ["get", "peligro"], "Medio"] as maplibregl.FilterSpecification,
      fill: EVACUATION_LAYER_IDS.volcanicHazardsMedioFill,
      line: EVACUATION_LAYER_IDS.volcanicHazardsMedioLine,
      fillColor: VOLCANIC_HAZARD_COLOR_MEDIO,
      lineColor: VOLCANIC_HAZARD_LINE_COLOR_MEDIO,
    },
    {
      filter: ["==", ["get", "peligro"], "Alto"] as maplibregl.FilterSpecification,
      fill: EVACUATION_LAYER_IDS.volcanicHazardsAltoFill,
      line: EVACUATION_LAYER_IDS.volcanicHazardsAltoLine,
      fillColor: VOLCANIC_HAZARD_COLOR_ALTO,
      lineColor: VOLCANIC_HAZARD_LINE_COLOR_ALTO,
    },
  ]

  for (const level of levels) {
    map.addLayer({
      id: level.fill,
      type: "fill",
      source: EVACUATION_LAYER_IDS.volcanicHazardsSource,
      ...sl,
      minzoom: 6,
      filter: level.filter,
      layout: { visibility: layerVisibility(visible) },
      paint: { "fill-color": level.fillColor, "fill-opacity": 0.4 },
    })
    map.addLayer({
      id: level.line,
      type: "line",
      source: EVACUATION_LAYER_IDS.volcanicHazardsSource,
      ...sl,
      minzoom: 6,
      filter: level.filter,
      layout: { visibility: layerVisibility(visible) },
      paint: {
        "line-color": level.lineColor,
        "line-width": 1.25,
        "line-opacity": 0.85,
      },
    })
  }
}

export async function ensureWildfireOccurrenceLayer(
  map: maplibregl.Map,
  visible: boolean,
): Promise<void> {
  if (map.getSource(EVACUATION_LAYER_IDS.wildfireOccurrenceSource)) {
    setLayerIdsVisibility(
      map,
      [...WILDFIRE_FILL_LAYER_IDS, ...WILDFIRE_LINE_LAYER_IDS],
      visible,
    )
    return
  }

  await addPmtilesVectorSource(map, {
    sourceId: EVACUATION_LAYER_IDS.wildfireOccurrenceSource,
    pmtilesUrl: EVACUATION_URLS.wildfirePmtiles,
  })
  const sl = vectorSourceLayer(EVACUATION_PMTILES_SOURCE_LAYER.wildfire)

  const classes = [
    {
      code: 1,
      fill: EVACUATION_LAYER_IDS.wildfireOccurrenceFill1,
      line: EVACUATION_LAYER_IDS.wildfireOccurrenceLine1,
      fillColor: WILDFIRE_COLOR_1,
      lineColor: WILDFIRE_LINE_COLOR_1,
    },
    {
      code: 2,
      fill: EVACUATION_LAYER_IDS.wildfireOccurrenceFill2,
      line: EVACUATION_LAYER_IDS.wildfireOccurrenceLine2,
      fillColor: WILDFIRE_COLOR_2,
      lineColor: WILDFIRE_LINE_COLOR_2,
    },
    {
      code: 3,
      fill: EVACUATION_LAYER_IDS.wildfireOccurrenceFill3,
      line: EVACUATION_LAYER_IDS.wildfireOccurrenceLine3,
      fillColor: WILDFIRE_COLOR_3,
      lineColor: WILDFIRE_LINE_COLOR_3,
    },
    {
      code: 4,
      fill: EVACUATION_LAYER_IDS.wildfireOccurrenceFill4,
      line: EVACUATION_LAYER_IDS.wildfireOccurrenceLine4,
      fillColor: WILDFIRE_COLOR_4,
      lineColor: WILDFIRE_LINE_COLOR_4,
    },
    {
      code: 5,
      fill: EVACUATION_LAYER_IDS.wildfireOccurrenceFill5,
      line: EVACUATION_LAYER_IDS.wildfireOccurrenceLine5,
      fillColor: WILDFIRE_COLOR_5,
      lineColor: WILDFIRE_LINE_COLOR_5,
    },
  ]

  for (const c of classes) {
    const filter = [
      "==",
      ["get", "gridcode"],
      c.code,
    ] as maplibregl.FilterSpecification
    map.addLayer({
      id: c.fill,
      type: "fill",
      source: EVACUATION_LAYER_IDS.wildfireOccurrenceSource,
      ...sl,
      minzoom: WILDFIRE_OCCURRENCE_MIN_ZOOM,
      filter,
      layout: { visibility: layerVisibility(visible) },
      paint: { "fill-color": c.fillColor, "fill-opacity": 0.45 },
    })
    map.addLayer({
      id: c.line,
      type: "line",
      source: EVACUATION_LAYER_IDS.wildfireOccurrenceSource,
      ...sl,
      minzoom: WILDFIRE_OCCURRENCE_MIN_ZOOM,
      filter,
      layout: { visibility: layerVisibility(visible) },
      paint: {
        "line-color": c.lineColor,
        "line-width": 0.75,
        "line-opacity": 0.7,
      },
    })
  }
}

function setLayerIdsVisibility(
  map: maplibregl.Map,
  ids: readonly string[],
  visible: boolean,
): void {
  const v = layerVisibility(visible)
  for (const id of ids) {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", v)
  }
}

export async function setEvacuationLayerVisibility(
  map: maplibregl.Map,
  visibility: EvacuationLayerVisibility,
): Promise<void> {
  setLayerIdsVisibility(
    map,
    [EVACUATION_LAYER_IDS.areasFill, EVACUATION_LAYER_IDS.areasLine],
    visibility.areas,
  )
  setLayerIdsVisibility(
    map,
    [EVACUATION_LAYER_IDS.routes, EVACUATION_LAYER_IDS.routesArrows],
    visibility.routes,
  )
  setLayerIdsVisibility(
    map,
    [EVACUATION_LAYER_IDS.meetingPoints],
    visibility.meetingPoints,
  )
  setLayerIdsVisibility(
    map,
    [EVACUATION_LAYER_IDS.volcanoes, EVACUATION_LAYER_IDS.volcanoesLabels],
    visibility.volcanoes,
  )
  setLayerIdsVisibility(
    map,
    [
      EVACUATION_LAYER_IDS.volcanicRoutes,
      EVACUATION_LAYER_IDS.volcanicRoutesArrows,
    ],
    visibility.volcanicRoutes,
  )
  setLayerIdsVisibility(
    map,
    [EVACUATION_LAYER_IDS.volcanicMeetingPointsPe],
    visibility.volcanicMeetingPointsPe,
  )
  setLayerIdsVisibility(
    map,
    [EVACUATION_LAYER_IDS.volcanicMeetingPointsPet],
    visibility.volcanicMeetingPointsPet,
  )
  setLayerIdsVisibility(
    map,
    [EVACUATION_LAYER_IDS.volcanicRadii],
    visibility.volcanicRadii,
  )

  if (visibility.volcanicHazards) {
    await ensureVolcanicHazardsLayer(map, true)
  } else {
    setLayerIdsVisibility(
      map,
      [...VOLCANIC_HAZARD_FILL_LAYER_IDS, ...VOLCANIC_HAZARD_LINE_LAYER_IDS],
      false,
    )
  }

  if (visibility.wildfireOccurrence) {
    await ensureWildfireOccurrenceLayer(map, true)
  } else {
    setLayerIdsVisibility(
      map,
      [...WILDFIRE_FILL_LAYER_IDS, ...WILDFIRE_LINE_LAYER_IDS],
      false,
    )
  }
}

export function removeEvacuationLayers(map: maplibregl.Map): void {
  if (!canMutateStyle(map)) return

  const layerIds = [
    EVACUATION_LAYER_IDS.areasFill,
    EVACUATION_LAYER_IDS.areasLine,
    EVACUATION_LAYER_IDS.routes,
    EVACUATION_LAYER_IDS.routesArrows,
    EVACUATION_LAYER_IDS.meetingPoints,
    EVACUATION_LAYER_IDS.volcanoes,
    EVACUATION_LAYER_IDS.volcanoesLabels,
    EVACUATION_LAYER_IDS.volcanicRoutes,
    EVACUATION_LAYER_IDS.volcanicRoutesArrows,
    EVACUATION_LAYER_IDS.volcanicMeetingPointsPe,
    EVACUATION_LAYER_IDS.volcanicMeetingPointsPet,
    EVACUATION_LAYER_IDS.volcanicRadii,
    ...VOLCANIC_HAZARD_FILL_LAYER_IDS,
    ...VOLCANIC_HAZARD_LINE_LAYER_IDS,
    ...WILDFIRE_FILL_LAYER_IDS,
    ...WILDFIRE_LINE_LAYER_IDS,
  ]
  removeLayersByIds(map, layerIds)
  // Legacy circle ids from earlier builds (no-op if absent).
  removeLayersByIds(map, [
    "tsunami-meeting-points-circle",
    "volcanic-meeting-points-circle",
    "volcanic-meeting-points-icons",
  ])

  const sourceIds = [
    EVACUATION_LAYER_IDS.areasSource,
    EVACUATION_LAYER_IDS.routesSource,
    EVACUATION_LAYER_IDS.routesArrowsSource,
    EVACUATION_LAYER_IDS.meetingPointsSource,
    EVACUATION_LAYER_IDS.volcanoesSource,
    EVACUATION_LAYER_IDS.volcanicRoutesSource,
    EVACUATION_LAYER_IDS.volcanicRoutesArrowsSource,
    EVACUATION_LAYER_IDS.volcanicMeetingPointsSource,
    EVACUATION_LAYER_IDS.volcanicRadiiSource,
    EVACUATION_LAYER_IDS.volcanicHazardsSource,
    EVACUATION_LAYER_IDS.wildfireOccurrenceSource,
  ]
  for (const id of sourceIds) {
    if (map.getSource(id)) map.removeSource(id)
  }
  for (const imageId of [
    EVACUATION_LAYER_IDS.routesArrowImage,
    EVACUATION_LAYER_IDS.volcanicRoutesArrowImage,
    EVACUATION_LAYER_IDS.volcanoesIconImage,
    EVACUATION_LAYER_IDS.meetingPointPeImage,
    EVACUATION_LAYER_IDS.meetingPointPetImage,
    EVACUATION_LAYER_IDS.meetingPointTsunamiPeImage,
  ]) {
    if (map.hasImage(imageId)) map.removeImage(imageId)
  }
}
