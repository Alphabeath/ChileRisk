import type maplibregl from "maplibre-gl"

export const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"

export const REGIONS_DATA_URL = "/data/regional.geojson"
export const COMUNAS_DATA_URL = "/data/comunas.geojson"

export const CHILE_BOUNDS: [number, number, number, number] = [-76, -56, -66, -17]

export const COMUNAS_MIN_ZOOM = 7

export const REGION_FILL_COLOR = "#3b82f6"
export const REGION_FILL_HOVER = "#60a5fa"
export const REGION_LINE_COLOR = "#1e40af"
export const REGION_LINE_HOVER = "#93c5fd"

export const COMUNA_FILL_COLOR = "#8b5cf6"
export const COMUNA_FILL_HOVER = "#a78bfa"
export const COMUNA_LINE_COLOR = "#6d28d9"
export const COMUNA_LINE_HOVER = "#c4b5fd"

export interface RegionProperties {
  codregion: number
  Region: string
  area_km: number
}

export interface ComunaProperties {
  cod_comuna: number
  Comuna: string
  Provincia: string
  Region: string
  codregion: number
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
