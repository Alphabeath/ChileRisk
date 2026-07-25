import type { Desastre } from "@/data/disasters"
import {
  CitizenPageHero,
  HeroStatBox,
} from "@/components/layout/citizen-page-hero"
import {
  categoryHeroBoost,
  categoryLabels,
  getDesastreCategory,
} from "@/lib/disasters-visual"
import { GLASS_DIVIDER } from "@/lib/glass-panel"
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
    <CitizenPageHero
      gradientClass={cn(
        "bg-gradient-to-br",
        categoryHeroBoost[category],
      )}
      fadeClass="bg-gradient-to-t from-black/90 via-black/50 to-black/20"
      overlays={
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90",
            desastre.color,
          )}
          aria-hidden
        />
      }
      watermark={
        <Icon
          className="pointer-events-none absolute -right-2 top-8 size-40 text-white/[0.08] sm:size-52 lg:size-60"
          strokeWidth={1}
          aria-hidden
        />
      }
      leading={
        <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
          <div className="flex size-14 shrink-0 items-center justify-center border border-white/25 bg-black/40 backdrop-blur-sm sm:size-16">
            <Icon className="size-7 text-white sm:size-8" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pr-8 sm:pr-16">
            <div className="mb-2 inline-flex items-center gap-2 border border-white/25 bg-white/10 px-3 py-1 backdrop-blur-sm">
              <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white">
                {categoryLabels[category]}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {desastre.title}
            </h1>
          </div>
        </div>
      }
      afterTitle={
        <div className="relative flex flex-col gap-5 px-5 pb-5 sm:gap-6 sm:px-8 sm:pb-8">
          <DisasterDescriptionBlock text={desastre.description} />

          <dl className="grid w-full grid-cols-3 gap-2 sm:gap-3">
            <HeroStatBox label="Fases" value={3} className="min-h-[4.5rem] sm:min-h-[5rem]" />
            <HeroStatBox label="Pasos" value={totalSteps} className="min-h-[4.5rem] sm:min-h-[5rem]" />
            <HeroStatBox label="Fuente" text="SENAPRED" className="min-h-[4.5rem] sm:min-h-[5rem]" />
          </dl>

          <div
            className={cn(
              "grid grid-cols-1 divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0",
              GLASS_DIVIDER,
            )}
          >
            {essentialsMeta.map(({ key, label, icon: PhaseIcon }) => (
              <div key={key} className="flex gap-3 px-4 py-4 sm:px-5 sm:py-5">
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
      }
    />
  )
}
