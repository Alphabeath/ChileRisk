export const queryKeys = {
  nationalRisk: (date: string) => ["nationalRisk", date] as const,
  regionRisk: (codregion: number) => ["regionRisk", codregion] as const,
  comunaRisk: (codcomuna: number, date: string) =>
    ["comunaRisk", codcomuna, date] as const,
  comunaMapScores: (date: string) => ["comunaMapScores", date] as const,
  recentEvents: (date: string) => ["recentEvents", date] as const,
  eventImpact: (eventId: number) => ["eventImpact", eventId] as const,
  activeAlerts: (date: string) => ["activeAlerts", date] as const,
}
