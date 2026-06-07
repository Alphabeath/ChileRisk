import { EvacuacionMapSketch } from "@/components/evacuacion/evacuacion-map-sketch"
import { GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { Route } from "lucide-react"
import { cn } from "@/lib/utils"

export default function EvacuacionPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-16 sm:gap-5 sm:px-6 lg:px-8">
        <header className={cn(GLASS_PANEL_CLASS, GLASS_MICA_INTERACTIVE_CLASS, "relative overflow-hidden")}>
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-950/70 via-slate-900/90 to-red-950/60"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
            aria-hidden
          />
          <Route
            className="pointer-events-none absolute -right-4 top-1/2 size-36 -translate-y-1/2 text-white/[0.07] sm:size-48"
            strokeWidth={1}
            aria-hidden
          />

          <div className="relative flex flex-col gap-4 p-5 sm:p-8">
            <span className="inline-flex w-fit items-center gap-2 border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[1.2px] text-amber-200/90">
              Bosquejo · integración mapa pendiente
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Evacuación
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-white/75 sm:text-base">
              Visualiza zonas de riesgo y vías de evacuación de tu territorio. Esta página
              reutilizará el mapa de ChileRisk con capas dedicadas a rutas seguras y puntos
              de encuentro.
            </p>
          </div>
        </header>

        <EvacuacionMapSketch />

        <p className="text-center text-[11px] text-white/40">
          Datos de evacuación y geometrías de rutas aún no conectados al backend.
        </p>
      </div>
    </div>
  )
}