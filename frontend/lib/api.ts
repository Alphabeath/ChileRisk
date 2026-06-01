import type {
  NationalRisk,
  RegionRisk,
  ComunaRisk,
  SeismicEvent,
  EventImpactResponse,
  ActiveAlert,
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

export async function getNationalRisk(): Promise<NationalRisk[]> {
  return fetchJson<NationalRisk[]>("/api/v1/risk/national")
}

export async function getRegionRisk(codregion: number): Promise<RegionRisk> {
  return fetchJson<RegionRisk>(`/api/v1/regiones/${codregion}/risk`)
}

export async function getComunaRisk(codcomuna: number): Promise<ComunaRisk> {
  return fetchJson<ComunaRisk>(`/api/v1/comunas/${codcomuna}/risk`)
}

export async function getRecentEvents(hours = 48): Promise<SeismicEvent[]> {
  return fetchJson<SeismicEvent[]>(`/api/v1/events?hours=${hours}`)
}

export async function getEventImpact(eventId: number): Promise<EventImpactResponse> {
  return fetchJson<EventImpactResponse>(`/api/v1/events/${eventId}/impact`)
}

export async function getActiveAlerts(): Promise<ActiveAlert[]> {
  return fetchJson<ActiveAlert[]>("/api/v1/alerts/active")
}
