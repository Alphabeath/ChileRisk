import { GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { Backpack } from "lucide-react"
import { cn } from "@/lib/utils"

export function PreparationPageHero() {
  return (
    <header className={cn(GLASS_PANEL_CLASS, GLASS_MICA_INTERACTIVE_CLASS, "relative overflow-hidden")}>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950/80 via-slate-900/90 to-emerald-950/50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
        aria-hidden
      />
      <Backpack
        className="pointer-events-none absolute -right-4 top-1/2 size-36 -translate-y-1/2 text-white/[0.07] sm:size-48"
        strokeWidth={1}
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 p-5 sm:p-8">
        <span className="inline-flex w-fit items-center gap-2 border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[1.2px] text-amber-200/90">
          Bosquejo · contenido en desarrollo
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Preparación
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-white/75 sm:text-base">
          Aprende a anticiparte ante emergencias: qué tener listo en casa, cómo coordinar a
          tu familia y qué hábitos reducen el impacto cuando ocurre un desastre.
        </p>
      </div>
    </header>
  )
}