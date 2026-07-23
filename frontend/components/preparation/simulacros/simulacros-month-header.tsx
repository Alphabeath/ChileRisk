import { FamilyPlanStatusChip } from "@/components/preparation/family-plan/family-plan-layout"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

interface SimulacrosMonthHeaderProps {
  monthLabel: string
  year: number
  count: number
  accent?: string
  chipBorder?: string
}

export function SimulacrosMonthHeader({
  monthLabel,
  year,
  count,
  accent,
  chipBorder,
}: SimulacrosMonthHeaderProps) {
  return (
    <header
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex items-center justify-between gap-3 border-l-[3px] px-3 py-2.5 sm:px-4",
        chipBorder,
      )}
    >
      <div className="min-w-0">
        <h3
          className={cn(
            "text-[12px] font-semibold uppercase tracking-[1.2px] text-white sm:text-[13px]",
            accent,
          )}
        >
          {monthLabel}
        </h3>
        <p className={cn(PREPARATION_EYEBROW_CLASS, "mt-0.5 text-white/45")}>
          {year}
        </p>
      </div>
      <FamilyPlanStatusChip tone="empty">
        {count} {count === 1 ? "ejercicio" : "ejercicios"}
      </FamilyPlanStatusChip>
    </header>
  )
}
