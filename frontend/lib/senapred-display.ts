import type { SenapredAlert } from "@/lib/types"

export const ALERT_LEVEL_META = {
  preventiva: {
    label: "Preventiva",
    hex: "#38bdf8",
    badge: "bg-sky-500/10 text-sky-300 border-sky-400/40",
  },
  amarilla: {
    label: "Amarilla",
    hex: "#fbbf24",
    badge: "bg-amber-500/10 text-amber-300 border-amber-400/40",
  },
  naranja: {
    label: "Naranja",
    hex: "#fb923c",
    badge: "bg-orange-500/10 text-orange-300 border-orange-400/40",
  },
  roja: {
    label: "Roja",
    hex: "#DA291C",
    badge: "bg-[#DA291C]/15 text-[#ff9a9a] border-[#DA291C]/45",
  },
} as const

const LEVEL_ORDER = { roja: 0, naranja: 1, amarilla: 2, preventiva: 3 } as const

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 60_000) return "ahora"
  const m = Math.floor(ms / 60_000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function formatAlertCategory(cat: string | null): string {
  if (!cat) return "—"
  return cat.replace(/_/g, " ").toUpperCase()
}

export function shortenRegionName(name: string | null): string | null {
  if (!name) return null
  return name.replace(/^Regi[oó]n de( la| las| el| los)?\s+/i, "")
}

export function sortSenapredAlerts(alerts: SenapredAlert[]): SenapredAlert[] {
  return [...alerts].sort((a, b) => {
    const levelDiff = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]
    if (levelDiff !== 0) return levelDiff
    return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
  })
}

export const POPUP_MAX_ALERTS = 3
export const POPUP_MAX_SEISMIC = 3

export function filterAlertsForRegion(
  alerts: SenapredAlert[],
  codregion: number
): SenapredAlert[] {
  return alerts.filter(
    (a) => a.region_code == null || a.region_code === codregion
  )
}