/** Evacuation map URLs, layer ids, colors, zoom gates. */

export const EVACUATION_DATA_BASE = "/data/evacuacion"

/** OpenFreeMap — detailed streets; theme-aware (no API key). */
export const EVACUATION_STREETS_STYLES = {
  light: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://tiles.openfreemap.org/styles/dark",
} as const

export const EVACUATION_URLS = {
  tsunamiAreasPmtiles: `${EVACUATION_DATA_BASE}/tsunami-areas.pmtiles`,
  tsunamiRoutes: `${EVACUATION_DATA_BASE}/tsunami-routes.geojson`,
  tsunamiMeetingPoints: `${EVACUATION_DATA_BASE}/tsunami-meeting-points.geojson`,
  volcanicHazardsPmtiles: `${EVACUATION_DATA_BASE}/volcanic-hazards.pmtiles`,
  volcanicRadii: `${EVACUATION_DATA_BASE}/volcanic-radii.geojson`,
  activeVolcanoes: `${EVACUATION_DATA_BASE}/active-volcanoes.geojson`,
  volcanicRoutes: `${EVACUATION_DATA_BASE}/volcanic-routes.geojson`,
  volcanicMeetingPoints: `${EVACUATION_DATA_BASE}/volcanic-meeting-points.geojson`,
  wildfirePmtiles: `${EVACUATION_DATA_BASE}/wildfire-occurrence.pmtiles`,
} as const

/** tippecanoe layer names when PMTiles exist (see scripts/build-evacuacion-data.sh). */
export const EVACUATION_PMTILES_SOURCE_LAYER = {
  tsunamiAreas: "tsunami_areas",
  volcanicHazards: "volcanic_hazards",
  wildfire: "wildfire_occurrence",
} as const

export const EVACUATION_LAYER_IDS = {
  areasSource: "tsunami-areas",
  areasFill: "tsunami-areas-fill",
  areasLine: "tsunami-areas-line",
  routesSource: "tsunami-routes",
  routes: "tsunami-routes-line",
  routesArrowImage: "tsunami-routes-arrow",
  routesArrowsSource: "tsunami-routes-arrows-source",
  routesArrows: "tsunami-routes-arrows",
  meetingPointsSource: "tsunami-meeting-points",
  meetingPoints: "tsunami-meeting-points-icons",
  meetingPointPeImage: "evacuacion-meeting-pe",
  meetingPointPetImage: "evacuacion-meeting-pet",
  meetingPointTsunamiPeImage: "evacuacion-meeting-tsunami-pe",
  volcanoesSource: "volcanoes-active",
  volcanoesIconImage: "volcano-marker-sdf",
  volcanoes: "volcanoes-active-icons",
  volcanoesLabels: "volcanoes-active-labels",
  volcanicRoutesSource: "volcanic-routes",
  volcanicRoutes: "volcanic-routes-line",
  volcanicMeetingPointsSource: "volcanic-meeting-points",
  volcanicMeetingPointsPe: "volcanic-meeting-points-pe",
  volcanicMeetingPointsPet: "volcanic-meeting-points-pet",
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

export const EVACUATION_ROUTE_COLOR = "#0077ff"
export const EVACUATION_ROUTE_LINE_WIDTH = 4
/** Legend fallback / accents — map markers use original KMZ icons. */
export const EVACUATION_MEETING_POINT_COLOR = "#16a34a"
export const VOLCANIC_ROUTE_COLOR = "#0077ff"
export const VOLCANIC_MEETING_POINT_COLOR = "#f59e0b"

export const EVACUATION_ICON_URLS = {
  meetingPointPe: `${EVACUATION_DATA_BASE}/icons/meeting-point-pe.png`,
  meetingPointPet: `${EVACUATION_DATA_BASE}/icons/meeting-point-pet.png`,
  meetingPointTsunamiPe: `${EVACUATION_DATA_BASE}/icons/meeting-point-tsunami-pe.png`,
} as const

export const EVACUATION_MEETING_POINT_ICON_SIZE = 1.15

export const VOLCANIC_HAZARD_COLOR_ALTO = "#dc2626"
export const VOLCANIC_HAZARD_COLOR_MEDIO = "#ea580c"
export const VOLCANIC_HAZARD_COLOR_BAJO = "#eab308"
export const VOLCANIC_HAZARD_LINE_COLOR_ALTO = "#b91c1c"
export const VOLCANIC_HAZARD_LINE_COLOR_MEDIO = "#c2410c"
export const VOLCANIC_HAZARD_LINE_COLOR_BAJO = "#ca8a04"

export const WILDFIRE_COLOR_1 = "#6b7fa0"
export const WILDFIRE_COLOR_2 = "#5a9e82"
export const WILDFIRE_COLOR_3 = "#d4b832"
export const WILDFIRE_COLOR_4 = "#d07020"
export const WILDFIRE_COLOR_5 = "#b82828"
export const WILDFIRE_LINE_COLOR_1 = "#4a5a72"
export const WILDFIRE_LINE_COLOR_2 = "#3d7560"
export const WILDFIRE_LINE_COLOR_3 = "#a89020"
export const WILDFIRE_LINE_COLOR_4 = "#a05818"
export const WILDFIRE_LINE_COLOR_5 = "#8a1e1e"

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

export const EVACUATION_AREAS_MIN_ZOOM = 10
export const WILDFIRE_OCCURRENCE_MIN_ZOOM = 5
export const EVACUATION_MEETING_POINTS_MIN_ZOOM = 11
export const EVACUATION_ROUTES_MIN_ZOOM = EVACUATION_AREAS_MIN_ZOOM
export const EVACUATION_ROUTE_ARROWS_MIN_ZOOM = EVACUATION_AREAS_MIN_ZOOM

export const EVACUATION_MAP_MIN_ZOOM = 3
export const EVACUATION_MAP_MAX_ZOOM = 16

export { CHILE_BOUNDS, MAP_FLY_DURATION_MS } from "@/components/map/map-config"
