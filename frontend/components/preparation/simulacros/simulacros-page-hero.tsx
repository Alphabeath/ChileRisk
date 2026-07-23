"use client"

import { Siren } from "lucide-react"

import { SimulacrosCountdown } from "@/components/preparation/simulacros/simulacros-countdown"
import { GLASS_DIVIDER } from "@/lib/glass-panel"
import {
  PREPARATION_EYEBROW_CLASS,
  PREPARATION_HERO_SHELL_CLASS,
} from "@/lib/preparation-ui"
import { DRILL_TYPE_HIGHLIGHTS } from "@/data/simulacros"
import { formatDrillDate } from "@/lib/simulacros-format"
import { cn } from "@/lib/utils"
import type { Simulacro } from "@/lib/types"

interface SimulacrosPageHeroProps {
  next: Simulacro | null | undefined
  upcomingTotal: number
}

export function SimulacrosPageHero({ next, upcomingTotal }: SimulacrosPageHeroProps) {
  return (
    <header className={PREPARATION_HERO_SHELL_CLASS}>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--primary-chile)]/55 via-red-950/70 to-[var(--secondary-chile)]/45"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
        aria-hidden
      />
      <Siren
        className="pointer-events-none absolute -right-6 top-1/2 size-40 -translate-y-1/2 text-white/[0.08] sm:size-56 lg:size-64"
        strokeWidth={1}
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1">
          <span className="inline-flex w-fit items-center gap-2 border border-rose-300/30 bg-rose-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[1.2px] text-rose-100/90">
            Calendario SERNAPRED
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Simulacros de evacuación
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base">
            Ejercicios oficiales coordinados por SENAPRED en todo Chile. Consulta
            fechas, tipos de amenaza y participa en la preparación de tu comunidad.
          </p>
        </div>

        <dl className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3 lg:min-w-[16rem]">
          <StatBox
            label="A efectuarse"
            value={upcomingTotal}
            suffix="simulacros"
          />
          <StatBox label="Tipos" value={DRILL_TYPE_HIGHLIGHTS.length} />
        </dl>
      </div>

      {next?.drill_date ? (
        <div className="relative border-t border-white/10 bg-black/40 px-5 py-5 sm:px-8">
          <p className={cn(PREPARATION_EYEBROW_CLASS, "text-amber-200/90")}>
            Próximo simulacro
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white sm:text-lg">
                {next.title || "Simulacro SENAPRED"}
              </p>
              <p className="mt-1 text-[12.5px] text-white/55">
                {formatDrillDate(next.drill_date)}
                {next.region_name ? ` · ${next.region_name}` : null}
              </p>
            </div>
            <SimulacrosCountdown drillDate={next.drill_date} />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "relative flex overflow-x-auto border-t divide-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible",
          GLASS_DIVIDER,
        )}
      >
        {DRILL_TYPE_HIGHLIGHTS.map(
          ({ drillType, shortLabel, icon: Icon, accent }) => (
            <div
              key={drillType}
              className="flex min-w-[7rem] shrink-0 items-center justify-center gap-2.5 px-3 py-4 transition-colors hover:bg-white/[0.03] sm:min-w-0 sm:flex-1 sm:gap-3 sm:px-4 sm:py-5"
            >
              <div className="flex size-9 shrink-0 items-center justify-center border border-white/20 bg-white/10 sm:size-10">
                <Icon
                  className={cn("size-4 sm:size-[1.125rem]", accent)}
                  aria-hidden
                />
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[1.1px] text-white sm:text-[11px]">
                  {shortLabel}
                </p>
              </div>
            </div>
          ),
        )}
      </div>
    </header>
  )
}

function StatBox({
  label,
  value,
  suffix,
}: {
  label: string
  value: number | null
  suffix?: string
}) {
  return (
    <div className="border border-white/20 bg-black/35 px-3 py-3 text-center backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-black/50 sm:px-4 sm:py-4">
      <dt className={cn(PREPARATION_EYEBROW_CLASS, "text-white/55")}>{label}</dt>
      <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white sm:text-3xl">
        {value === null ? (
          "—"
        ) : suffix ? (
          <span>
            {value}
            <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-white/55 sm:text-[11px]">
              {suffix}
            </span>
          </span>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}
