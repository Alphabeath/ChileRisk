"use client"

import { AlertTriangle, Clock, ShieldCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { GLASS_DIVIDER, GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

export interface DisasterPhaseConfig {
  key: "antes" | "durante" | "despues"
  title: string
  subtitle: string
  accent: string
  border: string
}

interface DisasterPhasePanelProps {
  phase: DisasterPhaseConfig
  items: string[]
  id: string
  color: string
}

export function DisasterPhasePanel({
  phase,
  items,
  id,
  color,
}: DisasterPhasePanelProps) {
  const phaseIcons: Record<DisasterPhaseConfig["key"], LucideIcon> = {
    antes: Clock,
    durante: AlertTriangle,
    despues: ShieldCheck,
  }
  const Icon = phaseIcons[phase.key]

  return (
    <section
      id={id}
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "scroll-mt-24 overflow-hidden border-l-[3px]",
        phase.border,
      )}
    >
      <header
        className={cn(
          "relative flex items-center gap-3 border-b px-4 py-4 sm:px-6",
          GLASS_DIVIDER,
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-r opacity-80",
            color,
          )}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-black/55" aria-hidden />
        <div className="relative flex size-10 shrink-0 items-center justify-center border border-white/15 bg-black/30 backdrop-blur-sm">
          <Icon className={cn("size-5", phase.accent)} aria-hidden />
        </div>
        <div className="relative min-w-0 flex-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/95">
            {phase.title}
          </h2>
          <p className="mt-0.5 text-[11px] text-white/55">{phase.subtitle}</p>
        </div>
        <span className="relative shrink-0 font-mono text-[10px] uppercase tracking-wider text-white/50">
          {items.length} pasos
        </span>
      </header>
      <ol className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 sm:gap-3 sm:p-5 lg:grid-cols-2">
        {items.map((item, i) => {
          const isPriority = phase.key === "durante" && i === 0
          return (
            <li
              key={i}
              className={cn(
                "group flex gap-3 border px-3 py-3 sm:px-4 transition-all duration-150 hover:-translate-y-px",
                isPriority
                  ? "col-span-1 border-amber-500/40 bg-amber-500/[0.08] sm:col-span-2 hover:bg-amber-500/[0.13]"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/25",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center border font-mono text-[10px] font-semibold tabular-nums transition-all duration-150",
                  isPriority
                    ? "border-amber-500/35 bg-amber-500/15 text-amber-200 group-hover:border-amber-400/50 group-hover:bg-amber-500/25"
                    : "border-white/10 bg-white/[0.05] text-white/55 group-hover:border-white/25 group-hover:bg-white/[0.08] group-hover:text-white/70",
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                {isPriority && (
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-[1.1px] text-amber-300/90">
                    Acción prioritaria
                  </p>
                )}
                <span
                  className={cn(
                    "text-[12.5px] leading-snug",
                    isPriority ? "text-white/95" : "text-white/80",
                  )}
                >
                  {item}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}