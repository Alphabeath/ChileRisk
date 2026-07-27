"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowRight,
  Check,
  Circle,
  Loader2,
  type LucideIcon,
  Users,
  AlertTriangle,
  Home,
  Map,
  ShieldCheck,
  Phone,
  Backpack,
  Megaphone,
} from "lucide-react"

import {
  FamilyPlanStatusBanner,
  FamilyPlanStatusChip,
} from "@/components/preparation/family-plan/family-plan-layout"
import { Button } from "@/components/ui/button"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import {
  firstIncompleteStep,
  getStepStatuses,
} from "@/lib/family-plan-completion"
import {
  STEP_DESCRIPTIONS,
  WIZARD_STEPS,
} from "@/lib/family-plan-defaults"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import {
  PREPARATION_CTA_LIFT_CLASS,
  PREPARATION_EYEBROW_CLASS,
} from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

const STEP_ICONS: Record<number, LucideIcon> = {
  1: Users,
  2: AlertTriangle,
  3: Home,
  4: Map,
  5: ShieldCheck,
  6: Phone,
  7: Backpack,
  8: Megaphone,
}

const STEP_ACCENT: Record<number, string> = {
  1: "text-blue-300",
  2: "text-amber-300",
  3: "text-emerald-300",
  4: "text-orange-300",
  5: "text-cyan-300",
  6: "text-violet-300",
  7: "text-rose-300",
  8: "text-pink-300",
}

const STEP_NUMBER_TINT: Record<number, string> = {
  1: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  2: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  3: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  4: "border-orange-500/30 bg-orange-500/10 text-orange-200",
  5: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  6: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  7: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  8: "border-pink-500/30 bg-pink-500/10 text-pink-200",
}

const STEP_BORDER_ACCENT: Record<number, string> = {
  1: "border-l-blue-400/70",
  2: "border-l-amber-400/70",
  3: "border-l-emerald-400/70",
  4: "border-l-orange-400/70",
  5: "border-l-cyan-400/70",
  6: "border-l-violet-400/70",
  7: "border-l-rose-400/70",
  8: "border-l-pink-400/70",
}

export function FamilyPlanDashboard() {
  const { data, plan, isLoading, isError } = useFamilyPlan()

  if (isLoading || !data) {
    return (
      <div
        className={cn(
          GLASS_PANEL_CLASS,
          "flex items-center justify-center gap-3 p-8",
        )}
        data-tour="prep-family-plan"
      >
        <Loader2 className="size-5 animate-spin text-white/50" aria-hidden />
        <span className="text-sm text-white/60">Cargando tu plan...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className={cn(GLASS_PANEL_CLASS, "p-6 text-sm text-white/70")}
        data-tour="prep-family-plan"
      >
        No se pudo cargar el plan familiar.
      </div>
    )
  }

  const statuses = getStepStatuses(data)
  const completed = statuses.filter((s) => s.completed)
  const pct = plan?.completion_pct ?? 0
  const continueStep = firstIncompleteStep(data)
  const continueTitle =
    WIZARD_STEPS.find((s) => s.step === continueStep)?.title ?? "Plan"
  const updatedLabel = plan?.updated_at
    ? format(new Date(plan.updated_at), "d MMM yyyy, HH:mm", { locale: es })
    : "Sin guardar aún"

  return (
    <section
      aria-labelledby="family-plan-dashboard-heading"
      className="flex flex-col gap-3"
      data-tour="prep-family-plan"
    >
      <CompletionBanner
        pct={pct}
        completedCount={completed.length}
        updatedLabel={updatedLabel}
        continueStep={continueStep}
        continueTitle={continueTitle}
      />
      <StepGrid statuses={statuses} continueStep={continueStep} />
    </section>
  )
}

function CompletionBanner({
  pct,
  completedCount,
  updatedLabel,
  continueStep,
  continueTitle,
}: {
  pct: number
  completedCount: number
  updatedLabel: string
  continueStep: number
  continueTitle: string
}) {
  const allDone = pct === 100

  return (
    <FamilyPlanStatusBanner>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <CompletionRing pct={pct} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              id="family-plan-dashboard-heading"
              className={cn(PREPARATION_EYEBROW_CLASS, "text-white/75")}
            >
              Plan Familia Preparada
            </p>
            <FamilyPlanStatusChip
              tone={allDone ? "complete" : completedCount > 0 ? "started" : "empty"}
            >
              {allDone ? "Completo" : `${completedCount}/8`}
            </FamilyPlanStatusChip>
          </div>
          <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">
            {allDone
              ? "Tu plan está listo"
              : pct === 0
                ? "Aún no has empezado"
                : `Siguiente: Paso ${continueStep} · ${continueTitle}`}
          </h2>
          <p className="mt-0.5 text-[12px] text-white/50">
            Última actualización: {updatedLabel}
          </p>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        {pct >= 50 ? (
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/preparation/family-plan/summary">
              Resumen y PDF
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        ) : null}
        <Button asChild size="sm" className={cn("w-full sm:w-auto", PREPARATION_CTA_LIFT_CLASS)}>
          <Link
            href={
              allDone
                ? "/preparation/family-plan/summary"
                : `/preparation/family-plan/step/${continueStep}`
            }
          >
            {pct === 0
              ? "Empezar plan"
              : allDone
                ? "Ver resumen"
                : "Continuar"}
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    </FamilyPlanStatusBanner>
  )
}

function CompletionRing({
  pct,
  size = "md",
}: {
  pct: number
  size?: "sm" | "md"
}) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const dash = (pct / 100) * circumference
  const isComplete = pct === 100
  const box = size === "sm" ? "size-16 sm:size-[4.5rem]" : "size-24 sm:size-28"
  const text = size === "sm" ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"

  return (
    <div className={cn("relative shrink-0", box)}>
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
          className={cn(
            "fill-none transition-all duration-700 ease-out",
            isComplete ? "stroke-emerald-400" : "stroke-emerald-300",
          )}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <p
          className={cn(
            "font-mono font-semibold tabular-nums leading-none",
            text,
            isComplete ? "text-emerald-300" : "text-white",
          )}
        >
          {pct}
          <span className="text-[10px] font-semibold text-white/50">%</span>
        </p>
      </div>
    </div>
  )
}

function StepGrid({
  statuses,
  continueStep,
}: {
  statuses: { step: number; completed: boolean }[]
  continueStep: number
}) {
  return (
    <div className={cn(GLASS_PANEL_CLASS, "p-4 sm:p-5")}>
      <div className="mb-3">
        <h3 className={cn(PREPARATION_EYEBROW_CLASS, "text-white/90")}>
          Tus 8 pasos
        </h3>
        <p className="mt-0.5 text-[12px] text-white/50">
          Toca cualquier paso para editarlo o revisarlo.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {WIZARD_STEPS.map((meta) => {
          const status = statuses.find((s) => s.step === meta.step)
          const completed = status?.completed ?? false
          const current = meta.step === continueStep && !completed
          const Icon = STEP_ICONS[meta.step]
          return (
            <li key={meta.step}>
              <StepChip
                step={meta.step}
                title={meta.title}
                description={STEP_DESCRIPTIONS[meta.step]}
                completed={completed}
                current={current}
                icon={Icon}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function StepChip({
  step,
  title,
  description,
  completed,
  current,
  icon: Icon,
}: {
  step: number
  title: string
  description: string
  completed: boolean
  current: boolean
  icon: LucideIcon
}) {
  const href = `/preparation/family-plan/step/${step}`

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full w-full min-h-[5.5rem] flex-col gap-1.5 border border-l-[3px] bg-white/[0.03] p-3 text-left transition-all duration-200",
        STEP_BORDER_ACCENT[step],
        completed
          ? "border-emerald-500/30 bg-emerald-500/[0.06] hover:-translate-y-[2px] hover:border-emerald-400/45 hover:bg-emerald-500/[0.1]"
          : current
            ? "border-emerald-400/50 bg-emerald-500/[0.1] ring-1 ring-inset ring-emerald-400/30"
            : "border-white/10 hover:-translate-y-[2px] hover:border-white/20 hover:bg-white/[0.06]",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
      )}
      aria-label={
        completed
          ? `Revisar paso ${step} ${title}`
          : `Ir al paso ${step} ${title}`
      }
      aria-current={current ? "step" : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center border font-mono text-[11px] font-semibold tabular-nums",
              completed
                ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200"
                : current
                  ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100"
                  : STEP_NUMBER_TINT[step],
            )}
          >
            {step}
          </span>
          <Icon
            className={cn(
              "size-3.5",
              completed
                ? "text-emerald-300"
                : current
                  ? "text-emerald-200"
                  : STEP_ACCENT[step],
            )}
            aria-hidden
          />
        </div>
        {completed ? (
          <Check
            className="size-3.5 shrink-0 text-emerald-300"
            aria-label="Completado"
          />
        ) : current ? (
          <span className="text-[9px] font-semibold uppercase tracking-[1px] text-emerald-200/90">
            Ahora
          </span>
        ) : (
          <Circle
            className="size-3.5 shrink-0 text-white/30 transition-colors group-hover:text-white/60"
            aria-hidden
          />
        )}
      </div>
      <div className="flex-1">
        <p
          className={cn(
            "text-[12px] font-semibold leading-tight transition-colors",
            completed ? "text-white/85" : "text-white",
          )}
        >
          {title}
        </p>
        <p className="mt-0.5 hidden text-[10.5px] leading-snug text-white/50 sm:block">
          {description}
        </p>
      </div>
      <ArrowRight
        className="mt-auto size-3 self-end text-white/30 transition-all duration-200 group-hover:-translate-y-[1px] group-hover:translate-x-[1px] group-hover:text-white/70"
        aria-hidden
      />
    </Link>
  )
}
