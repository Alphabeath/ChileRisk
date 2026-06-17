import type { Simulacro } from "@/lib/types"

const _SPANISH_DAYS: readonly string[] = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
]

const _SPANISH_MONTHS: readonly string[] = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

export function formatDrillDate(iso: string): string {
  const [year, month, day] = iso.split("-").map((n) => Number(n))
  if (!year || !month || !day) return iso
  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime())) return iso
  const dow = _SPANISH_DAYS[date.getUTCDay()] ?? ""
  const m = _SPANISH_MONTHS[month - 1] ?? ""
  return `${dow.charAt(0).toUpperCase() + dow.slice(1)} ${day} de ${m} de ${year}`
}

export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  past: boolean
}

/** 11:00 America/Santiago ≈ 15:00 UTC (invierno CLT). */
function drillTargetMs(iso: string): number | null {
  const [year, month, day] = iso.split("-").map((n) => Number(n))
  if (!year || !month || !day) return null
  return Date.UTC(year, month - 1, day, 15, 0, 0)
}

export function simulacroCountdown(iso: string, now: number): Countdown {
  const target = drillTargetMs(iso)
  if (target === null) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true }
  }
  const diffMs = target - now
  const past = diffMs <= 0
  const absMs = Math.max(0, diffMs)
  const days = Math.floor(absMs / 86_400_000)
  const hours = Math.floor((absMs % 86_400_000) / 3_600_000)
  const minutes = Math.floor((absMs % 3_600_000) / 60_000)
  const seconds = Math.floor((absMs % 60_000) / 1_000)
  return { days, hours, minutes, seconds, past }
}

export function daysUntil(iso: string, now: number): number {
  const [year, month, day] = iso.split("-").map((n) => Number(n))
  if (!year || !month || !day) return 0
  const target = Date.UTC(year, month - 1, day, 0, 0, 0)
  return Math.round((target - now) / 86_400_000)
}

export function isUpcoming(sim: Simulacro, now: number): boolean {
  return daysUntil(sim.drill_date, now) >= -1
}
