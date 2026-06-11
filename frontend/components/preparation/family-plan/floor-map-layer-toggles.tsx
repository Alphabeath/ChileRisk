"use client"

import {
  Eye,
  EyeOff,
  LayoutGrid,
  Route,
  Shield,
  Siren,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

export interface LayerVisibility {
  rooms: boolean
  markers: boolean
  routes: boolean
  zones: boolean
}

interface FloorMapLayerTogglesProps {
  visibility: LayerVisibility
  onToggle: (key: keyof LayerVisibility, value: boolean) => void
  counts: { rooms: number; markers: number; routes: number; zones: number }
  embedded?: boolean
  flyout?: boolean
}

const LAYERS: {
  key: keyof LayerVisibility
  label: string
  icon: LucideIcon
}[] = [
  { key: "rooms", label: "Habitaciones", icon: LayoutGrid },
  { key: "markers", label: "Puntos de emergencia", icon: Siren },
  { key: "routes", label: "Rutas", icon: Route },
  { key: "zones", label: "Zonas", icon: Shield },
]

export function FloorMapLayerToggles({
  visibility,
  onToggle,
  counts,
  embedded = false,
  flyout = false,
}: FloorMapLayerTogglesProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        flyout
          ? ""
          : embedded
            ? "border-t border-white/10 pt-3"
            : cn(GLASS_PANEL_CLASS, "p-3"),
      )}
    >
      {!flyout ? (
        <div className="flex items-center gap-2">
          <Eye className="size-3 shrink-0 text-white/55" aria-hidden />
          <span className="text-[9px] font-semibold uppercase tracking-[1.1px] text-white/75">
            Visibilidad
          </span>
        </div>
      ) : null}
      <ul className="flex flex-col gap-0.5">
        {LAYERS.map((layer) => {
          const checked = visibility[layer.key]
          const LayerIcon = layer.icon
          const VisibilityIcon = checked ? Eye : EyeOff
          return (
            <li key={layer.key}>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-none px-1.5 py-1.5 transition-colors hover:bg-white/[0.06]",
                  !checked && "opacity-60",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) =>
                    onToggle(layer.key, value === true)
                  }
                />
                <LayerIcon className="size-3.5 shrink-0 text-white/55" aria-hidden />
                <span className="flex-1 text-[10.5px] text-white/75">
                  {layer.label}
                </span>
                <VisibilityIcon className="size-3 shrink-0 text-white/40" aria-hidden />
                <span className="min-w-[1.25rem] text-right font-mono text-[10px] tabular-nums text-white/45">
                  {counts[layer.key]}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}