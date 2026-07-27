"use client"

import { cn } from "@/lib/utils"
import { emergencyVisual } from "@/lib/emergency-ui"
import type { AlertLevel } from "@/lib/types"

export type EmergencyPageFrameProps = {
  severity: AlertLevel
  /** Minimized state (banner dismissed → chip): static, dimmer vignette. */
  calm?: boolean
}

/**
 * Viewport edge tint (fade inward) + opacity pulse while emergency mode is active.
 * Roja pulses faster (1.4s) than naranja (2.2s). pointer-events-none so it never blocks UI.
 */
export function EmergencyPageFrame({
  severity,
  calm = false,
}: EmergencyPageFrameProps) {
  const isRoja = severity === "roja"
  const visual = emergencyVisual(severity)

  return (
    <div
      aria-hidden
      className={cn(
        "emergency-page-frame pointer-events-none fixed inset-0 z-30",
        isRoja ? "emergency-page-frame--roja" : "emergency-page-frame--naranja",
        calm && "emergency-page-frame--calm",
      )}
      style={
        {
          "--emergency-frame-color": visual.frameColor,
          "--emergency-frame-period": visual.framePeriod,
        } as React.CSSProperties
      }
    />
  )
}
