"use client"

import { useMemo, useState } from "react"
import {
  ChevronDown,
  Crosshair,
  ExternalLink,
  MapPin,
  Navigation,
} from "lucide-react"
import { useDraggablePanel } from "@/hooks"
import { buildGoogleMapsPlaceUrl } from "@/lib/evacuation-popup"
import type { EvacuationUserLocationState } from "@/lib/evacuation-location-state"
import {
  formatDistanceKm,
  nearestMeetingPoints,
  type EvacuationMeetingPoint,
} from "@/lib/evacuation-meeting-points"
import {
  MAP_PANEL_DRAG_HANDLE_CLASS,
  MAP_PANEL_HEADER_LABEL_CLASS,
  MAP_PANEL_SHELL_CLASS,
} from "@/lib/map-panel-styles"
import { cn } from "@/lib/utils"

interface EvacuationNearestPointsPanelProps {
  points: Omit<EvacuationMeetingPoint, "distanceKm">[]
  userLocationState: EvacuationUserLocationState
  layersReady: boolean
  onFocusPoint: (point: { lng: number; lat: number }) => void
  flow?: boolean
  disabled?: boolean
}

function LocationPendingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-8 text-center">
      <Crosshair className="size-6 animate-pulse text-amber-400/70" />
      <p className="text-[12px] font-medium text-white/80">Obteniendo ubicación…</p>
      <p className="text-[10px] leading-snug text-white/45">
        Espera un momento o acepta el permiso en el mapa para ver los puntos más cercanos.
      </p>
    </div>
  )
}

type UnavailableLocationReason = Extract<
  EvacuationUserLocationState,
  { status: "unavailable" }
>["reason"]

function LocationHint({ reason }: { reason: UnavailableLocationReason }) {
  const message =
    reason === "denied"
      ? "Permiso de ubicación denegado. Actívalo en el navegador para ver puntos cercanos."
      : reason === "dismissed"
        ? "Activa tu ubicación desde el panel del mapa para listar los puntos más cercanos."
        : reason === "out-of-bounds"
          ? "Tu ubicación está fuera del área del mapa de Chile."
          : reason === "unsupported"
            ? "Este navegador no admite geolocalización."
            : "No se pudo obtener tu ubicación. Revisa la conexión o inténtalo de nuevo."

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-8 text-center">
      <Crosshair className="size-6 text-amber-400/70" />
      <p className="text-[12px] font-medium text-white/80">Ubicación no disponible</p>
      <p className="text-[10px] leading-snug text-white/45">{message}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="border border-white/10 bg-white/[0.03] px-2.5 py-2.5">
          <div className="h-3 w-24 animate-pulse rounded-sm bg-white/[0.08]" />
          <div className="mt-2 h-2.5 w-full animate-pulse rounded-sm bg-white/[0.05]" />
        </div>
      ))}
    </div>
  )
}

export function EvacuationNearestPointsPanel({
  points,
  userLocationState,
  layersReady,
  onFocusPoint,
  flow = false,
  disabled,
}: EvacuationNearestPointsPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const { ref, handleProps, style, isDragging } = useDraggablePanel({
    id: "evacuation-meeting-points",
    corner: flow ? undefined : "top-left",
    cornerInset: 16,
    flow,
  })

  const userLocation =
    userLocationState.status === "ready"
      ? { lng: userLocationState.lng, lat: userLocationState.lat }
      : null

  const ranked = useMemo(
    () => nearestMeetingPoints(points, userLocation, 5),
    [points, userLocation],
  )

  return (
    <aside
      ref={ref}
      className={cn(MAP_PANEL_SHELL_CLASS, "flex max-h-[min(420px,48dvh)] flex-col")}
      style={style}
      aria-label="Puntos de encuentro"
      inert={disabled ? true : undefined}
    >
      <div className="flex w-full items-stretch border-b border-white/10">
        <div
          {...handleProps}
          className={cn(MAP_PANEL_DRAG_HANDLE_CLASS, "gap-2 py-2")}
          style={{ touchAction: "none" }}
          data-dragging={isDragging || undefined}
          aria-label="Arrastrar panel de puntos de encuentro"
        >
          <MapPin className="size-4 shrink-0 text-amber-400/90" aria-hidden />
          <div className="min-w-0 flex-1">
            <span className="block text-[10.5px] font-semibold uppercase tracking-[1.4px] text-white/85">
              Puntos de encuentro
            </span>
            {userLocation && ranked.length > 0 ? (
              <span className="mt-0.5 block font-mono text-[9px] text-white/45">
                {ranked.length} más próximos
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((value) => !value)
          }}
          aria-expanded={expanded}
          aria-controls="evacuation-nearest-points-body"
          aria-label={expanded ? "Colapsar lista" : "Expandir lista"}
          className="flex shrink-0 items-center border-l border-white/10 px-2 text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
        >
          <ChevronDown
            className={cn("size-3 transition-transform duration-200", !expanded && "-rotate-90")}
            aria-hidden
          />
        </button>
      </div>

      <div
        id="evacuation-nearest-points-body"
        className={cn("min-h-0 flex-1 overflow-y-auto", !expanded && "hidden")}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {!layersReady ? (
          <LoadingState />
        ) : userLocationState.status === "pending" ? (
          <LocationPendingState />
        ) : userLocationState.status === "unavailable" ? (
          <LocationHint reason={userLocationState.reason} />
        ) : ranked.length === 0 ? (
          <div className="px-4 py-6 text-center text-[11px] text-white/50">
            No hay puntos de encuentro en esta zona.
          </div>
        ) : (
          <ul className="divide-y divide-white/10" role="list">
            {ranked.map((point, index) => (
              <li key={point.id}>
                <div className="px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-white/90">
                        {point.comuna !== "—" ? point.comuna : `Punto ${index + 1}`}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-snug text-white/50">
                        {[
                          point.sector !== "—" ? point.sector : null,
                          point.provincia !== "—" ? point.provincia : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Punto de encuentro SENAPRED"}
                      </p>
                    </div>
                    {point.distanceKm != null ? (
                      <span className="shrink-0 font-mono text-[10px] font-semibold tabular-nums text-amber-200/90">
                        {formatDistanceKm(point.distanceKm)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onFocusPoint({ lng: point.lng, lat: point.lat })}
                      className="inline-flex items-center gap-1 border border-white/15 bg-white/[0.06] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/85 transition-colors hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
                    >
                      <Navigation className="size-3" aria-hidden />
                      Ver en mapa
                    </button>
                    <a
                      href={buildGoogleMapsPlaceUrl(point.lat, point.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
                    >
                      Google Maps
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}