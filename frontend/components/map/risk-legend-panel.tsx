"use client"

import { useState } from "react"
import { ChevronDown, Layers, RotateCcw } from "lucide-react"
import { useDraggablePanel } from "@/hooks"
import { MAP_RISK_BUCKETS } from "@/lib/risk-scale"
import { cn } from "@/lib/utils"

export function RiskLegendPanel() {
  const [expanded, setExpanded] = useState(false)
  const { ref, handleProps, style, isDragging, isMoved, resetPosition } =
    useDraggablePanel({
      id: "risk-legend-panel",
      corner: "bottom-right",
      cornerInset: 16,
    })

  return (
    <div
      ref={ref}
      className={cn(
        "z-20 border border-white/10 bg-black/60 shadow-2xl shadow-black/40 backdrop-blur-xl",
        expanded ? "w-[min(240px,calc(100vw-2rem))]" : "w-auto"
      )}
      style={style}
      role="group"
      aria-label="Leyenda de colores de riesgo"
    >
      <div
        className={cn(
          "flex items-stretch",
          expanded && "border-b border-white/10"
        )}
      >
        <div
          {...handleProps}
          className={cn(
            "flex min-w-0 flex-1 select-none items-center gap-2 px-3 py-2",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{ touchAction: "none" }}
          aria-label="Arrastrar leyenda de riesgo"
        >
          <Layers className="size-3.5 shrink-0 text-white/55" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75">
            Riesgo
          </span>
          {!expanded && (
            <div className="ml-1 flex items-center gap-0.5" aria-hidden>
              {[...MAP_RISK_BUCKETS].reverse().map((bucket) => (
                <span
                  key={bucket.severity}
                  className="size-2.5 rounded-[2px] border border-white/15"
                  style={{ backgroundColor: bucket.color }}
                />
              ))}
            </div>
          )}
        </div>
        {isMoved && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              resetPosition()
            }}
            aria-label="Restablecer posición"
            title="Restablecer posición"
            className="flex shrink-0 items-center border-l border-white/10 px-2.5 text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
          >
            <RotateCcw className="size-3" />
          </button>
        )}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
          aria-expanded={expanded}
          aria-controls="risk-legend-panel-body"
          aria-label={expanded ? "Colapsar leyenda" : "Expandir leyenda"}
          className="flex shrink-0 items-center border-l border-white/10 px-2.5 text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              !expanded && "-rotate-90"
            )}
            aria-hidden
          />
        </button>
      </div>

      <div
        id="risk-legend-panel-body"
        className={cn("px-3 py-2.5", !expanded && "hidden")}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <p className="mb-2.5 text-[10px] leading-snug text-white/50">
          Color según puntuación compuesta (0–100) del día seleccionado. Combina sismo,
          ola de calor, ola de frío y viento.
        </p>
        <ul className="flex flex-col gap-2" role="list">
          {[...MAP_RISK_BUCKETS].reverse().map((bucket) => (
            <li key={bucket.severity} className="flex items-center gap-2.5">
              <span
                className="size-4 shrink-0 rounded-sm border border-white/20 shadow-sm"
                style={{ backgroundColor: bucket.color }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-medium text-white/90">
                    {bucket.label}
                  </span>
                  <span className="shrink-0 font-mono text-[9px] tabular-nums text-white/45">
                    {bucket.scoreRangeLabel}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 border-t border-white/[0.06] pt-2 text-[9px] leading-snug text-white/40">
          Regiones con zoom alejado; comunas al acercar. Sin dato del día se asume nivel
          moderado (35).
        </p>
      </div>
    </div>
  )
}