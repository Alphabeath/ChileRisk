"use client"

import { useLayoutEffect, useMemo, useState } from "react"
import {
  CITIZEN_NAVBAR_CLEARANCE_PX,
  MAP_PANEL_LEFT_INSET_PX,
} from "@/lib/citizen-layout"
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  ChevronDown,
} from "lucide-react"
import { useActiveAlerts, useAirQuality, useDraggablePanel } from "@/hooks"
import { sortActiveAlertsBySeverity } from "@/lib/alerts-display"
import { MAP_PANEL_DRAG_HANDLE_CLASS, MAP_PANEL_SHELL_CLASS } from "@/lib/map-panel-styles"
import type { ActiveAlert, AirQualityZone } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ActiveAlertCard, AirQualityAlertCard } from "./alert-ui"

type AlertFilter = "all" | "chilerisk" | "senapred" | "sernageomin" | "airechile"

type PanelItem =
  | { kind: "alert"; alert: ActiveAlert }
  | { kind: "air"; zone: AirQualityZone }

const FILTER_OPTIONS: { value: AlertFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "chilerisk", label: "Chile Risk" },
  { value: "senapred", label: "Sernapred" },
  { value: "sernageomin", label: "Volcán" },
  { value: "airechile", label: "Aire" },
]

/** Align with ALERT_LEVEL_PRIORITY (0 = most severe). */
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

function SkeletonCard() {
  return (
    <div className="px-3 py-2.5">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-4 w-16 animate-pulse rounded-sm bg-white/[0.06]" />
        <div className="h-3 w-12 animate-pulse rounded-sm bg-white/[0.04]" />
      </div>
      <div className="h-3 w-full animate-pulse rounded-sm bg-white/[0.08]" />
      <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded-sm bg-white/[0.08]" />
      <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded-sm bg-white/[0.04]" />
    </div>
  )
}

function EmptyState({ filter }: { filter: AlertFilter }) {
  const { title, hint } =
    filter === "chilerisk"
      ? { title: "Sin alertas ChileRisk", hint: "El motor de riesgo no reporta emergencias" }
      : filter === "senapred"
        ? { title: "Sin alertas SERNAPRED", hint: "No hay alertas ni eventos publicados" }
        : filter === "sernageomin"
          ? {
              title: "Sin alertas SERNAGEOMIN",
              hint: "No hay volcanes con alerta elevada vigente",
            }
          : filter === "airechile"
            ? {
                title: "Sin datos Aire Chile",
                hint: "Cobertura parcial (zonas PPDA). Sin snapshot para este día",
              }
            : {
                title: "Sin alertas activas",
                hint: "SERNAPRED, ChileRisk, SERNAGEOMIN y Aire Chile sin novedades",
              }
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-8 text-center">
      <CheckCircle2 className="size-6 text-emerald-400/70" />
      <div className="text-[12px] font-medium text-white/80">{title}</div>
      <div className="text-[10px] text-white/45">{hint}</div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-6 text-center">
      <AlertTriangle className="size-5 text-[#DA291C]/80" />
      <div className="text-[11px] font-medium text-white/80">No se pudieron cargar alertas</div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/55 underline underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
      >
        Reintentar
      </button>
    </div>
  )
}

/** Room for alerts list + header when Fecha/Controles sit below in the left column. */
const ALERTS_EXPAND_MIN_VIEWPORT_PX = 280
const LEFT_COLUMN_BOTTOM_RESERVE_PX = 220

function hasViewportSpaceForAlertsExpanded(): boolean {
  if (typeof window === "undefined") return false
  const available =
    window.innerHeight -
    CITIZEN_NAVBAR_CLEARANCE_PX -
    MAP_PANEL_LEFT_INSET_PX -
    LEFT_COLUMN_BOTTOM_RESERVE_PX
  return available >= ALERTS_EXPAND_MIN_VIEWPORT_PX
}

function useAlertsPanelModel() {
  const [filter, setFilter] = useState<AlertFilter>("all")
  const {
    data: alerts = [],
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useActiveAlerts()
  const {
    data: airData,
    isLoading: airLoading,
    error: airError,
    refetch: refetchAir,
  } = useAirQuality()

  const zones = useMemo(() => airData?.items ?? [], [airData?.items])
  const sortedAlerts = useMemo(() => sortActiveAlertsBySeverity(alerts), [alerts])

  const allItems = useMemo(() => {
    const items: PanelItem[] = [
      ...sortedAlerts.map((alert): PanelItem => ({ kind: "alert", alert })),
      ...zones.map((zone): PanelItem => ({ kind: "air", zone })),
    ]
    return sortPanelItems(items)
  }, [sortedAlerts, zones])

  const senapredCount = sortedAlerts.filter((a) => a.source === "senapred").length
  const chileriskCount = sortedAlerts.filter((a) => a.source === "chilerisk").length
  const sernageominCount = sortedAlerts.filter((a) => a.source === "sernageomin").length
  const airechileCount = zones.length

  const counts: Record<AlertFilter, number> = {
    all: allItems.length,
    chilerisk: chileriskCount,
    senapred: senapredCount,
    sernageomin: sernageominCount,
    airechile: airechileCount,
  }

  const filtered = useMemo(() => {
    if (filter === "chilerisk") {
      return allItems.filter((i) => i.kind === "alert" && i.alert.source === "chilerisk")
    }
    if (filter === "senapred") {
      return allItems.filter((i) => i.kind === "alert" && i.alert.source === "senapred")
    }
    if (filter === "sernageomin") {
      return allItems.filter(
        (i) => i.kind === "alert" && i.alert.source === "sernageomin",
      )
    }
    if (filter === "airechile") {
      return allItems.filter((i) => i.kind === "air")
    }
    return allItems
  }, [allItems, filter])

  const displayCount =
    filter === "all"
      ? allItems.length
      : filter === "airechile"
        ? airechileCount
        : filter === "chilerisk"
          ? chileriskCount
          : filter === "sernageomin"
            ? sernageominCount
            : senapredCount

  const hasItems = allItems.length > 0
  const isLoading = alertsLoading || airLoading
  const error = alertsError || airError
  const refetch = () => {
    void refetchAlerts()
    void refetchAir()
  }

  return {
    filter,
    setFilter,
    filtered,
    counts,
    displayCount,
    hasItems,
    isLoading,
    error,
    refetch,
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
      className="grid grid-cols-3 gap-1 px-2 py-1.5"
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
              "inline-flex min-w-0 items-center justify-between gap-1 rounded-none border px-1.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
              active
                ? "border-white/25 bg-white/[0.12] text-white"
                : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.06] hover:text-white/80",
            )}
          >
            <span className="truncate">{opt.label}</span>
            <span
              className={cn(
                "shrink-0 font-mono text-[9px] tabular-nums",
                active
                  ? count > 0
                    ? "text-[#ff9a9a]"
                    : "text-white/50"
                  : count > 0
                    ? "text-white/70"
                    : "text-white/35",
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

function AlertsListBody({
  open,
  maxHeightClass,
  isLoading,
  error,
  refetch,
  filtered,
  filter,
}: {
  open: boolean
  maxHeightClass: string
  isLoading: boolean
  error: unknown
  refetch: () => void
  filtered: PanelItem[]
  filter: AlertFilter
}) {
  return (
    <div
      id="active-alerts-list"
      className={cn(
        "divide-y divide-white/[0.06] overflow-y-auto",
        maxHeightClass,
        !open && "hidden",
      )}
      role="region"
      aria-live="polite"
    >
      {isLoading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        filtered.map((item) =>
          item.kind === "air" ? (
            <AirQualityAlertCard key={`air-${item.zone.zone_slug}`} zone={item.zone} />
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
      className="flex w-full flex-col"
      aria-label="Alertas activas SERNAPRED, ChileRisk y Aire Chile"
    >
      <div className="border-b border-white/[0.06]">
        <AlertsFilterChips
          filter={model.filter}
          setFilter={model.setFilter}
          counts={model.counts}
        />
      </div>
      <AlertsListBody
        open
        maxHeightClass="max-h-[min(60dvh,480px)]"
        isLoading={model.isLoading}
        error={model.error}
        refetch={model.refetch}
        filtered={model.filtered}
        filter={model.filter}
      />
    </aside>
  )
}

function ActiveAlertsPanelOverlay({ flow }: { flow: boolean }) {
  const [openOverride, setOpenOverride] = useState<boolean | null>(null)
  const [, setResizeEpoch] = useState(0)
  const model = useAlertsPanelModel()

  useLayoutEffect(() => {
    if (!flow) return
    const onResize = () => setResizeEpoch((n) => n + 1)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [flow])

  const spaceExpanded = flow ? hasViewportSpaceForAlertsExpanded() : false
  const open = openOverride ?? (flow ? spaceExpanded : false)
  const { ref, handleProps, style, isDragging } = useDraggablePanel({
    id: "active-alerts-panel",
    corner: flow ? undefined : "top-left",
    cornerInset: 16,
    flow,
  })

  const Icon = model.hasItems ? Bell : BellOff

  return (
    <aside
      ref={ref}
      className={cn(
        MAP_PANEL_SHELL_CLASS,
        "flex flex-col",
        "max-h-[min(420px,50dvh)]",
      )}
      style={style}
      aria-label="Alertas activas SERNAPRED, ChileRisk y Aire Chile"
    >
      <div className="flex w-full items-stretch border-b border-white/10">
        <div
          {...handleProps}
          className={cn(MAP_PANEL_DRAG_HANDLE_CLASS, "gap-2.5 py-2.5")}
          style={{ touchAction: "none" }}
          data-dragging={isDragging || undefined}
          aria-label="Arrastrar panel"
        >
          <div className="relative shrink-0">
            <Icon className={cn("size-4", model.hasItems ? "text-white" : "text-white/55")} />
            {model.hasItems && (
              <span
                className="absolute -right-1 -top-1 size-1.5 animate-pulse rounded-full bg-[#DA291C]"
                style={{ boxShadow: "0 0 4px rgba(218,41,28,0.8)" }}
                aria-hidden
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10.5px] font-semibold uppercase tracking-[1.4px] text-white/85">
              Alertas
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpenOverride((v) => !(v ?? open))}
          aria-expanded={open}
          aria-controls="active-alerts-list"
          aria-label={open ? "Colapsar alertas" : "Expandir alertas"}
          className="flex shrink-0 items-center gap-2 border-l border-white/10 px-3 transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
        >
          <span
            className={cn(
              "rounded-sm border px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tabular-nums",
              model.hasItems
                ? "border-[#DA291C]/40 bg-[#DA291C]/20 text-[#ff9a9a]"
                : "border-white/10 bg-white/[0.08] text-white/60",
            )}
          >
            {model.displayCount}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 text-white/60 transition-transform duration-200",
              !open && "-rotate-90",
            )}
            aria-hidden
          />
        </button>
      </div>

      <div className={cn("border-b border-white/[0.06]", !open && "hidden")}>
        <AlertsFilterChips
          filter={model.filter}
          setFilter={model.setFilter}
          counts={model.counts}
        />
      </div>

      <AlertsListBody
        open={open}
        maxHeightClass="max-h-[min(300px,36dvh)]"
        isLoading={model.isLoading}
        error={model.error}
        refetch={model.refetch}
        filtered={model.filtered}
        filter={model.filter}
      />
    </aside>
  )
}

export function ActiveAlertsPanel({
  flow = false,
  embedded = false,
}: {
  flow?: boolean
  /** Inside mobile Drawer: no shell, no drag handle, list always open. */
  embedded?: boolean
}) {
  if (embedded) return <ActiveAlertsPanelEmbedded />
  return <ActiveAlertsPanelOverlay flow={flow} />
}

/** @deprecated Use ActiveAlertsPanel */
export const SenapredAlertsPanel = ActiveAlertsPanel
