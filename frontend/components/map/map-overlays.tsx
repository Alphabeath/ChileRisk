"use client"

import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import { MAP_DESKTOP_ONLY_CONTENTS_CLASS } from "@/lib/citizen-layout"
import { MapLeftPanelsColumn } from "./map-left-panels-column"
import { MapRightPanelsColumn } from "./map-right-panels-column"
import { MonitorMobileDrawer } from "./monitor-mobile-drawer"

export const ALERTS_DND_CONTEXT_ID = "chilerisk-active-alerts"

/** @deprecated Use ALERTS_DND_CONTEXT_ID */
export const SENAPRED_DND_CONTEXT_ID = ALERTS_DND_CONTEXT_ID

export function MapOverlays() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  return (
    <>
      <div className={MAP_DESKTOP_ONLY_CONTENTS_CLASS}>
        <DndContext
          id={ALERTS_DND_CONTEXT_ID}
          sensors={sensors}
          modifiers={[restrictToWindowEdges]}
        >
          <MapLeftPanelsColumn />
          <MapRightPanelsColumn />
        </DndContext>
      </div>
      <MonitorMobileDrawer />
    </>
  )
}
