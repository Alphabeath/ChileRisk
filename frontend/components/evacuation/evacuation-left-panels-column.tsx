"use client"

import {
  CITIZEN_NAVBAR_CLEARANCE_PX,
  MAP_DESKTOP_ONLY_CLASS,
  MAP_PANEL_LEFT_INSET_PX,
  MAP_PANEL_WIDTH_CLASS,
} from "@/lib/citizen-layout"
import type { EvacuationLayerVisibility } from "@/lib/evacuation-layers"
import type { EvacuationUserLocationState } from "@/lib/evacuation-location-state"
import type { EvacuationMeetingPoint } from "@/lib/evacuation-meeting-points"
import { cn } from "@/lib/utils"
import { EvacuationLayersLegend } from "./evacuation-layers-legend"
import { EvacuationNearestPointsPanel } from "./evacuation-nearest-points-panel"

interface EvacuationLeftPanelsColumnProps {
  layerVisibility: EvacuationLayerVisibility
  onToggleLayer: (key: keyof EvacuationLayerVisibility) => void
  meetingPoints: Omit<EvacuationMeetingPoint, "distanceKm">[]
  userLocationState: EvacuationUserLocationState
  layersReady: boolean
  onFocusPoint: (point: { lng: number; lat: number }) => void
  locationPromptActive?: boolean
}

/** Left column: Puntos de encuentro → Capas. Desktop (`md+`) only. */
export function EvacuationLeftPanelsColumn({
  layerVisibility,
  onToggleLayer,
  meetingPoints,
  userLocationState,
  layersReady,
  onFocusPoint,
  locationPromptActive,
}: EvacuationLeftPanelsColumnProps) {
  const isBlocked = !!locationPromptActive

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
      aria-label="Puntos de encuentro y capas del mapa"
    >
      <div
        className={cn(
          "pointer-events-auto flex min-h-0 flex-1 flex-col overflow-hidden",
          isBlocked && "hidden",
        )}
      >
        <EvacuationNearestPointsPanel
          flow
          points={meetingPoints}
          userLocationState={userLocationState}
          layersReady={layersReady}
          onFocusPoint={onFocusPoint}
          disabled={isBlocked}
        />
      </div>
      <div
        className={cn(
          "pointer-events-auto flex shrink-0 flex-col",
          isBlocked && "hidden",
        )}
      >
        <EvacuationLayersLegend
          flow
          visibility={layerVisibility}
          onToggle={onToggleLayer}
          disabled={isBlocked}
        />
      </div>
    </div>
  )
}
