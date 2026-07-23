"use client"

import Link from "next/link"
import {
  CalendarPlus,
  ClipboardList,
  ExternalLink,
  MapPin,
  Smartphone,
} from "lucide-react"

import { FamilyPlanStatusChip } from "@/components/preparation/family-plan/family-plan-layout"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { PREPARATION_CTA_LIFT_CLASS } from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"
import { cleanComunas, simulacroCountdown } from "@/lib/simulacros-format"
import { REGION_LABELS } from "@/lib/simulacros-labels"
import { getDrillTypeVisual } from "@/lib/simulacros-visual"
import {
  buildSimulacroDrillHref,
  downloadSimulacroIcs,
} from "@/lib/simulacros-to-drill"
import type { Simulacro } from "@/lib/types"

interface SimulacroListRowProps {
  simulacro: Simulacro
  variant: "upcoming" | "past"
  now: number
  embedded?: boolean
}

const SPANISH_DAYS_SHORT: readonly string[] = [
  "dom",
  "lun",
  "mar",
  "mié",
  "jue",
  "vie",
  "sáb",
]

const SPANISH_MONTHS_SHORT: readonly string[] = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
]

const ACTION_BTN =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 border px-3 text-[10px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"

function formatShortDate(iso: string): {
  day: string
  month: string
  weekday: string
} {
  const [year, month, day] = iso.split("-").map((n) => Number(n))
  if (!year || !month || !day) return { day: iso, month: "", weekday: "" }
  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime())) return { day: iso, month: "", weekday: "" }
  return {
    day: String(day).padStart(2, "0"),
    month: SPANISH_MONTHS_SHORT[month - 1] ?? "",
    weekday: (SPANISH_DAYS_SHORT[date.getUTCDay()] ?? "").toUpperCase(),
  }
}

function countdownLabel(
  countdown: ReturnType<typeof simulacroCountdown>,
  isToday: boolean,
): { primary: string; unit: string; eyebrow: string } {
  if (isToday) {
    return { primary: "Hoy", unit: "", eyebrow: "Fecha" }
  }
  if (countdown.days > 0) {
    return {
      primary: String(countdown.days),
      unit: countdown.days === 1 ? "día" : "días",
      eyebrow: "Faltan",
    }
  }
  return {
    primary: countdown.hours <= 1 ? "<1" : String(countdown.hours),
    unit: "horas",
    eyebrow: "En",
  }
}

export function SimulacroListRow({
  simulacro,
  variant,
  now,
  embedded = false,
}: SimulacroListRowProps) {
  const countdown = simulacroCountdown(simulacro.drill_date, now)
  const isUpcoming = variant === "upcoming"
  const isToday = !countdown.past && countdown.days === 0
  const visual = getDrillTypeVisual(simulacro.drill_type)
  const TypeIcon = visual.icon
  const { day, month, weekday } = formatShortDate(simulacro.drill_date)

  const regionLabel =
    simulacro.region_name ||
    (simulacro.region_code
      ? `Región de ${REGION_LABELS[simulacro.region_code] ?? simulacro.region_code}`
      : null)
  const comunas = cleanComunas(simulacro.participating_comunas)
  const hasDetailPage = simulacro.detail_url.includes("/simulacros_t/")
  const showCountdown = isUpcoming && !countdown.past
  const cd = showCountdown ? countdownLabel(countdown, isToday) : null

  return (
    <article
      className={cn(
        "group border border-l-[3px] transition-colors duration-200",
        visual.chipBorder,
        embedded
          ? "bg-white/[0.02] hover:bg-white/[0.05]"
          : cn(
              GLASS_PANEL_CLASS,
              GLASS_MICA_INTERACTIVE_CLASS,
              "hover:bg-black/55",
            ),
        isToday && "border-amber-300/45 bg-amber-300/[0.06] ring-1 ring-amber-300/15",
        !isUpcoming && "opacity-90",
      )}
    >
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-stretch sm:gap-4 sm:p-4">
        {/* Date */}
        <div
          className={cn(
            "flex w-full shrink-0 items-center gap-3 border border-white/10 bg-white/[0.03] px-3 py-2.5 sm:w-[5.5rem] sm:flex-col sm:justify-center sm:gap-0.5 sm:px-2 sm:py-3",
            isToday && "border-amber-300/35 bg-amber-300/10",
          )}
        >
          <span
            className={cn(
              "font-mono text-[9px] font-semibold uppercase tracking-[1.2px]",
              isToday ? "text-amber-100" : "text-white/55",
            )}
          >
            {isToday ? "Hoy" : weekday}
          </span>
          <div className="flex items-baseline gap-1 sm:flex-col sm:items-center sm:gap-0">
            <span
              className={cn(
                "font-mono text-[26px] font-semibold leading-none tabular-nums sm:text-[28px]",
                isToday ? "text-amber-50" : "text-white",
              )}
            >
              {day}
            </span>
            <span
              className={cn(
                "font-mono text-[10px] uppercase tracking-wider",
                isToday ? "text-amber-200/80" : "text-white/55",
              )}
            >
              {month}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 border px-2 py-1",
                visual.iconChip,
              )}
            >
              <TypeIcon className={cn("size-3.5", visual.accent)} aria-hidden />
              <span
                className={cn(
                  "text-[9.5px] font-semibold uppercase tracking-[0.8px]",
                  visual.accent,
                )}
              >
                {visual.shortLabel}
              </span>
            </span>
            {simulacro.mensaje_sae ? (
              <FamilyPlanStatusChip tone="complete">
                <Smartphone className="size-3" aria-hidden />
                SAE
              </FamilyPlanStatusChip>
            ) : null}
          </div>

          {regionLabel ? (
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.4px] leading-snug text-white sm:text-[14px]">
              {regionLabel}
            </h4>
          ) : null}

          {simulacro.title &&
          simulacro.title !== "Simulacro SENAPRED" &&
          simulacro.title !== regionLabel ? (
            <p className="line-clamp-1 text-[12px] text-white/60">{simulacro.title}</p>
          ) : null}

          {comunas.length > 0 ? (
            <p className="flex items-start gap-1.5 text-[12px] leading-snug text-white/65">
              <MapPin
                className="mt-0.5 size-3 shrink-0 text-white/40"
                aria-hidden
              />
              <span className="line-clamp-2">
                <span className="text-white/40">Comunas:</span>{" "}
                <span className="text-white/75">{comunas.join(", ")}</span>
              </span>
            </p>
          ) : null}
        </div>

        {/* Countdown / status + actions */}
        <div className="flex shrink-0 flex-col gap-2 sm:items-end sm:justify-between">
          {showCountdown && cd ? (
            <div
              className={cn(
                "flex h-8 items-center gap-1.5 border px-2.5 font-mono sm:self-end",
                isToday
                  ? "border-amber-300/40 bg-amber-300/15 text-amber-50"
                  : "border-white/10 bg-white/[0.04] text-white/90",
              )}
              aria-label={
                isToday
                  ? "Simulacro hoy"
                  : `${cd.eyebrow} ${cd.primary} ${cd.unit}`
              }
            >
              {!isToday ? (
                <span className="text-[8.5px] font-semibold uppercase tracking-[1px] text-white/50">
                  {cd.eyebrow}
                </span>
              ) : null}
              <span className="text-[13px] font-semibold tabular-nums leading-none">
                {cd.primary}
              </span>
              {cd.unit ? (
                <span className="text-[8.5px] font-semibold uppercase tracking-[0.8px] text-white/50">
                  {cd.unit}
                </span>
              ) : null}
            </div>
          ) : (
            <FamilyPlanStatusChip tone="empty" className="sm:self-end">
              Realizado
            </FamilyPlanStatusChip>
          )}

          <div className="flex flex-wrap gap-2 sm:justify-end">
            {hasDetailPage ? (
              <a
                href={simulacro.detail_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ver en SENAPRED"
                className={cn(
                  ACTION_BTN,
                  PREPARATION_CTA_LIFT_CLASS,
                  "border-white/15 bg-white/[0.04] text-white/70 hover:bg-white/[0.10] hover:text-white",
                )}
              >
                SENAPRED
                <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : null}
            {isUpcoming ? (
              <button
                type="button"
                onClick={() => downloadSimulacroIcs(simulacro)}
                aria-label="Descargar archivo .ics para agendar"
                className={cn(
                  ACTION_BTN,
                  PREPARATION_CTA_LIFT_CLASS,
                  "border-white/20 bg-white/[0.08] text-white/90 hover:bg-white/[0.14]",
                )}
              >
                <CalendarPlus className="size-3" aria-hidden />
                Agendar
              </button>
            ) : null}
            <Link
              href={buildSimulacroDrillHref(simulacro)}
              className={cn(
                ACTION_BTN,
                PREPARATION_CTA_LIFT_CLASS,
                "border-emerald-500/35 bg-emerald-500/10 text-emerald-50 hover:bg-emerald-500/20",
              )}
            >
              <ClipboardList className="size-3" aria-hidden />
              Agregar al plan
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
