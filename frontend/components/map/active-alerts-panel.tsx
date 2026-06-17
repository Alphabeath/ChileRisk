"use client"

import { useCallback, useLayoutEffect, useMemo, useState } from "react"
import {
  CITIZEN_NAVBAR_CLEARANCE_PX,
  MAP_PANEL_LEFT_INSET_PX,
} from "@/lib/citizen-layout"
import {
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  ChevronDown,
  Filter,
} from "lucide-react"
import { useActiveAlerts, useDraggablePanel } from "@/hooks"
import { sortActiveAlerts } from "@/lib/alerts-display"
import { MAP_PANEL_DRAG_HANDLE_CLASS, MAP_PANEL_SHELL_CLASS } from "@/lib/map-panel-styles"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ActiveAlertCard } from "./alert-ui"

type AlertFilter = "all" | "chilerisk" | "senapred"

const FILTER_OPTIONS: { value: AlertFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "chilerisk", label: "Chile Risk" },
  { value: "senapred", label: "Sernapred" },
]

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
        : {
            title: "Sin alertas activas",
            hint: "SERNAPRED y ChileRisk sin emergencias reportadas",
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

export function ActiveAlertsPanel({ flow = false }: { flow?: boolean }) {
  const [openOverride, setOpenOverride] = useState<boolean | null>(null)
  const [spaceExpanded, setSpaceExpanded] = useState(false)
  const [filter, setFilter] = useState<AlertFilter>("all")

  const syncSpaceExpanded = useCallback(() => {
    if (!flow) return
    setSpaceExpanded(hasViewportSpaceForAlertsExpanded())
  }, [flow])

  useLayoutEffect(() => {
    syncSpaceExpanded()
    if (!flow) return
    window.addEventListener("resize", syncSpaceExpanded)
    return () => window.removeEventListener("resize", syncSpaceExpanded)
  }, [flow, syncSpaceExpanded])

  const open = openOverride ?? (flow ? spaceExpanded : false)
  const { ref, handleProps, style, isDragging } = useDraggablePanel({
    id: "active-alerts-panel",
    corner: flow ? undefined : "top-left",
    cornerInset: 16,
    flow,
  })

  const { data: alerts = [], isLoading, error, refetch } = useActiveAlerts()

  const sorted = useMemo(() => sortActiveAlerts(alerts), [alerts])
  const senapredAlerts = sorted.filter(
    (a) => a.source === "senapred" && (a.record_kind ?? "alerta") === "alerta"
  ).length
  const senapredEventos = sorted.filter(
    (a) => a.source === "senapred" && a.record_kind === "evento"
  ).length
  const senapredCount = senapredAlerts + senapredEventos
  const chileriskCount = sorted.filter((a) => a.source === "chilerisk").length

  const counts: Record<AlertFilter, number> = {
    all: sorted.length,
    chilerisk: chileriskCount,
    senapred: senapredCount,
  }

  const filtered = useMemo(() => {
    if (filter === "chilerisk") return sorted.filter((a) => a.source === "chilerisk")
    if (filter === "senapred") return sorted.filter((a) => a.source === "senapred")
    return sorted
  }, [sorted, filter])

  const activeFilterLabel = FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? "Todas"
  const isFiltered = filter !== "all"

  const hasAlerts = sorted.length > 0
  const Icon = hasAlerts ? Bell : BellOff

  return (
    <aside
      ref={ref}
      className={cn(
        MAP_PANEL_SHELL_CLASS,
        "flex flex-col",
        "max-h-[min(380px,44dvh)]",
      )}
      style={style}
      aria-label="Alertas activas SERNAPRED y ChileRisk"
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
            <Icon className={cn("size-4", hasAlerts ? "text-white" : "text-white/55")} />
            {hasAlerts && (
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
            {isFiltered && (
              <span className="mt-0.5 block truncate text-[9px] uppercase tracking-wider text-white/45">
                · {activeFilterLabel}
              </span>
            )}
          </div>
        </div>

        <Popover>
          <PopoverTrigger
            aria-label="Filtrar alertas por fuente"
            className={cn(
              "relative flex shrink-0 items-center justify-center border-l border-white/10 px-2.5 transition-colors",
              "hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
              isFiltered ? "text-white" : "text-white/60 hover:text-white/85",
            )}
          >
            <Filter className="size-3.5" aria-hidden />
            {isFiltered && (
              <span
                className="absolute right-1 top-1 size-1.5 rounded-full bg-[#DA291C]"
                aria-hidden
              />
            )}
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={6}
            className="w-56 gap-2 border-white/10 bg-black/85 p-2 text-white shadow-2xl shadow-black/60 backdrop-blur-xl"
          >
            <div className="px-2 pt-1 text-[9.5px] font-semibold uppercase tracking-[1.2px] text-white/55">
              Filtrar por fuente
            </div>
            <div role="radiogroup" aria-label="Fuente de alertas" className="flex flex-col gap-0.5">
              {FILTER_OPTIONS.map((opt) => {
                const active = filter === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setFilter(opt.value)}
                    className={cn(
                      "group flex items-center gap-2 rounded-none px-2 py-1.5 text-left text-[11.5px] transition-colors",
                      "hover:bg-white/[0.06] focus-visible:bg-white/[0.08] focus-visible:outline-none",
                      active && "bg-white/[0.06]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-3.5 shrink-0 items-center justify-center border",
                        active
                          ? "border-[#DA291C] bg-[#DA291C]/15 text-[#ff9a9a]"
                          : "border-white/20 text-transparent",
                      )}
                      aria-hidden
                    >
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                    <span className="flex-1 truncate">{opt.label}</span>
                    <span
                      className={cn(
                        "rounded-sm border px-1 font-mono text-[9.5px] font-semibold leading-none tabular-nums",
                        counts[opt.value] > 0
                          ? "border-[#DA291C]/40 bg-[#DA291C]/20 text-[#ff9a9a]"
                          : "border-white/10 bg-white/[0.04] text-white/40",
                      )}
                    >
                      {counts[opt.value]}
                    </span>
                  </button>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>

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
              hasAlerts
                ? "border-[#DA291C]/40 bg-[#DA291C]/20 text-[#ff9a9a]"
                : "border-white/10 bg-white/[0.08] text-white/60"
            )}
          >
            {sorted.length}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 text-white/60 transition-transform duration-200",
              !open && "-rotate-90"
            )}
            aria-hidden
          />
        </button>
      </div>

      <div
        id="active-alerts-list"
        className={cn(
          "divide-y divide-white/[0.06] overflow-y-auto max-h-[min(320px,38dvh)]",
          !open && "hidden"
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
          <ErrorState onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          filtered.map((alert) => (
            <ActiveAlertCard
              key={`${alert.source}-${alert.id}`}
              alert={alert}
              showRegion
            />
          ))
        )}
      </div>
    </aside>
  )
}

/** @deprecated Use ActiveAlertsPanel */
export const SenapredAlertsPanel = ActiveAlertsPanel