"use client"

import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import { MapLeftPanelsColumn } from "./map-left-panels-column"
import { MapRightPanelsColumn } from "./map-right-panels-column"

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
      <MapLeftPanelsColumn />
      <MapRightPanelsColumn />
    </DndContext>
  )
}