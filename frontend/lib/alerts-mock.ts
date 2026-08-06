/**
 * Temporary mock active alerts + Aire Chile zones for the map Alertas panel.
 * Flip `USE_ALERTS_MOCK` to false when `lib/api.ts` + hooks land.
 *
 * ChileRisk entries use alert levels preventiva | amarilla | roja
 * (same scheme as territory detail / risk-scale) — not legacy critico/moderado.
 */

import type { ActiveAlert, AirQualityZone } from "@/lib/alert-types"

/** When true, Alertas panel reads local fixtures instead of the API. */
/** Keep false — monitor uses live `/api/v1/alerts` + `/air-quality`. */
export const USE_ALERTS_MOCK = false

/** Fixed anchor so SSR and client share the same relative ages. */
const ANCHOR_MS = Date.parse("2026-08-02T15:00:00.000Z")

function hoursAgo(h: number): string {
  return new Date(ANCHOR_MS - h * 3_600_000).toISOString()
}

const CONDITION_DATE = "2026-08-02"
const FORECAST_DATE = "2026-08-03"

const MOCK_ALERTS: ActiveAlert[] = [
  {
    id: "senapred-mock-1",
    source: "senapred",
    level: "roja",
    category: "incendio_forestal",
    title: "Alerta Roja por incendio forestal en Valparaíso",
    content: null,
    url_access: null,
    external_url: "https://www.senapred.cl/",
    issued_at: hoursAgo(2),
    synced_at: hoursAgo(1),
    region_code: 5,
    region_name: "Región de Valparaíso",
    affected_scope: "comuna",
    comuna_codes: [5101, 5109],
    is_monitor: false,
    parent_id: null,
    thread_root_id: null,
    record_kind: "alerta",
    hazard_type: "incendio_forestal",
    composite_score: null,
    dominant_hazard: null,
    severity: null,
    risk_detail: null,
  },
  {
    id: "senapred-mock-2",
    source: "senapred",
    level: "amarilla",
    category: "viento",
    title: "Alerta Amarilla por viento en Biobío",
    content: null,
    url_access: null,
    external_url: "https://www.senapred.cl/",
    issued_at: hoursAgo(5),
    synced_at: hoursAgo(4),
    region_code: 8,
    region_name: "Región del Biobío",
    affected_scope: "region",
    comuna_codes: [],
    is_monitor: true,
    parent_id: null,
    thread_root_id: null,
    record_kind: "alerta",
    hazard_type: "viento",
    composite_score: null,
    dominant_hazard: null,
    severity: null,
    risk_detail: null,
  },
  {
    id: "senapred-mock-3",
    source: "senapred",
    level: "preventiva",
    category: "sismo",
    title: "Alerta Preventiva por actividad sísmica en la Región Metropolitana",
    content: null,
    url_access: null,
    external_url: "https://www.senapred.cl/",
    issued_at: hoursAgo(8),
    synced_at: hoursAgo(7),
    region_code: 13,
    region_name: "Región Metropolitana de Santiago",
    affected_scope: "region",
    comuna_codes: [],
    is_monitor: false,
    parent_id: null,
    thread_root_id: null,
    record_kind: "alerta",
    hazard_type: "sismo",
    composite_score: null,
    dominant_hazard: null,
    severity: null,
    risk_detail: null,
  },
  {
    id: "cr-region-7",
    source: "chilerisk",
    level: "roja",
    category: "ola_calor",
    title: "Alerta por ola de calor",
    content: null,
    url_access: null,
    external_url: null,
    issued_at: hoursAgo(3),
    synced_at: hoursAgo(2),
    region_code: 7,
    region_name: "Región del Maule",
    affected_scope: "region",
    comuna_codes: [],
    is_monitor: false,
    parent_id: null,
    thread_root_id: null,
    record_kind: "alerta",
    hazard_type: "ola_calor",
    composite_score: 72,
    dominant_hazard: "ola_calor",
    severity: "roja",
    risk_detail: "índice calor 72/100",
  },
  {
    id: "cr-region-4",
    source: "chilerisk",
    level: "amarilla",
    category: "viento",
    title: "Alerta por viento",
    content: null,
    url_access: null,
    external_url: null,
    issued_at: hoursAgo(6),
    synced_at: hoursAgo(5),
    region_code: 4,
    region_name: "Región de Coquimbo",
    affected_scope: "region",
    comuna_codes: [],
    is_monitor: false,
    parent_id: null,
    thread_root_id: null,
    record_kind: "alerta",
    hazard_type: "viento",
    composite_score: 48,
    dominant_hazard: "viento",
    severity: "amarilla",
    risk_detail: "índice viento 48/100",
  },
  {
    id: "cr-region-9",
    source: "chilerisk",
    level: "preventiva",
    category: "ola_frio",
    title: "Alerta por ola de frío",
    content: null,
    url_access: null,
    external_url: null,
    issued_at: hoursAgo(10),
    synced_at: hoursAgo(9),
    region_code: 9,
    region_name: "Región de La Araucanía",
    affected_scope: "region",
    comuna_codes: [],
    is_monitor: false,
    parent_id: null,
    thread_root_id: null,
    record_kind: "alerta",
    hazard_type: "ola_frio",
    composite_score: 28,
    dominant_hazard: "ola_frio",
    severity: "preventiva",
    risk_detail: "índice frío 28/100",
  },
  {
    id: "sernageomin:villarrica",
    source: "sernageomin",
    level: "naranja",
    category: "volcan",
    title: "Alerta Naranja — Volcán Villarrica",
    content: null,
    url_access: null,
    external_url: "https://rnvv.sernageomin.cl/",
    issued_at: hoursAgo(12),
    synced_at: hoursAgo(11),
    region_code: 9,
    region_name: "Región de La Araucanía",
    affected_scope: "comuna",
    comuna_codes: [9120],
    is_monitor: false,
    parent_id: null,
    thread_root_id: null,
    record_kind: "alerta",
    hazard_type: "volcan",
    composite_score: null,
    dominant_hazard: null,
    severity: null,
    risk_detail: null,
  },
  {
    id: "sernageomin:calbuco",
    source: "sernageomin",
    level: "amarilla",
    category: "volcan",
    title: "Alerta Amarilla — Volcán Calbuco",
    content: null,
    url_access: null,
    external_url: "https://rnvv.sernageomin.cl/",
    issued_at: hoursAgo(24),
    synced_at: hoursAgo(20),
    region_code: 10,
    region_name: "Región de Los Lagos",
    affected_scope: "comuna",
    comuna_codes: [10107],
    is_monitor: false,
    parent_id: null,
    thread_root_id: null,
    record_kind: "alerta",
    hazard_type: "volcan",
    composite_score: null,
    dominant_hazard: null,
    severity: null,
    risk_detail: null,
  },
]

const MOCK_AIR_ZONES: AirQualityZone[] = [
  {
    zone_slug: "santiago",
    condition_date: CONDITION_DATE,
    level: "alerta",
    forecast_date: FORECAST_DATE,
    forecast_level: "regular",
    pm25_range_label: "PM2.5 55–79 µg/m³",
    zone_name: "Santiago",
    region_code: 13,
    comuna_codes: [13101, 13114, 13123],
    measures_current: [
      "Restricción vehicular permanente vigente",
      "Se recomienda evitar ejercicio intenso al aire libre",
    ],
    restrictions_permanent: [],
    external_url: "https://airechile.mma.gob.cl/",
    synced_at: hoursAgo(1),
  },
  {
    zone_slug: "temuco-padre-las-casas",
    condition_date: CONDITION_DATE,
    level: "preemergencia",
    forecast_date: null,
    forecast_level: null,
    pm25_range_label: "PM2.5 80–109 µg/m³",
    zone_name: "Temuco y Padre Las Casas",
    region_code: 9,
    comuna_codes: [9101, 9112],
    measures_current: [
      "Prohibición de uso de calefactores a leña",
      "Restricción vehicular adicional",
    ],
    restrictions_permanent: [],
    external_url: "https://airechile.mma.gob.cl/",
    synced_at: hoursAgo(2),
  },
]

export function getMockActiveAlerts(): ActiveAlert[] {
  if (!USE_ALERTS_MOCK) return []
  return MOCK_ALERTS
}

export function getMockAirZones(): AirQualityZone[] {
  if (!USE_ALERTS_MOCK) return []
  return MOCK_AIR_ZONES
}

/** Total items shown in the Alertas panel (alerts + air zones). */
export function getMockAlertsTotalCount(): number {
  return getMockActiveAlerts().length + getMockAirZones().length
}
