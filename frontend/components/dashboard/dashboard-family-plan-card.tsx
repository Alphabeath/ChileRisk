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

/** Ring sized so “100%” fits inside the stroke without clipping. */
function CompletionRing({ pct }: { pct: number }) {
  const size = 88
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circumference
  const isComplete = pct >= 100
  const center = size / 2

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Plan familiar ${pct}% completado`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-white/10"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className={cn(
            "transition-all duration-700 ease-out",
            isComplete ? "stroke-emerald-300" : "stroke-emerald-400/90",
          )}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <p
          className={cn(
            "flex items-baseline justify-center font-mono font-semibold tabular-nums leading-none tracking-tight",
            isComplete ? "text-emerald-200" : "text-white",
          )}
        >
          <span className="text-[1.125rem]">{pct}</span>
          <span className="text-[0.65rem] opacity-80">%</span>
        </p>
      </div>
    </div>
  )
}

export function DashboardFamilyPlanCard({ className }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useFamilyPlan()

  const pct = data ? computeCompletionPct(data) : 0
  const completed = data
    ? getStepStatuses(data).filter((s) => s.completed).length
    : 0

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
        <div className="flex flex-col gap-3" aria-hidden>
          <div className="flex items-center gap-4">
            <div className="size-[88px] shrink-0 animate-pulse rounded-full bg-white/[0.06]" />
            <div className="h-4 w-24 animate-pulse bg-white/[0.06]" />
          </div>
          <div className="h-9 w-full animate-pulse bg-white/[0.06]" />
        </div>
      ) : !data ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-white/70">Aún no tienes un plan.</p>
          <Link
            href={cta.href}
            className="inline-flex w-full justify-center border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-300 transition-colors hover:bg-emerald-500/20"
          >
            {cta.label}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <CompletionRing pct={pct} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white/90">
                {completed} de 8 pasos
              </p>
              {pct === 100 ? (
                <p className="mt-1 text-[11px] uppercase tracking-wider text-emerald-300/80">
                  Plan completo
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-white/45">
                  Te faltan {8 - completed}
                </p>
              )}
              <div className="mt-3 h-1.5 w-full bg-white/10">
                <div
                  className="h-full bg-emerald-400/80 transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
          <Link
            href={cta.href}
            className="inline-flex w-full justify-center border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-300 transition-colors hover:bg-emerald-500/20"
          >
            {cta.label}
          </Link>
        </div>
      )}
    </DashboardSection>
  )
}
