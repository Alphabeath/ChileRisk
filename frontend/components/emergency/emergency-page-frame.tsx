"use client"

import { cn } from "@/lib/utils"
import type { AlertLevel } from "@/lib/types"

export type EmergencyPageFrameProps = {
  severity: AlertLevel
}

/**
 * Viewport edge tint (fade inward) + opacity pulse while emergency mode is active.
 * pointer-events-none so it never blocks UI.
 */
export function EmergencyPageFrame({ severity }: EmergencyPageFrameProps) {
  const isRoja = severity === "roja"

  return (
    <div
      aria-hidden
      className={cn(
        "emergency-page-frame pointer-events-none fixed inset-0 z-30",
        isRoja ? "emergency-page-frame--roja" : "emergency-page-frame--naranja",
      )}
    />
  )
}
