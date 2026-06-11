"use client"

import { useState } from "react"
import { Home, Square, Building2, House, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  FLOOR_MAP_TEMPLATES,
  type FloorMapTemplate,
} from "@/lib/floor-map-templates"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface FloorMapTemplateTabsProps {
  onApply: (template: FloorMapTemplate) => void
  currentRoomCount: number
  compact?: boolean
}

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  blank: Square,
  "apartment-1b": Building2,
  "house-2b": Home,
  "house-3b": House,
  "house-4b": House,
}

export function FloorMapTemplateTabs({
  onApply,
  currentRoomCount,
  compact = false,
}: FloorMapTemplateTabsProps) {
  const [selectedId, setSelectedId] = useState<string>("blank")
  const [confirming, setConfirming] = useState(false)

  const selected =
    FLOOR_MAP_TEMPLATES.find((t) => t.id === selectedId) ?? FLOOR_MAP_TEMPLATES[0]

  function handleApplyClick() {
    if (selected.rooms.length === 0) {
      onApply(selected)
      setConfirming(false)
      return
    }
    if (currentRoomCount > 0 && !confirming) {
      setConfirming(true)
      return
    }
    onApply(selected)
    setConfirming(false)
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        !compact && cn(GLASS_PANEL_CLASS, "gap-3 p-4"),
      )}
    >
      <div className="flex items-center gap-2">
        <Layers className="size-3.5 shrink-0 text-white/55" aria-hidden />
        <h3 className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75">
          Plantillas
        </h3>
      </div>

      <div
        role="tablist"
        aria-label="Plantillas de plano"
        className="grid grid-cols-5 gap-1"
      >
        {FLOOR_MAP_TEMPLATES.map((tpl) => {
          const Icon = TEMPLATE_ICONS[tpl.id] ?? Square
          const active = tpl.id === selectedId
          return (
            <button
              key={tpl.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setSelectedId(tpl.id)
                setConfirming(false)
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 border px-1.5 py-1.5 transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
                active
                  ? "border-white/20 bg-white/15 text-white"
                  : "border-white/10 bg-black/30 text-white/55 hover:border-white/20 hover:bg-white/[0.06] hover:text-white/80",
              )}
              title={tpl.name}
            >
              <Icon className="size-3.5" aria-hidden />
              <span className="truncate text-[8px] font-semibold uppercase tracking-wider">
                {shortName(tpl.id)}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-[10px] leading-snug text-white/50">{selected.description}</p>

      {confirming ? (
        <div className="flex flex-col gap-2 border border-amber-500/30 bg-amber-500/10 p-2">
          <p className="text-[10px] text-amber-100/90">
            Esto reemplazará las {currentRoomCount} habitaciones actuales. Marcadores,
            zonas y rutas se conservan.
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleApplyClick}>
              Confirmar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleApplyClick}
          className="w-full"
        >
          {selected.rooms.length === 0
            ? "Limpiar plano"
            : `Aplicar (${selected.rooms.length} hab.)`}
        </Button>
      )}
    </div>
  )
}

function shortName(id: string): string {
  switch (id) {
    case "blank":
      return "Blanco"
    case "apartment-1b":
      return "1D/1B"
    case "house-2b":
      return "2D/1B"
    case "house-3b":
      return "3D/2B"
    case "house-4b":
      return "4D/2B"
    default:
      return id
  }
}