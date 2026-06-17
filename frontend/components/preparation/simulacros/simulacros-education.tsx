import {
  GLASS_DIVIDER,
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import {
  simulacroTipos,
  simulacrosClosing,
  simulacrosImportance,
  simulacrosIntro,
} from "@/data/simulacros"
import { cn } from "@/lib/utils"

const BODY = "text-[12px] leading-relaxed text-white/70"
const SECTION = "text-[11px] font-semibold uppercase tracking-[1.2px] text-white/90"

export function SimulacrosEducation() {
  return (
    <section
      aria-labelledby="simulacros-education-heading"
      className={cn(GLASS_PANEL_CLASS, GLASS_MICA_INTERACTIVE_CLASS, "overflow-hidden")}
    >
      <div className="border-b border-white/10 bg-gradient-to-r from-[var(--primary-chile)]/20 via-transparent to-[var(--secondary-chile)]/15 px-5 py-5 sm:px-6">
        <p className={SECTION}>{simulacrosIntro.title}</p>
        <h2
          id="simulacros-education-heading"
          className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl"
        >
          {simulacrosIntro.subtitle}
        </h2>
        <p className={cn("mt-3 max-w-3xl", BODY)}>{simulacrosIntro.lead}</p>
        <p className={cn("mt-2 max-w-3xl", BODY)}>{simulacrosIntro.body}</p>
      </div>

      <div className={cn("grid gap-0 lg:grid-cols-[1fr_1.1fr]", GLASS_DIVIDER)}>
        <div className="border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <h3 className={SECTION}>¿Por qué son importantes?</h3>
          <ol className="mt-4 flex flex-col gap-2">
            {simulacrosImportance.map(({ n, title, body }) => (
              <li
                key={n}
                className="flex gap-3 border border-white/10 bg-white/[0.02] px-3 py-2.5"
              >
                <span className="flex size-6 shrink-0 items-center justify-center border border-white/15 bg-black/30 font-mono text-[11px] font-semibold text-white/50">
                  {n}
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-white/90">{title}</p>
                  <p className={cn("mt-0.5", BODY)}>{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="p-5 sm:p-6">
          <h3 className={SECTION}>Tipos de simulacros</h3>
          <ul className="mt-4 flex flex-col gap-3">
            {simulacroTipos.map((tipo) => {
              const Icon = tipo.icon
              return (
                <li
                  key={tipo.drillType}
                  className={cn(
                    "flex gap-3 border border-white/10 bg-white/[0.02] p-3",
                    "border-l-[3px]",
                    tipo.chipBorder,
                  )}
                >
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center border bg-black/40 sm:size-14",
                      tipo.iconChip,
                    )}
                  >
                    <Icon className={cn("size-6 sm:size-7", tipo.accent)} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-white/90">{tipo.title}</p>
                    <p className={cn("mt-1", BODY)}>{tipo.description}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <p className={cn("border-t border-white/10 px-5 py-4 sm:px-6", BODY)}>
        {simulacrosClosing}
      </p>
    </section>
  )
}