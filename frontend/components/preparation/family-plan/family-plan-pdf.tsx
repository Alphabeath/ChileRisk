"use client"

import { Printer } from "lucide-react"

import { FamilyPlanSummary } from "@/components/preparation/family-plan/family-plan-summary"
import { Button } from "@/components/ui/button"

export function FamilyPlanPdfActions() {
  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button type="button" onClick={handlePrint}>
        <Printer data-icon="inline-start" />
        Exportar PDF
      </Button>
      <p className="self-center text-[11px] text-white/45">
        Se abrirá el diálogo de impresión. Activa «Gráficos de fondo» para ver el
        mapa a color.
      </p>
    </div>
  )
}

export function FamilyPlanPrintView() {
  return (
    <div className="family-plan-print-area">
      <FamilyPlanSummary />
    </div>
  )
}