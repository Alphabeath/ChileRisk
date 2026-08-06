export const queryKeys = {
  nationalRisk: (date: string) => ["nationalRisk", date] as const,
  regionRisk: (codregion: number) => ["regionRisk", codregion] as const,
  comunaRisk: (codcomuna: number, date: string) =>
    ["comunaRisk", codcomuna, date] as const,
  recentEvents: (date: string) => ["recentEvents", date] as const,
  activeAlerts: (date: string) => ["activeAlerts", date] as const,
  airQuality: (
    date: string,
    params: { region?: number; episodeOnly?: boolean } = {},
  ) => ["airQuality", date, params] as const,
  airQualityZone: (slug: string, date: string) =>
    ["airQualityZone", slug, date] as const,
  airQualityByComuna: (codComuna: number, date: string) =>
    ["airQualityByComuna", codComuna, date] as const,
  meteoChileZones: (date: string) => ["meteoChileZones", date] as const,
  simulacros: (params: Record<string, unknown> = {}) =>
    ["simulacros", params] as const,
  simulacroNext: () => ["simulacroNext"] as const,
  simulacro: (slug: string) => ["simulacro", slug] as const,
  nearestMeetingPoints: (params: {
    lat: number
    lon: number
    hazard?: string
    limit?: number
  }) => ["nearestMeetingPoints", params] as const,
}
