import type { DrillType, Simulacro } from "@/lib/types"
import { parseIsoDate, todayIsoDate } from "@/lib/query-date"

export const DRILL_TYPE_LABELS: Record<DrillType, string> = {
  sismo_tsunami_borde_costero: "Sismo y tsunami · borde costero",
  sismo_tsunami_educacion: "Sismo y tsunami · educación",
  erupcion_volcanica: "Erupción volcánica",
  remocion_en_masa: "Remoción en masa",
  otro: "Otro simulacro",
}

/** Editorial SENAPRED scenario colors — not alert/risk semantics. */
export const DRILL_TYPE_COLORS: Record<
  DrillType,
  { accent: string; ink: string }
> = {
  sismo_tsunami_borde_costero: { accent: "#00a6d0", ink: "#062b38" },
  sismo_tsunami_educacion: { accent: "#0fb1af", ink: "#062f2e" },
  erupcion_volcanica: { accent: "#b33a4a", ink: "#ffffff" },
  remocion_en_masa: { accent: "#6b4a2e", ink: "#fff8ef" },
  otro: { accent: "#0167b7", ink: "#ffffff" },
}


export function hasSimulacroDetailPage(detailUrl: string): boolean {
  try {
    const pathname = new URL(detailUrl, "https://senapred.cl").pathname
    return /^\/simulacros_t\/[^/]+\/?$/.test(pathname)
  } catch {
    return false
  }
}

export function formatSimulacroDate(iso: string): {
  weekday: string
  day: string
  month: string
  year: string
} {
  const date = parseIsoDate(iso)
  const weekday = date
    .toLocaleDateString("es-CL", { weekday: "long" })
    .toLowerCase()
  const month = date
    .toLocaleDateString("es-CL", { month: "short" })
    .replace(/\.$/, "")
    .toLowerCase()

  return {
    weekday,
    day: String(date.getDate()).padStart(2, "0"),
    month,
    year: String(date.getFullYear()),
  }
}

export function partitionSimulacros(
  items: readonly Simulacro[],
  today = todayIsoDate(),
): { upcoming: Simulacro[]; past: Simulacro[] } {
  const reference = parseIsoDate(today).getTime()
  const upcoming = items
    .filter((item) => parseIsoDate(item.drill_date).getTime() >= reference)
    .sort(
      (left, right) =>
        parseIsoDate(left.drill_date).getTime() -
        parseIsoDate(right.drill_date).getTime(),
    )
  const past = items
    .filter((item) => parseIsoDate(item.drill_date).getTime() < reference)
    .sort(
      (left, right) =>
        parseIsoDate(right.drill_date).getTime() -
        parseIsoDate(left.drill_date).getTime(),
    )

  return { upcoming, past }
}
