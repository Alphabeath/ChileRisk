export const queryKeys = {
  nationalRisk: ["nationalRisk"] as const,
  regionRisk: (codregion: number) => ["regionRisk", codregion] as const,
  comunaRisk: (codcomuna: number) => ["comunaRisk", codcomuna] as const,
  comunaMapScores: ["comunaMapScores"] as const,
  recentEvents: (hours: number) => ["recentEvents", hours] as const,
  eventImpact: (eventId: number) => ["eventImpact", eventId] as const,
  activeAlerts: ["activeAlerts"] as const,
}
