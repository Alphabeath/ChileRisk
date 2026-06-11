import Link from "next/link"
import { PreparationPageHero } from "@/components/preparation/preparation-page-hero"
import { PreparationTopicGrid } from "@/components/preparation/preparation-topic-grid"
import { FamilyPlanDashboard } from "@/components/preparation/family-plan/family-plan-dashboard"
import {
  DISASTERS_NAV_LINK_CLASS,
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { ArrowRight, ShieldAlert } from "lucide-react"
import { WIZARD_STEPS } from "@/lib/family-plan-defaults"
import { desastres } from "@/data/disasters"
import {
  EXTERNAL_THREATS,
  INTERNAL_THREATS,
} from "@/lib/family-plan-defaults"
import { cn } from "@/lib/utils"

export default function PreparationPage() {
  const guides = desastres.length
  const hazardTypes = EXTERNAL_THREATS.length + INTERNAL_THREATS.length

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-16 sm:gap-5 sm:px-6 lg:px-8">
        <PreparationPageHero
          planSteps={WIZARD_STEPS.length}
          guides={guides}
          hazardTypes={hazardTypes}
        />

        <FamilyPlanDashboard />

        <PreparationTopicGrid />

        <aside
          className={cn(
            GLASS_PANEL_CLASS,
            GLASS_MICA_INTERACTIVE_CLASS,
            "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75">
              Siguiente paso
            </p>
            <p className="mt-1 max-w-xl text-[12px] text-white/50">
              Revisa las guías por tipo de emergencia para acciones concretas en
              cada fase: antes, durante y después.
            </p>
          </div>
          <Link
            href="/disasters"
            className={cn(
              DISASTERS_NAV_LINK_CLASS,
              "inline-flex shrink-0 items-center gap-2",
            )}
          >
            <ShieldAlert className="size-4" aria-hidden />
            Ver guías por desastre
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </aside>
      </div>
    </div>
  )
}
