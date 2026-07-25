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
  FamilyPlan,
  FamilyPlanData,
  Simulacro,
  SimulacroListResponse,
  SimulacrosParams,
  AirQualityListResponse,
  AirQualityParams,
  AirQualityZone,
  ChatRequest,
  ChatResponse,
  ChatThreadDetail,
  ChatThreadSummary,
  MeetingPointNearestResponse,
  NearestComuna,
  UserProfile,
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

export async function getFamilyPlan(): Promise<FamilyPlan> {
  return fetchJson<FamilyPlan>("/api/v1/family-plan")
}

export async function updateFamilyPlan(data: FamilyPlanData): Promise<FamilyPlan> {
  return fetchJson<FamilyPlan>("/api/v1/family-plan", {
    method: "PUT",
    body: JSON.stringify({ data }),
  })
}

export async function listSimulacros(
  params: SimulacrosParams = {}
): Promise<SimulacroListResponse> {
  const search = new URLSearchParams()
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.region !== undefined) search.set("region", String(params.region))
  if (params.type) search.set("type", params.type)
  if (params.source) search.set("source", params.source)
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

export async function getSimulacro(slug: string): Promise<Simulacro> {
  return fetchJson<Simulacro>(`/api/v1/simulacros/${encodeURIComponent(slug)}`)
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

export async function postChat(body: ChatRequest): Promise<ChatResponse> {
  return fetchJson<ChatResponse>("/api/v1/chat", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function listChatThreads(): Promise<ChatThreadSummary[]> {
  return fetchJson<ChatThreadSummary[]>("/api/v1/chat/threads")
}

export async function getChatThread(threadId: string): Promise<ChatThreadDetail> {
  return fetchJson<ChatThreadDetail>(
    `/api/v1/chat/threads/${encodeURIComponent(threadId)}`,
  )
}

export async function getUserProfile(): Promise<UserProfile> {
  return fetchJson<UserProfile>("/api/v1/users/me")
}

export async function getNearestComuna(params: {
  lat: number
  lon: number
}): Promise<NearestComuna> {
  const search = new URLSearchParams()
  search.set("lat", String(params.lat))
  search.set("lon", String(params.lon))
  return fetchJson<NearestComuna>(`/api/v1/comunas/nearest?${search.toString()}`)
}

export async function updateUserProfile(body: {
  home_comuna_code: number | null
}): Promise<UserProfile> {
  return fetchJson<UserProfile>("/api/v1/users/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  })
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

export type ChatStreamHandlers = {
  onStatus?: (phase: string) => void
  onToken?: (text: string) => void
  onDone?: (response: ChatResponse) => void
  onError?: (error: Error) => void
}

/** SSE chat stream via the authenticated backend proxy. */
export async function streamChat(
  body: ChatRequest,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/v1/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`API error ${res.status}: ${text || res.statusText}`)
  }
  if (!res.body) {
    throw new Error("Streaming no soportado en este navegador")
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let finalResponse: ChatResponse | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split("\n\n")
    buffer = parts.pop() ?? ""
    for (const part of parts) {
      const lines = part.split("\n")
      let event = "message"
      let data = ""
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim()
        if (line.startsWith("data:")) data += line.slice(5).trim()
      }
      if (!data) continue
      try {
        const parsed = JSON.parse(data) as Record<string, unknown>
        if (event === "status" && typeof parsed.phase === "string") {
          handlers.onStatus?.(parsed.phase)
        } else if (event === "token" && typeof parsed.text === "string") {
          handlers.onToken?.(parsed.text)
        } else if (event === "done") {
          finalResponse = parsed as unknown as ChatResponse
          handlers.onDone?.(finalResponse)
        }
      } catch (err) {
        handlers.onError?.(
          err instanceof Error ? err : new Error("Invalid SSE payload"),
        )
      }
    }
  }

  if (!finalResponse) {
    throw new Error("Stream terminó sin respuesta final")
  }
  return finalResponse
}
