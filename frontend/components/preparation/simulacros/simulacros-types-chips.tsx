"use client"

import { X } from "lucide-react"

import { SIMULACRO_TYPE_LABELS } from "@/lib/simulacros-labels"
import { getDrillTypeVisual } from "@/lib/simulacros-visual"
import type { DrillType } from "@/lib/types"
import { cn } from "@/lib/utils"

const TYPE_ORDER: DrillType[] = [
  "sismo_tsunami_borde_costero",
  "sismo_tsunami_educacion",
  "erupcion_volcanica",
  "remocion_en_masa",
  "otro",
]

interface SimulacrosTypesChipsProps {
  selected: DrillType | undefined
  onToggle: (type: DrillType) => void
  onClear: () => void
}

export function SimulacrosTypesChips({
  selected,
  onToggle,
  onClear,
}: SimulacrosTypesChipsProps) {
  return (
    <div
      className="flex flex-col gap-2"
      role="group"
      aria-label="Filtrar por tipo de simulacro"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/55">
          Filtrar por tipo
        </span>
        {selected ? (
          <button
            type="button"
            onClick={onClear}
            className={cn(
              "inline-flex h-6 items-center gap-1 border border-white/15 bg-white/[0.04] px-2 text-[9px] font-semibold uppercase tracking-[1.2px] text-white/65 transition-colors",
              "hover:border-white/25 hover:bg-white/[0.08] hover:text-white",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
            )}
            aria-label="Quitar filtro de tipo"
          >
            <X className="size-2.5" aria-hidden />
            Limpiar tipo
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {TYPE_ORDER.map((t) => {
          const visual = getDrillTypeVisual(t)
          const Icon = visual.icon
          const active = selected === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => onToggle(t)}
              aria-pressed={active}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 border px-2.5 text-[10px] font-semibold uppercase tracking-[1px] whitespace-nowrap transition-all duration-150",
                "border-l-[3px]",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
                "active:scale-[0.985]",
                active
                  ? cn(visual.chipActive, visual.chipBorder)
                  : cn(
                      "border-white/10 text-white/55 hover:border-white/25 hover:bg-white/[0.06] hover:text-white/90",
                      visual.chipBorder,
                    ),
              )}
            >
              <Icon
                className={cn(
                  "size-3 shrink-0",
                  active ? visual.accent : "text-white/45",
                )}
                aria-hidden
              />
              {SIMULACRO_TYPE_LABELS[t]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
