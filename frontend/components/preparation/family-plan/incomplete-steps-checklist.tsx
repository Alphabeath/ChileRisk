"use client"

import Link from "next/link"
import { ArrowRight, Check, Circle } from "lucide-react"

import { getStepStatuses } from "@/lib/family-plan-completion"
import { WIZARD_STEPS } from "@/lib/family-plan-defaults"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import type { FamilyPlanData } from "@/lib/types"
import { cn } from "@/lib/utils"

interface IncompleteStepsChecklistProps {
  data: FamilyPlanData
  className?: string
}

/** Print-hidden checklist of incomplete wizard steps with deep links. */
export function IncompleteStepsChecklist({
  data,
  className,
}: IncompleteStepsChecklistProps) {
  const statuses = getStepStatuses(data)
  const incomplete = statuses.filter((s) => !s.completed)

  if (incomplete.length === 0) {
    return (
      <div
        className={cn(
          GLASS_PANEL_CLASS,
          GLASS_MICA_INTERACTIVE_CLASS,
          "print:hidden flex items-center gap-3 p-4",
          className,
        )}
      >
        <span className="flex size-8 items-center justify-center border border-emerald-500/40 bg-emerald-500/15">
          <Check className="size-4 text-emerald-300" aria-hidden />
        </span>
        <div>
          <p className={cn(PREPARATION_EYEBROW_CLASS, "text-emerald-200/90")}>
            Plan completo
          </p>
          <p className="mt-0.5 text-[12.5px] text-white/65">
            Los 8 pasos están listos. Puedes exportar el PDF cuando quieras.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        GLASS_PANEL_CLASS,
        "print:hidden flex flex-col gap-3 p-4 sm:p-5",
        className,
      )}
    >
      <div>
        <p className={cn(PREPARATION_EYEBROW_CLASS, "text-amber-200/90")}>
          Pasos pendientes ({incomplete.length})
        </p>
        <p className="mt-1 text-[12.5px] text-white/55">
          Completa estos pasos para subir el porcentaje del plan.
        </p>
      </div>
      <ul className="flex flex-col gap-1.5">
        {incomplete.map((s) => {
          const meta = WIZARD_STEPS.find((w) => w.step === s.step)
          return (
            <li key={s.step}>
              <Link
                href={`/preparation/family-plan/step/${s.step}`}
                className="group flex items-center gap-3 border border-white/10 bg-white/[0.03] px-3 py-2.5 transition-all hover:-translate-y-px hover:border-white/20 hover:bg-white/[0.06]"
              >
                <Circle className="size-3.5 shrink-0 text-amber-300/80" aria-hidden />
                <span className="min-w-0 flex-1 text-[12px] font-semibold text-white/85">
                  Paso {s.step} · {meta?.title}
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
