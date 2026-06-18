"use client"

import { CalendarCheck2, CalendarOff, ExternalLink } from "lucide-react"

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
  const Icon = view === "upcoming" ? CalendarOff : CalendarCheck2
  const title =
    view === "upcoming"
      ? "Sin simulacros próximos"
      : "Sin simulacros pasados"
  const hint =
    view === "upcoming"
      ? "SERNAPRED no ha publicado simulacros próximos en su calendario público. Vuelve a revisar pronto o consulta el calendario oficial."
      : "Aún no se han registrado simulacros pasados para los filtros aplicados. Ajusta el rango o limpia los filtros."

  return (
    <div
      className={cn(
        embedded
          ? "flex flex-col items-center justify-center gap-3 border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center"
          : cn(
              GLASS_PANEL_CLASS,
              GLASS_MICA_INTERACTIVE_CLASS,
              "flex flex-col items-center justify-center gap-3 border-dashed px-6 py-14 text-center",
            ),
      )}
    >
      <span
        className="flex size-12 items-center justify-center border border-white/15 bg-black/30 text-white/45"
        aria-hidden
      >
        <Icon className="size-6" />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/85">
          {title}
        </p>
        <p className="mt-1.5 max-w-md text-[12px] leading-relaxed text-white/55">
          {hint}
        </p>
      </div>
      {view === "upcoming" ? (
        <a
          href="https://senapred.cl/simulacros/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex h-8 items-center gap-2 border border-white/15 bg-white/[0.06] px-4 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/80 transition-colors",
            "hover:border-white/30 hover:bg-white/[0.12] hover:text-white",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
          )}
        >
          Ver calendario SENAPRED
          <ExternalLink className="size-3" aria-hidden />
        </a>
      ) : null}
    </div>
  )
}
