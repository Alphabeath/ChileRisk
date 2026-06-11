import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import {
  FamilyPlanPdfActions,
  FamilyPlanPrintView,
} from "@/components/preparation/family-plan/family-plan-pdf"
import { DISASTERS_NAV_LINK_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

export default function FamilyPlanSummaryPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/preparation"
          className={cn(DISASTERS_NAV_LINK_CLASS, "inline-flex items-center gap-2")}
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Volver al dashboard
        </Link>
        <FamilyPlanPdfActions />
      </div>
      <FamilyPlanPrintView />
    </div>
  )
}