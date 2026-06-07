"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Clock, ShieldCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  CITIZEN_NAVBAR_TOP_PX,
  DISASTER_PHASE_NAV_STICKY_TOP_PX,
} from "@/lib/citizen-layout"
import { GLASS_DIVIDER, GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { useUIStore } from "@/stores/ui-store"
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
  const [isPinned, setIsPinned] = useState(false)
  const stickyRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const setDisasterPhaseNavPinned = useUIStore((s) => s.setDisasterPhaseNavPinned)

  useEffect(() => {
    const syncNavState = () => {
      const sentinelTop = sentinelRef.current?.getBoundingClientRect().top ?? Infinity
      const pinned = sentinelTop < DISASTER_PHASE_NAV_STICKY_TOP_PX
      setIsPinned(pinned)
      setDisasterPhaseNavPinned(pinned)

      const navBottom = stickyRef.current?.getBoundingClientRect().bottom ?? 120
      const triggerLine = navBottom + 8
      let currentId = phases[0]?.id ?? ""

      for (const phase of phases) {
        const el = document.getElementById(phase.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= triggerLine) {
          currentId = phase.id
        }
      }

      setActiveId(currentId)
    }

    syncNavState()
    window.addEventListener("scroll", syncNavState, { passive: true, capture: true })
    window.addEventListener("resize", syncNavState, { passive: true })
    return () => {
      window.removeEventListener("scroll", syncNavState, { capture: true })
      window.removeEventListener("resize", syncNavState)
      setDisasterPhaseNavPinned(false)
    }
  }, [phases, setDisasterPhaseNavPinned])

  const activeIndex = Math.max(
    0,
    phases.findIndex((p) => p.id === activeId),
  )
  const progressPct = ((activeIndex + 1) / phases.length) * 100

  const stickyTop = isPinned ? CITIZEN_NAVBAR_TOP_PX : DISASTER_PHASE_NAV_STICKY_TOP_PX

  return (
    <>
      <div ref={sentinelRef} className="pointer-events-none h-px w-full" aria-hidden />
      <div
        ref={stickyRef}
        className={cn(
          "sticky z-20 transition-[top] duration-200 ease-out",
          isPinned && "z-50",
          className,
        )}
        style={{ top: stickyTop }}
      >
      <nav
        className={cn(
          GLASS_PANEL_CLASS,
          GLASS_MICA_INTERACTIVE_CLASS,
          "overflow-hidden",
        )}
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

        <ul className={cn("relative grid grid-cols-3 divide-x", GLASS_DIVIDER)}>
          {phases.map((phase) => {
            const Icon = phaseIcons[phase.phaseKey]
            const isActive = phase.id === activeId
            return (
              <li key={phase.id} className="group min-w-0">
                <a
                  href={`#${phase.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex min-h-[3rem] flex-row items-center justify-center gap-2 px-2 py-2.5 text-center transition-all duration-200 sm:min-h-[3.25rem] sm:px-3",
                    "hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/35",
                    isActive && "bg-white/[0.1]",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center border backdrop-blur-sm transition-all duration-200 sm:size-8",
                      isActive
                        ? "border-white/30 bg-white/15"
                        : "border-white/15 bg-black/25 group-hover:border-white/25",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-3.5 transition-transform duration-200 sm:size-4",
                        isActive ? "text-white" : "text-white/70",
                        "group-hover:scale-[1.2]",
                      )}
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-[1.1px] text-white/95 sm:text-[11px] sm:tracking-[1.2px]">
                      {phase.label}
                    </span>
                    <span className="mt-0.5 hidden line-clamp-1 text-[10px] text-white/55 sm:block">
                      {phase.subtitle}
                    </span>
                  </div>
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
      </div>
    </>
  )
}