"use client"

import {
  CITIZEN_NAVBAR_CLEARANCE_PX,
  MAP_DESKTOP_ONLY_CLASS,
  MAP_PANEL_LEFT_INSET_PX,
  MAP_PANEL_WIDTH_CLASS,
} from "@/lib/citizen-layout"
import { cn } from "@/lib/utils"
import { ActiveAlertsPanel } from "./active-alerts-panel"
import { MapActionsPanel } from "./map-actions-panel"
import { QueryDateControl } from "./query-date-control"

/** Left column: Alertas → Fecha → Controles (top to bottom). Desktop (`md+`) only. */
export function MapLeftPanelsColumn() {
  return (
    <div
      className={cn(
        "pointer-events-none fixed z-20 flex-col gap-2",
        MAP_DESKTOP_ONLY_CLASS,
        MAP_PANEL_WIDTH_CLASS,
      )}
      style={{
        top: CITIZEN_NAVBAR_CLEARANCE_PX,
        left: MAP_PANEL_LEFT_INSET_PX,
        bottom: MAP_PANEL_LEFT_INSET_PX,
        maxHeight: `calc(100dvh - ${CITIZEN_NAVBAR_CLEARANCE_PX + MAP_PANEL_LEFT_INSET_PX}px)`,
      }}
      aria-label="Alertas y controles del mapa"
    >
      <div className="pointer-events-auto flex shrink-0 flex-col">
        <ActiveAlertsPanel flow />
      </div>
      <div className="pointer-events-auto flex shrink-0 flex-col gap-2">
        <QueryDateControl flow />
        <MapActionsPanel flow />
      </div>
    </div>
  )
}
