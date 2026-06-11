"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowRight, Check, Circle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { WIZARD_STEPS } from "@/lib/family-plan-defaults"
import { firstIncompleteStep, getStepStatuses } from "@/lib/family-plan-completion"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import { DISASTERS_NAV_LINK_CLASS, GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

export function FamilyPlanDashboard() {
  const { data, plan, isLoading, isError } = useFamilyPlan()

  if (isLoading || !data) {
    return (
      <div className={cn(GLASS_PANEL_CLASS, "flex items-center justify-center gap-3 p-8")}>
        <Loader2 className="size-5 animate-spin text-white/50" aria-hidden />
        <span className="text-sm text-white/60">Cargando tu plan...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={cn(GLASS_PANEL_CLASS, "p-6 text-sm text-white/70")}>
        No se pudo cargar el plan familiar.
      </div>
    )
  }

  const statuses = getStepStatuses(data)
  const completed = statuses.filter((s) => s.completed)
  const pending = statuses.filter((s) => !s.completed)
  const pct = plan?.completion_pct ?? 0
  const continueStep = firstIncompleteStep(data)
  const updatedLabel = plan?.updated_at
    ? format(new Date(plan.updated_at), "d MMM yyyy, HH:mm", { locale: es })
    : "Sin guardar aún"

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          GLASS_PANEL_CLASS,
          GLASS_MICA_INTERACTIVE_CLASS,
          "flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75">
            Plan Familia Preparada
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            {pct}% completado
          </h2>
          <p className="mt-1 text-[12px] text-white/50">
            Última actualización: {updatedLabel}
          </p>
          <div className="mt-4 max-w-md">
            <Progress value={pct} className="h-1.5 bg-white/10" />
          </div>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href={`/preparation/family-plan/step/${continueStep}`}>
            {pct === 100 ? "Revisar plan" : "Continuar plan"}
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={cn(GLASS_PANEL_CLASS, "p-4")}>
          <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-emerald-300/90">
            Completados ({completed.length})
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {completed.map((s) => {
              const meta = WIZARD_STEPS.find((w) => w.step === s.step)
              return (
                <li key={s.step} className="flex items-center gap-2 text-[12px] text-white/75">
                  <Check className="size-3.5 shrink-0 text-emerald-400" aria-hidden />
                  {meta?.title}
                </li>
              )
            })}
            {completed.length === 0 ? (
              <li className="text-[12px] text-white/45">Aún no hay pasos completados.</li>
            ) : null}
          </ul>
        </div>

        <div className={cn(GLASS_PANEL_CLASS, "p-4")}>
          <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-amber-300/90">
            Pendientes ({pending.length})
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {pending.map((s) => {
              const meta = WIZARD_STEPS.find((w) => w.step === s.step)
              return (
                <li key={s.step}>
                  <Link
                    href={`/preparation/family-plan/step/${s.step}`}
                    className="flex items-center gap-2 text-[12px] text-white/70 transition-colors hover:text-white"
                  >
                    <Circle className="size-3 shrink-0 text-white/35" aria-hidden />
                    {meta?.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {pct >= 50 ? (
        <aside className={cn(GLASS_PANEL_CLASS, "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between")}>
          <p className="text-[12px] text-white/55">
            Ya tienes suficiente información para revisar y exportar tu plan.
          </p>
          <Link
            href="/preparation/family-plan/summary"
            className={cn(DISASTERS_NAV_LINK_CLASS, "inline-flex shrink-0 items-center gap-2")}
          >
            Ver resumen y PDF
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </aside>
      ) : null}
    </div>
  )
}