"use client"

import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { usePlanStats } from "@/lib/use-plan-stats"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface PreparationPageHeroProps {
  planSteps: number
  guides: number
  hazardTypes: number
}

export function PreparationPageHero({
  planSteps,
  guides,
  hazardTypes,
}: PreparationPageHeroProps) {
  const { pendingCount, isLoading } = usePlanStats()

  return (
    <header
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "relative w-full overflow-hidden",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--primary-chile)]/55 via-emerald-950/70 to-[var(--secondary-chile)]/45"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(0,50,160,0.25),transparent_45%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
        aria-hidden
      />
      <ChileWatermark />

      <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1">
          <span className="inline-flex w-fit items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[1.2px] text-emerald-200/90">
            Metodología SENAPRED
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Preparación
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base">
            Construye tu Plan Familia Preparada paso a paso y complementa con guías
            por tipo de emergencia para anticiparte ante desastres en Chile.
          </p>
        </div>

        <dl className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3 lg:min-w-[22rem] lg:grid-cols-4">
          <StatBox
            label="Pasos pendientes"
            value={isLoading ? "—" : pendingCount}
            accent="emerald"
          />
          <StatBox label="Pasos del plan" value={planSteps} />
          <StatBox label="Guías" value={guides} />
          <StatBox label="Amenazas" value={hazardTypes} />
        </dl>
      </div>
    </header>
  )
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string
  value: ReactNode
  accent?: "emerald"
}) {
  return (
    <div
      className={cn(
        "border border-white/20 bg-black/35 px-3 py-3 text-center backdrop-blur-sm sm:px-4 sm:py-4 transition-colors hover:bg-black/50 hover:border-white/25",
        accent === "emerald" && "border-emerald-500/30 bg-emerald-950/30",
      )}
    >
      <dt className="text-[9px] font-semibold uppercase tracking-[1.1px] text-white/55 sm:text-[10px]">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-mono text-2xl font-semibold tabular-nums text-white sm:text-3xl transition-colors",
          accent === "emerald" && "text-emerald-200",
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function ChileWatermark() {
  return (
    <svg
      className="pointer-events-none absolute -right-8 top-1/2 hidden size-72 -translate-y-1/2 text-white/[0.05] sm:block lg:size-96"
      viewBox="0 0 200 480"
      fill="currentColor"
      aria-hidden
    >
      <path d="M70 8 L88 14 L100 22 L108 36 L112 52 L108 64 L96 72 L92 84 L98 96 L106 108 L110 124 L108 140 L100 154 L92 168 L96 184 L106 196 L116 210 L122 228 L120 246 L114 262 L120 278 L132 290 L142 304 L146 320 L142 336 L132 348 L120 356 L112 368 L108 384 L100 400 L86 412 L72 420 L58 424 L46 418 L40 404 L42 388 L48 372 L42 358 L30 348 L20 334 L14 318 L12 300 L18 282 L28 268 L32 252 L26 236 L18 220 L14 202 L18 184 L28 170 L34 154 L30 138 L24 122 L26 104 L34 88 L46 76 L56 64 L62 48 L62 32 L66 18 Z" />
    </svg>
  )
}
