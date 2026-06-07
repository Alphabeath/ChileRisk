"use client"

import { ChileMap } from "@/components/map/chile-map"
import { GLASS_DIVIDER, GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { AlertTriangle, MapPin, Route } from "lucide-react"
import { cn } from "@/lib/utils"

const sketchLayers = [
  {
    label: "Zonas de riesgo",
    description: "Áreas con mayor exposición según amenaza activa (inundación, tsunami, incendio, etc.).",
    icon: AlertTriangle,
    swatch: "bg-red-500/50",
    status: "Capa mock",
  },
  {
    label: "Vías de evacuación",
    description: "Rutas seguras hacia puntos de encuentro y zonas elevadas o refugio.",
    icon: Route,
    swatch: "bg-emerald-500/50",
    status: "Capa mock",
  },
  {
    label: "Puntos de encuentro",
    description: "Plazas, colegios y equipamientos designados por la municipalidad.",
    icon: MapPin,
    swatch: "bg-amber-500/50",
    status: "Capa mock",
  },
] as const

export function EvacuacionMapSketch() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] lg:items-start">
      <div
        className={cn(
          GLASS_PANEL_CLASS,
          "relative overflow-hidden",
          "h-[min(70dvh,640px)] min-h-[360px]",
          "[&_.cr-map]:!h-full [&_.cr-map]:!min-h-0",
        )}
      >
        <ChileMap />
        <div className="pointer-events-none absolute inset-x-0 top-0 border-b border-white/10 bg-black/55 px-4 py-2 backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[1.1px] text-white/80">
            Mapa base ChileRisk
          </p>
          <p className="text-[11px] text-white/50">
            Las capas de evacuación se superpondrán aquí en una versión futura.
          </p>
        </div>
      </div>

      <aside
        className={cn(
          GLASS_PANEL_CLASS,
          GLASS_MICA_INTERACTIVE_CLASS,
          "flex flex-col overflow-hidden",
        )}
        aria-label="Capas planificadas"
      >
        <div className={cn("border-b px-4 py-3.5", GLASS_DIVIDER)}>
          <h2 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/90">
            Capas previstas
          </h2>
          <p className="mt-0.5 text-[11px] text-white/50">
            Referencia visual del alcance del módulo.
          </p>
        </div>

        <ul className="divide-y divide-white/10">
          {sketchLayers.map((layer) => {
            const Icon = layer.icon
            return (
              <li key={layer.label} className="flex gap-3 px-4 py-3.5">
                <div
                  className={cn(
                    "mt-0.5 size-8 shrink-0 border border-white/15",
                    layer.swatch,
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="size-3.5 text-white/70" aria-hidden />
                    <p className="text-[12px] font-medium text-white/85">{layer.label}</p>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-white/50">
                    {layer.description}
                  </p>
                  <span className="mt-2 inline-block font-mono text-[9px] uppercase tracking-wider text-white/40">
                    {layer.status}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </aside>
    </div>
  )
}