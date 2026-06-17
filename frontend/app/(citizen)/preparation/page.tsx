import Link from "next/link"
import { PreparationPageHero } from "@/components/preparation/preparation-page-hero"
import { PreparationTopicGrid } from "@/components/preparation/preparation-topic-grid"
import { FamilyPlanDashboard } from "@/components/preparation/family-plan/family-plan-dashboard"
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
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-16 sm:gap-4 sm:px-6 lg:px-8">
        <PreparationPageHero
          planSteps={WIZARD_STEPS.length}
          guides={guides}
          hazardTypes={hazardTypes}
        />

        <FamilyPlanDashboard />

        <PreparationTopicGrid />

        <aside
          className={cn(
            "relative flex flex-col gap-3 overflow-hidden border border-white/10 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between",
            "supports-[backdrop-filter]:bg-black/40",
            GLASS_MICA_INTERACTIVE,
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--primary-chile)]/65 via-red-950/70 to-[var(--secondary-chile)]/55"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
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
              <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-emerald-200/90">
                Siguiente paso
              </p>
              <p className="mt-1 max-w-xl text-[13px] leading-snug text-white">
                Guías prácticas por tipo de emergencia: antes, durante y después.
              </p>
            </div>
          </div>
          <Link
            href="/disasters"
            className={cn(
              "relative inline-flex shrink-0 items-center gap-2 border border-white/25 bg-white/15 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[1.2px] text-white transition-colors hover:bg-white/25",
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

const GLASS_MICA_INTERACTIVE = "glass-mica interactive-mica bg-black/60"
