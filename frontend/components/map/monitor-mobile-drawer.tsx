"use client"

import { useEffect, useState } from "react"
import { Bell, Calendar, Eye, Layers, ShieldAlert, Wind } from "lucide-react"
import { useActiveAlerts, useAirQuality, useQueryDate } from "@/hooks"
import {
  TOUR_MONITOR_EVENT,
  type TourMonitorDetail,
} from "@/lib/tour/tour-steps"
import { formatQueryDateLabel, todayIsoDate } from "@/lib/query-date"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { ActiveAlertsPanel } from "./active-alerts-panel"
import {
  MapMobileBottomSheet,
  type MapMobileBottomSheetTab,
} from "./map-mobile-bottom-sheet"
import { QueryDateControl } from "./query-date-control"
import { RiskLegendPanel } from "./risk-legend-panel"

const MONITOR_TABS: MapMobileBottomSheetTab[] = [
  { id: "alertas", label: "Alertas", icon: Bell },
  { id: "fecha", label: "Fecha", icon: Calendar },
  { id: "vistas", label: "Vistas", icon: Eye },
]

function modeLabel(mode: "risk" | "alerts" | "air"): string {
  if (mode === "alerts") return "Alertas"
  if (mode === "air") return "Aire"
  return "Riesgo"
}

function MonitorStatusStrip() {
  const { data: alerts = [] } = useActiveAlerts()
  const { data: airData } = useAirQuality()
  const { selectedDate } = useQueryDate()
  const mapColorMode = useUIStore((s) => s.mapColorMode)
  const dateLabel = formatQueryDateLabel(selectedDate, todayIsoDate())
  const count = alerts.length + (airData?.items?.length ?? 0)
  const hasAlerts = count > 0

  return (
    <>
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            hasAlerts ? "bg-[#DA291C]" : "bg-emerald-400/70",
          )}
          style={
            hasAlerts
              ? { boxShadow: "0 0 4px rgba(218,41,28,0.8)" }
              : undefined
          }
          aria-hidden
        />
        <span
          className={cn(
            "font-mono text-[11px] font-semibold tabular-nums",
            hasAlerts ? "text-[#ff9a9a]" : "text-white/70",
          )}
        >
          {count}
        </span>
        <span className="truncate text-[10px] text-white/45">
          {hasAlerts ? "activas" : "sin alertas"}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-1 border-l border-white/10 pl-3">
        {mapColorMode === "alerts" ? (
          <ShieldAlert className="size-3 shrink-0 text-white/55" aria-hidden />
        ) : mapColorMode === "air" ? (
          <Wind className="size-3 shrink-0 text-white/55" aria-hidden />
        ) : (
          <Layers className="size-3 shrink-0 text-white/55" aria-hidden />
        )}
        <span className="truncate text-[10px] font-semibold uppercase tracking-[1.1px] text-white/70">
          {modeLabel(mapColorMode)}
        </span>
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-1 border-l border-white/10 pl-3">
        <Calendar className="size-3 shrink-0 text-white/55" aria-hidden />
        <span className="truncate font-mono text-[10px] tabular-nums text-white/70">
          {dateLabel}
        </span>
      </div>
    </>
  )
}

/** Mobile chrome for `/monitor`: Alertas | Fecha | Vistas. */
export function MonitorMobileDrawer() {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState("alertas")

  useEffect(() => {
    const onTour = (e: Event) => {
      const detail = (e as CustomEvent<TourMonitorDetail>).detail
      if (!detail) return
      if (detail.tab) setActiveTab(detail.tab)
      if (detail.expand !== undefined) setExpanded(detail.expand)
    }
    window.addEventListener(TOUR_MONITOR_EVENT, onTour)
    return () => window.removeEventListener(TOUR_MONITOR_EVENT, onTour)
  }, [])

  return (
    <MapMobileBottomSheet
      expanded={expanded}
      onExpandedChange={setExpanded}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      tabs={MONITOR_TABS}
      status={<MonitorStatusStrip />}
      aria-label="Controles del monitor"
      data-tour="monitor-mobile-sheet"
    >
      {activeTab === "alertas" ? <ActiveAlertsPanel embedded /> : null}
      {activeTab === "fecha" ? <QueryDateControl embedded /> : null}
      {activeTab === "vistas" ? <RiskLegendPanel embedded /> : null}
    </MapMobileBottomSheet>
  )
}
