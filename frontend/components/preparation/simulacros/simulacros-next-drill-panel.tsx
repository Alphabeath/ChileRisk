"use client"

import { SimulacrosCountdown } from "@/components/preparation/simulacros/simulacros-countdown"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import { formatDrillDate } from "@/lib/simulacros-format"
import { cn } from "@/lib/utils"
import type { Simulacro } from "@/lib/types"

interface SimulacrosNextDrillPanelProps {
  next: Simulacro | null | undefined
}

/** Next-drill countdown — lives under the page hero so hero height stays stable. */
export function SimulacrosNextDrillPanel({ next }: SimulacrosNextDrillPanelProps) {
  if (!next?.drill_date) return null

  return (
    <aside
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "px-5 py-5 sm:px-8",
      )}
    >
      <p className={cn(PREPARATION_EYEBROW_CLASS, "text-amber-200/90")}>
        Próximo simulacro
      </p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-white sm:text-lg">
            {next.title || "Simulacro SENAPRED"}
          </p>
          <p className="mt-1 text-[12.5px] text-white/55">
            {formatDrillDate(next.drill_date)}
            {next.region_name ? ` · ${next.region_name}` : null}
          </p>
        </div>
        <SimulacrosCountdown drillDate={next.drill_date} />
      </div>
    </aside>
  )
}
