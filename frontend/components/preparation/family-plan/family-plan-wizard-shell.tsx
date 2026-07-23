"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, BookOpen, Loader2, Siren } from "lucide-react"

import { PreparationBreadcrumb } from "@/components/preparation/preparation-breadcrumb"
import { PreparationContextBanner } from "@/components/preparation/preparation-context-banner"
import { FamilyPlanStepNav } from "@/components/preparation/family-plan/family-plan-step-nav"
import { Button } from "@/components/ui/button"
import { WIZARD_STEPS } from "@/lib/family-plan-defaults"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import { DISASTERS_NAV_LINK_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import {
  PREPARATION_EYEBROW_CLASS,
  PREPARATION_EMPTY_STATE_CLASS,
  preparationSaveLabel,
  preparationSavePillClass,
  type PreparationSaveStatus,
} from "@/lib/preparation-ui"
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
  const fromSenapred = searchParams.get("source") === "senapred"
  const [inputFocused, setInputFocused] = useState(false)

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      const tag = t.tagName
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        t.isContentEditable
      ) {
        setInputFocused(true)
      }
    }
    const onFocusOut = () => {
      // defer so click on footer still works
      window.setTimeout(() => {
        const active = document.activeElement as HTMLElement | null
        const tag = active?.tagName
        const still =
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          Boolean(active?.isContentEditable)
        setInputFocused(still)
      }, 0)
    }
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("focusout", onFocusOut)
    return () => {
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("focusout", onFocusOut)
    }
  }, [])

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3">
        <Loader2 className="size-6 animate-spin text-white/50" aria-hidden />
        <span className="sr-only">Cargando plan familiar...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={PREPARATION_EMPTY_STATE_CLASS}>
        <p className="text-sm text-white/70">
          No se pudo cargar el plan. Intenta recargar la página.
        </p>
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

  const pillStatus = (saveStatus ?? "idle") as PreparationSaveStatus

  const navFooter = (
    <>
      <span
        className={cn(
          "inline-flex w-fit items-center border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[1px]",
          preparationSavePillClass(pillStatus),
        )}
        aria-live="polite"
      >
        {preparationSaveLabel(pillStatus)}
      </span>
      <div className="flex flex-1 flex-wrap justify-end gap-2">
        {prevStep && prevStepTitle ? (
          <Link
            href={`/preparation/family-plan/step/${prevStep}`}
            className={cn(DISASTERS_NAV_LINK_CLASS, "inline-flex items-center gap-2")}
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            <span className="max-w-[8rem] truncate sm:max-w-none">{prevStepTitle}</span>
          </Link>
        ) : (
          <Link
            href="/preparation"
            className={cn(DISASTERS_NAV_LINK_CLASS, "inline-flex items-center gap-2")}
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Preparación
          </Link>
        )}
        {nextStep && nextStepTitle ? (
          <Button asChild variant="default">
            <Link href={`/preparation/family-plan/step/${nextStep}`}>
              <span className="max-w-[8rem] truncate sm:max-w-none">{nextStepTitle}</span>
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
    </>
  )

  return (
    <div className="flex flex-col gap-4 pb-24 sm:pb-0">
      <PreparationBreadcrumb
        items={[
          { label: "Preparación", href: "/preparation" },
          { label: "Plan Familia", href: "/preparation" },
          { label: `Paso ${step}` },
        ]}
      />

      {fromEmergencyKit ? (
        <PreparationContextBanner
          eyebrow="Vienes desde la guía de Kit de emergencia"
          body="Marca los ítems que ya tienes. Vuelve a la guía cuando termines."
          href="/preparation/emergency-kit"
          cta="Volver a la guía"
          icon={BookOpen}
          accent="blue"
        />
      ) : null}

      {fromSenapred ? (
        <PreparationContextBanner
          eyebrow="Vienes del calendario SERNAPRED"
          body="Revisa o completa el registro del simulacro en este paso."
          href="/simulacros"
          cta="Volver al calendario"
          icon={Siren}
          accent="rose"
        />
      ) : null}

      <FamilyPlanStepNav currentStep={step} data={data} />

      <div
        className={cn(
          GLASS_PANEL_CLASS,
          // Clears compact sticky chrome (active below lg)
          "scroll-mt-44 flex flex-col gap-5 p-5 lg:scroll-mt-0 lg:gap-6 lg:p-6",
        )}
      >
        <header>
          <p className={cn(PREPARATION_EYEBROW_CLASS, "text-emerald-300/80")}>
            Paso {step}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">
            {description}
          </p>
        </header>

        {children}

        {/* Desktop footer inside panel */}
        <div className="hidden items-center justify-between gap-3 border-t border-white/10 pt-4 sm:flex">
          {navFooter}
        </div>
      </div>

      {/* Mobile sticky footer — hidden while typing */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/90 p-3 backdrop-blur-xl sm:hidden",
          "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          inputFocused && "pointer-events-none translate-y-full opacity-0",
          "transition-all duration-200",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2">{navFooter}</div>
      </div>
    </div>
  )
}
