"use client"

import { Check, LayoutGrid, MapPinned, Pencil, Route, Siren } from "lucide-react"

import { FloorMapCanvas } from "@/components/preparation/family-plan/floor-map/floor-map-canvas"
import type { LayerVisibility } from "@/components/preparation/family-plan/floor-map-layer-toggles"
import { Button } from "@/components/ui/button"
import type { SaveStatus } from "@/hooks/use-family-plan"
import { FLOOR_MAP_SELECT_TOOL } from "@/lib/floor-map-tools"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import type { FloorMap } from "@/lib/types"
import { cn } from "@/lib/utils"

const REVIEW_VISIBILITY: LayerVisibility = {
  rooms: true,
  markers: true,
  routes: true,
  zones: true,
}

interface FloorMapReviewStepProps {
  floorMap: FloorMap
  saveStatus: SaveStatus
  onEdit?: () => void
  editLabel?: string
  className?: string
}

function formatSavedAt(value: string): string {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function FloorMapReviewStep({
  floorMap,
  saveStatus,
  onEdit,
  editLabel = "Editar plano",
  className,
}: FloorMapReviewStepProps) {
  const isSaved = floorMap.saved_at !== null
  const stats = [
    { label: "Habitaciones", value: floorMap.rooms.length, icon: LayoutGrid },
    { label: "Emergencia", value: floorMap.markers.length, icon: Siren },
    { label: "Rutas", value: floorMap.routes.length, icon: Route },
    { label: "Zonas", value: floorMap.zones.length, icon: MapPinned },
  ]

  const statusMessage =
    saveStatus === "saving"
      ? "Guardando plano..."
      : saveStatus === "saved"
        ? "Plano guardado en tu plan familiar."
        : saveStatus === "error"
          ? "No se pudo guardar. Intenta de nuevo."
          : "Vista de solo lectura. Usa Editar plano para hacer cambios."

  return (
    <div className={cn("flex flex-col gap-3 p-3 sm:p-4", className)}>
      <div
        className={cn(
          GLASS_PANEL_CLASS,
          "flex flex-col gap-3 border-0 bg-black/40 p-3 sm:p-4",
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center border border-emerald-500/50 bg-emerald-500/15 text-emerald-200">
              <Check className="size-4" aria-hidden />
            </span>
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/85">
                Mapa de vivienda guardado
              </h3>
              <p className="mt-1 text-[11px] leading-snug text-white/50">{statusMessage}</p>
              {isSaved && floorMap.saved_at ? (
                <p className="mt-1 font-mono text-[10px] text-white/40">
                  Guardado el {formatSavedAt(floorMap.saved_at)}
                </p>
              ) : null}
            </div>
          </div>

          {onEdit ? (
            <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={onEdit}>
              <Pencil data-icon="inline-start" />
              {editLabel}
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="flex items-center gap-2 border border-white/10 bg-black/25 px-2.5 py-2"
              >
                <Icon className="size-3.5 shrink-0 text-white/45" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-wider text-white/45">{item.label}</p>
                  <p className="font-mono text-[12px] font-semibold text-white/85">{item.value}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <FloorMapCanvas
        floorMap={floorMap}
        visibility={REVIEW_VISIBILITY}
        routeDraft={[]}
        activeTool={FLOOR_MAP_SELECT_TOOL}
        readOnly
        className="border border-white/15"
        onCanvasPlace={() => {}}
        onUpdate={() => {}}
      />
    </div>
  )
}