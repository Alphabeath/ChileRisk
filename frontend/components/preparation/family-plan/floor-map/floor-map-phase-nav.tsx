"use client"

import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  FLOOR_MAP_PHASES,
  floorMapPhaseIndex,
  type FloorMapPhase,
} from "@/lib/floor-map-phases"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

interface FloorMapPhaseNavProps {
  current: FloorMapPhase
  maxReached: FloorMapPhase
  onSelect: (phase: FloorMapPhase) => void
  onBack?: () => void
  onContinue?: () => void
  continueLabel?: string
  onSave?: () => void
  saveLabel?: string
  className?: string
}

export function FloorMapPhaseNav({
  current,
  maxReached,
  onSelect,
  onBack,
  onContinue,
  continueLabel = "Continuar",
  onSave,
  saveLabel = "Guardar plano",
  className,
}: FloorMapPhaseNavProps) {
  const maxIndex = floorMapPhaseIndex(maxReached)
  const currentIndex = floorMapPhaseIndex(current)

  return (
    <nav
      className={cn(
        GLASS_PANEL_CLASS,
        "sticky top-0 z-40 flex flex-col gap-3 p-3",
        className,
      )}
      aria-label="Pasos del mapa de vivienda"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-4">
        <ol className="grid w-full flex-1 grid-cols-3 gap-1.5 sm:gap-2">
          {FLOOR_MAP_PHASES.map((step) => {
            const isCurrent = step.id === current
            const isDone = floorMapPhaseIndex(step.id) < currentIndex
            const isReachable = floorMapPhaseIndex(step.id) <= maxIndex

            return (
              <li key={step.id} className="flex min-w-0">
                <button
                  type="button"
                  disabled={!isReachable}
                  onClick={() => isReachable && onSelect(step.id)}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-2.5 border px-2.5 py-2.5 text-left transition-colors sm:px-3",
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
                      "flex size-6 shrink-0 items-center justify-center border text-[10px] font-semibold",
                      isCurrent
                        ? "border-white/35 bg-white/15 text-white"
                        : isDone
                          ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-100"
                          : "border-white/15 bg-black/40 text-white/55",
                    )}
                  >
                    {isDone ? <Check aria-hidden /> : step.step}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-[10px] font-semibold uppercase tracking-[1px]",
                        isCurrent ? "text-white" : "text-white/75",
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="mt-0.5 hidden truncate text-[10px] leading-snug text-white/45 sm:block">
                      {step.description}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        {(onBack || onSave || onContinue) ? (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white/10 pt-3 lg:w-auto lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
            {onBack ? (
              <Button type="button" size="sm" variant="outline" onClick={onBack}>
                <ArrowLeft data-icon="inline-start" />
                Anterior
              </Button>
            ) : null}
            {onSave ? (
              <Button type="button" size="sm" onClick={onSave}>
                <Save data-icon="inline-start" />
                {saveLabel}
              </Button>
            ) : null}
            {onContinue ? (
              <Button type="button" size="sm" variant={onSave ? "outline" : "default"} onClick={onContinue}>
                {continueLabel}
                <ArrowRight data-icon="inline-end" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </nav>
  )
}