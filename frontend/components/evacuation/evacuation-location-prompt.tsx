"use client"

import { Crosshair, MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  GLASS_DIVIDER,
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"

export const EVACUATION_LOCATION_DISMISSED_KEY = "chilerisk-evacuation-location-dismissed"

export type GeolocationPermissionState = "granted" | "prompt" | "denied" | "unknown"

export type EvacuationLocationPromptStatus = "idle" | "loading" | "denied" | "unavailable" | "out-of-bounds"

/** Browser geolocation permission — `unknown` when Permissions API is unavailable. */
export async function getGeolocationPermissionState(): Promise<GeolocationPermissionState> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unknown"
  }

  try {
    const result = await navigator.permissions.query({ name: "geolocation" })
    if (result.state === "granted" || result.state === "prompt" || result.state === "denied") {
      return result.state
    }
    return "unknown"
  } catch {
    return "unknown"
  }
}

interface EvacuationLocationPromptProps {
  status: EvacuationLocationPromptStatus
  onAccept: () => void
  onDismiss: () => void
}

const glassButtonClass = cn(
  "flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[1.1px] transition-all duration-150",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
  "disabled:cursor-not-allowed disabled:opacity-45",
)

export function EvacuationLocationPrompt({
  status,
  onAccept,
  onDismiss,
}: EvacuationLocationPromptProps) {
  const isLoading = status === "loading"

  const errorMessage =
    status === "denied"
      ? "Permiso denegado. Activa la ubicación en tu navegador para centrar el mapa."
      : status === "unavailable"
        ? "No se pudo obtener tu ubicación. Revisa la conexión o inténtalo de nuevo."
        : status === "out-of-bounds"
          ? "Tu ubicación está fuera del área del mapa de Chile."
          : null

  return (
    <div
      className="absolute inset-0 z-30 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-labelledby="evacuation-location-prompt-title"
      aria-describedby="evacuation-location-prompt-desc"
    >
      <div
        className={cn(
          GLASS_PANEL_CLASS,
          GLASS_MICA_INTERACTIVE_CLASS,
          "relative w-full max-w-sm overflow-hidden",
        )}
      >
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            "absolute top-2 right-2 flex size-7 items-center justify-center text-white/45 transition-colors",
            "hover:bg-white/[0.06] hover:text-white/80",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
          )}
          aria-label="Cerrar"
          disabled={isLoading}
        >
          <X className="size-3.5" aria-hidden />
        </button>

        <div className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-chile)]/40 via-red-950/50 to-[var(--secondary-chile)]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/20" />
          <MapPin
            className="absolute -top-1 -right-2 size-16 text-white/[0.07]"
            aria-hidden
          />
          <div className="relative px-4 py-4 pr-10">
            <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/55">
              Ubicación
            </p>
            <h2
              id="evacuation-location-prompt-title"
              className="mt-1 text-lg font-semibold tracking-tight text-white"
            >
              Centrar en tu zona
            </h2>
          </div>
        </div>

        <div className="px-4 py-4">
          <p
            id="evacuation-location-prompt-desc"
            className="text-[12.5px] leading-snug text-white/80"
          >
            Con tu permiso, el mapa se acerca a tu comuna para mostrar rutas y puntos de
            encuentro cercanos. Solo se usa en este dispositivo.
          </p>

          {errorMessage ? (
            <p
              className="mt-3 border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-100/90"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className={cn("mt-4 flex gap-2 border-t pt-4", GLASS_DIVIDER)}>
            <button
              type="button"
              onClick={onDismiss}
              disabled={isLoading}
              className={cn(
                glassButtonClass,
                "border border-white/10 bg-white/[0.03] text-white/60",
                "hover:bg-white/[0.06] hover:text-white/85",
              )}
            >
              Ahora no
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={isLoading}
              className={cn(
                glassButtonClass,
                "border border-white/20 bg-white/15 text-white",
                "hover:bg-white/20 hover:text-white",
              )}
            >
              <Crosshair className="size-3.5 shrink-0" aria-hidden />
              {isLoading ? "Obteniendo…" : "Usar mi ubicación"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function wasEvacuationLocationDismissed(): boolean {
  if (typeof window === "undefined") return false
  try {
    return sessionStorage.getItem(EVACUATION_LOCATION_DISMISSED_KEY) === "1"
  } catch {
    return false
  }
}

export function dismissEvacuationLocationPrompt(): void {
  try {
    sessionStorage.setItem(EVACUATION_LOCATION_DISMISSED_KEY, "1")
  } catch {
    // sessionStorage unavailable — prompt may reappear on reload
  }
}