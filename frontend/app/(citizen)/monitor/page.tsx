"use client"

import dynamic from "next/dynamic"

import { MapAlertsOverlay } from "@/components/map/map-alerts-overlay"
import { MonitorLiveDataProvider } from "@/components/map/monitor-live-data"

const ChileMap = dynamic(
  () =>
    import("@/components/map/chile-map").then((m) => m.ChileMap),
  { ssr: false },
)

export default function MonitorPage() {
  return (
    <MonitorLiveDataProvider>
      <main className="relative h-full w-full overflow-hidden overscroll-none">
        <ChileMap />
        <MapAlertsOverlay />
      </main>
    </MonitorLiveDataProvider>
  )
}
