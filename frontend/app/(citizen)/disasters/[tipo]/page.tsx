import { notFound } from "next/navigation"
import Link from "next/link"
import { desastres, getDesastreBySlug } from "@/data/disasters"
import { DisasterDetailActions } from "@/components/disasters/disaster-detail-actions"
import { DisasterDetailHero } from "@/components/disasters/disaster-detail-hero"
import { DisasterDetailNav } from "@/components/disasters/disaster-detail-nav"
import {
  DisasterPhasePanel,
  type DisasterPhaseConfig,
} from "@/components/disasters/disaster-phase-panel"
import { RelatedDisasters } from "@/components/disasters/related-disasters"
import {
  categoryHeroBoost,
  getDesastreCategory,
} from "@/lib/disasters-visual"
import { DISASTERS_NAV_LINK_CLASS } from "@/lib/glass-panel"
import { ArrowLeft, AlertTriangle, Clock, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export function generateStaticParams() {
  return desastres.map((d) => ({ tipo: d.slug }))
}

const phases: DisasterPhaseConfig[] = [
  {
    key: "antes",
    title: "Antes",
    subtitle: "Prevención y preparación",
    icon: Clock,
    accent: "text-blue-400",
    border: "border-l-blue-500",
  },
  {
    key: "durante",
    title: "Durante",
    subtitle: "Acción inmediata",
    icon: AlertTriangle,
    accent: "text-amber-400",
    border: "border-l-amber-500",
  },
  {
    key: "despues",
    title: "Después",
    subtitle: "Recuperación y seguridad",
    icon: ShieldCheck,
    accent: "text-emerald-400",
    border: "border-l-emerald-500",
  },
]

export default async function DisasterDetailPage({
  params,
}: {
  params: Promise<{ tipo: string }>
}) {
  const { tipo } = await params
  const desastre = getDesastreBySlug(tipo)

  if (!desastre) {
    notFound()
  }

  const category = getDesastreCategory(desastre.slug)
  const totalSteps =
    desastre.antes.length + desastre.durante.length + desastre.despues.length

  const phaseNav = phases.map((phase) => ({
    id: `fase-${phase.key}`,
    phaseKey: phase.key,
    label: phase.title,
    subtitle: phase.subtitle,
    count: desastre[phase.key].length,
  }))

  return (
    <div className="relative min-h-screen bg-background">
      <div
        className={cn(
          "pointer-events-none fixed inset-0 bg-gradient-to-b opacity-[0.22]",
          categoryHeroBoost[category],
        )}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <Link href="/disasters" className={cn(DISASTERS_NAV_LINK_CLASS, "mb-6")}>
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Volver a desastres
        </Link>

        <DisasterDetailHero desastre={desastre} totalSteps={totalSteps} />

        <DisasterDetailActions title={desastre.title} />

        <div className="mt-4">
          <DisasterDetailNav color={desastre.color} phases={phaseNav} />
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {phases.map((phase) => (
            <DisasterPhasePanel
              key={phase.key}
              id={`fase-${phase.key}`}
              phase={phase}
              items={desastre[phase.key]}
              color={desastre.color}
            />
          ))}
        </div>

        <RelatedDisasters currentSlug={desastre.slug} />
      </div>
    </div>
  )
}