"use client"

import { useMemo, useState } from "react"
import { Crosshair, Layers, MapPin } from "lucide-react"
import {
  MapMobileBottomSheet,
  type MapMobileBottomSheetTab,
} from "@/components/map/map-mobile-bottom-sheet"
import { EvacuationLayersLegend } from "@/components/evacuation/evacuation-layers-legend"
import { EvacuationNearestPointsPanel } from "@/components/evacuation/evacuation-nearest-points-panel"
import type { EvacuationLayerVisibility } from "@/lib/evacuation-layers"
import type { EvacuationUserLocationState } from "@/lib/evacuation-location-state"
import {
  nearestMeetingPoints,
  type EvacuationMeetingPoint,
} from "@/lib/evacuation-meeting-points"
import { cn } from "@/lib/utils"

const EVACUATION_TABS: MapMobileBottomSheetTab[] = [
  { id: "puntos", label: "Puntos", icon: MapPin },
  { id: "capas", label: "Capas", icon: Layers },
]

interface EvacuationMobileDrawerProps {
  layerVisibility: EvacuationLayerVisibility
  onToggleLayer: (key: keyof EvacuationLayerVisibility) => void
  meetingPoints: Omit<EvacuationMeetingPoint, "distanceKm">[]
  userLocationState: EvacuationUserLocationState
  layersReady: boolean
  onFocusPoint: (point: { lng: number; lat: number }) => void
  locationPromptActive?: boolean
}

function EvacuationStatusStrip({
  userLocationState,
  meetingPoints,
}: {
  userLocationState: EvacuationUserLocationState
  meetingPoints: Omit<EvacuationMeetingPoint, "distanceKm">[]
}) {
  const nearbyCount = useMemo(() => {
    if (userLocationState.status !== "ready") return 0
    return nearestMeetingPoints(
      meetingPoints,
      { lng: userLocationState.lng, lat: userLocationState.lat },
      5,
    ).length
  }, [meetingPoints, userLocationState])

  const locationLabel =
    userLocationState.status === "ready"
      ? "Ubicación lista"
      : userLocationState.status === "pending"
        ? "Obteniendo ubicación…"
        : "Sin ubicación"

  const hasNearby = userLocationState.status === "ready" && nearbyCount > 0

  return (
    <>
      <div className="flex min-w-0 items-center gap-1.5">
        <Crosshair
          className={cn(
            "size-3.5 shrink-0",
            userLocationState.status === "ready"
              ? "text-emerald-400/80"
              : "text-amber-400/70",
          )}
          aria-hidden
        />
        <span className="truncate text-[10px] text-white/70">{locationLabel}</span>
      </div>

      {hasNearby ? (
        <div className="ml-auto flex min-w-0 items-center gap-1 border-l border-white/10 pl-3">
          <MapPin className="size-3 shrink-0 text-amber-400/90" aria-hidden />
          <span className="font-mono text-[11px] font-semibold tabular-nums text-amber-200/90">
            {nearbyCount}
          </span>
          <span className="truncate text-[10px] text-white/45">cercanos</span>
        </div>
      ) : null}
    </>
  )
}

/** Mobile chrome for `/evacuation`: persistent bottom sheet — Puntos | Capas. */
export function EvacuationMobileDrawer({
  layerVisibility,
  onToggleLayer,
  meetingPoints,
  userLocationState,
  layersReady,
  onFocusPoint,
  locationPromptActive,
}: EvacuationMobileDrawerProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState("puntos")
  const blocked = !!locationPromptActive

  const handleFocusPoint = (point: { lng: number; lat: number }) => {
    onFocusPoint(point)
    setExpanded(false)
  }

  return (
    <MapMobileBottomSheet
      expanded={expanded && !blocked}
      onExpandedChange={(next) => {
        if (blocked) return
        setExpanded(next)
      }}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      tabs={EVACUATION_TABS}
      status={
        <EvacuationStatusStrip
          userLocationState={userLocationState}
          meetingPoints={meetingPoints}
        />
      }
      hidden={blocked}
      aria-label="Controles de evacuación"
    >
      {activeTab === "puntos" ? (
        <EvacuationNearestPointsPanel
          embedded
          points={meetingPoints}
          userLocationState={userLocationState}
          layersReady={layersReady}
          onFocusPoint={handleFocusPoint}
        />
      ) : null}
      {activeTab === "capas" ? (
        <EvacuationLayersLegend
          embedded
          visibility={layerVisibility}
          onToggle={onToggleLayer}
        />
      ) : null}
    </MapMobileBottomSheet>
  )
}
