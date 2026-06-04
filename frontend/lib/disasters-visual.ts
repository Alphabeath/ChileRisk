export type DesastreCategory =
  | "sismico"
  | "volcanico"
  | "incendio"
  | "hidrologico"
  | "climatico"

export const categoryLabels: Record<DesastreCategory, string> = {
  sismico: "Sísmico y costero",
  volcanico: "Volcánico",
  incendio: "Incendios",
  hidrologico: "Hidrológico",
  climatico: "Climático",
}

const slugCategory: Record<string, DesastreCategory> = {
  sismos: "sismico",
  tsunami: "sismico",
  volcanes: "volcanico",
  "incendios-forestales": "incendio",
  "incendios-estructurales": "incendio",
  aluviones: "hidrologico",
  deslizamientos: "hidrologico",
  inundaciones: "hidrologico",
  "calor-extremo": "climatico",
  heladas: "climatico",
  viento: "climatico",
  "tormentas-electricas": "climatico",
}

export function getDesastreCategory(slug: string): DesastreCategory {
  return slugCategory[slug] ?? "climatico"
}

/** Stronger full-bleed gradient for disaster detail hero (by category). */
export const categoryHeroBoost: Record<DesastreCategory, string> = {
  sismico:
    "from-red-600/55 via-orange-800/40 to-[var(--secondary-chile)]/35",
  volcanico: "from-orange-600/50 via-red-900/45 to-stone-950/50",
  incendio: "from-amber-600/50 via-orange-800/40 to-red-950/45",
  hidrologico: "from-blue-600/50 via-cyan-800/40 to-slate-950/50",
  climatico: "from-sky-600/45 via-indigo-800/35 to-slate-950/50",
}