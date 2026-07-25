import { SimulacroListRow } from "@/components/preparation/simulacros/simulacro-list-row"
import { SimulacrosMonthHeader } from "@/components/preparation/simulacros/simulacros-month-header"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { getDrillTypeVisual } from "@/lib/simulacros-visual"
import { cn } from "@/lib/utils"
import type { Simulacro } from "@/lib/types"

const SPANISH_MONTHS: readonly string[] = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

/** Left rail width (= content padding). Line + dots share the horizontal center. */
const RAIL_CLASS = "w-5 sm:w-6"
const CONTENT_PAD_CLASS = "pl-5 sm:pl-6"
/** Half-rail offset so marker centers on the vertical line. */
const MARKER_OFFSET_CLASS = "-left-2.5 sm:-left-3"

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

function buildGroups(
  items: Simulacro[],
  variant: "upcoming" | "past",
): MonthGroup[] {
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
        monthLabel: SPANISH_MONTHS[m - 1] ?? "",
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

    group.items.sort((a, b) => {
      const cmp = a.drill_date.localeCompare(b.drill_date)
      return variant === "past" ? -cmp : cmp
    })
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.year !== b.year) {
      return variant === "past" ? b.year - a.year : a.year - b.year
    }
    return variant === "past"
      ? b.monthIndex - a.monthIndex
      : a.monthIndex - b.monthIndex
  })
}

function TimelineMarker({
  className,
  tone,
}: {
  className?: string
  tone?: string
}) {
  return (
    <span
      className={cn(
        "absolute z-10 size-2.5 -translate-x-1/2 rounded-full border-2 bg-[var(--background)] sm:size-3",
        MARKER_OFFSET_CLASS,
        tone ?? "border-white/45",
        className,
      )}
      aria-hidden
    />
  )
}

export function SimulacrosTimeline({
  items,
  variant,
  now,
  embedded = false,
}: SimulacrosTimelineProps) {
  const groups = buildGroups(items, variant)

  if (groups.length === 0) return null

  return (
    <div
      className={cn(
        embedded
          ? "relative"
          : cn(
              GLASS_PANEL_CLASS,
              GLASS_MICA_INTERACTIVE_CLASS,
              "relative overflow-hidden px-4 py-6 sm:px-6 sm:py-7",
            ),
      )}
    >
      <div className={cn("relative", CONTENT_PAD_CLASS)}>
        <div
          className={cn(
            "pointer-events-none absolute inset-y-2 left-0",
            RAIL_CLASS,
          )}
          aria-hidden
        >
          <div className="mx-auto h-full w-px bg-gradient-to-b from-white/50 via-white/20 to-white/5" />
        </div>

        <div className="relative flex flex-col gap-7 sm:gap-8">
          {groups.map((group) => {
            const visual = group.dominantType
              ? getDrillTypeVisual(group.dominantType)
              : null
            return (
              <section
                key={group.key}
                className="relative flex flex-col gap-2.5"
                aria-label={`${group.monthLabel} ${group.year}`}
              >
                <div className="relative">
                  <TimelineMarker
                    className="top-1/2 -translate-y-1/2"
                    tone={visual?.chipBorder}
                  />
                  <SimulacrosMonthHeader
                    monthLabel={group.monthLabel}
                    year={group.year}
                    count={group.count}
                    accent={visual?.monthAccent}
                    chipBorder={visual?.chipBorder}
                  />
                </div>
                <ul className="flex flex-col gap-2.5">
                  {group.items.map((sim) => {
                    const rowVisual = getDrillTypeVisual(sim.drill_type)
                    return (
                      <li key={sim.slug} className="relative">
                        <TimelineMarker
                          className="top-1/2 -translate-y-1/2"
                          tone={rowVisual.chipBorder}
                        />
                        <SimulacroListRow
                          simulacro={sim}
                          variant={variant}
                          now={now}
                          embedded={embedded}
                        />
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
