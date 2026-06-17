import { SimulacroListRow } from "@/components/preparation/simulacros/simulacro-list-row"
import { SimulacrosMonthHeader } from "@/components/preparation/simulacros/simulacros-month-header"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { getDrillTypeVisual } from "@/lib/simulacros-visual"
import { cn } from "@/lib/utils"
import type { Simulacro } from "@/lib/types"

const _SPANISH_MONTHS: readonly string[] = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

interface SimulacrosTimelineProps {
  items: Simulacro[]
  variant: "upcoming" | "past"
  now: number
  embedded?: boolean
}

interface MonthGroup {
  key: string
  year: number
  monthIndex: number
  monthLabel: string
  count: number
  dominantType: Simulacro["drill_type"] | null
  items: Simulacro[]
}

function buildGroups(items: Simulacro[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>()

  for (const sim of items) {
    const [y, m] = sim.drill_date.split("-").map((n) => Number(n))
    if (!y || !m) continue
    const key = `${y}-${String(m).padStart(2, "0")}`
    let group = map.get(key)
    if (!group) {
      group = {
        key,
        year: y,
        monthIndex: m - 1,
        monthLabel: _SPANISH_MONTHS[m - 1] ?? "",
        count: 0,
        dominantType: null,
        items: [],
      }
      map.set(key, group)
    }
    group.items.push(sim)
    group.count += 1
  }

  for (const group of map.values()) {
    const tally = new Map<Simulacro["drill_type"], number>()
    for (const sim of group.items) {
      tally.set(sim.drill_type, (tally.get(sim.drill_type) ?? 0) + 1)
    }
    let dominant: Simulacro["drill_type"] | null = null
    let max = 0
    for (const [type, c] of tally) {
      if (c > max) {
        max = c
        dominant = type
      }
    }
    group.dominantType = dominant
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.monthIndex - b.monthIndex
  })
}

export function SimulacrosTimeline({
  items,
  variant,
  now,
  embedded = false,
}: SimulacrosTimelineProps) {
  const groups = buildGroups(items)

  if (groups.length === 0) return null

  return (
    <div
      className={cn(
        embedded
          ? "relative"
          : cn(GLASS_PANEL_CLASS, GLASS_MICA_INTERACTIVE_CLASS, "relative overflow-hidden"),
      )}
    >
      {!embedded ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          aria-hidden
        />
      ) : null}

      <div className={cn("relative", embedded ? "py-1" : "px-4 py-5 sm:px-6 sm:py-6")}>
        <div
          className="pointer-events-none absolute bottom-4 left-3 top-4 w-px bg-gradient-to-b from-white/30 via-white/12 to-transparent sm:left-4"
          aria-hidden
        />

        <div className="relative flex flex-col gap-6 pl-5 sm:gap-7 sm:pl-6">
          {groups.map((group) => {
            const visual = group.dominantType
              ? getDrillTypeVisual(group.dominantType)
              : null
            return (
              <section
                key={group.key}
                className="relative flex flex-col gap-2"
                aria-label={`${group.monthLabel} ${group.year}`}
              >
                <SimulacrosMonthHeader
                  monthLabel={group.monthLabel}
                  year={group.year}
                  count={group.count}
                  accent={visual?.monthAccent}
                  chipBorder={visual?.chipBorder}
                  showRail
                />
                <div className="flex flex-col gap-2">
                  {group.items.map((sim) => (
                    <SimulacroListRow
                      key={sim.slug}
                      simulacro={sim}
                      variant={variant}
                      now={now}
                      embedded={embedded}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}