"use client"

import Link from "next/link"
import {
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  MapPin,
  Smartphone,
} from "lucide-react"

import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
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

const _SPANISH_DAYS_SHORT: readonly string[] = [
  "dom",
  "lun",
  "mar",
  "mié",
  "jue",
  "vie",
  "sáb",
]

const _SPANISH_MONTHS_SHORT: readonly string[] = [
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

const _ACTION_BTN =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 border px-3 text-[10px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"

function formatShortDate(iso: string): { day: string; month: string; weekday: string } {
  const [year, month, day] = iso.split("-").map((n) => Number(n))
  if (!year || !month || !day) return { day: iso, month: "", weekday: "" }
  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime())) return { day: iso, month: "", weekday: "" }
  const weekday = _SPANISH_DAYS_SHORT[date.getUTCDay()] ?? ""
  const m = _SPANISH_MONTHS_SHORT[month - 1] ?? ""
  return {
    day: String(day).padStart(2, "0"),
    month: m,
    weekday: (weekday ?? "").toUpperCase(),
  }
}

function DateCell({
  day,
  month,
  weekday,
  isToday,
  chipBorder,
}: {
  day: string
  month: string
  weekday: string
  isToday: boolean
  chipBorder: string
}) {
  return (
    <div
      className={cn(
        "flex w-[7rem] shrink-0 flex-col items-center justify-center border px-3 py-3 sm:w-[7.5rem] sm:py-3.5",
        isToday
          ? "border-amber-300/40 bg-amber-300/15"
          : "border-white/10 bg-white/[0.04]",
        "border-l-[3px]",
        !isToday && chipBorder,
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
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "font-mono text-[26px] font-semibold leading-none tabular-nums sm:text-3xl",
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
  )
}

function TypeCell({
  drillType,
  layout = "stack",
}: {
  drillType: Simulacro["drill_type"]
  layout?: "stack" | "inline"
}) {
  const visual = getDrillTypeVisual(drillType)
  const Icon = visual.icon

  if (layout === "inline") {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center border bg-black/40",
            visual.iconChip,
          )}
        >
          <Icon className={cn("size-3.5", visual.accent)} aria-hidden />
        </div>
        <span
          className={cn(
            "truncate text-[9.5px] font-semibold uppercase tracking-[0.6px]",
            visual.accent,
          )}
        >
          {visual.shortLabel}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex w-[6.5rem] shrink-0 flex-col items-center justify-center gap-1.5 border border-white/10 bg-black/35 px-2 py-3",
        visual.chipBorder,
      )}
    >
      <div
        className={cn(
          "flex size-8 items-center justify-center border bg-black/40",
          visual.iconChip,
        )}
      >
        <Icon className={cn("size-4", visual.accent)} aria-hidden />
      </div>
      <span
        className={cn(
          "max-w-full text-center text-[9px] font-semibold uppercase leading-tight tracking-[0.6px]",
          visual.accent,
        )}
      >
        {visual.shortLabel}
      </span>
    </div>
  )
}

function CountdownCell({
  isUpcoming,
  countdown,
  isToday,
}: {
  isUpcoming: boolean
  countdown: ReturnType<typeof simulacroCountdown>
  isToday: boolean
}) {
  if (!isUpcoming || countdown.past) {
    return (
      <div className="flex h-full w-[4.75rem] shrink-0 flex-col items-center justify-center border border-white/10 bg-white/[0.02] px-2 py-2.5">
        <span className="inline-flex h-6 items-center font-mono text-[9px] font-semibold uppercase tracking-[1px] text-white/40">
          Realizado
        </span>
      </div>
    )
  }

  const showDays = countdown.days > 0
  const primary = showDays
    ? String(countdown.days)
    : countdown.hours <= 1
      ? "<1"
      : String(countdown.hours)
  const unit = showDays ? (countdown.days === 1 ? "día" : "días") : "horas"
  const label = isToday ? "Hoy" : showDays ? "Faltan" : "En"

  return (
    <div
      className={cn(
        "flex w-[4.75rem] shrink-0 flex-col items-center justify-center border px-2 py-2.5",
        isToday
          ? "border-amber-300/40 bg-amber-300/10"
          : "border-white/10 bg-white/[0.04]",
      )}
    >
      <span
        className={cn(
          "font-mono text-[8.5px] font-semibold uppercase tracking-[1px]",
          isToday ? "text-amber-200/80" : "text-white/55",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-xl font-semibold tabular-nums leading-none",
          isToday ? "text-amber-50" : "text-white/90",
        )}
      >
        {primary}
      </span>
      <span
        className={cn(
          "font-mono text-[8.5px] font-semibold uppercase tracking-[0.8px]",
          isToday ? "text-amber-200/70" : "text-white/45",
        )}
      >
        {unit}
      </span>
    </div>
  )
}

function StatusBadge({
  isToday,
  isUpcoming,
  countdown,
}: {
  isToday: boolean
  isUpcoming: boolean
  countdown: ReturnType<typeof simulacroCountdown>
}) {
  if (isToday) {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 border border-amber-300/50 bg-amber-300/20 px-2.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-amber-50">
        <CheckCircle2 className="size-3" aria-hidden />
        Hoy
      </span>
    )
  }
  if (!isUpcoming || countdown.past) {
    return (
      <span className="inline-flex h-7 items-center border border-white/15 bg-white/[0.04] px-2.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/55">
        Pasado
      </span>
    )
  }
  return null
}

function RegionContent({
  regionLabel,
  comunas,
  mensajeSae,
  isToday,
}: {
  regionLabel: string | null
  comunas: string[]
  mensajeSae: boolean
  isToday: boolean
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        {regionLabel ? (
          <h4 className="min-w-0 text-[14px] font-semibold uppercase tracking-[0.4px] leading-snug text-white">
            {regionLabel}
          </h4>
        ) : null}
        {mensajeSae ? (
          <span className="inline-flex h-7 shrink-0 items-center gap-1.5 border border-emerald-300/40 bg-emerald-500/15 px-2.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-emerald-100">
            <Smartphone className="size-3" aria-hidden />
            SAE
          </span>
        ) : null}
        {isToday ? (
          <span className="inline-flex h-7 shrink-0 items-center border border-amber-300/50 bg-amber-300/25 px-2.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-amber-50">
            Hoy
          </span>
        ) : null}
      </div>
      {comunas.length > 0 ? (
        <p className="flex items-start gap-1.5 text-[12px] leading-snug text-white/70">
          <MapPin
            className="mt-0.5 size-3 shrink-0 text-white/45"
            aria-hidden
          />
          <span>
            <span className="text-white/45">Comunas:</span>{" "}
            <span className="text-white/80">{comunas.join(", ")}</span>
          </span>
        </p>
      ) : null}
    </div>
  )
}

function ActionButtons({
  hasDetailPage,
  detailUrl,
  isUpcoming,
  simulacro,
  layout = "row",
}: {
  hasDetailPage: boolean
  detailUrl: string
  isUpcoming: boolean
  simulacro: Simulacro
  layout?: "row" | "col"
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 gap-2",
        layout === "col" ? "flex-col items-stretch" : "flex-row items-center",
      )}
    >
      {hasDetailPage ? (
        <a
          href={detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ver en SENAPRED"
          className={cn(
            _ACTION_BTN,
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
            _ACTION_BTN,
            "border-white/20 bg-white/[0.08] text-white/90 hover:bg-white/[0.14]",
          )}
        >
          <CalendarPlus className="size-3" aria-hidden />
          Agendar
        </button>
      ) : (
        <Link
          href={buildSimulacroDrillHref(simulacro)}
          className={cn(
            _ACTION_BTN,
            "border-white/20 bg-white/[0.08] text-white/90 hover:bg-white/[0.14]",
          )}
        >
          <ClipboardList className="size-3" aria-hidden />
          Agregar al plan
        </Link>
      )}
    </div>
  )
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
  const { day, month, weekday } = formatShortDate(simulacro.drill_date)

  const regionLabel =
    simulacro.region_name ||
    (simulacro.region_code
      ? `Región de ${REGION_LABELS[simulacro.region_code] ?? simulacro.region_code}`
      : null)
  const cleanComunasList = cleanComunas(simulacro.participating_comunas)

  const hasDetailPage = simulacro.detail_url.includes("/simulacros_t/")

  return (
    <article
      className={cn(
        embedded
          ? "group border border-white/10 bg-white/[0.02] transition-colors duration-200 hover:bg-white/[0.05]"
          : cn(
              GLASS_PANEL_CLASS,
              GLASS_MICA_INTERACTIVE_CLASS,
              "group transition-all duration-200 hover:bg-black/55",
            ),
        isToday && "border-amber-300/40 ring-1 ring-amber-300/15",
        !isUpcoming && "opacity-85",
      )}
    >
      {/* Mobile */}
      <div className="flex flex-col gap-3 p-3 sm:hidden">
        <div className="flex items-stretch gap-2.5">
          <DateCell
            day={day}
            month={month}
            weekday={weekday}
            isToday={isToday}
            chipBorder={visual.chipBorder}
          />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 border border-white/8 bg-white/[0.02] px-3 py-2.5">
            <TypeCell drillType={simulacro.drill_type} layout="inline" />
            <RegionContent
              regionLabel={regionLabel}
              comunas={cleanComunasList}
              mensajeSae={simulacro.mensaje_sae}
              isToday={isToday}
            />
          </div>
          <CountdownCell
            isUpcoming={isUpcoming}
            countdown={countdown}
            isToday={isToday}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge
            isToday={isToday}
            isUpcoming={isUpcoming}
            countdown={countdown}
          />
          <ActionButtons
            hasDetailPage={hasDetailPage}
            detailUrl={simulacro.detail_url}
            isUpcoming={isUpcoming}
            simulacro={simulacro}
          />
        </div>
      </div>

      {/* Desktop — meta | divider | content | actions */}
      <div className="hidden items-stretch gap-5 px-4 py-4 sm:flex lg:gap-6 lg:px-5 lg:py-5">
        <div className="flex shrink-0 items-stretch gap-3">
          <DateCell
            day={day}
            month={month}
            weekday={weekday}
            isToday={isToday}
            chipBorder={visual.chipBorder}
          />
          <TypeCell drillType={simulacro.drill_type} />
          <CountdownCell
            isUpcoming={isUpcoming}
            countdown={countdown}
            isToday={isToday}
          />
        </div>

        <div
          className="w-px shrink-0 self-stretch bg-gradient-to-b from-transparent via-white/15 to-transparent"
          aria-hidden
        />

        <RegionContent
          regionLabel={regionLabel}
          comunas={cleanComunasList}
          mensajeSae={simulacro.mensaje_sae}
          isToday={isToday}
        />

        <div
          className="w-px shrink-0 self-stretch bg-gradient-to-b from-transparent via-white/10 to-transparent"
          aria-hidden
        />

        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge
            isToday={isToday}
            isUpcoming={isUpcoming}
            countdown={countdown}
          />
          <ActionButtons
            hasDetailPage={hasDetailPage}
            detailUrl={simulacro.detail_url}
            isUpcoming={isUpcoming}
            simulacro={simulacro}
            layout="col"
          />
        </div>
      </div>
    </article>
  )
}
