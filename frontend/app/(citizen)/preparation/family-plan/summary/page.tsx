"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { IncompleteStepsChecklist } from "@/components/preparation/family-plan/incomplete-steps-checklist"
import {
  FamilyPlanPdfActions,
  FamilyPlanPrintView,
} from "@/components/preparation/family-plan/family-plan-pdf"
import { PreparationBreadcrumb } from "@/components/preparation/preparation-breadcrumb"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import { DISASTERS_NAV_LINK_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

function SummaryChrome() {
  const { data } = useFamilyPlan()
  return (
    <div className="flex flex-col gap-4 print:hidden">
      <PreparationBreadcrumb
        items={[
          { label: "Preparación", href: "/preparation" },
          { label: "Plan Familia", href: "/preparation" },
          { label: "Resumen" },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/preparation"
          className={cn(DISASTERS_NAV_LINK_CLASS, "inline-flex items-center gap-2")}
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Volver a preparación
        </Link>
        <FamilyPlanPdfActions />
      </div>
      {data ? <IncompleteStepsChecklist data={data} /> : null}
    </div>
  )
}

export default function FamilyPlanSummaryPage() {
  return (
    <div className="flex flex-col gap-4">
      <SummaryChrome />
      <FamilyPlanPrintView />
    </div>
  )
}
