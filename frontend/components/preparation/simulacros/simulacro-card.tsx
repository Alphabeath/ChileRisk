"use client"

import Link from "next/link"
import { ExternalLink, Megaphone, Plus, Smartphone } from "lucide-react"

import {
  GLASS_DIVIDER,
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"
import { formatDrillDate, simulacroCountdown } from "@/lib/simulacros-format"
import {
  REGION_LABELS,
  SIMULACRO_TYPE_LABELS,
} from "@/lib/simulacros-labels"
import { getDrillTypeVisual } from "@/lib/simulacros-visual"
import { buildSimulacroDrillHref } from "@/lib/simulacros-to-drill"
import type { Simulacro } from "@/lib/types"

interface SimulacroCardProps {
  simulacro: Simulacro
  variant: "upcoming" | "past"
  now: number
}

export function SimulacroCard({ simulacro, variant, now }: SimulacroCardProps) {
  const countdown = simulacroCountdown(simulacro.drill_date, now)
  const isUpcoming = variant === "upcoming"
  const isToday = !countdown.past && countdown.days === 0
  const visual = getDrillTypeVisual(simulacro.drill_type)
  const TypeIcon = visual.icon

  const regionLabel =
    simulacro.region_name ||
    (simulacro.region_code
      ? `Región de ${REGION_LABELS[simulacro.region_code] ?? simulacro.region_code}`
      : null)

  const hasDetailPage = simulacro.detail_url.includes("/simulacros_t/")

  return (
    <article
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-[2px] hover:bg-black/60",
        !isUpcoming && "opacity-80",
      )}
    >
      <div
        className={cn(
          "relative flex items-start gap-3 border-b px-4 py-3",
          GLASS_DIVIDER,
          "bg-gradient-to-br",
          isToday ? "from-amber-600/70 via-rose-800/50 to-red-900/50" : visual.color,
        )}
      >
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center border bg-black/40 backdrop-blur-sm",
            visual.iconChip,
          )}
        >
          <TypeIcon className={cn("size-5", visual.accent)} aria-hidden />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[1.0px]",
                visual.iconChip,
                visual.accent,
              )}
            >
              <Megaphone className="size-2.5" aria-hidden />
              {SIMULACRO_TYPE_LABELS[simulacro.drill_type]}
            </span>
            {simulacro.mensaje_sae ? (
              <span className="inline-flex items-center gap-1 border border-emerald-300/40 bg-emerald-500/20 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[1.0px] text-emerald-100">
                <Smartphone className="size-2.5" aria-hidden />
                Mensaje SAE
              </span>
            ) : null}
            {isToday ? (
              <span className="inline-flex items-center gap-1 border border-amber-300/60 bg-amber-300/30 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[1.0px] text-amber-50">
                HOY
              </span>
            ) : null}
            {!isUpcoming ? (
              <span className="inline-flex items-center gap-1 border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[1.0px] text-white/55">
                Pasado
              </span>
            ) : null}
          </div>
          <h3 className="text-[13.5px] font-semibold uppercase tracking-[0.6px] leading-snug text-white">
            {simulacro.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-3">
        <div className="flex flex-col gap-1 text-[12px] text-white/80">
          <p className="font-mono text-[11px] uppercase tracking-wider text-white/55">
            {formatDrillDate(simulacro.drill_date)}
          </p>
          {regionLabel ? (
            <p className="text-white/70">
              <span className="text-white/45">Región:</span> {regionLabel}
            </p>
          ) : null}
          {simulacro.participating_comunas.length > 0 ? (
            <p className="text-[11.5px] leading-snug text-white/65">
              <span className="text-white/45">Comunas:</span>{" "}
              {simulacro.participating_comunas.join(", ")}
            </p>
          ) : null}
        </div>

        {simulacro.summary ? (
          <p className="line-clamp-3 text-[12px] leading-snug text-white/60">
            {simulacro.summary}
          </p>
        ) : null}

        <div className={cn("mt-auto flex flex-col gap-2 border-t pt-3", GLASS_DIVIDER)}>
          {isUpcoming && !countdown.past ? (
            <p className="font-mono text-[11px] uppercase tracking-wider text-amber-200/85">
              {countdown.days === 0
                ? countdown.hours <= 1
                  ? "Comienza en menos de 1 hora"
                  : `En ${countdown.hours} h`
                : `En ${countdown.days} d`}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {hasDetailPage ? (
              <a
                href={simulacro.detail_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/80 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
              >
                Ver en SENAPRED
                <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : null}
            {isUpcoming ? (
              <Link
                href={buildSimulacroDrillHref(simulacro)}
                className="inline-flex shrink-0 items-center gap-1.5 border border-white/20 bg-white/[0.08] px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/90 transition-colors hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
              >
                <Plus className="size-3" aria-hidden />
                Agregar a mi plan
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
