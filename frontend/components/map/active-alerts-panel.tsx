"use client"

import { useMemo } from "react"
import { CheckCircle2, ChevronDown } from "lucide-react"

import { ActiveAlertCard, AirQualityAlertCard } from "@/components/map/alert-ui"
import { useMonitorLiveData } from "@/components/map/monitor-live-data"
import { Skeleton } from "@/components/ui/skeleton"
import type { ActiveAlert, AirQualityZone, AlertFilter } from "@/lib/alert-types"
import { sortActiveAlertsBySeverity, filterActiveAlertsBySource } from "@/lib/alerts-display"
import {
  MAP_PANEL_TITLE_CLASS,
  mapPanelWidthClass,
} from "@/lib/citizen-layout"
import { SURFACE_PANEL_SHELL_CLASS } from "@/lib/surface"
import { useMapDesktopCompact } from "@/lib/use-map-desktop-compact"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

type PanelItem =
  | { kind: "alert"; alert: ActiveAlert }
  | { kind: "air"; zone: AirQualityZone }

const FILTER_OPTIONS: { value: AlertFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "chilerisk", label: "Chile Risk" },
  { value: "senapred", label: "Senapred" },
  { value: "sernageomin", label: "Volcán" },
  { value: "meteochile", label: "Meteo" },
  { value: "airechile", label: "Aire" },
]

const AIR_SORT_PRIORITY: Record<string, number> = {
  emergencia: 0,
  preemergencia: 1,
  alerta: 2,
  regular: 3,
  bueno: 4,
}

const ALERT_LEVEL_PRIORITY: Record<string, number> = {
  roja: 0,
  naranja: 1,
  amarilla: 2,
  preventiva: 3,
  informativa: 4,
}

function itemSortKey(item: PanelItem): number {
  if (item.kind === "air") {
    return AIR_SORT_PRIORITY[item.zone.level] ?? 9
  }
  return ALERT_LEVEL_PRIORITY[item.alert.level] ?? 9
}

function sortPanelItems(items: PanelItem[]): PanelItem[] {
  return [...items].sort((a, b) => {
    const d = itemSortKey(a) - itemSortKey(b)
    if (d !== 0) return d
    if (a.kind === "air" && b.kind === "air") {
      return a.zone.zone_name.localeCompare(b.zone.zone_name, "es")
    }
    if (a.kind === "alert" && b.kind === "alert") {
      return (
        new Date(b.alert.issued_at).getTime() -
        new Date(a.alert.issued_at).getTime()
      )
    }
    return a.kind === "air" ? 1 : -1
  })
}

function EmptyState({ filter }: { filter: AlertFilter }) {
  const { title, hint } =
    filter === "chilerisk"
      ? {
          title: "Sin alertas ChileRisk",
          hint: "El motor de riesgo no reporta emergencias",
        }
      : filter === "senapred"
        ? {
            title: "Sin alertas SENAPRED",
            hint: "No hay alertas ni eventos publicados",
          }
        : filter === "sernageomin"
          ? {
              title: "Sin alertas SERNAGEOMIN",
              hint: "No hay volcanes con alerta elevada vigente",
            }
          : filter === "meteochile"
            ? {
                title: "Sin avisos MeteoChile",
                hint: "DMC sin Avisos, Alertas ni Alarmas vigentes",
              }
            : filter === "airechile"
              ? {
                  title: "Sin datos Aire Chile",
                  hint: "Cobertura parcial (zonas PPDA). Sin snapshot para este día",
                }
              : {
                  title: "Sin alertas activas",
                  hint: "SENAPRED, ChileRisk, SERNAGEOMIN, MeteoChile y Aire Chile sin novedades",
                }
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-3.5 py-8 text-center">
      <CheckCircle2 className="size-5 text-muted-foreground" />
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[1.2px] text-foreground">
        {title}
      </div>
      <div className="text-[10px] leading-snug text-muted-foreground">{hint}</div>
    </div>
  )
}

function useAlertsPanelModel() {
  const filter = useUIStore((s) => s.alertsFilter)
  const setFilter = useUIStore((s) => s.setAlertsFilter)

  const { alerts, air, isPending } = useMonitorLiveData()
  const zones = useMemo(() => air?.items ?? [], [air?.items])
  /** Pending first paint for this `?date=` — never show EmptyState while fetching. */
  const isLoading = isPending
  const sortedAlerts = useMemo(
    () => sortActiveAlertsBySeverity(alerts),
    [alerts],
  )

  const allItems = useMemo(() => {
    const items: PanelItem[] = [
      ...sortedAlerts.map((alert): PanelItem => ({ kind: "alert", alert })),
      ...zones.map((zone): PanelItem => ({ kind: "air", zone })),
    ]
    return sortPanelItems(items)
  }, [sortedAlerts, zones])

  const senapredCount = sortedAlerts.filter((a) => a.source === "senapred").length
  const chileriskCount = sortedAlerts.filter(
    (a) => a.source === "chilerisk",
  ).length
  const sernageominCount = sortedAlerts.filter(
    (a) => a.source === "sernageomin",
  ).length
  const meteochileCount = sortedAlerts.filter(
    (a) => a.source === "meteochile",
  ).length
  const airechileCount = zones.length

  const counts: Record<AlertFilter, number> = {
    all: allItems.length,
    chilerisk: chileriskCount,
    senapred: senapredCount,
    sernageomin: sernageominCount,
    meteochile: meteochileCount,
    airechile: airechileCount,
  }

  const filtered = useMemo(() => {
    if (filter === "airechile") {
      return allItems.filter((i) => i.kind === "air")
    }
    if (filter === "all") return allItems
    const bySource = new Set(
      filterActiveAlertsBySource(sortedAlerts, filter).map((a) => a.id),
    )
    return allItems.filter(
      (i) => i.kind === "alert" && bySource.has(i.alert.id),
    )
  }, [allItems, filter, sortedAlerts])

  const displayCount =
    filter === "all"
      ? allItems.length
      : filter === "airechile"
        ? airechileCount
        : filter === "chilerisk"
          ? chileriskCount
          : filter === "sernageomin"
            ? sernageominCount
            : filter === "meteochile"
              ? meteochileCount
              : senapredCount

  return {
    filter,
    setFilter,
    filtered,
    counts,
    displayCount,
    hasItems: allItems.length > 0,
    isLoading,
  }
}

function AlertsFilterChips({
  filter,
  setFilter,
  counts,
}: {
  filter: AlertFilter
  setFilter: (v: AlertFilter) => void
  counts: Record<AlertFilter, number>
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Filtrar alertas por fuente"
      className="grid grid-cols-3 gap-1 px-2.5 py-1.5"
    >
      {FILTER_OPTIONS.map((opt) => {
        const active = filter === opt.value
        const count = counts[opt.value]
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setFilter(opt.value)}
            className={cn(
              "inline-flex min-w-0 items-center justify-between gap-1 border px-1.5 py-1.5 font-mono text-[8px] font-semibold uppercase tracking-[1.1px] transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring/30",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="truncate">{opt.label}</span>
            <span
              className={cn(
                "shrink-0 tabular-nums",
                active
                  ? count > 0
                    ? "text-primary-foreground"
                    : "text-primary-foreground/70"
                  : "text-muted-foreground",
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function AlertsListSkeleton() {
  return (
    <div
      className="flex flex-col gap-1.5 bg-background"
      aria-busy
      aria-label="Cargando alertas"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-2 bg-background px-3.5 py-3">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-14" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="mt-1 h-2.5 w-20" />
        </div>
      ))}
    </div>
  )
}

function AlertsListBody({
  open,
  className,
  filtered,
  filter,
  isLoading,
}: {
  open: boolean
  className?: string
  filtered: PanelItem[]
  filter: AlertFilter
  isLoading: boolean
}) {
  return (
    <div
      id="active-alerts-list"
      className={cn(
        "flex min-h-0 flex-col gap-1.5 overflow-y-auto bg-background",
        className,
        !open && "hidden",
      )}
      role="region"
      aria-live="polite"
    >
      {isLoading ? (
        <AlertsListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="bg-background">
          <EmptyState filter={filter} />
        </div>
      ) : (
        filtered.map((item) =>
          item.kind === "air" ? (
            <AirQualityAlertCard
              key={`air-${item.zone.zone_slug}`}
              zone={item.zone}
            />
          ) : (
            <ActiveAlertCard
              key={`${item.alert.source}-${item.alert.id}`}
              alert={item.alert}
              showRegion
            />
          ),
        )
      )}
    </div>
  )
}

function ActiveAlertsPanelEmbedded() {
  const model = useAlertsPanelModel()

  return (
    <aside
      className="flex min-h-0 w-full flex-col"
      aria-label="Alertas activas SENAPRED, ChileRisk y Aire Chile"
    >
      <div className="shrink-0 border-b border-border">
        <AlertsFilterChips
          filter={model.filter}
          setFilter={model.setFilter}
          counts={model.counts}
        />
      </div>
      <AlertsListBody
        open
        className="max-h-[min(60dvh,480px)]"
        filtered={model.filtered}
        filter={model.filter}
        isLoading={model.isLoading}
      />
    </aside>
  )
}

function ActiveAlertsPanelOverlay() {
  const open = useUIStore((s) => s.alertsExpanded)
  const setOpen = useUIStore((s) => s.setAlertsExpanded)
  const compact = useMapDesktopCompact()
  const model = useAlertsPanelModel()
  const rail = compact === true && !open

  return (
    <aside
      className={cn(
        SURFACE_PANEL_SHELL_CLASS,
        "flex max-h-[min(520px,calc(100dvh-5.5rem))] flex-col overflow-hidden transition-[width] duration-200 ease-out",
        mapPanelWidthClass(open || compact === false),
      )}
      aria-label="Alertas activas SENAPRED, ChileRisk y Aire Chile"
    >
      {/* Chrome — match territory detail mono header */}
      <div
        className={cn(
          "relative z-10 flex w-full shrink-0 items-center border-b border-border",
          rail ? "justify-center px-2 py-1" : "justify-between gap-2 px-2.5 py-1",
        )}
      >
        {rail ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="active-alerts-list"
            aria-label="Expandir alertas"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"
          >
            <span className={MAP_PANEL_TITLE_CLASS}>Alertas</span>
            <span
              className={cn(
                "inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-bold tabular-nums",
                model.hasItems
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {model.displayCount}
            </span>
            <ChevronDown
              className="size-3.5 -rotate-90 transition-transform duration-200"
              aria-hidden
            />
          </button>
        ) : (
          <>
            <p className={cn("min-w-0 truncate", MAP_PANEL_TITLE_CLASS)}>
              Alertas
            </p>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="active-alerts-list"
              aria-label={open ? "Colapsar alertas" : "Expandir alertas"}
              className="inline-flex shrink-0 items-center gap-1.5 px-1 py-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"
            >
              <span
                className={cn(
                  "inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-bold tabular-nums",
                  model.hasItems
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {model.displayCount}
              </span>
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  !open && "-rotate-90",
                )}
                aria-hidden
              />
            </button>
          </>
        )}
      </div>

      <div
        className={cn(
          "relative z-10 shrink-0 border-b border-border",
          !open && "hidden",
        )}
      >
        <AlertsFilterChips
          filter={model.filter}
          setFilter={model.setFilter}
          counts={model.counts}
        />
      </div>

      <AlertsListBody
        open={open}
        className="relative z-10 min-h-0 flex-1"
        filtered={model.filtered}
        filter={model.filter}
        isLoading={model.isLoading}
      />
    </aside>
  )
}

export function ActiveAlertsPanel({
  embedded = false,
}: {
  /** Kept for call-site compatibility (desktop column). */
  flow?: boolean
  /** Inside mobile Sheet: no shell, list always open. */
  embedded?: boolean
}) {
  if (embedded) return <ActiveAlertsPanelEmbedded />
  return <ActiveAlertsPanelOverlay />
}
