"use client"

import { CalendarOff, Inbox } from "lucide-react"

import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

interface SimulacrosEmptyStateProps {
  view: "upcoming" | "past"
  embedded?: boolean
}

export function SimulacrosEmptyState({ view, embedded = false }: SimulacrosEmptyStateProps) {
  const Icon = view === "upcoming" ? CalendarOff : Inbox
  const title =
    view === "upcoming"
      ? "Sin simulacros próximos"
      : "Sin simulacros pasados"
  const hint =
    view === "upcoming"
      ? "SERNAPRED no ha publicado simulacros próximos en su calendario público."
      : "Aún no se han registrado simulacros pasados para los filtros aplicados."

  return (
    <div
      className={cn(
        embedded
          ? "flex flex-col items-center justify-center gap-2 border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center"
          : cn(
              GLASS_PANEL_CLASS,
              GLASS_MICA_INTERACTIVE_CLASS,
              "flex flex-col items-center justify-center gap-2 border-dashed px-6 py-14 text-center",
            ),
      )}
    >
      <Icon className="size-6 text-white/35" aria-hidden />
      <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/80">
        {title}
      </p>
      <p className="max-w-md text-[12px] text-white/45">{hint}</p>
    </div>
  )
}
