"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useMemo, useState, type CSSProperties } from "react"

import { SimulacrosTypeFilter } from "@/components/simulacros/simulacros-type-filter"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSimulacros } from "@/hooks/use-simulacros"
import { parseIsoDate } from "@/lib/query-date"
import {
  DRILL_TYPE_COLORS,
  DRILL_TYPE_LABELS,
  formatSimulacroDate,
  hasSimulacroDetailPage,
  partitionSimulacros,
} from "@/lib/simulacros"
import type { DrillType, Simulacro } from "@/lib/types"
import { cn } from "@/lib/utils"

const EMPTY_SIMULACROS: Simulacro[] = []

type AgendaSegment = "upcoming" | "completed"

function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

function formatMonthHeading(isoYearMonth: string): string {
  const [year] = isoYearMonth.split("-")
  const date = parseIsoDate(`${isoYearMonth}-01`)
  const label = date
    .toLocaleDateString("es-CL", { month: "long" })
    .toLowerCase()
  return `${label} ${year ?? ""}`.trim()
}

function groupByMonth(items: readonly Simulacro[]): {
  key: string
  label: string
  items: Simulacro[]
}[] {
  const groups = new Map<string, Simulacro[]>()
  for (const item of items) {
    const key = monthKey(item.drill_date)
    const bucket = groups.get(key)
    if (bucket) {
      bucket.push(item)
    } else {
      groups.set(key, [item])
    }
  }

  return Array.from(groups.entries()).map(([key, groupItems]) => ({
    key,
    label: formatMonthHeading(key),
    items: groupItems,
  }))
}

function AgendaEntry({
  item,
  variant,
}: {
  item: Simulacro
  variant: "upcoming" | "completed"
}) {
  const date = formatSimulacroDate(item.drill_date)
  const typeLabel = DRILL_TYPE_LABELS[item.drill_type]
  const colors = DRILL_TYPE_COLORS[item.drill_type]
  const comunas = item.participating_comunas.filter(Boolean)
  const isCompleted = variant === "completed"
  const hasDetailPage = hasSimulacroDetailPage(item.detail_url)
  const accent = isCompleted ? "#da291c" : colors.accent
  const ink = isCompleted ? "#ffffff" : colors.ink
  const style = {
    "--drill-accent": accent,
    "--drill-ink": ink,
  } as CSSProperties & {
    "--drill-accent": string
    "--drill-ink": string
  }

  return (
    <article
      style={style}
      className={cn(
        "grid overflow-hidden border border-border bg-card text-card-foreground shadow-[0_10px_28px_color-mix(in_oklch,var(--foreground)_10%,transparent)]",
        hasDetailPage
          ? "sm:grid-cols-[6.75rem_minmax(0,1fr)_8.75rem]"
          : "sm:grid-cols-[6.75rem_minmax(0,1fr)]",
        isCompleted && "opacity-[0.96]"
      )}
    >
      <div className="flex items-center gap-3 bg-[var(--drill-accent)] px-4 py-4 text-[var(--drill-ink)] sm:flex-col sm:items-start sm:justify-center sm:gap-1 sm:py-5">
        <p className="font-mono text-[10px] font-semibold tracking-[1.2px] uppercase opacity-90">
          {date.weekday}
        </p>
        <p className="font-mono text-4xl leading-none font-bold tracking-tight tabular-nums">
          {date.day}
        </p>
        <p className="font-mono text-[10px] font-semibold tracking-[1.2px] uppercase opacity-90">
          {date.month}
        </p>
      </div>

      <div className="relative min-w-0 border-t border-border px-4 py-4 sm:border-t-0 sm:border-l sm:px-5 sm:py-5">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-[var(--drill-accent)] sm:inset-y-0 sm:left-0 sm:h-auto sm:w-1"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="px-2 py-px font-mono text-[10px] font-semibold leading-4 tracking-[1.2px] uppercase"
            style={{ backgroundColor: colors.accent, color: colors.ink }}
          >
            {typeLabel}
          </span>
          {item.mensaje_sae ? (
            <span className="border border-[var(--drill-accent)]/55 bg-[color-mix(in_oklch,var(--drill-accent)_14%,transparent)] px-2 py-1 font-mono text-[10px] font-semibold tracking-[1.2px] text-foreground uppercase">
              SAE
            </span>
          ) : null}
          {item.region_name ? (
            <span className="bg-muted px-2 py-1 font-mono text-[10px] font-semibold tracking-[1.2px] text-muted-foreground uppercase">
              {item.region_name}
            </span>
          ) : null}
        </div>

        <h4 className="mt-3 text-lg font-bold tracking-tight text-balance text-foreground">
          {hasDetailPage ? (
            <Link
              href={`/simulacros/${item.slug}`}
              className="underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </h4>

        {!isCompleted && item.summary ? (
          <p className="mt-2 max-w-[70ch] text-sm leading-6 text-muted-foreground">
            {item.summary}
          </p>
        ) : null}

        {!isCompleted && comunas.length > 0 ? (
          <p className="mt-3 border-t border-border/80 pt-3 text-xs leading-5 text-muted-foreground">
            <span className="font-mono text-[10px] font-semibold tracking-[1.2px] text-foreground uppercase">
              Participan
            </span>
            <span className="mt-1 block">{comunas.join(", ")}</span>
          </p>
        ) : null}
      </div>

      {hasDetailPage ? (
        <div className="flex flex-col justify-center border-t border-border bg-[color-mix(in_oklch,var(--drill-accent)_8%,var(--card))] px-4 py-4 sm:border-t-0 sm:border-l">
          <Link
            href={`/simulacros/${item.slug}`}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            style={{ backgroundColor: accent, color: ink }}
          >
            Detalle
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      ) : null}
    </article>
  )
}

function NextExercisePanel({ item }: { item: Simulacro }) {
  const date = formatSimulacroDate(item.drill_date)
  const colors = DRILL_TYPE_COLORS[item.drill_type]
  const hasDetailPage = hasSimulacroDetailPage(item.detail_url)
  const style = {
    "--next-accent": colors.accent,
    "--next-ink": colors.ink,
  } as CSSProperties & {
    "--next-accent": string
    "--next-ink": string
  }

  const comunas = item.participating_comunas.filter(Boolean)

  return (
    <article
      style={style}
      className={cn(
        "grid overflow-hidden bg-[var(--next-accent)] text-[var(--next-ink)] shadow-[0_10px_28px_color-mix(in_oklch,var(--next-accent)_35%,transparent)]",
        hasDetailPage
          ? "sm:grid-cols-[6.75rem_minmax(0,1fr)_8.75rem]"
          : "sm:grid-cols-[6.75rem_minmax(0,1fr)]"
      )}
    >
      <div className="flex items-center gap-3 bg-[color-mix(in_oklch,var(--next-ink)_9%,transparent)] px-4 py-4 sm:flex-col sm:items-start sm:justify-center sm:gap-1 sm:py-5">
        <p className="font-mono text-[10px] font-semibold tracking-[1.2px] uppercase opacity-90">
          {date.weekday}
        </p>
        <p className="font-mono text-4xl leading-none font-bold tracking-tight tabular-nums">
          {date.day}
        </p>
        <p className="font-mono text-[10px] font-semibold tracking-[1.2px] uppercase opacity-90">
          {date.month} {date.year}
        </p>
      </div>

      <div className="min-w-0 border-t border-current/25 px-4 py-4 sm:border-t-0 sm:border-l sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-[var(--next-ink)] px-2 py-1 font-mono text-[10px] font-semibold tracking-[1.2px] text-[var(--next-accent)] uppercase">
            Próximo ejercicio
          </span>
          <span className="bg-[color-mix(in_oklch,var(--next-ink)_16%,transparent)] px-2 py-px font-mono text-[10px] font-semibold leading-4 tracking-[1.2px] uppercase">
            {DRILL_TYPE_LABELS[item.drill_type]}
          </span>
          {item.mensaje_sae ? (
            <span className="border border-current/55 px-2 py-1 font-mono text-[10px] font-semibold tracking-[1.2px] uppercase">
              SAE
            </span>
          ) : null}
          {item.region_name ? (
            <span className="bg-[color-mix(in_oklch,var(--next-ink)_12%,transparent)] px-2 py-1 font-mono text-[10px] font-semibold tracking-[1.2px] uppercase">
              {item.region_name}
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 text-xl font-bold tracking-tight text-balance sm:text-2xl">
          {hasDetailPage ? (
            <Link
              href={`/simulacros/${item.slug}`}
              className="underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none"
            >
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </h3>

        {item.summary ? (
          <p className="mt-2 max-w-[70ch] text-sm leading-6 opacity-85">
            {item.summary}
          </p>
        ) : null}

        {comunas.length > 0 ? (
          <p className="mt-3 border-t border-current/25 pt-3 text-xs leading-5 opacity-85">
            <span className="font-mono text-[10px] font-semibold tracking-[1.2px] uppercase opacity-100">
              Participan
            </span>
            <span className="mt-1 block">{comunas.join(", ")}</span>
          </p>
        ) : null}
      </div>

      {hasDetailPage ? (
        <div className="flex flex-col justify-center border-t border-current/25 bg-[color-mix(in_oklch,var(--next-ink)_7%,transparent)] px-4 py-4 sm:border-t-0 sm:border-l">
          <Link
            href={`/simulacros/${item.slug}`}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-current px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-colors hover:bg-[color-mix(in_oklch,var(--next-ink)_12%,transparent)] focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--next-accent)] focus-visible:outline-none"
          >
            Detalle
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      ) : null}
    </article>
  )
}

function AgendaMonthGroup({
  label,
  items,
  segment,
}: {
  label: string
  items: Simulacro[]
  segment: AgendaSegment
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex h-2 w-2 shrink-0",
            segment === "upcoming"
              ? "bg-[#0167b7]"
              : "bg-[var(--secondary-chile)]"
          )}
          aria-hidden
        />
        <h3 className="font-mono text-[11px] font-bold tracking-[1.4px] text-muted-foreground uppercase">
          {label}
        </h3>
        <div className="h-px flex-1 bg-border" aria-hidden />
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.slug}>
            <AgendaEntry
              item={item}
              variant={segment === "completed" ? "completed" : "upcoming"}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

function AgendaLoadingState() {
  return (
    <div className="space-y-4" aria-busy="true">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="grid gap-4 border border-border bg-card p-5 sm:grid-cols-[6.5rem_minmax(0,1fr)]"
        >
          <Skeleton className="h-16 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SimulacrosAgenda() {
  const [selectedType, setSelectedType] = useState<DrillType | null>(null)
  const [segment, setSegment] = useState<AgendaSegment>("upcoming")
  const { data, isError, isPending, refetch } = useSimulacros({ limit: 200 })
  const items = data?.items ?? EMPTY_SIMULACROS

  const filteredItems = useMemo(
    () =>
      selectedType
        ? items.filter((item) => item.drill_type === selectedType)
        : items,
    [items, selectedType]
  )

  const { upcoming, past } = useMemo(
    () => partitionSimulacros(filteredItems),
    [filteredItems]
  )
  const activeItems = segment === "upcoming" ? upcoming : past
  const nextItem = segment === "upcoming" ? (upcoming[0] ?? null) : null
  const calendarItems = useMemo(
    () => (segment === "upcoming" ? upcoming.slice(1) : past),
    [past, segment, upcoming]
  )
  const monthGroups = useMemo(
    () => groupByMonth(calendarItems),
    [calendarItems]
  )

  return (
    <section
      id="calendario-simulacros"
      aria-labelledby="simulacros-agenda-title"
      className="border-b border-border bg-background py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-8">
          <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-[#0167b7] uppercase dark:text-sky-300">
            Calendario SENAPRED
          </p>
          <h2
            id="simulacros-agenda-title"
            className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-5xl"
          >
            Calendario de ejercicios
          </h2>
          <p className="mt-4 max-w-[62ch] text-base leading-7 text-muted-foreground sm:text-lg">
            Revisa fechas, territorios y tipos de simulacro publicados por
            SENAPRED. Los ejercicios con ficha publicada habilitan su detalle.
          </p>
        </div>

        <div className="mt-8 overflow-hidden border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-muted-foreground uppercase">
                Segmento
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cambia entre ejercicios futuros y realizados
              </p>
            </div>
            <div
              className="inline-flex w-full border border-border bg-background p-1 sm:w-auto"
              role="tablist"
              aria-label="Segmento de agenda"
            >
              <button
                type="button"
                role="tab"
                aria-selected={segment === "upcoming"}
                className={cn(
                  "min-h-11 flex-1 px-4 font-mono text-[10px] font-bold tracking-[1.2px] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-none",
                  segment === "upcoming"
                    ? "bg-[#0167b7] text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSegment("upcoming")}
              >
                Próximos ({upcoming.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={segment === "completed"}
                className={cn(
                  "min-h-11 flex-1 px-4 font-mono text-[10px] font-bold tracking-[1.2px] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-none",
                  segment === "completed"
                    ? "bg-[var(--secondary-chile)] text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSegment("completed")}
              >
                Realizados ({past.length})
              </button>
            </div>
          </div>

          <div className="border-b border-border px-4 py-5 sm:px-5">
            <SimulacrosTypeFilter
              selectedType={selectedType}
              onSelect={setSelectedType}
              labelledBy="simulacros-agenda-filtro-label"
              controlsId="simulacros-agenda-results"
            />
          </div>

          <div className="px-4 py-5 sm:px-5" id="simulacros-agenda-results">
            {isError ? (
              <div
                className="border border-destructive/40 bg-card p-6"
                role="alert"
              >
                <p className="text-base font-bold text-foreground">
                  No pudimos cargar la agenda
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Revisa tu conexión e inténtalo nuevamente.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 min-h-11"
                  onClick={() => void refetch()}
                >
                  Reintentar
                </Button>
              </div>
            ) : null}

            {isPending ? <AgendaLoadingState /> : null}

            {!isPending && !isError && items.length === 0 ? (
              <div className="border border-border bg-card p-6" role="status">
                <p className="text-sm text-muted-foreground">
                  No hay simulacros publicados
                </p>
              </div>
            ) : null}

            {!isPending &&
            !isError &&
            items.length > 0 &&
            activeItems.length === 0 ? (
              <div className="border border-border bg-card p-6" role="status">
                <p className="text-sm text-muted-foreground">
                  {selectedType
                    ? "No hay simulacros de este tipo en este segmento"
                    : segment === "upcoming"
                      ? "No hay próximos ejercicios publicados"
                      : "No hay ejercicios realizados"}
                </p>
                {selectedType ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5 min-h-11"
                    onClick={() => setSelectedType(null)}
                  >
                    Mostrar todos
                  </Button>
                ) : null}
              </div>
            ) : null}

            {!isPending && !isError && activeItems.length > 0 ? (
              <div className="space-y-8">
                {nextItem ? <NextExercisePanel item={nextItem} /> : null}
                {monthGroups.length > 0 ? (
                  <div className="space-y-8">
                    {monthGroups.map((group) => (
                      <AgendaMonthGroup
                        key={group.key}
                        label={group.label}
                        items={group.items}
                        segment={segment}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
