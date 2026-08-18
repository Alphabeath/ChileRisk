"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useMemo, type CSSProperties } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useActiveAlerts } from "@/hooks/use-active-alerts"
import { useNextSimulacro } from "@/hooks/use-simulacros"
import {
  ALERT_LEVEL_META,
  ALERT_SOURCE_META,
  alertLevelUsesDarkInk,
  getActiveAlertMainText,
  sortActiveAlertsBySeverity,
} from "@/lib/alerts-display"
import { INICIO_PULSE_HEADING } from "@/lib/inicio-content"
import {
  DRILL_TYPE_COLORS,
  DRILL_TYPE_LABELS,
  formatSimulacroDate,
  hasSimulacroDetailPage,
} from "@/lib/simulacros"
import type { ActiveAlert, AlertSource, Simulacro } from "@/lib/types"
import { cn } from "@/lib/utils"

const INNER_WRAPPER_CLASS = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"

const FOCUS_RING_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"

const EMPTY_ALERT_FIELD = "#3a3f4a"

export function InicioNationalPulse() {
  const alertsQuery = useActiveAlerts()
  const nextQuery = useNextSimulacro()
  const alertRows = alertsQuery.data

  const ranked = useMemo(
    () => sortActiveAlertsBySeverity(alertRows ?? []),
    [alertRows],
  )
  const topAlert = ranked[0]
  const sources = useMemo(
    () => uniqueAlertSources(alertRows ?? []),
    [alertRows],
  )

  const showNext =
    nextQuery.isPending || nextQuery.isError || Boolean(nextQuery.data)

  return (
    <section
      aria-labelledby="inicio-pulse-title"
      className="border-b border-border bg-muted/40 py-14 sm:py-16 dark:bg-muted/20"
    >
      <div className={INNER_WRAPPER_CLASS}>
        <h2
          id="inicio-pulse-title"
          className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
        >
          {INICIO_PULSE_HEADING}
        </h2>
        <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
          Recuento observado de las fuentes del monitor. No reemplaza el mapa.
        </p>

        <div
          className={cn(
            "mt-10 grid items-stretch gap-px bg-border",
            showNext && "md:grid-cols-2",
          )}
        >
          <AlertsPulseCell
            isPending={alertsQuery.isPending}
            isError={alertsQuery.isError}
            onRetry={() => void alertsQuery.refetch()}
            count={alertRows?.length ?? 0}
            topAlert={topAlert}
            sources={sources}
          />
          {showNext ? (
            <NextSimulacroPulseCell
              isPending={nextQuery.isPending}
              isError={nextQuery.isError}
              onRetry={() => void nextQuery.refetch()}
              item={nextQuery.data ?? null}
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}

function AlertsPulseCell({
  isPending,
  isError,
  onRetry,
  count,
  topAlert,
  sources,
}: {
  isPending: boolean
  isError: boolean
  onRetry: () => void
  count: number
  topAlert: ActiveAlert | undefined
  sources: AlertSource[]
}) {
  if (isPending) {
    return <PulseSkeleton label="Alertas" />
  }

  if (isError) {
    return (
      <PulseError
        label="Alertas"
        message="No se pudieron cargar las alertas activas."
        onRetry={onRetry}
      />
    )
  }

  if (count === 0 || !topAlert) {
    return (
      <PulseField
        fill={EMPTY_ALERT_FIELD}
        ink="#ffffff"
        label="Alertas"
        figure="0"
        figureMeta="activas"
        kicker="Sin dato"
        detail="Sin alertas activas en las fuentes consultadas."
      />
    )
  }

  const countLabel = count === 1 ? "activa" : "activas"
  const level = ALERT_LEVEL_META[topAlert.level]
  const headline = getActiveAlertMainText(topAlert)
  const sourceLine =
    sources.length > 0
      ? sources.map((source) => ALERT_SOURCE_META[source].label).join(" · ")
      : null
  const darkInk = alertLevelUsesDarkInk(topAlert.level)

  return (
    <PulseField
      href="/monitor"
      fill={level.hex}
      ink={darkInk ? "#171717" : "#ffffff"}
      label="Alertas"
      figure={String(count)}
      figureMeta={countLabel}
      kicker={sourceLine ? `${level.label} · ${sourceLine}` : level.label}
      detail={headline}
    />
  )
}

function NextSimulacroPulseCell({
  isPending,
  isError,
  onRetry,
  item,
}: {
  isPending: boolean
  isError: boolean
  onRetry: () => void
  item: Simulacro | null
}) {
  if (isPending) {
    return <PulseSkeleton label="Próximo ejercicio" />
  }

  if (isError) {
    return (
      <PulseError
        label="Próximo ejercicio"
        message="No se pudo cargar el próximo simulacro."
        onRetry={onRetry}
      />
    )
  }

  if (!item) return null

  const date = formatSimulacroDate(item.drill_date)
  const colors = DRILL_TYPE_COLORS[item.drill_type]
  const href = hasSimulacroDetailPage(item.detail_url)
    ? `/simulacros/${item.slug}`
    : "/simulacros"

  return (
    <PulseField
      href={href}
      fill={colors.accent}
      ink={colors.ink}
      label="Próximo ejercicio"
      figure={date.day}
      figureMeta={`${date.weekday} · ${date.month} ${date.year}`}
      kicker={`${DRILL_TYPE_LABELS[item.drill_type]} · SENAPRED`}
      detail={item.title}
    />
  )
}

function PulseField({
  href,
  fill,
  ink,
  label,
  figure,
  figureMeta,
  kicker,
  detail,
}: {
  href?: string
  fill: string
  ink: string
  label: string
  figure: string
  figureMeta: string
  kicker: string
  detail: string
}) {
  const style = {
    "--pulse-fill": fill,
    "--pulse-ink": ink,
  } as CSSProperties
  const className = cn(
    "flex h-full min-h-72 min-w-0 flex-col overflow-hidden bg-[var(--pulse-fill)] text-[var(--pulse-ink)]",
    href &&
      `group transition-opacity duration-150 hover:opacity-95 ${FOCUS_RING_CLASS}`,
  )

  const body = (
    <>
      <span className="flex shrink-0 items-center justify-between gap-4 border-b border-current/20 px-6 py-4 sm:px-7">
        <PulseLabel invert>{label}</PulseLabel>
        {href ? (
          <ChevronRight
            className="size-4 shrink-0 opacity-80 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden
          />
        ) : null}
      </span>
      <span className="flex min-h-0 flex-1 flex-col justify-center px-6 py-6 sm:px-7 sm:py-7">
        <span className="font-mono text-7xl leading-none font-bold tracking-tight tabular-nums">
          {figure}
        </span>
        <span className="mt-3 font-mono text-[11px] tracking-[1.4px] uppercase opacity-80">
          {figureMeta}
        </span>
      </span>
      <span className="flex h-28 shrink-0 flex-col justify-center border-t border-current/20 bg-black/10 px-6 py-4 sm:h-32 sm:px-7">
        <span className="block truncate font-mono text-[10px] font-semibold tracking-[1.2px] uppercase opacity-80">
          {kicker}
        </span>
        <span className="mt-2 line-clamp-2 text-lg font-extrabold tracking-tight text-balance sm:text-xl">
          {detail}
        </span>
      </span>
    </>
  )

  if (href) {
    return (
      <Link href={href} style={style} className={className}>
        {body}
      </Link>
    )
  }

  return (
    <article style={style} className={className}>
      {body}
    </article>
  )
}

function PulseLabel({
  children,
  invert = false,
}: {
  children: string
  invert?: boolean
}) {
  return (
    <p
      className={cn(
        "text-[10px] font-semibold tracking-[1.2px] uppercase",
        invert ? "text-current opacity-80" : "text-foreground",
      )}
    >
      {children}
    </p>
  )
}

function PulseSkeleton({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-56 flex-col justify-between bg-background p-6 sm:p-7">
      <PulseLabel>{label}</PulseLabel>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-28" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
    </div>
  )
}

function PulseError({
  label,
  message,
  onRetry,
}: {
  label: string
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex h-full min-h-56 flex-col justify-between gap-6 bg-background p-6 sm:p-7">
      <div>
        <PulseLabel>{label}</PulseLabel>
        <p className="mt-6 font-mono text-[11px] tracking-[1.4px] text-muted-foreground uppercase">
          Sin dato
        </p>
        <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      </div>
      <Button variant="outline" size="sm" className="w-fit" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}

function uniqueAlertSources(alerts: readonly ActiveAlert[]): AlertSource[] {
  const seen = new Set<AlertSource>()
  const ordered: AlertSource[] = []
  for (const alert of alerts) {
    if (seen.has(alert.source)) continue
    seen.add(alert.source)
    ordered.push(alert.source)
  }
  return ordered
}
