"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Clock, ShieldCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { DISASTER_PHASE_NAV_STICKY_TOP_PX } from "@/lib/citizen-layout"
import { GLASS_DIVIDER, GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

export interface DisasterPhaseNavItem {
  id: string
  /** Phase id — not named `key` (reserved by React and stripped on client boundaries). */
  phaseKey: "antes" | "durante" | "despues"
  label: string
  subtitle: string
  count: number
}

const phaseIcons: Record<DisasterPhaseNavItem["phaseKey"], LucideIcon> = {
  antes: Clock,
  durante: AlertTriangle,
  despues: ShieldCheck,
}

interface DisasterDetailNavProps {
  color: string
  phases: DisasterPhaseNavItem[]
  className?: string
}

export function DisasterDetailNav({ color, phases, className }: DisasterDetailNavProps) {
  const [activeId, setActiveId] = useState(phases[0]?.id ?? "")

  useEffect(() => {
    const sectionIds = phases.map((p) => p.id)
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: "-28% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    for (const el of elements) observer.observe(el)
    return () => observer.disconnect()
  }, [phases])

  const activeIndex = Math.max(
    0,
    phases.findIndex((p) => p.id === activeId),
  )
  const progressPct = ((activeIndex + 1) / phases.length) * 100

  return (
    <nav
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "relative overflow-hidden",
        className,
      )}
      style={{ top: DISASTER_PHASE_NAV_STICKY_TOP_PX }}
      aria-label="Fases de preparación"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-r",
          color,
        )}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-black/50" aria-hidden />

      <ul
        className={cn(
          "relative grid grid-cols-3 divide-x",
          "lg:grid-cols-1 lg:divide-x-0 lg:divide-y",
          GLASS_DIVIDER,
        )}
      >
        {phases.map((phase) => {
          const Icon = phaseIcons[phase.phaseKey]
          const isActive = phase.id === activeId
          return (
            <li key={phase.id} className="group min-w-0">
              <a
                href={`#${phase.id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex h-full min-h-[4.25rem] flex-col items-center justify-center gap-1 px-2 py-3 text-center transition-all duration-200 sm:min-h-[5.5rem] sm:gap-1.5 sm:px-4 sm:py-4",
                  "lg:min-h-0 lg:flex-row lg:items-center lg:justify-start lg:gap-3 lg:px-4 lg:py-3.5 lg:text-left",
                  "hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/35",
                  isActive && "bg-white/[0.1]",
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center border backdrop-blur-sm transition-all duration-200",
                    isActive
                      ? "border-white/30 bg-white/15"
                      : "border-white/15 bg-black/25 group-hover:border-white/25",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 transition-transform duration-200",
                      isActive ? "text-white" : "text-white/70",
                      "group-hover:scale-[1.2]",
                    )}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 lg:flex-1">
                  <span className="block text-[11px] font-semibold uppercase tracking-[1.2px] text-white/95">
                    {phase.label}
                  </span>
                  <span className="mt-0.5 line-clamp-1 text-[10px] text-white/55 sm:line-clamp-2 lg:line-clamp-1">
                    {phase.subtitle}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/60 lg:ml-2">
                  {phase.count} pasos
                </span>
              </a>
            </li>
          )
        })}
      </ul>

      <div
        className={cn("relative h-1 border-t bg-black/40", GLASS_DIVIDER)}
        role="progressbar"
        aria-valuenow={Math.round(progressPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso por fases"
      >
        <div
          className="h-full bg-white/70 transition-[width] duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </nav>
  )
}