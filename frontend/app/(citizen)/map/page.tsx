"use client"

import { ChileMap } from "@/components/map/chile-map"
import { MapOverlays } from "@/components/map/map-overlays"

export default function MapPage() {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <ChileMap />
      <MapOverlays />
    </div>
  )
}