import type * as maplibregl from "maplibre-gl"

/** Source: [caracena/chile-geojson](https://github.com/caracena/chile-geojson) (16 regiones). */
export const REGIONS_DATA_URL = "/data/regional.geojson"

/**
 * Comunas from the same repo (`1.geojson`…`16.geojson` merged).
 * Three tiers for A/B: `"full"` / `"medium"`
 * (~2.3 MB, runtime default) / `"simplified"` (~0.3 MB, fallback).
 * NOTE: `"full"` no longer ships in `public/data/` — the raw file lives outside
 * the repo (~/data/chilerisk/comunas_full.geojson, ~18 MB). It only applies if
 * you copy it locally for A/B testing; otherwise its URL 404s.
 */
export type ComunasDetail = "full" | "medium" | "simplified"
/** Toggle A/B: full vs simplified. Runtime default is medium (visual balance). */
export const COMUNAS_DETAIL: ComunasDetail = "medium"

const COMUNAS_DATA_URLS: Record<ComunasDetail, string> = {
  full: "/data/comunas_full.geojson",
  medium: "/data/comunas_medium.geojson",
  simplified: "/data/comunas_simplified.geojson",
}

export const COMUNAS_DATA_URL = COMUNAS_DATA_URLS[COMUNAS_DETAIL]

/**
 * Precomputed comuna label anchor points (345 features, pole-of-inaccessibility
 * from the simplified build). Loaded lazily for the zoom ≥ 7 label layer —
 * never computed at runtime.
 */
export const COMUNAS_LABELS_DATA_URL = "/data/comunas_labels.geojson"

/** Alert fill pulse updates per second (rAF throttled; MapLibre transition blends between ticks). */
export const ALERT_PULSE_FPS = 10

/** Paint transition so stepped opacity updates still look continuous. */
export const ALERT_PULSE_TRANSITION_MS = 90

export const CHILE_BOUNDS: [number, number, number, number] = [-76, -56, -66, -17]

/** Camera zoom limits for `/monitor` MapLibre map. */
export const MAP_MIN_ZOOM = 3
export const MAP_MAX_ZOOM = 10

/**
 * Uniform fly animation duration (ms) for every map camera fly:
 * sismo click, locate button, auto-centrado al entrar, focus de punto de
 * encuentro. Reference was the page-entry fly (1500 ms) — slowed further.
 */
export const MAP_FLY_DURATION_MS = 2500

export const COMUNAS_MIN_ZOOM = 7

export interface MapThemeColors {
  regionLine: string
  regionLineHover: string
  comunaLine: string
  comunaLineHover: string
  regionLabelColor: string
  regionLabelHalo: string
  comunaLabelColor: string
  comunaLabelHalo: string
  /** Rest / hover fill opacity — higher in light so alert colors stay vivid on positron. */
  regionFillOpacity: number
  regionFillOpacityHover: number
  comunaFillOpacity: number
  comunaFillOpacityHover: number
}

/** Layer colors per app theme. Dark values match the old map's CARTO dark-matter tuning. */
export const MAP_THEME_COLORS: Record<"dark" | "light", MapThemeColors> = {
  dark: {
    regionLine: "#ffffff",
    regionLineHover: "#ffffff",
    comunaLine: "#ffffff",
    comunaLineHover: "#ffffff",
    regionLabelColor: "rgba(168, 176, 180, 1)",
    regionLabelHalo: "#222",
    comunaLabelColor: "#e2e8f0",
    comunaLabelHalo: "#1e293b",
    regionFillOpacity: 0.52,
    regionFillOpacityHover: 0.98,
    comunaFillOpacity: 0.42,
    comunaFillOpacityHover: 0.95,
  },
  light: {
    regionLine: "#334155",
    regionLineHover: "#0f172a",
    comunaLine: "#334155",
    comunaLineHover: "#0f172a",
    regionLabelColor: "#334155",
    regionLabelHalo: "#ffffff",
    comunaLabelColor: "#1e293b",
    comunaLabelHalo: "#ffffff",
    regionFillOpacity: 0.68,
    regionFillOpacityHover: 0.98,
    comunaFillOpacity: 0.58,
    comunaFillOpacityHover: 0.95,
  },
}

/**
 * Alert fill pulse period (ms). Faster = more urgent.
 * Global loop uses the shortest period among visible severities.
 */
export const ALERT_PULSE_PERIOD_MS: Record<
  "preventiva" | "amarilla" | "naranja" | "roja" | "informativa",
  number
> = {
  roja: 3800,
  naranja: 4400,
  amarilla: 5000,
  preventiva: 6200,
  informativa: 6200,
}

/** Shortest pulse period from alert level / severity strings (fallback: preventiva). */
export function alertPulsePeriodMs(
  severities: Iterable<string | null | undefined>,
): number {
  let period = ALERT_PULSE_PERIOD_MS.preventiva
  for (const s of severities) {
    if (
      s === "roja" ||
      s === "naranja" ||
      s === "amarilla" ||
      s === "preventiva" ||
      s === "informativa"
    ) {
      const p = ALERT_PULSE_PERIOD_MS[s]
      if (p < period) period = p
    }
  }
  return period
}

/** Map GEC air levels onto alert pulse periods (worse → faster). */
const AIR_PULSE_AS_ALERT: Record<string, keyof typeof ALERT_PULSE_PERIOD_MS> = {
  emergencia: "roja",
  preemergencia: "naranja",
  alerta: "amarilla",
  regular: "preventiva",
  bueno: "informativa",
}

export function airPulsePeriodMs(
  levels: Iterable<string | null | undefined>,
): number {
  return alertPulsePeriodMs(
    [...levels].map((l) => (l ? AIR_PULSE_AS_ALERT[l] : undefined)),
  )
}

/** Opacity expression: hover stays at max; rest uses `pulsed` (0–1 → rest…hover). */
export function fillOpacityPaint(
  rest: number,
  hover: number,
  pulsed?: number,
): maplibregl.ExpressionSpecification | number {
  const base =
    pulsed == null ? rest : rest + (hover - rest) * pulsed
  return [
    "case",
    ["boolean", ["feature-state", "hover"], false],
    hover,
    base,
  ]
}

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
  inundacion_score?: number
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
  inundacion_score?: number
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
