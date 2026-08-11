/**
 * Frontend API types (monitor-first).
 *
 * Canonical HTTP contract: OpenAPI → `lib/api-schema.d.ts` (`make sync-contract`).
 * Named OpenAPI schemas are aliased when shapes match; remaining interfaces are
 * hand-maintained until those routes expose named schemas.
 */
import type { components } from "./api-schema"

type Schemas = components["schemas"]

export type ApiActiveAlert = Schemas["ActiveAlertOut"]
/** OpenAPI schema; endpoint kept for tooling — monitor map does not consume it. */
export type ComunaMapScore = Schemas["ComunaMapScore"]

export interface NationalRisk {
  codregion: number
  name: string
  composite_score: number
  severity: "bajo" | "moderado" | "alto" | "critico"
  dominant_hazard: string
  comuna_count?: number
  sismo_score?: number
  ola_calor_score?: number
  ola_frio_score?: number
  viento_score?: number
  inundacion_score?: number
  avg_temperature_c?: number | null
  avg_wind_speed_kmh?: number | null
}

export interface RegionRisk {
  codregion: number
  name: string
  composite_score: number
  severity: string
  dominant_hazard: string
  sismo_score: number
  ola_calor_score: number
  ola_frio_score: number
  viento_score: number
  inundacion_score: number
  comuna_count?: number
  avg_temperature_c?: number | null
  avg_wind_speed_kmh?: number | null
  comunas: Array<{
    cod_comuna: number
    name: string
    composite_score: number
    severity: string
    dominant_hazard: string
    sismo_score: number
    ola_calor_score: number
    ola_frio_score: number
    viento_score: number
    inundacion_score: number
    temperature_c?: number | null
    wind_speed_kmh?: number | null
  }>
}
/** Risk fields normalized for region and comuna detail views. */
export interface TerritoryRiskFields {
  composite_score: number
  severity: string
  dominant_hazard: string
  sismo_score: number
  ola_calor_score: number
  ola_frio_score: number
  viento_score: number
  inundacion_score: number
  temperature_c: number | null
  wind_speed_kmh: number | null
}

export type AlertLevel =
  | "preventiva"
  | "amarilla"
  | "naranja"
  | "roja"
  | "informativa"

/** Alias used by Alertas panel UI. */
export type UnifiedAlertLevel = AlertLevel

export type AlertSource =
  | "senapred"
  | "chilerisk"
  | "sernageomin"
  | "meteochile"
export type AffectedScope = "region" | "comuna" | "unknown"
export type RecordKind = "alerta" | "evento"
export type HazardType =
  | "sismo"
  | "volcan"
  | "incendio"
  | "incendio_estructural"
  | "remocion"
  | "otros"

export type AlertFilter =
  | "all"
  | "chilerisk"
  | "senapred"
  | "sernageomin"
  | "meteochile"
  | "airechile"

export interface ActiveAlert {
  id: string
  source: AlertSource
  level: AlertLevel
  category: string | null
  title: string
  content: string | null
  url_access: string | null
  external_url: string | null
  issued_at: string
  synced_at: string
  region_code: number | null
  region_name: string | null
  affected_scope: AffectedScope
  comuna_codes: number[]
  is_monitor: boolean
  parent_id: string | null
  thread_root_id: string | null
  composite_score: number | null
  dominant_hazard: string | null
  severity: string | null
  risk_detail: string | null
  record_kind: RecordKind
  hazard_type: string | null
}

export interface ActiveAlertParams {
  region?: number
  level?: AlertLevel
  /** Día calendario Chile (YYYY-MM-DD) */
  date?: string
}

export interface SenapredAlertBrief {
  id: string
  record_kind: "alerta" | "evento"
  title: string
  level: "preventiva" | "amarilla" | "naranja" | "roja" | "informativa"
  external_url?: string | null
}

export interface SeismicEvent {
  id: number
  latitude: number
  longitude: number
  magnitude: number
  depth_km: number
  occurred_at: string
  occurred_at_local?: string | null
  source: string
  detail_url?: string | null
  is_perceived?: boolean
  intensity_report_url?: string | null
  reported_intensity_max?: number | null
  related_senapred_events?: SenapredAlertBrief[]
  related_senapred_alerts?: SenapredAlertBrief[]
  raw_data?: Record<string, unknown> | null
}

export interface ComunaRisk {
  cod_comuna: number
  name: string
  codregion: number
  sismo_score: number
  ola_calor_score: number
  ola_frio_score: number
  viento_score: number
  inundacion_score: number
  composite_score: number
  dominant_hazard: string
  severity: "bajo" | "moderado" | "alto" | "critico"
  computed_at: string
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

export type AirQualityLevel =
  | "bueno"
  | "regular"
  | "alerta"
  | "preemergencia"
  | "emergencia"

export interface AirQualityZone {
  zone_slug: string
  condition_date: string
  level: AirQualityLevel
  forecast_date: string | null
  forecast_level: AirQualityLevel | null
  pm25_range_label: string | null
  zone_name: string
  region_code: number | null
  comuna_codes: number[]
  measures_current: string[]
  restrictions_permanent: string[]
  external_url: string
  synced_at: string
}

export interface AirQualityListResponse {
  items: AirQualityZone[]
  total: number
  condition_date: string
}

export interface AirQualityParams {
  date?: string
  region?: number
  episode_only?: boolean
}

export type DrillType =
  | "sismo_tsunami_borde_costero"
  | "sismo_tsunami_educacion"
  | "erupcion_volcanica"
  | "remocion_en_masa"
  | "otro"

export type DrillSource = "future" | "recent" | "archive"

export interface Simulacro {
  slug: string
  title: string
  drill_date: string
  region_code: number | null
  region_name: string | null
  drill_type: DrillType
  participating_comunas: string[]
  summary: string | null
  detail_url: string
  mensaje_sae: boolean
  source: DrillSource
  synced_at: string
}

export type SimulacroBodyBlockKind =
  | "heading"
  | "paragraph"
  | "steps"
  | "link_list"
  | "sae_notice"
  | "callout"

export interface SimulacroBodyLink {
  label: string
  url: string
}

export interface SimulacroBodyBlock {
  kind: SimulacroBodyBlockKind
  title?: string | null
  text?: string | null
  items?: string[]
  links?: SimulacroBodyLink[]
}

export interface SimulacroDetail extends Simulacro {
  headline: string | null
  schedule_note: string | null
  hero_image_url: string | null
  body_blocks: SimulacroBodyBlock[]
}

export interface SimulacroListResponse {
  items: Simulacro[]
  total: number
  next_synced_at: string | null
}

export interface SimulacrosParams {
  from?: string
  to?: string
  region?: number
  type?: DrillType
  source?: DrillSource
  upcoming_only?: boolean
  past_only?: boolean
  limit?: number
  offset?: number
}

export type MeetingPointOut = Schemas["MeetingPointOut"]
export type MeetingPointNearestResponse = Schemas["MeetingPointNearestResponse"]
