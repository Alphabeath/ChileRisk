import type maplibregl from "maplibre-gl"

export const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"

export const REGIONS_DATA_URL = "/data/regional.geojson"
export const COMUNAS_DATA_URL = "/data/comunas.geojson"

export const CHILE_BOUNDS: [number, number, number, number] = [-76, -56, -66, -17]

export const COMUNAS_MIN_ZOOM = 7

export const REGION_LINE_COLOR = "#e2e8f0"
export const REGION_LINE_HOVER = "#ffffff"

export const COMUNA_LINE_COLOR = "#94a3b8"
export const COMUNA_LINE_HOVER = "#cbd5e1"

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
