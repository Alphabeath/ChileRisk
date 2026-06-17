"use client"

import { CalendarDays } from "lucide-react"

import {
  SimulacrosEmptyState,
  SimulacrosFilterBar,
  type SimulacrosRange,
  type SimulacrosView,
  SimulacrosSkeleton,
  SimulacrosTimeline,
} from "@/components/preparation/simulacros"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"
import type { Simulacro, SimulacrosParams } from "@/lib/types"

interface SimulacrosCalendarSectionProps {
  view: SimulacrosView
  range: SimulacrosRange
  params: SimulacrosParams
  total: number
  items: Simulacro[]
  now: number
  isLoading: boolean
  error: unknown
  isFetching: boolean
  onParamsChange: (next: SimulacrosParams) => void
  onRangeChange: (next: SimulacrosRange) => void
  onViewChange: (next: SimulacrosView) => void
  onRetry: () => void
}

export function SimulacrosCalendarSection({
  view,
  range,
  params,
  total,
  items,
  now,
  isLoading,
  error,
  isFetching,
  onParamsChange,
  onRangeChange,
  onViewChange,
  onRetry,
}: SimulacrosCalendarSectionProps) {
  return (
    <section
      aria-labelledby="simulacros-calendar-heading"
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col overflow-hidden",
      )}
    >
      <div className="flex flex-col gap-1 border-b border-white/10 bg-black/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center border border-white/15 bg-white/[0.06]">
            <CalendarDays className="size-4 text-white/80" aria-hidden />
          </span>
          <div>
            <h2
              id="simulacros-calendar-heading"
              className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/90"
            >
              Calendario de ejercicios
            </h2>
            <p className="text-[12px] text-white/55">
              Calendario oficial SERNAPRED 2026 — próximos y realizados
            </p>
          </div>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-white/45 sm:text-right">
          Fuente: senapred.cl/simulacros
        </p>
      </div>

      <div className="sticky top-20 z-10 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <SimulacrosFilterBar
          value={params}
          view={view}
          range={range}
          onChange={onParamsChange}
          onRangeChange={onRangeChange}
          onViewChange={onViewChange}
          total={total}
          embedded
        />
      </div>

      <div className="p-4 sm:p-5">
        {isLoading ? (
          <SimulacrosSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <p className="text-[12px] font-semibold text-white/85">
              No pudimos cargar el calendario.
            </p>
            <button
              type="button"
              onClick={onRetry}
              disabled={isFetching}
              className="inline-flex h-8 items-center gap-2 border border-white/15 bg-white/[0.06] px-4 text-[10px] font-semibold uppercase tracking-wider text-white/80 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30 disabled:opacity-50"
            >
              Reintentar
            </button>
          </div>
        ) : items.length === 0 ? (
          <SimulacrosEmptyState view={view} embedded />
        ) : (
          <SimulacrosTimeline items={items} variant={view} now={now} embedded />
        )}
      </div>
    </section>
  )
}