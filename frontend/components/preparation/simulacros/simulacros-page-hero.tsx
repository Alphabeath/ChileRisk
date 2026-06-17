"use client"

import { useEffect, useState } from "react"
import { Megaphone } from "lucide-react"

import {
  GLASS_DIVIDER,
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { DRILL_TYPE_HIGHLIGHTS } from "@/data/simulacros"
import { daysUntil } from "@/lib/simulacros-format"
import { cn } from "@/lib/utils"
import type { Simulacro } from "@/lib/types"

interface SimulacrosPageHeroProps {
  next: Simulacro | null | undefined
  upcomingTotal: number
}

export function SimulacrosPageHero({ next, upcomingTotal }: SimulacrosPageHeroProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  const daysLeft =
    next?.drill_date !== undefined && next.drill_date !== null
      ? Math.max(0, daysUntil(next.drill_date, now))
      : null

  return (
    <header
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "relative w-full overflow-hidden",
      )}
    >
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
      <Megaphone
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

        <dl className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3 lg:min-w-[20rem]">
          <StatBox
            label="Simulacro en"
            value={daysLeft}
            suffix={daysLeft === 1 ? "día" : "días"}
          />
          <StatBox label="Próximos" value={upcomingTotal} />
          <StatBox label="Tipos" value={DRILL_TYPE_HIGHLIGHTS.length} />
        </dl>
      </div>

      <div
        className={cn(
          "relative grid grid-cols-2 divide-x border-t sm:grid-cols-4",
          GLASS_DIVIDER,
        )}
      >
        {DRILL_TYPE_HIGHLIGHTS.map(
          ({ drillType, shortLabel, icon: Icon, accent }) => (
            <div
              key={drillType}
              className="flex items-center justify-center gap-2.5 px-3 py-4 transition-colors hover:bg-white/[0.03] sm:gap-3 sm:px-4 sm:py-5"
            >
              <div className="flex size-9 shrink-0 items-center justify-center border border-white/20 bg-white/10 sm:size-10">
                <Icon className={cn("size-4 sm:size-[1.125rem]", accent)} aria-hidden />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[1.1px] text-white sm:text-[11px]">
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
      <dt className="text-[9px] font-semibold uppercase tracking-[1.1px] text-white/55 sm:text-[10px]">
        {label}
      </dt>
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