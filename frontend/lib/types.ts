export interface NationalRisk {
  codregion: number
  name: string
  composite_score: number
  severity: "bajo" | "moderado" | "alto" | "critico"
  dominant_hazard: string
  sismo_score?: number
  ola_calor_score?: number
  ola_frio_score?: number
  viento_score?: number
  avg_temperature_c?: number | null
  avg_wind_speed_kmh?: number | null
}

export interface ComunaMapScore {
  cod_comuna: number
  composite_score: number
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

export interface SeismicEvent {
  id: number
  latitude: number
  longitude: number
  magnitude: number
  depth_km: number
  occurred_at: string
  occurred_at_local?: string | null
  source: string
  raw_data?: Record<string, unknown> | null
}

export interface EventImpact {
  cod_comuna: number
  name: string
  distance_km: number
  estimated_intensity: number
  risk_score: number
}

export interface ActiveAlert {
  id: number
  title: string
  message: string
  severity: string
  created_at: string
}

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
  } | null
}

export interface EventImpactResponse {
  event: SeismicEvent
  affected_comunas: EventImpact[]
  total_affected: number
}
