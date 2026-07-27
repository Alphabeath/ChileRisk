"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Route, Share2, ShieldQuestion, X } from "lucide-react"

import {
  ALERT_SOURCE_META,
  getActiveAlertMainText,
  htmlToPlainText,
  isLikelyHtml,
  sanitizeAlertHtml,
  timeAgo,
} from "@/lib/alerts-display"
import { CITIZEN_NAVBAR_CLEARANCE_PX } from "@/lib/citizen-layout"
import {
  EMERGENCY_CTA_GHOST_CLASS,
  EMERGENCY_CTA_SOLID_CLASS,
  EMERGENCY_STRIPE_BAR_CLASS,
  emergencyVisual,
} from "@/lib/emergency-ui"
import { cn } from "@/lib/utils"
import type { ActiveAlert, AlertLevel } from "@/lib/types"

export type EmergencyBannerProps = {
  alert: ActiveAlert
  severity: AlertLevel
  hazardLabel: string
  comunaName: string | null
  showEvacuate?: boolean
  onWhatToDo: () => void
  onEvacuate: () => void
  onShare: () => void
  onDismiss: () => void
}

type AlertDetail =
  | { kind: "html"; html: string }
  | { kind: "text"; text: string }

function alertDetail(alert: ActiveAlert, mainText: string): AlertDetail | null {
  const raw =
    (typeof alert.content === "string" && alert.content.trim()) ||
    (typeof alert.risk_detail === "string" && alert.risk_detail.trim()) ||
    null
  if (!raw) return null

  const plain = htmlToPlainText(raw)
  if (!plain) return null
  if (plain === mainText) return null
  if (mainText.includes(plain)) return null

  if (isLikelyHtml(raw)) {
    const html = sanitizeAlertHtml(raw)
    if (html) return { kind: "html", html }
  }
  return { kind: "text", text: plain }
}

/** Re-render "hace Xm" while the banner is visible. */
function useNowTick(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

export function EmergencyBanner({
  alert,
  severity,
  hazardLabel,
  comunaName,
  showEvacuate = true,
  onWhatToDo,
  onEvacuate,
  onShare,
  onDismiss,
}: EmergencyBannerProps) {
  const isRoja = severity === "roja"
  const visual = emergencyVisual(severity)
  const sourceMeta =
    ALERT_SOURCE_META[alert.source] ?? ALERT_SOURCE_META.senapred
  const place = comunaName ?? alert.region_name ?? "tu zona"
  const mainText = getActiveAlertMainText(alert)
  const detail = alertDetail(alert, mainText)
  useNowTick()

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "emergency-banner-enter fixed inset-x-0 z-40 mx-auto w-[min(100%-1.5rem,44rem)] border shadow-2xl backdrop-blur-xl",
        visual.bannerBg,
        visual.bannerBorder,
        visual.bannerShadow,
      )}
      style={{ top: CITIZEN_NAVBAR_CLEARANCE_PX }}
    >
      <div className={cn(EMERGENCY_STRIPE_BAR_CLASS, "h-2")} />

      <div className="px-3.5 py-3 sm:px-5">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "emergency-banner-icon mt-0.5 flex size-11 shrink-0 items-center justify-center border-2 border-white/80 bg-black/25",
            )}
            aria-hidden
          >
            <AlertTriangle className="size-6 text-white" strokeWidth={2.5} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2 className="text-xl font-black uppercase leading-none tracking-tight text-white sm:text-2xl">
                Alerta {severity === "roja" ? "Roja" : "Naranja"}
              </h2>
              <span className="inline-flex items-center gap-1.5 border border-white/50 bg-black/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                <span className="emergency-live-dot size-1.5 rounded-full bg-white" />
                Activa
                {alert.issued_at ? ` · hace ${timeAgo(alert.issued_at)}` : null}
              </span>
            </div>

            <p
              className={cn(
                "mt-1 text-[11px] font-bold uppercase tracking-[0.14em]",
                visual.accentText,
              )}
            >
              {hazardLabel} en {place}
            </p>

            <p className="mt-1.5 text-sm font-medium leading-snug text-white">
              {mainText}
            </p>

            {detail?.kind === "html" ? (
              <div
                className="alert-html-content mt-2 max-h-[14rem] overflow-y-auto border-l-2 border-white/40 bg-black/20 p-2.5 pr-1 sm:max-h-[18rem]"
                dangerouslySetInnerHTML={{ __html: detail.html }}
              />
            ) : null}
            {detail?.kind === "text" ? (
              <div className="mt-2 max-h-[14rem] overflow-y-auto border-l-2 border-white/40 bg-black/20 p-2.5 pr-1 text-xs leading-relaxed text-white/85 sm:max-h-[18rem]">
                {detail.text}
              </div>
            ) : null}

            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
              Fuente: {sourceMeta.label}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onWhatToDo()
                }}
                className={cn(EMERGENCY_CTA_SOLID_CLASS, "px-3.5 py-2")}
              >
                <ShieldQuestion className="size-4" aria-hidden />
                ¿Qué hago?
              </button>
              {showEvacuate ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEvacuate()
                  }}
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/80 px-3.5 py-2 text-xs font-black uppercase tracking-widest text-white transition-all duration-150 hover:-translate-y-px hover:bg-white/15 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/60 active:translate-y-0"
                >
                  <Route className="size-4" aria-hidden />
                  Evacuar
                </button>
              ) : null}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onShare()
                }}
                className={EMERGENCY_CTA_GHOST_CLASS}
              >
                <Share2 className="size-3.5" aria-hidden />
                Compartir
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDismiss()
            }}
            className="shrink-0 border border-white/40 bg-black/20 p-1.5 text-white/80 transition-colors hover:bg-black/40 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/60"
            aria-label="Minimizar alerta de emergencia"
            title="Minimizar — la alerta seguirá disponible como acceso rápido"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "h-1",
          isRoja ? "bg-red-400/70" : "bg-orange-300/70",
        )}
        aria-hidden
      />
    </div>
  )
}
