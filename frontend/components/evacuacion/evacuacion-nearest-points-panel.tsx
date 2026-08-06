"use client"

import { useMemo, useState } from "react"
import {
  ChevronDown,
  Crosshair,
  ExternalLink,
  MapPin,
  Navigation,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { buildGoogleMapsPlaceUrl } from "@/lib/evacuacion-popup"
import type { EvacuationUserLocationState } from "@/lib/evacuacion-location-state"
import {
  formatDistanceKm,
  nearestMeetingPoints,
  type EvacuationMeetingPoint,
} from "@/lib/evacuacion-meeting-points"
import {
  MAP_PANEL_TITLE_CLASS,
  MAP_PANEL_WIDTH_CLASS,
} from "@/lib/citizen-layout"
import { SURFACE_PANEL_SHELL_CLASS } from "@/lib/surface"
import { cn } from "@/lib/utils"

interface EvacuationNearestPointsPanelProps {
  points: Omit<EvacuationMeetingPoint, "distanceKm">[]
  userLocationState: EvacuationUserLocationState
  layersReady: boolean
  onFocusPoint: (point: { lng: number; lat: number }) => void
  onRequestLocate?: () => void
  /** Body only (e.g. mobile Sheet that already has a title). */
  embedded?: boolean
  /** Title + body without outer shell (parent provides the panel frame). */
  framed?: boolean
  className?: string
  apiPoints?: EvacuationMeetingPoint[] | null
  apiPending?: boolean
  apiFailed?: boolean
}

export function EvacuationNearestPointsPanel({
  points,
  userLocationState,
  layersReady,
  onFocusPoint,
  onRequestLocate,
  embedded = false,
  framed = true,
  className,
  apiPoints = null,
  apiPending = false,
  apiFailed = false,
}: EvacuationNearestPointsPanelProps) {
  const [expanded, setExpanded] = useState(true)

  const ranked = useMemo(() => {
    if (apiPoints && apiPoints.length > 0) return apiPoints
    const origin =
      userLocationState.status === "ready"
        ? { lat: userLocationState.lat, lng: userLocationState.lng }
        : null
    return nearestMeetingPoints(points, origin, 5)
  }, [apiPoints, points, userLocationState])

  const body = (
    <NearestBody
      layersReady={layersReady}
      userLocationState={userLocationState}
      ranked={ranked}
      apiPending={apiPending}
      apiFailed={apiFailed}
      onFocusPoint={onFocusPoint}
      onRequestLocate={onRequestLocate}
    />
  )

  if (embedded) return <div className="flex flex-col">{body}</div>

  const header = (
    <button
      type="button"
      className="flex h-10 w-full shrink-0 items-center justify-between gap-2 px-3 text-left"
      onClick={() => setExpanded((v) => !v)}
      aria-expanded={expanded}
    >
      <span className={MAP_PANEL_TITLE_CLASS}>Puntos cercanos</span>
      <ChevronDown
        className={cn(
          "size-4 text-muted-foreground transition-transform",
          expanded && "rotate-180",
        )}
        aria-hidden
      />
    </button>
  )

  const section = (
    <>
      {header}
      {expanded ? (
        <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
      ) : null}
    </>
  )

  const layoutClass = cn(
    "flex min-h-0 flex-col overflow-hidden",
    "shrink",
    className,
  )

  if (!framed) {
    return <div className={layoutClass}>{section}</div>
  }

  return (
    <section
      className={cn(
        SURFACE_PANEL_SHELL_CLASS,
        MAP_PANEL_WIDTH_CLASS,
        layoutClass,
      )}
    >
      {section}
    </section>
  )
}

function pointTitle(point: EvacuationMeetingPoint, index: number): string {
  if (point.sector && point.sector !== "—") return point.sector
  if (point.comuna && point.comuna !== "—") return point.comuna
  return `Punto ${index + 1}`
}

/** Location line without repeating the title (e.g. comuna twice). */
function pointLocationLine(
  point: EvacuationMeetingPoint,
  title: string,
): string | null {
  const parts: string[] = []
  if (
    point.comuna &&
    point.comuna !== "—" &&
    point.comuna.toLocaleLowerCase("es") !== title.toLocaleLowerCase("es")
  ) {
    parts.push(point.comuna)
  }
  if (point.provincia && point.provincia !== "—") {
    parts.push(point.provincia)
  }
  return parts.length > 0 ? parts.join(" · ") : null
}

function NearestBody({
  layersReady,
  userLocationState,
  ranked,
  apiPending,
  apiFailed,
  onFocusPoint,
  onRequestLocate,
}: {
  layersReady: boolean
  userLocationState: EvacuationUserLocationState
  ranked: EvacuationMeetingPoint[]
  apiPending: boolean
  apiFailed: boolean
  onFocusPoint: (point: { lng: number; lat: number }) => void
  onRequestLocate?: () => void
}) {
  if (!layersReady || apiPending) {
    return (
      <div className="flex flex-col gap-2 px-3 py-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (userLocationState.status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-8 text-center">
        <Crosshair className="size-6 animate-pulse text-muted-foreground" />
        <p className="text-[12px] font-medium text-foreground">
          Obteniendo ubicación…
        </p>
      </div>
    )
  }

  if (userLocationState.status === "idle" && ranked.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center">
        <Crosshair className="size-6 text-muted-foreground" />
        <div>
          <p className="text-[12px] font-medium text-foreground">
            Ubicación requerida
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Activa tu ubicación para listar puntos cercanos.
          </p>
        </div>
        {onRequestLocate ? (
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5"
            onClick={onRequestLocate}
          >
            <MapPin className="size-3.5" aria-hidden />
            Usar mi ubicación
          </Button>
        ) : null}
      </div>
    )
  }

  if (userLocationState.status === "unavailable") {
    const message =
      userLocationState.reason === "denied"
        ? "Permiso de ubicación denegado."
        : userLocationState.reason === "dismissed"
          ? "Activa tu ubicación para listar puntos cercanos."
          : userLocationState.reason === "out-of-bounds"
            ? "Tu ubicación está fuera del área del mapa."
            : "No se pudo obtener tu ubicación."
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center">
        <Crosshair className="size-6 text-muted-foreground" />
        <div>
          <p className="text-[12px] font-medium text-foreground">
            Ubicación no disponible
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">{message}</p>
        </div>
        {onRequestLocate ? (
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5"
            onClick={onRequestLocate}
          >
            <MapPin className="size-3.5" aria-hidden />
            Usar mi ubicación
          </Button>
        ) : null}
      </div>
    )
  }

  if (ranked.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-[11px] text-muted-foreground">
        {apiFailed
          ? "No se pudo consultar la API; sin puntos locales en esta zona."
          : "No hay puntos de encuentro en esta zona."}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border" role="list">
      {ranked.map((point, index) => {
        const title = pointTitle(point, index)
        const location = pointLocationLine(point, title)
        return (
          <li key={point.id} className="px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="min-w-0 truncate text-[11px] font-semibold text-foreground">
                {title}
              </p>
              {point.distanceKm != null ? (
                <p className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {formatDistanceKm(point.distanceKm)}
                </p>
              ) : null}
            </div>
            {location ? (
              <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                {location}
              </p>
            ) : null}
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                className="inline-flex h-8 items-center justify-center gap-1.5 border border-border bg-transparent px-2 font-mono text-[9px] font-semibold uppercase tracking-[1px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"
                onClick={() =>
                  onFocusPoint({ lng: point.lng, lat: point.lat })
                }
              >
                <Navigation className="size-3" aria-hidden />
                En mapa
              </button>
              <a
                href={buildGoogleMapsPlaceUrl(point.lat, point.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center justify-center gap-1.5 border border-border bg-transparent px-2 font-mono text-[9px] font-semibold uppercase tracking-[1px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"
              >
                <ExternalLink className="size-3" aria-hidden />
                Google Maps
              </a>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

