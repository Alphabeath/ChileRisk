import {
  CitizenPageHero,
  HeroFooterCell,
  HeroFooterIcon,
  HeroStatBox,
} from "@/components/layout/citizen-page-hero"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import { GLASS_DIVIDER } from "@/lib/glass-panel"
import { Backpack, Clock, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const phaseHighlights = [
  { label: "Antes", subtitle: "Prepara", icon: Clock, accent: "text-blue-300" },
  { label: "Durante", subtitle: "Usa", icon: Backpack, accent: "text-amber-300" },
  {
    label: "Después",
    subtitle: "Repón",
    icon: ShieldCheck,
    accent: "text-emerald-300",
  },
] as const

export function EmergencyKitHero() {
  return (
    <CitizenPageHero
      gradientClass="bg-gradient-to-br from-blue-950/80 via-slate-900/80 to-emerald-950/60"
      watermark={
        <Backpack
          className="pointer-events-none absolute -right-6 top-1/2 size-40 -translate-y-1/2 text-white/[0.08] sm:size-56 lg:size-64"
          strokeWidth={1}
          aria-hidden
        />
      }
      title="Kit de emergencia"
      description="Recursos para las primeras 72 horas tras una emergencia, cuando los servicios básicos pueden estar interrumpidos."
      meta={
        <p className={cn(PREPARATION_EYEBROW_CLASS, "text-white/45")}>
          Ajusta cantidades según integrantes, mascotas y condiciones médicas
        </p>
      }
      stats={
        <dl className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3 lg:min-w-[16rem]">
          <HeroStatBox label="Autonomía" value="72h" accent />
          <HeroStatBox label="Categorías" value={6} />
        </dl>
      }
      footer={
        <div className={cn("grid grid-cols-3 divide-x", GLASS_DIVIDER)}>
          {phaseHighlights.map(({ label, subtitle, icon: Icon, accent }) => (
            <HeroFooterCell key={label}>
              <HeroFooterIcon>
                <Icon
                  className={cn("size-4 sm:size-[1.125rem]", accent)}
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
