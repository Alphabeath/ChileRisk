"use client"

import { useState } from "react"
import { BookOpenText, ChevronDown } from "lucide-react"

import { simulacrosImportance } from "@/data/simulacros"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

export function SimulacrosImportanceAccordion() {
  const [open, setOpen] = useState(true)
  return (
    <section
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col overflow-hidden",
      )}
      aria-labelledby="simulacros-importance-heading"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="simulacros-importance-content"
        className={cn(
          "flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-left transition-colors sm:px-6",
          "hover:bg-white/[0.03]",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
          !open && "border-b-0",
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex size-8 shrink-0 items-center justify-center border border-amber-500/30 bg-amber-500/10 text-amber-200"
            aria-hidden
          >
            <BookOpenText className="size-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/55">
              Contexto SERNAPRED
            </p>
            <h3
              id="simulacros-importance-heading"
              className="mt-0.5 text-[15px] font-semibold leading-snug text-white/90"
            >
              ¿Por qué son importantes los simulacros?
            </h3>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-white/55 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id="simulacros-importance-content"
          className="flex flex-col gap-3 px-5 py-4 sm:px-6"
        >
          <ol className="grid gap-2 sm:grid-cols-2">
            {simulacrosImportance.map(({ n, title, body }) => (
              <li
                key={n}
                className="flex gap-3 border border-white/10 bg-white/[0.02] px-3 py-2.5"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center border border-white/15 bg-black/30 font-mono text-[11px] font-semibold text-white/65">
                  {n}
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-white/90">
                    {title}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-white/70">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-[12px] leading-relaxed text-white/55">
            Cada simulacro es una instancia clave para fortalecer la resiliencia
            de las comunidades y mejorar el funcionamiento del SINAPRED.
            Participar representa un compromiso con el entorno, la seguridad
            familiar y colectiva.
          </p>
        </div>
      ) : null}
    </section>
  )
}
