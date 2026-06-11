"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Loader2 } from "lucide-react"

import { FamilyPlanStepNav } from "@/components/preparation/family-plan/family-plan-step-nav"
import { Button } from "@/components/ui/button"
import { WIZARD_STEPS } from "@/lib/family-plan-defaults"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import {
  DISASTERS_NAV_LINK_CLASS,
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

interface FamilyPlanWizardShellProps {
  step: number
  title: string
  description: string
  children: React.ReactNode
}

export function FamilyPlanWizardShell({
  step,
  title,
  description,
  children,
}: FamilyPlanWizardShellProps) {
  const { data, isLoading, isError, saveStatus } = useFamilyPlan()
  const searchParams = useSearchParams()
  const fromEmergencyKit = searchParams.get("from") === "emergency-kit"

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-white/50" aria-hidden />
        <span className="sr-only">Cargando plan familiar...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={cn(GLASS_PANEL_CLASS, "p-6 text-center text-sm text-white/70")}>
        No se pudo cargar el plan. Intenta recargar la página.
      </div>
    )
  }

  const prevStep = step > 1 ? step - 1 : null
  const nextStep = step < WIZARD_STEPS.length ? step + 1 : null
  const prevStepTitle = prevStep
    ? WIZARD_STEPS.find((s) => s.step === prevStep)?.title
    : null
  const nextStepTitle = nextStep
    ? WIZARD_STEPS.find((s) => s.step === nextStep)?.title
    : null

  const saveLabel =
    saveStatus === "saving"
      ? "Guardando..."
      : saveStatus === "saved"
        ? "Guardado"
        : saveStatus === "error"
          ? "Error al guardar"
          : "Cambios pendientes"

  return (
    <div className="flex flex-col gap-4">
      {fromEmergencyKit ? (
        <div
          className={cn(
            GLASS_PANEL_CLASS,
            GLASS_MICA_INTERACTIVE_CLASS,
            "flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center border border-blue-400/30 bg-blue-500/10">
              <BookOpen className="size-4 text-blue-200" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-blue-200/90">
                Vienes desde la guía de Kit de emergencia
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-white/65">
                Marca los items que ya tienes en este paso. Vuelve a la guía
                cuando termines.
              </p>
            </div>
          </div>
          <Link
            href="/preparation/emergency-kit"
            className={cn(
              DISASTERS_NAV_LINK_CLASS,
              "inline-flex shrink-0 items-center gap-2",
            )}
          >
            Volver a la guía
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      ) : null}

      <FamilyPlanStepNav currentStep={step} data={data} />

      <div className={cn(GLASS_PANEL_CLASS, "flex flex-col gap-5 p-5 sm:p-6")}>
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-emerald-300/80">
            Paso {step}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/60">{description}</p>
        </header>

        {children}

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-white/45" aria-live="polite">
            {saveLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {prevStep && prevStepTitle ? (
              <Link
                href={`/preparation/family-plan/step/${prevStep}`}
                className={cn(DISASTERS_NAV_LINK_CLASS, "inline-flex items-center gap-2")}
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                {prevStepTitle}
              </Link>
            ) : (
              <Link
                href="/preparation"
                className={cn(DISASTERS_NAV_LINK_CLASS, "inline-flex items-center gap-2")}
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Dashboard
              </Link>
            )}
            {nextStep && nextStepTitle ? (
              <Button asChild variant="default">
                <Link href={`/preparation/family-plan/step/${nextStep}`}>
                  {nextStepTitle}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="default">
                <Link href="/preparation/family-plan/summary">
                  Ver resumen
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}