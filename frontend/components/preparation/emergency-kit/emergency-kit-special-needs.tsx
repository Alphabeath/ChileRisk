"use client"

import Link from "next/link"
import { ArrowRight, ShieldCheck } from "lucide-react"

import {
  FamilyPlanCategoryShell,
  FamilyPlanStatusChip,
} from "@/components/preparation/family-plan/family-plan-layout"
import { SPECIAL_KITS } from "@/components/preparation/emergency-kit/emergency-kit-content"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import {
  PREPARATION_CTA_LIFT_CLASS,
  PREPARATION_EYEBROW_CLASS,
} from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

function hasFlag(flags: readonly string[], target: string): boolean {
  return flags.some((flag) => flag === target)
}

export function EmergencyKitSpecialNeeds() {
  const { data, isLoading } = useFamilyPlan()

  const flags = data?.members.flatMap((m) => m.flags) ?? []
  const hasPets = (data?.pets.length ?? 0) > 0
  const hasTea = flags.some(
    (flag) => flag === "tea" || flag.toLowerCase().includes("tea"),
  )

  const relevantIds = new Set(
    SPECIAL_KITS.filter((kit) => {
      if (kit.flagHint === "lactation") return hasFlag(flags, "lactation")
      if (kit.flagHint === "pregnancy") return hasFlag(flags, "pregnancy")
      if (kit.flagHint === "tea") return hasTea
      if (kit.flagHint === "pets") return hasPets
      return false
    }).map((kit) => kit.id),
  )

  const relevantCount = relevantIds.size

  return (
    <section aria-labelledby="emergency-kit-special-heading">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div>
          <h2
            id="emergency-kit-special-heading"
            className={cn(PREPARATION_EYEBROW_CLASS, "text-white/90")}
          >
            Necesidades especiales
          </h2>
          <p className="mt-0.5 text-[12px] text-white/50">
            Kits adicionales. Si tu hogar tiene lactantes, embarazadas, personas
            TEA o mascotas, aparecen marcados desde el plan.
          </p>
        </div>
        {!isLoading && relevantCount > 0 ? (
          <p className="inline-flex items-center gap-1.5 text-[11px] text-emerald-200/80">
            <ShieldCheck className="size-3.5" aria-hidden />
            {relevantCount} relevantes para tu hogar
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div className={cn(GLASS_PANEL_CLASS, "p-4 text-[12px] text-white/55")}>
          Cargando información de tu hogar...
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SPECIAL_KITS.map((kit) => {
            const Icon = kit.icon
            const relevant = relevantIds.has(kit.id)
            return (
              <li key={kit.id}>
                <FamilyPlanCategoryShell
                  accentClassName={kit.borderAccent}
                  className={cn(
                    "h-full",
                    relevant && "border-emerald-500/35 bg-emerald-500/[0.05]",
                  )}
                  header={
                    <div className="flex w-full items-start gap-2.5">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center border",
                          kit.iconChip,
                        )}
                      >
                        <Icon className={cn("size-3.5", kit.accent)} aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/95">
                            {kit.title}
                          </h3>
                          {relevant ? (
                            <FamilyPlanStatusChip tone="complete">
                              En tu hogar
                            </FamilyPlanStatusChip>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-[11.5px] leading-snug text-white/55">
                          {kit.description}
                        </p>
                      </div>
                    </div>
                  }
                >
                  {kit.examples.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 px-1 text-[12px] leading-snug text-white/75"
                    >
                      <span
                        className="mt-1.5 size-1 shrink-0 rounded-full bg-white/35"
                        aria-hidden
                      />
                      {item}
                    </div>
                  ))}
                </FamilyPlanCategoryShell>
              </li>
            )
          })}
        </ul>
      )}

      {!isLoading && relevantCount === 0 ? (
        <p className="mt-3 text-[12px] text-white/50">
          Ninguno marcado aún.{" "}
          <Link
            href="/preparation/family-plan/step/1"
            className={cn(
              PREPARATION_CTA_LIFT_CLASS,
              "inline-flex items-center gap-1 text-white/80 underline underline-offset-2 hover:text-white",
            )}
          >
            Actualiza el paso 1 de tu plan
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </p>
      ) : null}
    </section>
  )
}
