"use client"

import { ChileMap } from "@/components/map/chile-map"
import { MapOverlays } from "@/components/map/map-overlays"

export default function MonitorPage() {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <ChileMap />
      <MapOverlays />
    </div>
  )
}