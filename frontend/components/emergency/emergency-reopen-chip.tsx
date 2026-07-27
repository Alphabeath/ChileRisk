"use client"

import { BellRing } from "lucide-react"

import { CITIZEN_NAVBAR_CLEARANCE_PX } from "@/lib/citizen-layout"
import { emergencyVisual } from "@/lib/emergency-ui"
import { cn } from "@/lib/utils"
import type { AlertLevel } from "@/lib/types"

export type EmergencyReopenChipProps = {
  severity: AlertLevel
  comunaName: string | null
  onReopen: () => void
}

/**
 * Persistent minimized indicator after dismissing the banner.
 * Re-expands the banner while the alert stays active.
 */
export function EmergencyReopenChip({
  severity,
  comunaName,
  onReopen,
}: EmergencyReopenChipProps) {
  const visual = emergencyVisual(severity)

  return (
    <div
      className="fixed left-1/2 z-40 -translate-x-1/2"
      style={{ top: CITIZEN_NAVBAR_CLEARANCE_PX }}
    >
      <button
        type="button"
        onClick={onReopen}
        className={cn(
          "emergency-chip-enter inline-flex items-center gap-2 border px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-2xl transition-transform duration-150 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
          visual.chipClass,
        )}
        aria-label="Reabrir alerta de emergencia activa"
      >
        <span className="emergency-live-dot size-2 rounded-full bg-white" />
        <BellRing className="size-3.5" aria-hidden />
        Alerta {severity === "roja" ? "Roja" : "Naranja"}
        {comunaName ? (
          <span className="font-semibold text-white/85">— {comunaName}</span>
        ) : null}
      </button>
    </div>
  )
}
