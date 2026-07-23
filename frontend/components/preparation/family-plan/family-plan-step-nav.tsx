"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Check, ChevronDown, List } from "lucide-react"

import { WIZARD_STEPS } from "@/lib/family-plan-defaults"
import { isStepCompleted } from "@/lib/family-plan-completion"
import {
  GLASS_DIVIDER,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import type { FamilyPlanData } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FamilyPlanStepNavProps {
  currentStep: number
  data: FamilyPlanData
}

export function FamilyPlanStepNav({ currentStep, data }: FamilyPlanStepNavProps) {
  const [open, setOpen] = useState(false)
  const progressPct = Math.round((currentStep / WIZARD_STEPS.length) * 100)
  const currentMeta = WIZARD_STEPS.find((s) => s.step === currentStep)
  const prevStep = currentStep > 1 ? currentStep - 1 : null
  const nextStep = currentStep < WIZARD_STEPS.length ? currentStep + 1 : null
  const tabsRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const root = tabsRef.current
    if (!root) return
    const active = root.querySelector<HTMLElement>("[aria-current='step']")
    active?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" })
  }, [currentStep])

  return (
    <nav
      className={cn(
        // Compact sticky chrome below lg; wide step row only at lg+.
        // No interactive-mica here: its ::after overlay washed out title / CTA text.
        "sticky top-20 z-10 lg:static lg:top-auto",
        GLASS_PANEL_CLASS,
        "bg-black/85 backdrop-blur-xl lg:bg-black/60",
      )}
      aria-label="Pasos del plan familiar"
    >
      {/* Compact chrome: phone + tablet / medium */}
      <div className="relative z-[1] flex flex-col gap-2 p-3 lg:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className={cn(PREPARATION_EYEBROW_CLASS, "text-white/55")}>
              Paso {currentStep} de {WIZARD_STEPS.length}
            </p>
            <p className="truncate text-[13px] font-semibold text-white">
              {currentMeta?.title}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {prevStep ? (
              <Link
                href={`/preparation/family-plan/step/${prevStep}`}
                className="border border-white/15 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[1px] text-white/70 hover:bg-white/[0.06]"
              >
                Ant.
              </Link>
            ) : null}
            {nextStep ? (
              <Link
                href={`/preparation/family-plan/step/${nextStep}`}
                className="border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[1px] text-emerald-100 hover:bg-emerald-500/25"
              >
                Sig.
              </Link>
            ) : (
              <Link
                href="/preparation/family-plan/summary"
                className="border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[1px] text-emerald-100"
              >
                Fin
              </Link>
            )}
          </div>
        </div>
        <GlobalProgressBar progressPct={progressPct} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-[1px] text-white/70 transition-colors hover:bg-white/[0.06]"
          aria-expanded={open}
        >
          <span className="inline-flex items-center gap-2">
            <List className="size-3.5" aria-hidden />
            Ver todos los pasos
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {open ? (
          <ol className="grid grid-cols-2 gap-1 border border-white/10 bg-black/40 p-2">
            {WIZARD_STEPS.map((item) => (
              <StepLink
                key={item.step}
                item={item}
                currentStep={currentStep}
                done={isStepCompleted(data, item.step)}
                onNavigate={() => setOpen(false)}
                compact
              />
            ))}
          </ol>
        ) : null}
      </div>

      {/* Wide layout: global progress + equal-width tabs (all visible) */}
      <div className="relative z-[1] hidden lg:block">
        <div className="flex items-end justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className={cn(PREPARATION_EYEBROW_CLASS, "text-white/75")}>
              Plan Familia Preparada
            </p>
            <p className="mt-0.5 truncate text-[11px] text-white/50">
              Paso {currentStep} de {WIZARD_STEPS.length} · {currentMeta?.title}
            </p>
          </div>
          <p className="shrink-0 font-mono text-[11px] tabular-nums text-white/55">
            {progressPct}%
          </p>
        </div>

        <GlobalProgressBar progressPct={progressPct} />

        <ol
          ref={tabsRef}
          className={cn(
            "flex w-full gap-px overflow-x-auto overscroll-x-contain bg-white/5",
            "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent]",
            GLASS_DIVIDER,
            "border-t",
          )}
        >
          {WIZARD_STEPS.map((item) => (
            <li
              key={item.step}
              className="flex min-w-0 flex-1 basis-0"
            >
              <StepLink
                item={item}
                currentStep={currentStep}
                done={isStepCompleted(data, item.step)}
              />
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}

function GlobalProgressBar({ progressPct }: { progressPct: number }) {
  return (
    <div
      className="h-1 w-full bg-white/10"
      role="progressbar"
      aria-valuenow={progressPct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progreso del plan"
    >
      <div
        className="h-full bg-emerald-500/80 transition-[width] duration-300 ease-out"
        style={{ width: `${progressPct}%` }}
      />
    </div>
  )
}

function StepLink({
  item,
  currentStep,
  done,
  onNavigate,
  compact = false,
}: {
  item: (typeof WIZARD_STEPS)[number]
  currentStep: number
  done: boolean
  onNavigate?: () => void
  compact?: boolean
}) {
  const active = item.step === currentStep
  return (
    <Link
      href={`/preparation/family-plan/step/${item.step}`}
      onClick={onNavigate}
      title={item.title}
      className={cn(
        "flex h-full w-full min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[1px] transition-colors",
        compact ? "px-2.5 py-2" : "px-1.5 py-2.5 xl:gap-2 xl:px-2.5",
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
            : active
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
              : "border-white/20 bg-black/30 text-white/60",
        )}
      >
        {done ? <Check className="size-3" aria-hidden /> : item.step}
      </span>
      <span className="min-w-0 truncate">{item.title}</span>
    </Link>
  )
}
