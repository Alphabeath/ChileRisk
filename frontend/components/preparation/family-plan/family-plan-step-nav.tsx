"use client"

import Link from "next/link"
import { Check } from "lucide-react"

import { WIZARD_STEPS } from "@/lib/family-plan-defaults"
import { isStepCompleted } from "@/lib/family-plan-completion"
import { GLASS_DIVIDER, GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import type { FamilyPlanData } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FamilyPlanStepNavProps {
  currentStep: number
  data: FamilyPlanData
}

export function FamilyPlanStepNav({ currentStep, data }: FamilyPlanStepNavProps) {
  const progressPct = (currentStep / WIZARD_STEPS.length) * 100

  return (
    <nav
      className={cn(GLASS_PANEL_CLASS, GLASS_MICA_INTERACTIVE_CLASS, "overflow-hidden")}
      aria-label="Pasos del plan familiar"
    >
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75">
          Plan Familia Preparada
        </p>
        <p className="mt-0.5 text-[11px] text-white/50">
          Paso {currentStep} de {WIZARD_STEPS.length}
        </p>
      </div>

      <div
        className="h-0.5 bg-white/10"
        role="progressbar"
        aria-valuenow={Math.round(progressPct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-emerald-500/80 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <ol className={cn("grid grid-cols-2 gap-px bg-white/5 sm:grid-cols-4", GLASS_DIVIDER)}>
        {WIZARD_STEPS.map((item) => {
          const done = isStepCompleted(data, item.step)
          const active = item.step === currentStep

          return (
            <li key={item.step}>
              <Link
                href={`/preparation/family-plan/step/${item.step}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[1px] transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:bg-white/[0.04] hover:text-white/80",
                )}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center border text-[9px]",
                    done
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                      : "border-white/20 bg-black/30 text-white/60",
                  )}
                >
                  {done ? <Check className="size-3" aria-hidden /> : item.step}
                </span>
                <span className="truncate">{item.title}</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}