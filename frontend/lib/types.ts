/**
 * Frontend API types.
 *
 * Canonical HTTP contract: OpenAPI → `lib/api-schema.d.ts` (`make sync-contract`).
 * Named OpenAPI schemas are aliased below when shapes match app usage.
 * Remaining interfaces are hand-maintained until those routes expose named schemas
 * (e.g. NationalRisk, SeismicEvent) or FE defaults make optional OpenAPI fields safe.
 */
import type { components } from "./api-schema"

type Schemas = components["schemas"]

/** OpenAPI mirror helpers for new code / contract checks. */
export type ApiActiveAlert = Schemas["ActiveAlertOut"]
export type ApiSimulacro = Schemas["SimulacroOut"]
export type ApiFamilyPlan = Schemas["FamilyPlanOut"]
export type ApiSyncRun = Schemas["SyncRunOut"]
export type ApiSyncStatusResponse = Schemas["SyncStatusResponse"]

export type ComunaMapScore = Schemas["ComunaMapScore"]
export type SyncRun = Schemas["SyncRunOut"]
export type SyncStatusResponse = Schemas["SyncStatusResponse"]

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
  avg_temperature_c?: number | null
  avg_wind_speed_kmh?: number | null
}

export interface RegionRisk {
  codregion: number
  name: string
  composite_score: number
  severity: "bajo" | "moderado" | "alto" | "critico"
  dominant_hazard: string
  comunas: Array<{
    cod_comuna: number
    name: string
    composite_score: number
    severity: "bajo" | "moderado" | "alto" | "critico"
    dominant_hazard: string
    sismo_score: number
    ola_calor_score: number
    ola_frio_score: number
    viento_score: number
    temperature_c?: number | null
    wind_speed_kmh?: number | null
  }>
}

export type AlertLevel = "preventiva" | "amarilla" | "naranja" | "roja" | "informativa"

export interface SenapredAlertBrief {
  id: string
  record_kind: "alerta" | "evento"
  title: string
  level: AlertLevel
  external_url?: string | null
  hazard_type?: string | null
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
  /** Informe CSN en sismologia.cl (cuando source=csn) */
  detail_url?: string | null
  is_perceived?: boolean
  intensity_report_url?: string | null
  reported_intensity_max?: number | null
  related_senapred_events?: SenapredAlertBrief[]
  related_senapred_alerts?: SenapredAlertBrief[]
  raw_data?: Record<string, unknown> | null
}

export interface EventImpact {
  cod_comuna: number
  name: string
  distance_km: number
  estimated_intensity: number
  risk_score: number
}

export type AlertSource = "senapred" | "chilerisk" | "sernageomin"
export type AffectedScope = "region" | "comuna" | "unknown"
export type RecordKind = "alerta" | "evento"
export type HazardType =
  | "sismo"
  | "volcan"
  | "incendio"
  | "incendio_estructural"
  | "remocion"
  | "otros"

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
  affected_scope?: AffectedScope
  comuna_codes?: number[]
  is_monitor: boolean
  parent_id: string | null
  /** Id SERNAPRED de la primera versión del hilo (actualizaciones encadenan parent_id). */
  thread_root_id?: string | null
  composite_score?: number | null
  dominant_hazard?: string | null
  severity?: string | null
  risk_detail?: string | null
  record_kind?: RecordKind
  hazard_type?: HazardType | string | null
}

/** @deprecated Use ActiveAlert */
export type SenapredAlert = ActiveAlert

export interface ActiveAlertParams {
  region?: number
  level?: AlertLevel
  /** Día calendario Chile (YYYY-MM-DD) */
  date?: string
}

/** @deprecated Use ActiveAlertParams */
export type SenapredAlertParams = ActiveAlertParams

export interface ComunaRisk {
  cod_comuna: number
  name: string
  codregion: number
  sismo_score: number
  ola_calor_score: number
  ola_frio_score: number
  viento_score: number
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

export interface EventImpactResponse {
  event: SeismicEvent
  affected_comunas: EventImpact[]
  total_affected: number
}

export interface FamilyMember {
  id: string
  first_name: string
  last_name: string
  document: string
  sex: string
  age: number | null
  nationality: string
  phone: string
  medical_conditions: string
  contraindications: string
  special_needs: string
  flags: string[]
}

export interface Pet {
  id: string
  name: string
  species: string
  age: number | null
  characteristics: string
  special_needs: string
}

export interface Threat {
  id: string
  risk: string
  category: "internal" | "external"
  probability: number
  impact: number
  corrective_action: string
  selected: boolean
}

export interface SafeZone {
  emergency: string
  safe_place: string
  evacuation_route: string
  safe_zone: string
  meeting_point: string
}

export interface FloorMapPoint {
  x: number
  y: number
}

export interface FloorMapRoom {
  id: string
  type: string
  x: number
  y: number
  w: number
  h: number
}

export interface FloorMapMarker {
  id: string
  type: string
  x: number
  y: number
}

export interface FloorMapRoute {
  id: string
  points: FloorMapPoint[]
}

export interface FloorMapZone {
  id: string
  type: "safe" | "risk"
  x: number
  y: number
  w: number
  h: number
}

export interface FloorMap {
  rooms: FloorMapRoom[]
  markers: FloorMapMarker[]
  routes: FloorMapRoute[]
  zones: FloorMapZone[]
  active_layer: "safe" | "risk" | "route"
  /** ISO timestamp when the user confirmed the floor map in the review step. */
  saved_at: string | null
}

export interface RoleAssignment {
  task: string
  member_id: string | null
}

export interface FamilyContact {
  id: string
  name: string
  phone: string
  address: string
  type: "family" | "institution"
}

export interface EmergencyKit {
  base: Record<string, boolean>
  infant: Record<string, boolean>
  pregnant: Record<string, boolean>
  tea: Record<string, boolean>
  pets: Record<string, boolean>
}

export interface DrillEvaluation {
  knew_route: boolean | null
  found_kit: boolean | null
  evacuated: boolean | null
  protected_pets: boolean | null
  roles_worked: boolean | null
  improvements: string
}

export interface Drill {
  id: string
  date: string
  emergency_type: string
  outcome: string
  improvements: string[]
  evaluation: DrillEvaluation
}

export interface FamilyPlanData {
  members: FamilyMember[]
  pets: Pet[]
  threats: Threat[]
  safe_zones: SafeZone[]
  floor_map: FloorMap
  roles: RoleAssignment[]
  contacts: FamilyContact[]
  emergency_kit: EmergencyKit
  drills: Drill[]
}

export interface FamilyPlan {
  id: string | null
  data: FamilyPlanData
  completion_pct: number
  updated_at: string | null
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
  /** YYYY-MM-DD */
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

export interface ChatMessageIn {
  role: "user" | "assistant"
  content: string
}

export interface ToolCallTrace {
  name: string
  arguments: Record<string, unknown>
  ok: boolean
  summary: string
}

export interface ChatRequest {
  messages: ChatMessageIn[]
  thread_id?: string | null
  comuna_code?: number | null
  region_code?: number | null
  lat?: number | null
  lon?: number | null
  stream?: boolean
}

export interface ChatResponse {
  reply: string
  thread_id: string | null
  tool_calls_used: ToolCallTrace[]
  sources: string[]
}

export interface ChatThreadSummary {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface ChatMessageOut {
  id: string
  role: string
  content: string
  tool_trace: ToolCallTrace[] | null
  created_at: string
}

export interface ChatThreadDetail {
  id: string
  title: string
  created_at: string
  updated_at: string
  messages: ChatMessageOut[]
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  home_comuna_code: number | null
  home_comuna_name: string | null
}

export interface NearestComuna {
  cod_comuna: number
  name: string
  codregion: number
  distance_km: number
  origin_lat: number
  origin_lon: number
}

export interface MeetingPointNearest {
  id: string
  hazard: string
  comuna: string
  provincia: string
  region: string
  sector: string
  lng: number
  lat: number
  distance_km: number | null
}

export interface MeetingPointNearestResponse {
  items: MeetingPointNearest[]
  origin_lat: number
  origin_lon: number
  hazard: string | null
  total_candidates: number
}
