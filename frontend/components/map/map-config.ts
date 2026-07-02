import type maplibregl from "maplibre-gl"

export const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"

/** Font glyphs for volcano labels on raster evacuation basemaps (Carto CDN). */
export const EVACUATION_MAP_GLYPHS =
  "https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf"

export const EVACUATION_SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8 as unknown as maplibregl.StyleSpecification["version"],
  glyphs: EVACUATION_MAP_GLYPHS,
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

export const EVACUATION_STREETS_STYLE: maplibregl.StyleSpecification = {
  version: 8 as unknown as maplibregl.StyleSpecification["version"],
  glyphs: EVACUATION_MAP_GLYPHS,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
}

export const TSUNAMI_EVACUATION_AREAS_URL = "/data/tsunami/evacuation-areas.geojson"
export const TSUNAMI_EVACUATION_ROUTES_URL = "/data/tsunami/evacuation-routes.kmz"
export const TSUNAMI_MEETING_POINTS_URL = "/data/tsunami/meeting-points.kmz"

export const VOLCANIC_ACTIVE_VOLCANOES_URL = "/data/volcanos/active-volcanoes.geojson"
export const VOLCANIC_EVACUATION_ROUTES_URL = "/data/volcanos/volcanic-routes.kmz"
export const VOLCANIC_EVACUATION_MEETING_POINTS_URL = "/data/volcanos/volcanic-meeting-points.kmz"
export const VOLCANIC_RADII_URL = "/data/volcanos/volcanic-radii.geojson"
export const VOLCANIC_HAZARDS_URL = "/data/volcanos/volcanic-hazards.geojson"

export const WILDFIRE_OCCURRENCE_URL = "/data/wildfire/wildfire-occurrence.geojson"

export const EVACUATION_LAYER_IDS = {
  areasSource: "tsunami-areas",
  areasFill: "tsunami-areas-fill",
  areasLine: "tsunami-areas-line",
  routes: "tsunami-routes",
  routesArrowImage: "tsunami-routes-arrow",
  routesArrowsSource: "tsunami-routes-arrows-source",
  routesArrows: "tsunami-routes-arrows",
  meetingPoints: "tsunami-meeting-points",
  volcanoesSource: "volcanoes-active",
  volcanoesIconImage: "volcano-marker-sdf",
  volcanoes: "volcanoes-active-icons",
  volcanoesLabels: "volcanoes-active-labels",
  volcanicRoutes: "volcanic-routes",
  volcanicMeetingPoints: "volcanic-meeting-points",
  volcanicRadiiSource: "volcanic-radii",
  volcanicRadii: "volcanic-radii-lines",
  volcanicHazardsSource: "volcanic-hazards",
  volcanicHazardsBajoFill: "volcanic-hazards-bajo-fill",
  volcanicHazardsMedioFill: "volcanic-hazards-medio-fill",
  volcanicHazardsAltoFill: "volcanic-hazards-alto-fill",
  volcanicHazardsBajoLine: "volcanic-hazards-bajo-line",
  volcanicHazardsMedioLine: "volcanic-hazards-medio-line",
  volcanicHazardsAltoLine: "volcanic-hazards-alto-line",
  volcanicRoutesArrowImage: "volcanic-routes-arrow",
  volcanicRoutesArrowsSource: "volcanic-routes-arrows-source",
  volcanicRoutesArrows: "volcanic-routes-arrows",
  wildfireOccurrenceSource: "wildfire-occurrence",
  wildfireOccurrenceFill1: "wildfire-occurrence-1-fill",
  wildfireOccurrenceFill2: "wildfire-occurrence-2-fill",
  wildfireOccurrenceFill3: "wildfire-occurrence-3-fill",
  wildfireOccurrenceFill4: "wildfire-occurrence-4-fill",
  wildfireOccurrenceFill5: "wildfire-occurrence-5-fill",
  wildfireOccurrenceLine1: "wildfire-occurrence-1-line",
  wildfireOccurrenceLine2: "wildfire-occurrence-2-line",
  wildfireOccurrenceLine3: "wildfire-occurrence-3-line",
  wildfireOccurrenceLine4: "wildfire-occurrence-4-line",
  wildfireOccurrenceLine5: "wildfire-occurrence-5-line",
} as const

/** Matches KML LineStyle00 in evacuation-routes.kmz (aabbggrr ffe65c00). */
export const EVACUATION_ROUTE_COLOR = "#005ce6"

/** Default line width for evacuation routes on the map. */
export const EVACUATION_ROUTE_LINE_WIDTH = 4

/** Symbol scale for meeting point icons (KMZ PNG). */
export const EVACUATION_MEETING_POINT_ICON_SIZE = 1.5

/** Legend swatch — matches green meeting point markers in KMZ. */
export const EVACUATION_MEETING_POINT_COLOR = "#22c55e"

/** Volcanic evacuation route color (distinct from tsunami blue). */
export const VOLCANIC_ROUTE_COLOR = "#ea580c"

/** Volcanic meeting points accent (amber). */
export const VOLCANIC_MEETING_POINT_COLOR = "#f59e0b"

/** SERNAGEOMIN volcanic hazard fill colors (Alto / Medio / Bajo). */
export const VOLCANIC_HAZARD_COLOR_ALTO = "#dc2626"
export const VOLCANIC_HAZARD_COLOR_MEDIO = "#ea580c"
export const VOLCANIC_HAZARD_COLOR_BAJO = "#eab308"

/** Matching outline colors for hazard polygons. */
export const VOLCANIC_HAZARD_LINE_COLOR_ALTO = "#b91c1c"
export const VOLCANIC_HAZARD_LINE_COLOR_MEDIO = "#c2410c"
export const VOLCANIC_HAZARD_LINE_COLOR_BAJO = "#ca8a04"

/** Wildfire occurrence fill colors (gridcode 1-5, kernel density classes). */
export const WILDFIRE_COLOR_1 = "#6b7fa0"
export const WILDFIRE_COLOR_2 = "#5a9e82"
export const WILDFIRE_COLOR_3 = "#d4b832"
export const WILDFIRE_COLOR_4 = "#d07020"
export const WILDFIRE_COLOR_5 = "#b82828"

/** Matching outline colors for wildfire polygons. */
export const WILDFIRE_LINE_COLOR_1 = "#4a5a72"
export const WILDFIRE_LINE_COLOR_2 = "#3d7560"
export const WILDFIRE_LINE_COLOR_3 = "#a89020"
export const WILDFIRE_LINE_COLOR_4 = "#a05818"
export const WILDFIRE_LINE_COLOR_5 = "#8a1e1e"

/** Draw Bajo → Medio → Alto so higher severity paints above overlaps. */
export const VOLCANIC_HAZARD_FILL_LAYER_IDS = [
  EVACUATION_LAYER_IDS.volcanicHazardsBajoFill,
  EVACUATION_LAYER_IDS.volcanicHazardsMedioFill,
  EVACUATION_LAYER_IDS.volcanicHazardsAltoFill,
] as const

export const VOLCANIC_HAZARD_LINE_LAYER_IDS = [
  EVACUATION_LAYER_IDS.volcanicHazardsBajoLine,
  EVACUATION_LAYER_IDS.volcanicHazardsMedioLine,
  EVACUATION_LAYER_IDS.volcanicHazardsAltoLine,
] as const

export const WILDFIRE_FILL_LAYER_IDS = [
  EVACUATION_LAYER_IDS.wildfireOccurrenceFill1,
  EVACUATION_LAYER_IDS.wildfireOccurrenceFill2,
  EVACUATION_LAYER_IDS.wildfireOccurrenceFill3,
  EVACUATION_LAYER_IDS.wildfireOccurrenceFill4,
  EVACUATION_LAYER_IDS.wildfireOccurrenceFill5,
] as const

export const WILDFIRE_LINE_LAYER_IDS = [
  EVACUATION_LAYER_IDS.wildfireOccurrenceLine1,
  EVACUATION_LAYER_IDS.wildfireOccurrenceLine2,
  EVACUATION_LAYER_IDS.wildfireOccurrenceLine3,
  EVACUATION_LAYER_IDS.wildfireOccurrenceLine4,
  EVACUATION_LAYER_IDS.wildfireOccurrenceLine5,
] as const

export function isVolcanoLayer(layerId: string): boolean {
  return (
    layerId === EVACUATION_LAYER_IDS.volcanoes ||
    layerId === EVACUATION_LAYER_IDS.volcanoesLabels
  )
}

export function isVolcanicHazardLayer(layerId: string): boolean {
  return (
    (VOLCANIC_HAZARD_FILL_LAYER_IDS as readonly string[]).includes(layerId) ||
    (VOLCANIC_HAZARD_LINE_LAYER_IDS as readonly string[]).includes(layerId)
  )
}

export function isWildfireLayer(layerId: string): boolean {
  return (
    (WILDFIRE_FILL_LAYER_IDS as readonly string[]).includes(layerId) ||
    (WILDFIRE_LINE_LAYER_IDS as readonly string[]).includes(layerId)
  )
}

/** Hide evacuation polygons until the user is zoomed into a comuna-scale view. */
export const EVACUATION_AREAS_MIN_ZOOM = 10

/** Wildfire occurrence polygons — visible at region level for overview. */
export const WILDFIRE_OCCURRENCE_MIN_ZOOM = 5

/** Meeting points only render when close enough to read labels and icons. */
export const EVACUATION_MEETING_POINTS_MIN_ZOOM = 11

/** Evacuation route lines — same comuna-scale threshold as areas. */
export const EVACUATION_ROUTES_MIN_ZOOM = EVACUATION_AREAS_MIN_ZOOM

/** Direction arrows at route ends — same scale as evacuation areas. */
export const EVACUATION_ROUTE_ARROWS_MIN_ZOOM = EVACUATION_AREAS_MIN_ZOOM

export const REGIONS_DATA_URL = "/data/regional.geojson"
export const COMUNAS_DATA_URL = "/data/comunas.geojson"

export const CHILE_BOUNDS: [number, number, number, number] = [-76, -56, -66, -17]

export const COMUNAS_MIN_ZOOM = 7

export const REGION_LINE_COLOR = "#ffffff"
export const REGION_LINE_HOVER = "#ffffff"

export const COMUNA_LINE_COLOR = "#ffffff"
export const COMUNA_LINE_HOVER = "#ffffff"

export interface RegionProperties {
  codregion: number
  Region: string
  area_km: number
  composite_score?: number
  severity?: string
  dominant_hazard?: string
  sismo_score?: number
  ola_calor_score?: number
  ola_frio_score?: number
  viento_score?: number
  avg_temperature_c?: number | null
  avg_wind_speed_kmh?: number | null
}

export interface ComunaProperties {
  cod_comuna: number
  Comuna: string
  Provincia: string
  Region: string
  codregion: number
  composite_score?: number
  severity?: string
  dominant_hazard?: string
  sismo_score?: number
  ola_calor_score?: number
  ola_frio_score?: number
  viento_score?: number
  temperature_c?: number | null
  wind_speed_kmh?: number | null
  seismic_impact?: {
    event_id: number
    distance_km: number
    estimated_intensity: number
    risk_score: number
    magnitude: number
    occurred_at?: string | null
    detail_url?: string | null
  } | null
}

export function hideForeignLabels(map: maplibregl.Map) {
  const style = map.getStyle()
  if (!style.layers) return

  const hidePatterns = [
    "country",
    "place_island",
    "place_city",
    "place_town",
    "place_village",
    "place_hamlet",
    "place_suburb",
    "place_state",
    "poi",
  ]

  for (const layer of style.layers) {
    const shouldHide = hidePatterns.some((pattern) =>
      layer.id.toLowerCase().includes(pattern)
    )
    if (shouldHide) {
      map.setLayoutProperty(layer.id, "visibility", "none")
    }
  }
}
