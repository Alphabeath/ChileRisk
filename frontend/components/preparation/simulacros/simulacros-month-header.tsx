"use client"

import { CalendarRange } from "lucide-react"

import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

interface SimulacrosMonthHeaderProps {
  monthLabel: string
  year: number
  count: number
  accent?: string
  chipBorder?: string
  showRail?: boolean
}

export function SimulacrosMonthHeader({
  monthLabel,
  year,
  count,
  accent,
  chipBorder,
  showRail = false,
}: SimulacrosMonthHeaderProps) {
  return (
    <header className="relative flex items-center gap-3">
      {showRail ? (
        <span
          className={cn(
            "absolute top-1/2 z-10 size-5 -translate-x-1/2 -translate-y-1/2 border-[3px] bg-[var(--background)] ring-4 ring-[var(--background)] sm:size-6",
            "-left-3 sm:-left-3.5",
            accent ? cn(chipBorder, accent) : "border-white/40",
          )}
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          GLASS_PANEL_CLASS,
          GLASS_MICA_INTERACTIVE_CLASS,
          "flex flex-1 items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5",
          chipBorder && "border-l-[3px]",
          chipBorder,
        )}
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center border border-white/15 bg-white/[0.05] text-white/80 sm:size-10"
          aria-hidden
        >
          <CalendarRange className="size-4 sm:size-[1.125rem]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "text-[13px] font-semibold uppercase tracking-[1.3px] text-white sm:text-[14px]",
              accent,
            )}
          >
            {monthLabel}
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">
            {year}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-7 shrink-0 items-center gap-1 border border-white/15 bg-white/[0.04] px-2.5 font-mono text-[10.5px] tabular-nums",
            count === 0
              ? "text-white/45"
              : "text-white/85",
          )}
        >
          <span className="font-semibold tabular-nums">{count}</span>
          <span className="text-[9.5px] font-semibold uppercase tracking-[1.1px] text-white/55">
            {count === 1 ? "ejercicio" : "ejercicios"}
          </span>
        </span>
      </div>
    </header>
  )
}
