"use client"

import { useEffect, useRef } from "react"
import { BellRing, ChevronDown, Route, ShieldQuestion } from "lucide-react"

import {
  ALERT_LEVEL_META,
  getActiveAlertMainText,
} from "@/lib/alerts-display"
import {
  EMERGENCY_CTA_OUTLINE_CLASS,
  EMERGENCY_CTA_SOLID_CLASS,
  EMERGENCY_STRIPE_BAR_CLASS,
  emergencyVisual,
} from "@/lib/emergency-ui"
import { cn } from "@/lib/utils"
import type { ActiveAlert, AlertLevel } from "@/lib/types"

export type EmergencyTakeoverProps = {
  alert: ActiveAlert
  severity: AlertLevel
  hazardLabel: string
  comunaName: string | null
  showEvacuate: boolean
  onWhatToDo: () => void
  onEvacuate: () => void
  onAcknowledge: () => void
}

const AUTO_COLLAPSE_MS = 12_000

/**
 * SAE-style full-screen takeover shown once per alert activation.
 * Auto-collapses to the persistent banner after ~12s or on any interaction.
 */
export function EmergencyTakeover({
  alert,
  severity,
  hazardLabel,
  comunaName,
  showEvacuate,
  onWhatToDo,
  onEvacuate,
  onAcknowledge,
}: EmergencyTakeoverProps) {
  const isRoja = severity === "roja"
  const visual = emergencyVisual(severity)
  const levelMeta = ALERT_LEVEL_META[severity]
  const place = comunaName ?? alert.region_name ?? "tu zona"
  const mainText = getActiveAlertMainText(alert)
  const primaryCtaRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    primaryCtaRef.current?.focus()
    const id = window.setTimeout(onAcknowledge, AUTO_COLLAPSE_MS)
    return () => window.clearTimeout(id)
  }, [onAcknowledge])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAcknowledge()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onAcknowledge])

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="emergency-takeover-title"
      aria-describedby="emergency-takeover-body"
      className={cn(
        "emergency-takeover fixed inset-0 z-[85] flex flex-col overflow-y-auto",
        visual.takeoverBg,
      )}
    >
      <div className={cn(EMERGENCY_STRIPE_BAR_CLASS, "h-2.5 shrink-0")} />

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <span
            className={cn(
              "emergency-takeover-ring absolute left-1/2 top-1/2 block size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 sm:size-72",
              visual.takeoverRing,
            )}
          />
          <span
            className={cn(
              "emergency-takeover-ring emergency-takeover-ring--delayed absolute left-1/2 top-1/2 block size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 sm:size-72",
              visual.takeoverRing,
            )}
          />
        </div>

        <div className="relative flex flex-col items-center">
          <div
            className={cn(
              "emergency-takeover-bell flex size-20 items-center justify-center border-4 border-white/90 bg-black/25 sm:size-24",
            )}
          >
            <BellRing
              className="size-10 text-white sm:size-12"
              strokeWidth={2.5}
              aria-hidden
            />
          </div>

          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.35em] text-white/75">
            Sistema de alerta — {place}
          </p>

          <h1
            id="emergency-takeover-title"
            className="mt-2 text-5xl font-black uppercase leading-none tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-7xl"
          >
            Alerta {levelMeta.label}
          </h1>

          <p
            className={cn(
              "mt-3 text-xl font-bold uppercase tracking-[0.2em] sm:text-2xl",
              visual.accentText,
            )}
          >
            {hazardLabel}
          </p>

          <p
            id="emergency-takeover-body"
            className="mt-5 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base"
          >
            {mainText}
          </p>

          <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <button
              ref={primaryCtaRef}
              type="button"
              onClick={onWhatToDo}
              className={cn(EMERGENCY_CTA_SOLID_CLASS, "flex-1 py-3.5 text-sm")}
            >
              <ShieldQuestion className="size-4" aria-hidden />
              ¿Qué hago?
            </button>
            {showEvacuate ? (
              <button
                type="button"
                onClick={onEvacuate}
                className={cn(
                  EMERGENCY_CTA_OUTLINE_CLASS,
                  "flex-1 py-3.5 text-sm",
                )}
              >
                <Route className="size-4" aria-hidden />
                Evacuar ahora
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onAcknowledge}
            className="mt-6 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/50"
          >
            Entendido — ver detalle
            <ChevronDown
              className="size-4 animate-bounce"
              style={{ animationDuration: "1.6s" }}
              aria-hidden
            />
          </button>
        </div>
      </div>

      <div className="shrink-0 px-6 pb-5">
        <div className="mx-auto h-1 w-full max-w-md bg-black/30">
          <div
            className="emergency-takeover-countdown h-full bg-white/85"
            style={{ animationDuration: `${AUTO_COLLAPSE_MS}ms` }}
          />
        </div>
        <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
          {isRoja ? "Mantén la calma y actúa de inmediato" : "Mantente informado y prepara tu plan"}
        </p>
      </div>

      <div className={cn(EMERGENCY_STRIPE_BAR_CLASS, "h-2.5 shrink-0")} />
    </div>
  )
}
