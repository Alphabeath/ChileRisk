"use client"

import {
  DRILL_TYPE_COLORS,
  DRILL_TYPE_LABELS,
} from "@/lib/simulacros"
import type { DrillType } from "@/lib/types"
import { cn } from "@/lib/utils"

export const SIMULACRO_FILTER_TYPES: readonly DrillType[] = [
  "sismo_tsunami_borde_costero",
  "sismo_tsunami_educacion",
  "erupcion_volcanica",
  "remocion_en_masa",
  "otro",
]

const FILTER_SHORT_LABELS: Record<DrillType, string> = {
  sismo_tsunami_borde_costero: "Borde costero",
  sismo_tsunami_educacion: "Educación",
  erupcion_volcanica: "Volcán",
  remocion_en_masa: "Remoción en masa",
  otro: "Otro",
}

type SimulacrosTypeFilterProps = {
  selectedType: DrillType | null
  onSelect: (type: DrillType | null) => void
  labelledBy?: string
  controlsId?: string
  className?: string
}

export function SimulacrosTypeFilter({
  selectedType,
  onSelect,
  labelledBy = "simulacros-filtro-label",
  controlsId,
  className,
}: SimulacrosTypeFilterProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex min-h-11 items-center justify-between gap-3">
        <p
          id={labelledBy}
          className="font-mono text-[10px] font-semibold tracking-[1.4px] text-muted-foreground uppercase"
        >
          Filtrar por tipo
        </p>
        {selectedType !== null ? (
          <button
            type="button"
            className="inline-flex min-h-11 shrink-0 items-center px-3 font-mono text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={() => onSelect(null)}
          >
            Limpiar filtro
          </button>
        ) : null}
      </div>

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
        role="group"
        aria-labelledby={labelledBy}
      >
        <FilterChip
          label="Todos"
          title="Todos los tipos de ejercicio"
          selected={selectedType === null}
          accent="#0167b7"
          ink="#ffffff"
          controlsId={controlsId}
          onClick={() => onSelect(null)}
        />
        {SIMULACRO_FILTER_TYPES.map((type) => {
          const colors = DRILL_TYPE_COLORS[type]
          return (
            <FilterChip
              key={type}
              label={FILTER_SHORT_LABELS[type]}
              title={DRILL_TYPE_LABELS[type]}
              selected={selectedType === type}
              accent={colors.accent}
              ink={colors.ink}
              controlsId={controlsId}
              onClick={() => onSelect(type)}
            />
          )
        })}
      </div>
    </div>
  )
}

function FilterChip({
  label,
  title,
  selected,
  accent,
  ink,
  controlsId,
  onClick,
}: {
  label: string
  title: string
  selected: boolean
  accent: string
  ink: string
  controlsId?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={selected}
      aria-controls={controlsId}
      onClick={onClick}
      className={cn(
        "group relative flex min-h-14 items-stretch overflow-hidden border text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        selected
          ? "border-transparent shadow-[0_10px_24px_color-mix(in_oklch,var(--foreground)_12%,transparent)]"
          : "border-border bg-card hover:border-[color-mix(in_oklch,var(--foreground)_22%,var(--border))]",
      )}
      style={
        selected
          ? {
              backgroundColor: accent,
              color: ink,
            }
          : undefined
      }
    >
      <span
        aria-hidden
        className={cn(
          "w-1.5 shrink-0 self-stretch",
          selected ? "bg-black/15 dark:bg-white/20" : "",
        )}
        style={selected ? undefined : { backgroundColor: accent }}
      />
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2">
        <span
          className={cn(
            "font-mono text-[10px] font-bold tracking-[1.1px] uppercase",
            !selected && "text-foreground",
          )}
        >
          {label}
        </span>
      </span>
    </button>
  )
}
