import {
  CitizenPageHero,
  HeroEyebrow,
  HeroFooterCell,
  HeroFooterIcon,
  HeroStatBox,
} from "@/components/layout/citizen-page-hero"
import { Backpack, CalendarCheck2, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"

interface PreparationPageHeroProps {
  planSteps: number
  guides: number
}

const topicHighlights = [
  {
    label: "Plan",
    subtitle: "Familia Preparada",
    icon: ClipboardList,
    accent: "text-emerald-300",
  },
  {
    label: "Kit",
    subtitle: "72 horas",
    icon: Backpack,
    accent: "text-blue-300",
  },
  {
    label: "Simulacros",
    subtitle: "Calendario",
    icon: CalendarCheck2,
    accent: "text-rose-300",
  },
] as const

/** Section identity — plan progress lives in FamilyPlanDashboard. */
export function PreparationPageHero({
  planSteps,
  guides,
}: PreparationPageHeroProps) {
  return (
    <CitizenPageHero
      gradientClass="bg-gradient-to-br from-[var(--primary-chile)]/55 via-emerald-950/70 to-[var(--secondary-chile)]/45"
      watermark={<ChileWatermark />}
      eyebrow={
        <HeroEyebrow className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200/90">
          Metodología SENAPRED
        </HeroEyebrow>
      }
      title="Preparación"
      description="Construye tu Plan Familia Preparada, completa tu kit y sigue los simulacros oficiales para anticiparte ante desastres en Chile."
      stats={
        <dl className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3 lg:min-w-[16rem]">
          <HeroStatBox label="Pasos del plan" value={planSteps} />
          <HeroStatBox label="Guías" value={guides} />
        </dl>
      }
      footer={
        <div className="grid grid-cols-3 divide-x divide-white/10">
          {topicHighlights.map(({ label, subtitle, icon: Icon, accent }) => (
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

function ChileWatermark() {
  return (
    <svg
      className="pointer-events-none absolute -right-8 top-1/2 hidden size-72 -translate-y-1/2 text-white/[0.05] sm:block lg:size-96"
      viewBox="0 0 200 480"
      fill="currentColor"
      aria-hidden
    >
      <path d="M70 8 L88 14 L100 22 L108 36 L112 52 L108 64 L96 72 L92 84 L98 96 L106 108 L110 124 L108 140 L100 154 L92 168 L96 184 L106 196 L116 210 L122 228 L120 246 L114 262 L120 278 L132 290 L142 304 L146 320 L142 336 L132 348 L120 356 L112 368 L108 384 L100 400 L86 412 L72 420 L58 424 L46 418 L40 404 L42 388 L48 372 L42 358 L30 348 L20 334 L14 318 L12 300 L18 282 L28 268 L32 252 L26 236 L18 220 L14 202 L18 184 L28 170 L34 154 L30 138 L24 122 L26 104 L34 88 L46 76 L56 64 L62 48 L62 32 L66 18 Z" />
    </svg>
  )
}
