"use client"

import { useFamilyPlan } from "@/hooks/use-family-plan"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { SPECIAL_KITS } from "@/components/preparation/emergency-kit/emergency-kit-content"
import { cn } from "@/lib/utils"
import { ShieldCheck, ShieldOff } from "lucide-react"

function hasFlag(flags: readonly string[], target: string): boolean {
  return flags.some((flag) => flag === target)
}

export function EmergencyKitSpecialNeeds() {
  const { data, isLoading } = useFamilyPlan()

  const flags = data?.members.flatMap((m) => m.flags) ?? []
  const hasPets = (data?.pets.length ?? 0) > 0
  const hasTea = flags.some((flag) =>
    flag === "tea" || flag.toLowerCase().includes("tea"),
  )

  const relevant = SPECIAL_KITS.filter((kit) => {
    if (kit.flagHint === "lactation") return hasFlag(flags, "lactation")
    if (kit.flagHint === "pregnancy") return hasFlag(flags, "pregnancy")
    if (kit.flagHint === "tea") return hasTea
    if (kit.flagHint === "pets") return hasPets
    return false
  })

  return (
    <section aria-labelledby="emergency-kit-special-heading">
      <div className="mb-3 flex flex-col gap-1">
        <h2
          id="emergency-kit-special-heading"
          className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/90"
        >
          Necesidades especiales
        </h2>
        <p className="text-[12px] text-white/50">
          Recomendaciones adicionales según los integrantes y mascotas registradas
          en tu Plan Familia Preparada.
        </p>
      </div>

      {isLoading ? (
        <div
          className={cn(
            GLASS_PANEL_CLASS,
            "p-4 text-[12px] text-white/55",
          )}
        >
          Cargando información de tu hogar...
        </div>
      ) : relevant.length === 0 ? (
        <div
          className={cn(
            GLASS_PANEL_CLASS,
            "flex items-start gap-3 p-4",
          )}
        >
          <ShieldOff className="mt-0.5 size-4 shrink-0 text-white/45" aria-hidden />
          <div>
            <p className="text-[13px] text-white/90">
              No hay necesidades especiales registradas.
            </p>
            <p className="mt-1 text-[12px] leading-snug text-white/55">
              Si en tu hogar hay lactantes, embarazadas, personas TEA o mascotas,
              puedes marcarlos en el paso 1 del Plan Familia para ver
              recomendaciones específicas aquí.
            </p>
          </div>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {relevant.map((kit) => {
            const Icon = kit.icon
            return (
              <li key={kit.id}>
                <article
                  className={cn(
                    GLASS_PANEL_CLASS,
                    "flex h-full flex-col overflow-hidden",
                  )}
                >
                  <header className="flex items-start gap-3 border-b border-white/10 p-4">
                    <div className="flex size-9 shrink-0 items-center justify-center border border-white/20 bg-black/40">
                      <Icon className={cn("size-4", kit.accent)} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/95">
                        {kit.title}
                      </h3>
                      <p className="mt-0.5 text-[12px] leading-snug text-white/55">
                        {kit.description}
                      </p>
                    </div>
                  </header>
                  <ul className="flex flex-1 flex-col gap-1.5 p-4">
                    {kit.examples.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-[12px] leading-snug text-white/75"
                      >
                        <span
                          className="mt-1.5 size-1 shrink-0 rounded-full bg-white/35"
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </li>
            )
          })}
        </ul>
      )}

      {relevant.length > 0 ? (
        <p className="mt-3 inline-flex items-center gap-2 text-[11px] text-white/45">
          <ShieldCheck className="size-3 text-emerald-300/80" aria-hidden />
          Ajustado automáticamente desde tu plan familiar.
        </p>
      ) : null}
    </section>
  )
}
