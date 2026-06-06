"use client"

import {
  CITIZEN_NAVBAR_CLEARANCE_PX,
  MAP_PANEL_RIGHT_INSET_PX,
  MAP_PANEL_WIDTH_CLASS,
} from "@/lib/citizen-layout"
import { cn } from "@/lib/utils"
import { RiskLegendPanel } from "./risk-legend-panel"

/** Right column (bottom): leyenda de riesgo. MapLibre zoom/compass uses top-right on the map. */
export function MapRightPanelsColumn() {
  return (
    <div
      className={cn(
        "pointer-events-none fixed z-20 flex flex-col justify-end",
        MAP_PANEL_WIDTH_CLASS,
      )}
      style={{
        left: "auto",
        top: CITIZEN_NAVBAR_CLEARANCE_PX,
        right: MAP_PANEL_RIGHT_INSET_PX,
        bottom: MAP_PANEL_RIGHT_INSET_PX,
        maxHeight: `calc(100dvh - ${CITIZEN_NAVBAR_CLEARANCE_PX + MAP_PANEL_RIGHT_INSET_PX}px)`,
      }}
      aria-label="Leyenda de riesgo"
    >
      <div className="pointer-events-auto flex shrink-0 flex-col">
        <RiskLegendPanel flow />
      </div>
    </div>
  )
}