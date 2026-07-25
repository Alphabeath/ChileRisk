"use client"

import { Siren } from "lucide-react"

import {
  CitizenPageHero,
  HeroEyebrow,
  HeroFooterCell,
  HeroFooterIcon,
  HeroStatBox,
} from "@/components/layout/citizen-page-hero"
import { GLASS_DIVIDER } from "@/lib/glass-panel"
import { DRILL_TYPE_HIGHLIGHTS } from "@/data/simulacros"
import { cn } from "@/lib/utils"

interface SimulacrosPageHeroProps {
  upcomingTotal: number
}

export function SimulacrosPageHero({ upcomingTotal }: SimulacrosPageHeroProps) {
  return (
    <CitizenPageHero
      gradientClass="bg-gradient-to-br from-[var(--primary-chile)]/55 via-red-950/70 to-[var(--secondary-chile)]/45"
      watermark={
        <Siren
          className="pointer-events-none absolute -right-6 top-1/2 size-40 -translate-y-1/2 text-white/[0.08] sm:size-56 lg:size-64"
          strokeWidth={1}
          aria-hidden
        />
      }
      eyebrow={
        <HeroEyebrow className="border-rose-300/30 bg-rose-500/10 text-rose-100/90">
          Calendario SERNAPRED
        </HeroEyebrow>
      }
      title="Simulacros de evacuación"
      description="Ejercicios oficiales coordinados por SENAPRED en todo Chile. Consulta fechas, tipos de amenaza y participa en la preparación de tu comunidad."
      stats={
        <dl className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3 lg:min-w-[16rem]">
          <HeroStatBox
            label="A efectuarse"
            value={upcomingTotal}
            suffix="simulacros"
          />
          <HeroStatBox label="Tipos" value={DRILL_TYPE_HIGHLIGHTS.length} />
        </dl>
      }
      footer={
        <div
          className={cn(
            "flex overflow-x-auto divide-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible",
            GLASS_DIVIDER,
          )}
        >
          {DRILL_TYPE_HIGHLIGHTS.map(
            ({ drillType, shortLabel, icon: Icon, accent }) => (
              <HeroFooterCell
                key={drillType}
                className="min-w-[7rem] shrink-0 sm:min-w-0 sm:flex-1 sm:px-4"
              >
                <HeroFooterIcon>
                  <Icon
                    className={cn("size-4 sm:size-[1.125rem]", accent)}
                    aria-hidden
                  />
                </HeroFooterIcon>
                <div className="min-w-0 text-left">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-[1.1px] text-white sm:text-[11px]">
                    {shortLabel}
                  </p>
                </div>
              </HeroFooterCell>
            ),
          )}
        </div>
      }
    />
  )
}
