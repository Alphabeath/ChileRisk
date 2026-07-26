"use client"

import Link from "next/link"
import { ListChecks } from "lucide-react"

import { DashboardSection } from "@/components/dashboard/dashboard-section"
import { useFamilyPlan } from "@/hooks"
import {
  computeCompletionPct,
  firstIncompleteStep,
  getStepStatuses,
} from "@/lib/family-plan-completion"
import { cn } from "@/lib/utils"

function CompletionRingSm({ pct }: { pct: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const dash = (pct / 100) * circumference
  const isComplete = pct === 100

  return (
    <div className="relative size-14 shrink-0 sm:size-16">
      <svg
        className="size-full -rotate-90"
        viewBox="0 0 100 100"
        role="img"
        aria-label={`Plan familiar ${pct}% completado`}
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="fill-none stroke-white/10"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="fill-none stroke-emerald-300 transition-all duration-700 ease-out"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <p
          className={cn(
            "font-mono text-base font-semibold tabular-nums leading-none sm:text-lg",
            isComplete ? "text-emerald-300" : "text-white",
          )}
        >
          {pct}%
        </p>
      </div>
    </div>
  )
}

export function DashboardFamilyPlanCard({ className }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useFamilyPlan()

  const pct = data ? computeCompletionPct(data) : 0
  const completed = data ? getStepStatuses(data).filter((s) => s.completed).length : 0

  let cta: { href: string; label: string }
  if (!data) {
    cta = { href: "/preparation/family-plan/step/1", label: "Crear mi plan" }
  } else if (pct === 100) {
    cta = { href: "/preparation/family-plan/summary", label: "Ver resumen" }
  } else {
    const step = firstIncompleteStep(data)
    cta = {
      href: `/preparation/family-plan/step/${step}`,
      label: `Continuar paso ${step}`,
    }
  }

  return (
    <DashboardSection
      eyebrow="Prepárate"
      title="Plan Familiar"
      icon={ListChecks}
      iconClassName="text-emerald-300/80"
      href="/preparation"
      className={className}
    >
      {isError ? (
        <div className="border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          No se pudo cargar tu plan.
          <button
            type="button"
            onClick={refetch}
            className="ml-3 border border-red-500/50 px-2 py-0.5 text-xs text-red-300 transition-colors hover:bg-red-500/20"
          >
            Reintentar
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-3" aria-hidden>
          <div className="size-14 animate-pulse rounded-full bg-white/[0.06] sm:size-16" />
          <div className="flex-1">
            <div className="h-4 w-2/3 animate-pulse bg-white/[0.06]" />
            <div className="mt-2 h-8 w-full animate-pulse bg-white/[0.06]" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {data ? <CompletionRingSm pct={pct} /> : null}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/80">
              {data
                ? pct === 100
                  ? "8 de 8 pasos"
                  : `${completed} de 8 pasos`
                : "Aún no tienes un plan."}
            </p>
            <Link
              href={cta.href}
              className="mt-2 inline-flex w-full justify-center border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-300 transition-colors hover:bg-emerald-500/20 sm:w-fit"
            >
              {cta.label}
            </Link>
          </div>
        </div>
      )}
    </DashboardSection>
  )
}
