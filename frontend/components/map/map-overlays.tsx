"use client"

import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import { ActiveAlertsPanel } from "./active-alerts-panel"
import { QueryDateControl } from "./query-date-control"
import { RiskLegendPanel } from "./risk-legend-panel"

export const ALERTS_DND_CONTEXT_ID = "chilerisk-active-alerts"

/** @deprecated Use ALERTS_DND_CONTEXT_ID */
export const SENAPRED_DND_CONTEXT_ID = ALERTS_DND_CONTEXT_ID

export function MapOverlays() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  return (
    <DndContext
      id={ALERTS_DND_CONTEXT_ID}
      sensors={sensors}
      modifiers={[restrictToWindowEdges]}
    >
      <ActiveAlertsPanel />
      <QueryDateControl />
      <RiskLegendPanel />
    </DndContext>
  )
}