"use client"

import { Crosshair, MapPin, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SURFACE_PANEL_SHELL_CLASS } from "@/lib/surface"
import { cn } from "@/lib/utils"

export const EVACUATION_LOCATION_DISMISSED_KEY =
  "chilerisk-evacuacion-location-dismissed"

export type EvacuationLocationPromptStatus =
  | "idle"
  | "loading"
  | "denied"
  | "unavailable"
  | "out-of-bounds"

export function wasEvacuationLocationDismissed(): boolean {
  try {
    return localStorage.getItem(EVACUATION_LOCATION_DISMISSED_KEY) === "1"
  } catch {
    return false
  }
}

export function dismissEvacuationLocationPrompt(): void {
  try {
    localStorage.setItem(EVACUATION_LOCATION_DISMISSED_KEY, "1")
  } catch {
    /* ignore */
  }
}

export function clearEvacuationLocationDismissed(): void {
  try {
    localStorage.removeItem(EVACUATION_LOCATION_DISMISSED_KEY)
  } catch {
    /* ignore */
  }
}

interface EvacuationLocationPromptProps {
  status: EvacuationLocationPromptStatus
  onAccept: () => void
  onDismiss: () => void
}

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
      aria-labelledby="evacuacion-location-prompt-title"
      aria-describedby="evacuacion-location-prompt-desc"
    >
      <div
        className={cn(
          SURFACE_PANEL_SHELL_CLASS,
          "relative w-full max-w-sm overflow-hidden p-4",
        )}
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-2 right-2 flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <span className="mt-0.5 flex size-9 items-center justify-center bg-primary/15 text-primary">
            <Crosshair className="size-4" aria-hidden />
          </span>
          <div>
            <h2
              id="evacuacion-location-prompt-title"
              className="text-sm font-semibold text-foreground"
            >
              Usar tu ubicación
            </h2>
            <p
              id="evacuacion-location-prompt-desc"
              className="mt-1 text-[12px] leading-snug text-muted-foreground"
            >
              Mostramos los puntos de encuentro oficiales más cercanos y
              centramos el mapa en tu zona.
            </p>
          </div>
        </div>
        {errorMessage ? (
          <p className="mt-3 text-[11px] text-destructive">{errorMessage}</p>
        ) : null}
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onDismiss}
            disabled={isLoading}
          >
            Ahora no
          </Button>
          <Button
            type="button"
            className="flex-1 gap-1.5"
            onClick={onAccept}
            disabled={isLoading}
          >
            <MapPin className="size-3.5" aria-hidden />
            {isLoading ? "Obteniendo…" : "Permitir"}
          </Button>
        </div>
      </div>
    </div>
  )
}
