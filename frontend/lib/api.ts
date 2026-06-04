import { normalizeActiveAlerts } from "@/lib/alerts-display"
import { clampQueryDate, todayIsoDate } from "@/lib/query-date"
import type {
  NationalRisk,
  RegionRisk,
  ComunaRisk,
  ComunaMapScore,
  SeismicEvent,
  EventImpactResponse,
  ActiveAlert,
  ActiveAlertParams,
} from "@/lib/types"

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:8000"

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

export async function getComunaMapScores(date?: string): Promise<ComunaMapScore[]> {
  const d = clampQueryDate(date ?? todayIsoDate())
  return fetchJson<ComunaMapScore[]>(`/api/v1/risk/comunas?date=${d}`)
}

export async function getRegionRisk(codregion: number): Promise<RegionRisk> {
  return fetchJson<RegionRisk>(`/api/v1/regiones/${codregion}/risk`)
}

export async function getComunaRisk(
  codcomuna: number,
  date?: string
): Promise<ComunaRisk> {
  const d = clampQueryDate(date ?? todayIsoDate())
  return fetchJson<ComunaRisk>(`/api/v1/comunas/${codcomuna}/risk?date=${d}`)
}

export async function getRecentEvents(date?: string): Promise<SeismicEvent[]> {
  const d = clampQueryDate(date ?? todayIsoDate())
  return fetchJson<SeismicEvent[]>(`/api/v1/events?date=${d}`)
}

export async function getEventImpact(eventId: number): Promise<EventImpactResponse> {
  return fetchJson<EventImpactResponse>(`/api/v1/events/${eventId}/impact`)
}

export async function getActiveAlerts(
  params: ActiveAlertParams = {}
): Promise<ActiveAlert[]> {
  const search = new URLSearchParams()
  if (params.region !== undefined) search.set("region", String(params.region))
  if (params.level) search.set("level", params.level)
  if (params.date !== undefined) {
    search.set("date", clampQueryDate(params.date))
  }
  const qs = search.toString()
  const raw = await fetchJson<unknown[]>(`/api/v1/alerts/active${qs ? `?${qs}` : ""}`)
  return normalizeActiveAlerts(raw)
}
