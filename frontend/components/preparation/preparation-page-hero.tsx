import {
  GLASS_DIVIDER,
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { AlertTriangle, Clock, ShieldCheck, Backpack } from "lucide-react"
import { cn } from "@/lib/utils"

interface PreparationPageHeroProps {
  planSteps: number
  guides: number
  hazardTypes: number
}

const phaseHighlights = [
  { label: "Antes", subtitle: "Prevención", icon: Clock, accent: "text-blue-400" },
  { label: "Durante", subtitle: "Acción", icon: AlertTriangle, accent: "text-amber-400" },
  { label: "Después", subtitle: "Recuperación", icon: ShieldCheck, accent: "text-emerald-400" },
] as const

export function PreparationPageHero({
  planSteps,
  guides,
  hazardTypes,
}: PreparationPageHeroProps) {
  return (
    <header
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "relative w-full overflow-hidden",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--primary-chile)]/55 via-emerald-950/70 to-[var(--secondary-chile)]/45"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
        aria-hidden
      />
      <Backpack
        className="pointer-events-none absolute -right-6 top-1/2 size-40 -translate-y-1/2 text-white/[0.08] sm:size-56 lg:size-64"
        strokeWidth={1}
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1">
          <span className="inline-flex w-fit items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[1.2px] text-emerald-200/90">
            Metodología SENAPRED
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Preparación
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base">
            Construye tu Plan Familia Preparada paso a paso y complementa con guías
            por tipo de emergencia para anticiparte ante desastres en Chile.
          </p>
        </div>

        <dl className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3 lg:min-w-[20rem]">
          <StatBox label="Pasos del plan" value={planSteps} />
          <StatBox label="Guías" value={guides} />
          <StatBox label="Amenazas" value={hazardTypes} />
        </dl>
      </div>

      <div
        className={cn(
          "relative grid grid-cols-3 divide-x border-t",
          GLASS_DIVIDER,
        )}
      >
        {phaseHighlights.map(({ label, subtitle, icon: Icon, accent }) => (
          <div
            key={label}
            className="flex items-center justify-center gap-2.5 px-3 py-4 sm:gap-3 sm:px-5 sm:py-5 transition-colors hover:bg-white/[0.03]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center border border-white/20 bg-white/10 sm:size-10 transition-all hover:border-white/30 hover:bg-white/15">
              <Icon
                className={cn("size-4 sm:size-[1.125rem] transition-transform hover:scale-105", accent)}
                aria-hidden
              />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white">
                {label}
              </p>
              <p className="text-[10px] text-white/55">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </header>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-white/20 bg-black/35 px-3 py-3 text-center backdrop-blur-sm sm:px-4 sm:py-4 transition-colors hover:bg-black/50 hover:border-white/25">
      <dt className="text-[9px] font-semibold uppercase tracking-[1.1px] text-white/55 sm:text-[10px]">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white sm:text-3xl transition-colors">
        {value}
      </dd>
    </div>
  )
}
