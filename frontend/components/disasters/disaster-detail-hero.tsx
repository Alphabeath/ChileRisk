import type { Desastre } from "@/data/disasters"
import {
  categoryHeroBoost,
  categoryLabels,
  getDesastreCategory,
} from "@/lib/disasters-visual"
import { GLASS_DIVIDER, GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { AlertTriangle, Clock, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { DisasterDescriptionBlock } from "./disaster-description-block"

interface DisasterDetailHeroProps {
  desastre: Desastre
  totalSteps: number
}

const essentialsMeta = [
  { key: "antes" as const, label: "Antes", icon: Clock },
  { key: "durante" as const, label: "Durante", icon: AlertTriangle },
  { key: "despues" as const, label: "Después", icon: ShieldCheck },
]

export function DisasterDetailHero({ desastre, totalSteps }: DisasterDetailHeroProps) {
  const Icon = desastre.icon
  const category = getDesastreCategory(desastre.slug)

  return (
    <header className={cn(GLASS_PANEL_CLASS, GLASS_MICA_INTERACTIVE_CLASS, "relative w-full overflow-hidden")}>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          categoryHeroBoost[category],
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90",
          desastre.color,
        )}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.14),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20"
        aria-hidden
      />
      <Icon
        className="pointer-events-none absolute -right-2 top-8 size-40 text-white/[0.08] sm:size-52 lg:size-60"
        strokeWidth={1}
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 p-5 sm:gap-6 sm:p-8">
        <div className="flex min-w-0 gap-4 sm:gap-5">
          <div className="flex size-14 shrink-0 items-center justify-center border border-white/25 bg-black/40 backdrop-blur-sm sm:size-16">
            <Icon className="size-7 text-white sm:size-8" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pr-8 sm:pr-16">
            <div className="mb-2 inline-flex items-center gap-2 border border-white/25 bg-white/10 px-3 py-1 backdrop-blur-sm">
              <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white">
                {categoryLabels[category]}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
              {desastre.title}
            </h1>
          </div>
        </div>

        <DisasterDescriptionBlock text={desastre.description} />

        <dl className="grid w-full grid-cols-3 gap-2 sm:gap-3">
          <StatBox label="Fases" value={3} />
          <StatBox label="Pasos" value={totalSteps} />
          <StatBox label="Fuente" text="SENAPRED" />
        </dl>

        <div
          className={cn(
            "grid grid-cols-1 divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0",
            GLASS_DIVIDER,
          )}
        >
          {essentialsMeta.map(({ key, label, icon: PhaseIcon }) => (
            <div
              key={key}
              className="flex gap-3 px-4 py-4 sm:px-5 sm:py-5"
            >
              <div className="flex size-9 shrink-0 items-center justify-center border border-white/20 bg-white/10">
                <PhaseIcon className="size-4 text-white/90" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/90">
                  {label} · esencial
                </p>
                <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-white/65">
                  {desastre[key][0]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}

function StatBox({
  label,
  value,
  text,
}: {
  label: string
  value?: number
  text?: string
}) {
  return (
    <div className="flex h-full min-h-[4.5rem] flex-col items-center justify-center border border-white/20 bg-black/35 px-3 py-3 text-center backdrop-blur-sm sm:min-h-[5rem] sm:px-4 sm:py-4">
      <dt className="text-[9px] font-semibold uppercase tracking-[1.1px] text-white/55 sm:text-[10px]">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-semibold tabular-nums text-white",
          text
            ? "text-base tracking-wide sm:text-lg"
            : "font-mono text-2xl sm:text-3xl",
        )}
      >
        {text ?? value}
      </dd>
    </div>
  )
}