import { Layers } from "lucide-react"

import { simulacroTipos, simulacrosClosing } from "@/data/simulacros"
import {
  GLASS_DIVIDER,
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

export function SimulacrosTypesSection() {
  return (
    <section
      aria-labelledby="simulacros-types-heading"
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col overflow-hidden",
      )}
    >
      <header className="flex items-center gap-3 border-b border-white/10 bg-black/35 px-5 py-4 sm:px-6">
        <span
          className="flex size-9 shrink-0 items-center justify-center border border-white/15 bg-white/[0.06]"
          aria-hidden
        >
          <Layers className="size-4 text-white/80" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/55">
            Tipos de simulacro SENAPRED
          </p>
          <h2
            id="simulacros-types-heading"
            className="mt-0.5 text-[15px] font-semibold leading-snug text-white/90"
          >
            ¿Conoces los tipos de simulacro?
          </h2>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {simulacroTipos.map((tipo) => {
            const Icon = tipo.icon
            return (
              <article
                key={tipo.drillType}
                className={cn(
                  "flex h-full flex-col overflow-hidden border border-white/10 bg-black/40 transition-all duration-200",
                  "hover:-translate-y-[2px] hover:bg-black/55",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 border-b px-4 py-3",
                    GLASS_DIVIDER,
                    "bg-gradient-to-br",
                    tipo.tileColor,
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center border",
                      tipo.iconChip,
                    )}
                    aria-hidden
                  >
                    <Icon className={cn("size-5", tipo.accent)} />
                  </span>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[1.1px] text-white/90">
                    {tipo.title}
                  </h3>
                </div>

                <p className="flex-1 px-4 py-3 text-[12px] leading-snug text-white/75">
                  {tipo.description}
                </p>
              </article>
            )
          })}
        </div>

        <p className="border-t border-white/10 pt-3 text-[12px] leading-relaxed text-white/55">
          {simulacrosClosing}
        </p>
      </div>
    </section>
  )
}
