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
  const parts: string[] = []
  if (sim.region_name) parts.push(sim.region_name)
  if (sim.participating_comunas.length) {
    parts.push(`Comunas: ${sim.participating_comunas.join(", ")}`)
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
