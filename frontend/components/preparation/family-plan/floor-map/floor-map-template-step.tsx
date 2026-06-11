"use client"

import { useEffect, useState } from "react"
import { Home, Square, Building2, House, Layers } from "lucide-react"
import {
  FLOOR_MAP_TEMPLATES,
  type FloorMapTemplate,
} from "@/lib/floor-map-templates"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface FloorMapTemplateStepProps {
  onPreviewChange: (template: FloorMapTemplate) => void
  className?: string
}

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  blank: Square,
  "apartment-1b": Building2,
  "house-2b": Home,
  "house-3b": House,
  "house-4b": House,
}

/** Bento: 3 arriba + 2 abajo (sm+); móvil 2×2 + ancho completo abajo */
const BENTO_SPAN: Record<string, string> = {
  blank: "col-span-1 sm:col-span-2",
  "apartment-1b": "col-span-1 sm:col-span-2",
  "house-2b": "col-span-1 sm:col-span-2",
  "house-3b": "col-span-1 sm:col-span-3",
  "house-4b": "col-span-2 sm:col-span-3",
}

export function FloorMapTemplateStep({
  onPreviewChange,
  className,
}: FloorMapTemplateStepProps) {
  const [selectedId, setSelectedId] = useState<string>("apartment-1b")

  const selected =
    FLOOR_MAP_TEMPLATES.find((t) => t.id === selectedId) ?? FLOOR_MAP_TEMPLATES[1]

  useEffect(() => {
    onPreviewChange(selected)
  }, [onPreviewChange, selected])

  function pickTemplate(id: string) {
    setSelectedId(id)
    const tpl = FLOOR_MAP_TEMPLATES.find((t) => t.id === id)
    if (tpl) onPreviewChange(tpl)
  }

  return (
    <div
      className={cn(
        GLASS_PANEL_CLASS,
        "flex min-h-0 flex-1 flex-col gap-4 p-4 sm:gap-5 sm:p-5",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-2">
        <Layers className="size-4 shrink-0 text-white/55" aria-hidden />
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/85">
            Paso 1 · Elige una plantilla
          </h3>
          <p className="mt-1 text-[11px] leading-snug text-white/50">
            Selecciona la que más se parezca a tu vivienda. Podrás ajustarla en el
            siguiente paso.
          </p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-2 sm:grid-cols-6 sm:grid-rows-2 sm:gap-2.5">
        {FLOOR_MAP_TEMPLATES.map((tpl) => {
          const Icon = TEMPLATE_ICONS[tpl.id] ?? Square
          const active = tpl.id === selectedId
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => pickTemplate(tpl.id)}
              className={cn(
                "flex h-full min-h-0 flex-col items-start gap-2 border p-2.5 text-left transition-colors sm:p-3",
                BENTO_SPAN[tpl.id],
                active
                  ? "border-white/25 bg-white/12 text-white"
                  : "border-white/10 bg-black/30 text-white/70 hover:border-white/20 hover:bg-white/[0.06]",
              )}
            >
              <Icon className="size-4 shrink-0 sm:size-5" aria-hidden />
              <span className="block text-[11px] font-medium leading-snug sm:text-[12px]">
                {tpl.name}
              </span>
              <span className="line-clamp-3 flex-1 text-[9px] leading-snug text-white/50 sm:line-clamp-4 sm:text-[10px]">
                {tpl.description}
              </span>
              <span className="mt-auto font-mono text-[8px] uppercase tracking-wider text-white/40">
                {tpl.rooms.length === 0
                  ? "Sin habitaciones"
                  : `${tpl.rooms.length} habitaciones`}
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-auto shrink-0 text-center text-[10px] leading-snug text-white/45">
        Usa <span className="text-white/70">Continuar</span> en la barra superior para
        aplicar la plantilla.
      </p>
    </div>
  )
}