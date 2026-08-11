import { normalizeActiveAlerts } from "@/lib/alerts-display"
import { clampQueryDate, todayIsoDate } from "@/lib/query-date"
import type {
  ActiveAlert,
  ActiveAlertParams,
  AirQualityListResponse,
  AirQualityParams,
  AirQualityZone,
  ComunaRisk,
  MeetingPointNearestResponse,
  NationalRisk,
  RegionRisk,
  SeismicEvent,
  Simulacro,
  SimulacroDetail,
  SimulacroListResponse,
  SimulacrosParams,
} from "@/lib/types"

const API_BASE = "/api/backend"

export function getApiBase(): string {
  return API_BASE
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`API error ${res.status}: ${text || res.statusText}`)
  }

  return res.json() as Promise<T>
}

export async function getNationalRisk(date?: string): Promise<NationalRisk[]> {
  const d = clampQueryDate(date ?? todayIsoDate())
  return fetchJson<NationalRisk[]>(`/api/v1/risk/national?date=${d}`)
}

export async function getRegionRisk(codregion: number): Promise<RegionRisk> {
  return fetchJson<RegionRisk>(`/api/v1/regiones/${codregion}/risk`)
}

export async function getComunaRisk(
  codcomuna: number,
  date?: string,
): Promise<ComunaRisk> {
  const d = clampQueryDate(date ?? todayIsoDate())
  return fetchJson<ComunaRisk>(`/api/v1/comunas/${codcomuna}/risk?date=${d}`)
}

export async function getRecentEvents(date?: string): Promise<SeismicEvent[]> {
  const d = clampQueryDate(date ?? todayIsoDate())
  return fetchJson<SeismicEvent[]>(`/api/v1/events?date=${d}`)
}

export async function getActiveAlerts(
  params: ActiveAlertParams = {},
): Promise<ActiveAlert[]> {
  const search = new URLSearchParams()
  if (params.region !== undefined) search.set("region", String(params.region))
  if (params.level) search.set("level", params.level)
  if (params.date !== undefined) {
    search.set("date", clampQueryDate(params.date))
  }
  const qs = search.toString()
  const raw = await fetchJson<unknown[]>(
    `/api/v1/alerts/active${qs ? `?${qs}` : ""}`,
  )
  return normalizeActiveAlerts(raw)
}

export async function getAirQuality(
  params: AirQualityParams = {},
): Promise<AirQualityListResponse> {
  const search = new URLSearchParams()
  if (params.date !== undefined) {
    search.set("date", clampQueryDate(params.date))
  }
  if (params.region !== undefined) search.set("region", String(params.region))
  if (params.episode_only) search.set("episode_only", "true")
  const qs = search.toString()
  return fetchJson<AirQualityListResponse>(
    `/api/v1/air-quality${qs ? `?${qs}` : ""}`,
  )
}

export async function getAirQualityZone(
  slug: string,
  date?: string,
): Promise<AirQualityZone> {
  const search = new URLSearchParams()
  if (date !== undefined) search.set("date", clampQueryDate(date))
  const qs = search.toString()
  return fetchJson<AirQualityZone>(
    `/api/v1/air-quality/${encodeURIComponent(slug)}${qs ? `?${qs}` : ""}`,
  )
}

export async function getAirQualityByComuna(
  codComuna: number,
  date?: string,
): Promise<AirQualityZone> {
  const search = new URLSearchParams()
  if (date !== undefined) search.set("date", clampQueryDate(date))
  const qs = search.toString()
  return fetchJson<AirQualityZone>(
    `/api/v1/air-quality/by-comuna/${codComuna}${qs ? `?${qs}` : ""}`,
  )
}

export type MeteoChileZonesGeoJSON = {
  type: "FeatureCollection"
  features: Array<{
    type: "Feature"
    properties?: Record<string, unknown> | null
    geometry: {
      type: string
      coordinates: unknown
    }
  }>
}

export async function getMeteoChileZones(
  date?: string,
): Promise<MeteoChileZonesGeoJSON> {
  const search = new URLSearchParams()
  if (date !== undefined) search.set("date", clampQueryDate(date))
  const qs = search.toString()
  return fetchJson<MeteoChileZonesGeoJSON>(
    `/api/v1/alerts/meteochile/zones${qs ? `?${qs}` : ""}`,
  )
}

export async function getSimulacros(
  params: SimulacrosParams = {},
): Promise<SimulacroListResponse> {
  const search = new URLSearchParams()
  if (params.from !== undefined) search.set("from", params.from)
  if (params.to !== undefined) search.set("to", params.to)
  if (params.region !== undefined) search.set("region", String(params.region))
  if (params.type !== undefined) search.set("type", params.type)
  if (params.source !== undefined) search.set("source", params.source)
  if (params.upcoming_only) search.set("upcoming_only", "true")
  if (params.past_only) search.set("past_only", "true")
  if (params.limit !== undefined) search.set("limit", String(params.limit))
  if (params.offset !== undefined) search.set("offset", String(params.offset))
  const qs = search.toString()
  return fetchJson<SimulacroListResponse>(
    `/api/v1/simulacros${qs ? `?${qs}` : ""}`,
  )
}

export async function getNextSimulacro(): Promise<Simulacro | null> {
  return fetchJson<Simulacro | null>("/api/v1/simulacros/next")
}

export async function getSimulacro(slug: string): Promise<SimulacroDetail> {
  return fetchJson<SimulacroDetail>(
    `/api/v1/simulacros/${encodeURIComponent(slug)}`,
  )
}

export async function getNearestMeetingPoints(params: {
  lat: number
  lon: number
  hazard?: "tsunami" | "volcanic"
  limit?: number
}): Promise<MeetingPointNearestResponse> {
  const search = new URLSearchParams()
  search.set("lat", String(params.lat))
  search.set("lon", String(params.lon))
  if (params.hazard) search.set("hazard", params.hazard)
  if (params.limit !== undefined) search.set("limit", String(params.limit))
  return fetchJson<MeetingPointNearestResponse>(
    `/api/v1/meeting-points/nearest?${search.toString()}`,
  )
}
