import {
  PREPARATION_EYEBROW_CLASS,
  PREPARATION_HERO_SHELL_CLASS,
} from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

interface PreparationPageHeroProps {
  planSteps: number
  guides: number
}

/** Section identity only — plan progress lives in FamilyPlanDashboard. */
export function PreparationPageHero({
  planSteps,
  guides,
}: PreparationPageHeroProps) {
  return (
    <header className={PREPARATION_HERO_SHELL_CLASS}>
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
      <ChileWatermark />

      <div className="relative p-5 sm:p-8">
        <span className="inline-flex w-fit items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[1.2px] text-emerald-200/90">
          Metodología SENAPRED
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Preparación
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
          Construye tu Plan Familia Preparada, completa tu kit y sigue los
          simulacros oficiales para anticiparte ante desastres en Chile.
        </p>
        <p className={cn(PREPARATION_EYEBROW_CLASS, "mt-5 text-white/45")}>
          {planSteps} pasos del plan · {guides} guías por desastre
        </p>
      </div>
    </header>
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
