"use client"

import { AlertTriangle, Route, Share2, ShieldQuestion, X } from "lucide-react"

import {
  ALERT_LEVEL_META,
  ALERT_SOURCE_META,
  getActiveAlertMainText,
  timeAgo,
} from "@/lib/alerts-display"
import { CITIZEN_NAVBAR_CLEARANCE_PX } from "@/lib/citizen-layout"
import { cn } from "@/lib/utils"
import type { ActiveAlert, AlertLevel } from "@/lib/types"

export type EmergencyBannerProps = {
  alert: ActiveAlert
  severity: AlertLevel
  hazardLabel: string
  comunaName: string | null
  onWhatToDo: () => void
  onEvacuate: () => void
  onShare: () => void
  onDismiss: () => void
}

function alertDetailLine(alert: ActiveAlert, mainText: string): string | null {
  const detail =
    (typeof alert.content === "string" && alert.content.trim()) ||
    (typeof alert.risk_detail === "string" && alert.risk_detail.trim()) ||
    null
  if (!detail) return null
  if (detail === mainText) return null
  if (mainText.includes(detail)) return null
  return detail
}

export function EmergencyBanner({
  alert,
  severity,
  hazardLabel,
  comunaName,
  onWhatToDo,
  onEvacuate,
  onShare,
  onDismiss,
}: EmergencyBannerProps) {
  const isRoja = severity === "roja"
  const levelMeta = ALERT_LEVEL_META[severity]
  const sourceMeta =
    ALERT_SOURCE_META[alert.source] ?? ALERT_SOURCE_META.senapred
  const place = comunaName ?? alert.region_name ?? "tu zona"
  const mainText = getActiveAlertMainText(alert)
  const detail = alertDetailLine(alert, mainText)

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "fixed inset-x-0 z-40 mx-auto w-[min(100%-1.5rem,42rem)] border px-3 py-2.5 shadow-2xl shadow-black/50 backdrop-blur-xl sm:px-4",
        isRoja
          ? "border-red-500/70 bg-red-950/90 shadow-red-500/30"
          : "border-orange-500/70 bg-orange-950/90 shadow-orange-500/25",
        "animate-pulse",
      )}
      style={{ top: CITIZEN_NAVBAR_CLEARANCE_PX, animationDuration: "2.2s" }}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle
          className={cn(
            "mt-0.5 size-5 shrink-0",
            isRoja ? "text-red-300" : "text-orange-300",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[1.2px]",
              isRoja ? "text-red-200" : "text-orange-200",
            )}
          >
            Alerta {levelMeta.label} — {hazardLabel} en {place}
          </p>
          <p className="mt-1 text-sm leading-snug text-white/90">{mainText}</p>
          {detail ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/60">
              {detail}
            </p>
          ) : null}
          <p className="mt-1 truncate text-[11px] text-white/45">
            {sourceMeta.label}
            {alert.issued_at ? ` · hace ${timeAgo(alert.issued_at)}` : null}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={onWhatToDo}
              className="inline-flex items-center gap-1 border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-white/15"
            >
              <ShieldQuestion className="size-3.5" aria-hidden />
              ¿Qué hago?
            </button>
            <button
              type="button"
              onClick={onEvacuate}
              className="inline-flex items-center gap-1 border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-white/15"
            >
              <Route className="size-3.5" aria-hidden />
              Evacuar
            </button>
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-1 border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-white/15"
            >
              <Share2 className="size-3.5" aria-hidden />
              Compartir
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 border border-white/15 p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Cerrar alerta de emergencia"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
