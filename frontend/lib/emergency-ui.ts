import { ALERT_LEVEL_META } from "@/lib/alerts-display"
import type { AlertLevel } from "@/lib/types"

export type EmergencyVisualConfig = {
  /** Vignette pulse period — roja faster = more urgent. */
  framePeriod: string
  /** Vignette edge alpha (CSS var for `.emergency-page-frame`). */
  frameColor: string
  /** Hazard-stripe bar colors (caution tape). */
  stripeA: string
  stripeB: string
  /** Saturated banner background (not near-black). */
  bannerBg: string
  bannerBorder: string
  bannerShadow: string
  /** Takeover full-screen background. */
  takeoverBg: string
  takeoverRing: string
  /** Accent text on saturated surfaces. */
  accentText: string
  chipClass: string
}

export const EMERGENCY_VISUALS: Record<"roja" | "naranja", EmergencyVisualConfig> =
  {
    roja: {
      framePeriod: "1.4s",
      frameColor: "rgba(218, 41, 28, 0.42)",
      stripeA: "#1c0503",
      stripeB: "#DA291C",
      bannerBg: "bg-gradient-to-b from-red-700/95 via-red-800/95 to-red-950/95",
      bannerBorder: "border-red-400/60",
      bannerShadow: "shadow-red-600/40",
      takeoverBg:
        "bg-gradient-to-b from-red-700 via-red-900 to-[#160302]",
      takeoverRing: "border-red-300/70",
      accentText: "text-red-200",
      chipClass: "bg-[#DA291C] border-red-300/50 shadow-red-600/50",
    },
    naranja: {
      framePeriod: "2.2s",
      frameColor: "rgba(251, 146, 60, 0.34)",
      stripeA: "#1c0f02",
      stripeB: "#fb923c",
      bannerBg:
        "bg-gradient-to-b from-orange-600/95 via-orange-700/95 to-orange-950/95",
      bannerBorder: "border-orange-300/60",
      bannerShadow: "shadow-orange-500/40",
      takeoverBg:
        "bg-gradient-to-b from-orange-600 via-orange-800 to-[#170a01]",
      takeoverRing: "border-orange-200/70",
      accentText: "text-orange-100",
      chipClass: "bg-orange-600 border-orange-200/50 shadow-orange-500/50",
    },
  }

export function emergencyVisual(severity: AlertLevel): EmergencyVisualConfig {
  return severity === "roja" ? EMERGENCY_VISUALS.roja : EMERGENCY_VISUALS.naranja
}

/** Animated caution-tape stripe bar (top of banner / takeover footer). */
export const EMERGENCY_STRIPE_BAR_CLASS = "emergency-stripe-bar" as const

/** Primary CTA on saturated emergency surfaces — solid white, black text. */
export const EMERGENCY_CTA_SOLID_CLASS =
  "inline-flex items-center justify-center gap-2 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-black/30 transition-all duration-150 hover:-translate-y-px hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/60 active:translate-y-0"

/** Secondary CTA — white outline over saturated background. */
export const EMERGENCY_CTA_OUTLINE_CLASS =
  "inline-flex items-center justify-center gap-2 border-2 border-white/80 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all duration-150 hover:-translate-y-px hover:bg-white/15 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/60 active:translate-y-0"

/** Ghost CTA (share / minor actions). */
export const EMERGENCY_CTA_GHOST_CLASS =
  "inline-flex items-center justify-center gap-1.5 border border-white/40 bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors duration-150 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/50"

/**
 * Path al asistente con el prompt de emergencia pre-cargado (`?q=`).
 * `AssistantChat` lo envía automáticamente al montar.
 */
export function emergencyAssistantPath(opts: {
  severity: AlertLevel
  hazardLabel: string
  comunaName: string | null
  comunaCode: number | null
}): string {
  const place = opts.comunaName ?? "mi comuna"
  const levelLabel = ALERT_LEVEL_META[opts.severity].label
  const prompt =
    `Estoy en ${place}` +
    (opts.comunaCode != null ? ` (código ${opts.comunaCode})` : "") +
    ` con alerta ${levelLabel} de ${opts.hazardLabel}. ` +
    "Dame exactamente 3 pasos concretos de seguridad, cortos, en español. Sin preámbulo."
  return `/assistant?${new URLSearchParams({ q: prompt }).toString()}`
}
