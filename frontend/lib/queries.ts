export const queryKeys = {
  nationalRisk: (date: string) => ["nationalRisk", date] as const,
  regionRisk: (codregion: number) => ["regionRisk", codregion] as const,
  comunaRisk: (codcomuna: number, date: string) =>
    ["comunaRisk", codcomuna, date] as const,
  comunaMapScores: (date: string) => ["comunaMapScores", date] as const,
  recentEvents: (date: string) => ["recentEvents", date] as const,
  eventImpact: (eventId: number) => ["eventImpact", eventId] as const,
  activeAlerts: (date: string) => ["activeAlerts", date] as const,
  familyPlan: () => ["familyPlan"] as const,
  simulacros: (params: Record<string, unknown>) =>
    ["simulacros", params] as const,
  nextSimulacro: () => ["nextSimulacro"] as const,
  simulacro: (slug: string) => ["simulacro", slug] as const,
  airQuality: (
    date: string,
    params: { region?: number; episodeOnly?: boolean } = {},
  ) => ["airQuality", date, params] as const,
  airQualityZone: (slug: string, date: string) =>
    ["airQualityZone", slug, date] as const,
  airQualityByComuna: (codComuna: number, date: string) =>
    ["airQualityByComuna", codComuna, date] as const,
  dashboardSummary: () => ["dashboardSummary"] as const,
  userProfile: () => ["userProfile"] as const,
  nearestComuna: (lat: number, lon: number) =>
    ["nearestComuna", lat, lon] as const,
  chatThreads: () => ["chatThreads"] as const,
  chatThread: (id: string) => ["chatThread", id] as const,
}
