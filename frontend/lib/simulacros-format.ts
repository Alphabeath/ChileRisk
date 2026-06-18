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

/**
 * Scrub a scraped `participating_comunas` array down to real Chilean
 * commune names. The SERNAPRED scraper occasionally concatenates
 * surrounding page copy (e.g. "Tocopilla Días Horas Minutos para el
 * simulacro ...") into the last entry, so we split each value by
 * comma and drop tokens that don't look like a proper noun.
 */
const COMUNA_BLOCKLIST_KEYWORDS: readonly string[] = [
  "Días",
  "Horas",
  "Minutos",
  "simulacro",
  "Simulacro",
  "ejercicio",
  "Mensaje SAE",
  "¿Sabes",
  "cómo participar",
  "comienza oficialmente",
  "se enviará",
  "para el",
  "del simulacro",
]

const COMUNA_MAX_LENGTH = 40

function looksLikeComuna(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length === 0) return false
  if (trimmed.length > COMUNA_MAX_LENGTH) return false
  if (COMUNA_BLOCKLIST_KEYWORDS.some((kw) => trimmed.includes(kw))) return false
  // Chilean commune names start with an uppercase letter (incl. accents)
  if (!/^[A-ZÁÉÍÓÚÑÜ]/.test(trimmed)) return false
  // Reject anything with too many whitespace gaps (typical of scraped prose)
  if (/\s{2,}/.test(trimmed)) return false
  return true
}

export function cleanComunas(comunas: readonly string[]): string[] {
  const result: string[] = []
  for (const entry of comunas) {
    if (!entry) continue
    const pieces = entry.split(",").map((p) => p.trim()).filter(Boolean)
    for (const piece of pieces) {
      if (looksLikeComuna(piece)) {
        result.push(piece)
      }
    }
  }
  // Dedupe while preserving order
  return Array.from(new Set(result))
}
