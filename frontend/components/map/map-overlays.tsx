"use client"

import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import { SenapredAlertsPanel } from "./senapred-alerts-panel"

/** Stable id so aria-describedby matches between SSR and client (dnd-kit global counter otherwise diverges). */
export const SENAPRED_DND_CONTEXT_ID = "chilerisk-senapred-alerts"

export function MapOverlays() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  return (
    <DndContext
      id={SENAPRED_DND_CONTEXT_ID}
      sensors={sensors}
      modifiers={[restrictToWindowEdges]}
    >
      <SenapredAlertsPanel />
    </DndContext>
  )
}