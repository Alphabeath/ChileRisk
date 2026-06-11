"use client"

import { Check } from "lucide-react"

import {
  FLOOR_MAP_PHASES,
  floorMapPhaseIndex,
  type FloorMapPhase,
} from "@/lib/floor-map-phases"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

interface FloorMapPhaseStepperProps {
  current: FloorMapPhase
  maxReached: FloorMapPhase
  onSelect: (phase: FloorMapPhase) => void
  className?: string
}

export function FloorMapPhaseStepper({
  current,
  maxReached,
  onSelect,
  className,
}: FloorMapPhaseStepperProps) {
  const maxIndex = floorMapPhaseIndex(maxReached)

  return (
    <nav
      className={cn(GLASS_PANEL_CLASS, "flex flex-col gap-3 p-3", className)}
      aria-label="Pasos del mapa de vivienda"
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75">
        Pasos
      </h3>
      <ol className="flex flex-col gap-1">
        {FLOOR_MAP_PHASES.map((step, index) => {
          const isCurrent = step.id === current
          const isDone = floorMapPhaseIndex(step.id) < floorMapPhaseIndex(current)
          const isReachable = floorMapPhaseIndex(step.id) <= maxIndex

          return (
            <li key={step.id} className="relative">
              <button
                type="button"
                disabled={!isReachable}
                onClick={() => isReachable && onSelect(step.id)}
                className={cn(
                  "flex w-full items-start gap-2.5 border px-2.5 py-2.5 text-left transition-colors",
                  isReachable
                    ? "hover:bg-white/[0.06]"
                    : "cursor-not-allowed opacity-45",
                  isCurrent
                    ? "border-white/25 bg-white/10"
                    : "border-white/10 bg-black/20",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center border text-[10px] font-semibold",
                    isCurrent
                      ? "border-white/35 bg-white/15 text-white"
                      : isDone
                        ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-100"
                        : "border-white/15 bg-black/40 text-white/55",
                  )}
                >
                  {isDone ? <Check className="size-3" aria-hidden /> : step.step}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-[10px] font-semibold uppercase tracking-[1px]",
                      isCurrent ? "text-white" : "text-white/75",
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-white/45">
                    {step.description}
                  </span>
                </span>
              </button>
              {index < FLOOR_MAP_PHASES.length - 1 ? (
                <span
                  className="absolute -bottom-1 left-[1.35rem] h-2 w-px bg-white/15"
                  aria-hidden
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}