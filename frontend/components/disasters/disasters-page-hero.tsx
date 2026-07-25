import {
  CitizenPageHero,
  HeroFooterCell,
  HeroFooterIcon,
  HeroStatBox,
} from "@/components/layout/citizen-page-hero"
import { GLASS_DIVIDER } from "@/lib/glass-panel"
import { AlertTriangle, Clock, ShieldAlert, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface DisastersPageHeroProps {
  disasterCount: number
  totalSteps: number
}

const phaseHighlights = [
  { label: "Antes", subtitle: "Prevención", icon: Clock },
  { label: "Durante", subtitle: "Acción", icon: AlertTriangle },
  { label: "Después", subtitle: "Recuperación", icon: ShieldCheck },
] as const

export function DisastersPageHero({ disasterCount, totalSteps }: DisastersPageHeroProps) {
  return (
    <CitizenPageHero
      gradientClass="bg-gradient-to-br from-[var(--primary-chile)]/55 via-red-950/70 to-[var(--secondary-chile)]/45"
      watermark={
        <ShieldAlert
          className="pointer-events-none absolute -right-6 top-1/2 size-40 -translate-y-1/2 text-white/[0.08] sm:size-56 lg:size-64"
          strokeWidth={1}
          aria-hidden
        />
      }
      title="Desastres y emergencias"
      description="Guías prácticas por tipo de riesgo: qué hacer en cada fase de una emergencia, con pasos claros para tu hogar y tu comunidad."
      stats={
        <dl className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3 lg:min-w-[20rem]">
          <HeroStatBox label="Emergencias" value={disasterCount} />
          <HeroStatBox label="Pasos totales" value={totalSteps} />
          <HeroStatBox label="Fases" value={3} />
        </dl>
      }
      footer={
        <div
          className={cn("grid grid-cols-3 divide-x", GLASS_DIVIDER)}
        >
          {phaseHighlights.map(({ label, subtitle, icon: Icon }) => (
            <HeroFooterCell key={label}>
              <HeroFooterIcon>
                <Icon
                  className="size-4 text-white/90 sm:size-[1.125rem]"
                  aria-hidden
                />
              </HeroFooterIcon>
              <div className="min-w-0 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white">
                  {label}
                </p>
                <p className="text-[10px] text-white/55">{subtitle}</p>
              </div>
            </HeroFooterCell>
          ))}
        </div>
      }
    />
  )
}
