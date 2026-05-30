"use client"

import { createRoot, type Root } from "react-dom/client"
import type { ReactNode } from "react"
import type { RegionProperties, ComunaProperties } from "./map-config"
import { Button } from "@/components/ui/button"

function hazardColor(score: number): string {
  if (score >= 75) return "bg-red-500"
  if (score >= 55) return "bg-orange-500"
  if (score >= 35) return "bg-yellow-500"
  return "bg-emerald-500"
}

function hazardLabel(key: string): string {
  const labels: Record<string, string> = {
    sismo: "Sismo",
    ola_calor: "Calor",
    ola_frio: "Frío",
    viento: "Viento",
  }
  return labels[key] || key
}

function HazardBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{score.toFixed(0)}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${hazardColor(score)}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critico: "bg-red-500/20 text-red-400 border-red-500/40",
    alto: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    moderado: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    bajo: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  }
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${colors[severity] || colors.bajo}`}>
      {severity}
    </span>
  )
}

interface RegionPopupContentProps {
  properties: RegionProperties
  onViewDetail: () => void
}

export function RegionPopupContent({ properties, onViewDetail }: RegionPopupContentProps) {
  return (
    <div className="py-3 min-w-[200px]">
      <div className="px-4 pb-2">
        <h3 className="text-sm font-bold text-foreground">{properties.Region}</h3>
        <div className="flex items-center gap-2 mt-1">
          {properties.severity && <SeverityBadge severity={properties.severity} />}
          {properties.dominant_hazard && (
            <span className="text-[10px] text-muted-foreground">{hazardLabel(properties.dominant_hazard)}</span>
          )}
        </div>
      </div>

      {properties.composite_score != null && (
        <div className="border-t border-white/40 px-4 py-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Riesgo compuesto</span>
            <span className="text-sm font-bold">{properties.composite_score.toFixed(1)}</span>
          </div>

          {properties.avg_temperature_c != null && (
            <div className="flex gap-3 text-[10px]">
              <span className="text-blue-400">{properties.avg_temperature_c.toFixed(1)}°C</span>
              {properties.avg_wind_speed_kmh != null && (
                <span className="text-cyan-400">{properties.avg_wind_speed_kmh.toFixed(0)} km/h</span>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            {properties.sismo_score != null && <HazardBar label="Sismo" score={properties.sismo_score} />}
            {properties.ola_calor_score != null && <HazardBar label="Calor" score={properties.ola_calor_score} />}
            {properties.ola_frio_score != null && <HazardBar label="Frío" score={properties.ola_frio_score} />}
            {properties.viento_score != null && <HazardBar label="Viento" score={properties.viento_score} />}
          </div>
        </div>
      )}

      <div className="border-t border-white/40 px-4 pt-2 pb-1">
        <Button variant="default" size="xs" onClick={onViewDetail} className="w-full">
          Ver detalle
        </Button>
      </div>
    </div>
  )
}

interface ComunaPopupContentProps {
  properties: ComunaProperties
  onViewDetail: () => void
}

export function ComunaPopupContent({ properties, onViewDetail }: ComunaPopupContentProps) {
  return (
    <div className="py-3 min-w-[200px]">
      <div className="px-4 pb-2">
        <h3 className="text-sm font-bold text-foreground">{properties.Comuna}</h3>
        <div className="flex items-center gap-2 mt-1">
          {properties.severity && <SeverityBadge severity={properties.severity} />}
          {properties.dominant_hazard && (
            <span className="text-[10px] text-muted-foreground">{hazardLabel(properties.dominant_hazard)}</span>
          )}
        </div>
      </div>

      {properties.seismic_impact && (
        <div className="mx-4 mb-2 rounded-md border border-orange-500/40 bg-orange-500/10 px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
            <span>Afectada por sismo M{properties.seismic_impact.magnitude.toFixed(1)}</span>
          </div>
          <div className="mt-1 text-[10px] text-orange-300/80 space-y-0.5">
            <div>Distancia al epicentro: {properties.seismic_impact.distance_km.toFixed(1)} km</div>
            <div>Intensidad estimada: {properties.seismic_impact.estimated_intensity.toFixed(2)}</div>
          </div>
        </div>
      )}

      {properties.composite_score != null && (
        <div className="border-t border-white/40 px-4 py-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Riesgo compuesto</span>
            <span className="text-sm font-bold">{properties.composite_score.toFixed(1)}</span>
          </div>

          {(properties.temperature_c != null || properties.wind_speed_kmh != null) && (
            <div className="flex gap-3 text-[10px]">
              {properties.temperature_c != null && (
                <span className="text-blue-400">{properties.temperature_c.toFixed(1)}°C</span>
              )}
              {properties.wind_speed_kmh != null && (
                <span className="text-cyan-400">{properties.wind_speed_kmh.toFixed(0)} km/h</span>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            {properties.sismo_score != null && <HazardBar label="Sismo" score={properties.sismo_score} />}
            {properties.ola_calor_score != null && <HazardBar label="Calor" score={properties.ola_calor_score} />}
            {properties.ola_frio_score != null && <HazardBar label="Frío" score={properties.ola_frio_score} />}
            {properties.viento_score != null && <HazardBar label="Viento" score={properties.viento_score} />}
          </div>
        </div>
      )}

      <div className="border-t border-white/40 px-4 pt-2 pb-1">
        <Button variant="default" size="xs" onClick={onViewDetail} className="w-full">
          Ver detalle
        </Button>
      </div>
    </div>
  )
}

export function createPopupContent(node: ReactNode): { element: HTMLDivElement; destroy: () => void } {
  const element = document.createElement("div")
  const root: Root = createRoot(element)
  root.render(node)
  let unmounted = false
  return {
    element,
    destroy: () => {
      if (!unmounted) {
        unmounted = true
        queueMicrotask(() => root.unmount())
      }
    },
  }
}
