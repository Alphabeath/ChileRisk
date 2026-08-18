"use client"

import { useEffect } from "react"
import { Bell, Calendar as CalendarIcon } from "lucide-react"

import { ActiveAlertsPanel } from "@/components/map/active-alerts-panel"
import { MapBottomDrawer } from "@/components/map/map-bottom-drawer"
import { useMonitorLiveData } from "@/components/map/monitor-live-data"
import { QueryDateControl } from "@/components/map/query-date-control"
import { useQueryDate } from "@/hooks"
import {
  CITIZEN_NAVBAR_CLEARANCE_PX,
  MAP_PANEL_LEFT_INSET_PX,
  MAP_PANEL_LEFT_POSITION_CLASS,
  MAP_WIDE_ONLY_CLASS,
} from "@/lib/citizen-layout"
import {
  formatQueryDateLabel,
  todayIsoDate,
} from "@/lib/query-date"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

function DesktopLeftColumn() {
  return (
    <div
      className={cn(
        "pointer-events-none fixed z-20 flex-col items-start gap-2",
        MAP_WIDE_ONLY_CLASS,
        MAP_PANEL_LEFT_POSITION_CLASS,
      )}
      style={{
        top: CITIZEN_NAVBAR_CLEARANCE_PX + MAP_PANEL_LEFT_INSET_PX,
        maxHeight: `calc(100dvh - ${CITIZEN_NAVBAR_CLEARANCE_PX + MAP_PANEL_LEFT_INSET_PX * 2}px)`,
      }}
      aria-label="Alertas y fecha del mapa"
    >
      <div className="pointer-events-auto flex min-h-0 shrink flex-col">
        <ActiveAlertsPanel />
      </div>
      <div className="pointer-events-auto flex shrink-0 flex-col">
        <QueryDateControl />
      </div>
    </div>
  )
}

/** Floating map controls — Alertas + Fecha in `lg+`, bottom drawer below. */
export function MapAlertsOverlay() {
  useEffect(() => {
    void useUIStore.persist.rehydrate()
  }, [])

  const { alerts, air } = useMonitorLiveData()
  const { selectedDate } = useQueryDate()
  const alertsCount = alerts.length + (air?.items.length ?? 0)
  const dateLabel = formatQueryDateLabel(selectedDate, todayIsoDate())

  return (
    <>
      <DesktopLeftColumn />
      <MapBottomDrawer
        id="monitor-map-controls"
        title="Controles del monitor"
        description="Alertas activas, filtros por fuente y fecha de consulta del mapa."
        defaultValue="alerts"
        tabs={[
          {
            value: "alerts",
            label: "Alertas",
            icon: <Bell aria-hidden />,
            meta: alertsCount,
            render: () => <ActiveAlertsPanel embedded />,
          },
          {
            value: "date",
            label: "Fecha",
            icon: <CalendarIcon aria-hidden />,
            meta: dateLabel,
            render: () => <QueryDateControl embedded />,
          },
        ]}
      />
    </>
  )
}
