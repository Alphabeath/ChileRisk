import { cleanComunas } from "@/lib/simulacros-format"
import type { Drill, Simulacro } from "@/lib/types"

const DRILL_TYPE_TO_HUMAN: Record<Simulacro["drill_type"], string> = {
  sismo_tsunami_borde_costero: "Sismo y Tsunami — Borde Costero",
  sismo_tsunami_educacion: "Sismo y Tsunami — Sector Educación",
  erupcion_volcanica: "Erupción Volcánica",
  remocion_en_masa: "Remoción en Masa",
  otro: "Simulacro SERNAPRED",
}

export function simulacroToDrill(sim: Simulacro): Pick<
  Drill,
  "date" | "emergency_type" | "outcome"
> {
  const title = DRILL_TYPE_TO_HUMAN[sim.drill_type] || sim.drill_type
  const comunas = cleanComunas(sim.participating_comunas)
  const parts: string[] = []
  if (sim.region_name) parts.push(sim.region_name)
  if (comunas.length > 0) {
    parts.push(`Comunas: ${comunas.join(", ")}`)
  }
  if (sim.mensaje_sae) parts.push("Mensaje SAE habilitado")
  return {
    date: sim.drill_date,
    emergency_type: title,
    outcome: parts.join(" · "),
  }
}

export interface SimulacroPrefillQuery {
  source?: "senapred"
  slug?: string
  date?: string
  emergency_type?: string
  outcome?: string
}

export function simulacroToQueryParams(sim: Simulacro): SimulacroPrefillQuery {
  const drill = simulacroToDrill(sim)
  return {
    source: "senapred",
    slug: sim.slug,
    date: drill.date,
    emergency_type: drill.emergency_type,
    outcome: drill.outcome,
  }
}

export function buildSimulacroDrillHref(sim: Simulacro): string {
  const q = simulacroToQueryParams(sim)
  const search = new URLSearchParams()
  search.set("source", "senapred")
  search.set("slug", sim.slug)
  if (q.date) search.set("date", q.date)
  if (q.emergency_type) search.set("emergency_type", q.emergency_type)
  if (q.outcome) search.set("outcome", q.outcome)
  return `/preparation/family-plan/step/8?${search.toString()}`
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function toIcsDate(iso: string): string | null {
  const [y, m, d] = iso.split("-").map((n) => Number(n))
  if (!y || !m || !d) return null
  return `${y}${pad2(m)}${pad2(d)}`
}

function nextDayIcsDate(iso: string): string | null {
  const [y, m, d] = iso.split("-").map((n) => Number(n))
  if (!y || !m || !d) return null
  const next = new Date(Date.UTC(y, m - 1, d + 1))
  return `${next.getUTCFullYear()}${pad2(next.getUTCMonth() + 1)}${pad2(next.getUTCDate())}`
}

/** Escape a TEXT-typed field per RFC 5545 §3.3.11. */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
}

/** Fold content lines to ≤ 75 octets per RFC 5545 §3.1. */
function foldIcsLine(line: string): string {
  if (line.length <= 75) return line
  const out: string[] = []
  let rest = line
  out.push(rest.slice(0, 75))
  rest = rest.slice(75)
  while (rest.length > 0) {
    out.push(` ${rest.slice(0, 74)}`)
    rest = rest.slice(74)
  }
  return out.join("\r\n")
}

/** Build a valid RFC 5545 .ics file (all-day event) for a simulacro. */
export function buildSimulacroIcs(sim: Simulacro): string | null {
  const start = toIcsDate(sim.drill_date)
  const end = nextDayIcsDate(sim.drill_date)
  if (!start || !end) return null

  const title = DRILL_TYPE_TO_HUMAN[sim.drill_type] || sim.drill_type
  const comunas = cleanComunas(sim.participating_comunas)
  const detailParts: string[] = []
  if (sim.region_name) detailParts.push(sim.region_name)
  if (comunas.length > 0) {
    detailParts.push(`Comunas: ${comunas.join(", ")}`)
  }
  if (sim.mensaje_sae) detailParts.push("Mensaje SAE habilitado")
  detailParts.push(`Fuente: ${sim.detail_url}`)

  const stamp = (() => {
    const d = new Date()
    return (
      `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
      `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
    )
  })()
  const uid = `${sim.slug}-${start}@chilerisk.cl`

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ChileRisk//Simulacros SERNAPRED//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcsText(`Simulacro SERNAPRED — ${title}`)}`,
    `DESCRIPTION:${escapeIcsText(detailParts.join("\n"))}`,
    ...(sim.region_name ? [`LOCATION:${escapeIcsText(sim.region_name)}`] : []),
    `URL:${escapeIcsText(sim.detail_url)}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
  return lines.map(foldIcsLine).join("\r\n") + "\r\n"
}

/** Trigger browser download of the simulacro .ics file. */
export function downloadSimulacroIcs(sim: Simulacro): void {
  if (typeof window === "undefined") return
  const ics = buildSimulacroIcs(sim)
  if (!ics) return
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `simulacro-senapred-${sim.slug}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
