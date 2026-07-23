import Link from "next/link"
import { ArrowRight, ShieldAlert } from "lucide-react"

import { PreparationPageHero } from "@/components/preparation/preparation-page-hero"
import { PreparationTopicGrid } from "@/components/preparation/preparation-topic-grid"
import { FamilyPlanDashboard } from "@/components/preparation/family-plan/family-plan-dashboard"
import { WIZARD_STEPS } from "@/lib/family-plan-defaults"
import { desastres } from "@/data/disasters"
import {
  PREPARATION_CTA_LIFT_CLASS,
  PREPARATION_EYEBROW_CLASS,
  PREPARATION_PAGE_INNER_CLASS,
  PREPARATION_PAGE_SHELL_CLASS,
} from "@/lib/preparation-ui"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

export default function PreparationPage() {
  const guides = desastres.length

  return (
    <div className={PREPARATION_PAGE_SHELL_CLASS}>
      <div className={PREPARATION_PAGE_INNER_CLASS}>
        <PreparationPageHero
          planSteps={WIZARD_STEPS.length}
          guides={guides}
        />

        <FamilyPlanDashboard />

        <PreparationTopicGrid />

        <aside
          className={cn(
            GLASS_PANEL_CLASS,
            GLASS_MICA_INTERACTIVE_CLASS,
            "relative flex flex-col gap-4 overflow-hidden border-l-[3px] border-l-red-400/60 p-5 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--primary-chile)]/55 via-red-950/65 to-[var(--secondary-chile)]/45"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
            aria-hidden
          />
          <ShieldAlert
            className="pointer-events-none absolute -right-4 -bottom-2 size-24 text-white/[0.07] sm:size-32"
            strokeWidth={1}
            aria-hidden
          />

          <div className="relative flex items-center gap-4">
            <div className="hidden size-10 shrink-0 items-center justify-center border border-white/25 bg-white/10 sm:flex">
              <ShieldAlert className="size-5 text-white/90" aria-hidden />
            </div>
            <div>
              <p className={cn(PREPARATION_EYEBROW_CLASS, "text-red-200/90")}>
                Guías por desastre
              </p>
              <p className="mt-1 max-w-xl text-[13px] leading-snug text-white">
                Antes, durante y después de cada emergencia: terremoto, tsunami,
                incendio y más.
              </p>
            </div>
          </div>

          <Link
            href="/disasters"
            className={cn(
              PREPARATION_CTA_LIFT_CLASS,
              "relative inline-flex w-full shrink-0 items-center justify-center gap-2 border border-red-400/40 bg-red-500/15 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[1.2px] text-red-50 hover:border-red-400/60 hover:bg-red-500/25 sm:w-fit",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
            )}
          >
            Ver guías por desastre
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </aside>
      </div>
    </div>
  )
}
