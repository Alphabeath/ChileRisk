import { ChileMap } from "@/components/map/chile-map"
import { SenapredAlertsPanel } from "@/components/map/senapred-alerts-panel"

export default function MapPage() {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <ChileMap />
      <SenapredAlertsPanel />
    </div>
  )
}
