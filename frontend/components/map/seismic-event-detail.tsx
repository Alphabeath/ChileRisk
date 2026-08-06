"use client"

import {
  Activity,
  Clock,
  ExternalLink,
  MapPin,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { formatDepth, formatMagnitude } from "@/lib/format"
import {
  formatSeismicWhen,
  getSeismicAccentColor,
  getSeismicDetailUrl,
  getSeismicIntensityReportUrl,
  getSeismicLocation,
  getSeismicMagnitudeType,
  isSeismicPerceived,
  seismicUsesDarkInk,
} from "@/lib/seismic"
import type { SeismicEvent } from "@/lib/types"
import { cn } from "@/lib/utils"

function MetricCell({
  Icon,
  label,
  value,
  secondary,
}: {
  Icon: LucideIcon
  label: string
  value: string
  secondary?: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 px-1 py-0.5">
      <div className="flex size-8 shrink-0 items-center justify-center border border-border bg-muted/50 text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="font-mono text-[9px] uppercase tracking-[1.1px] text-muted-foreground">
          {label}
        </span>
        <span className="mt-0.5 whitespace-nowrap font-mono text-[12px] font-semibold tabular-nums text-foreground">
          {value}
        </span>
        {secondary ? (
          <span className="mt-0.5 font-mono text-[9px] tabular-nums text-muted-foreground">
            {secondary}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function SeismicEventDetailContent({
  event,
  onClose,
  className,
}: {
  event: SeismicEvent
  onClose?: () => void
  className?: string
}) {
  const mag = event.magnitude
  const accent = getSeismicAccentColor(mag)
  const darkInk = seismicUsesDarkInk(mag)
  const location = getSeismicLocation(event)
  const magType = getSeismicMagnitudeType(event)
  const detailUrl = getSeismicDetailUrl(event)
  const intensityUrl = getSeismicIntensityReportUrl(event)
  const perceived = isSeismicPerceived(event)
  const when = formatSeismicWhen(event)
  const relatedEvents = event.related_senapred_events ?? []
  const relatedAlerts = event.related_senapred_alerts ?? []
  const relatedLinks = [
    ...relatedEvents.flatMap((r) =>
      r.external_url
        ? [{ id: `e-${r.id}`, label: r.title, href: r.external_url }]
        : [],
    ),
    ...relatedAlerts.flatMap((r) =>
      r.external_url
        ? [{ id: `a-${r.id}`, label: `Alerta: ${r.title}`, href: r.external_url }]
        : [],
    ),
  ]
  const sourceShort = event.source === "csn" ? "CSN" : event.source.toUpperCase()

  return (
    <div
      className={cn(
        "relative z-10 flex min-w-[240px] max-w-[310px] flex-col text-foreground",
        className,
      )}
    >
      {/* Chrome */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-2.5 py-1">
        <p className="min-w-0 truncate font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
          Sismo · {sourceShort}
          {perceived ? (
            <span className="text-foreground/80"> · Percibido</span>
          ) : null}
        </p>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex size-7 shrink-0 items-center justify-center border-0 bg-transparent text-muted-foreground shadow-none transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"
          >
            <X className="size-3.5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      {/* Hero — location + magnitude */}
      <div
        className="shrink-0 border-b border-border px-3.5 py-2.5"
        style={{ backgroundColor: accent }}
      >
        <div className="flex items-center gap-x-2.5">
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "font-sans text-[11px] font-semibold uppercase leading-snug tracking-[0.4px]",
                darkInk ? "text-neutral-950" : "text-white",
              )}
            >
              {location ?? "Sismo registrado"}
            </h3>
            <div
              className={cn(
                "mt-1 flex items-center gap-1 font-mono text-[9px] tabular-nums",
                darkInk ? "text-neutral-950/70" : "text-white/75",
              )}
            >
              <MapPin className="size-2.5 shrink-0" aria-hidden />
              <span>
                {event.latitude.toFixed(3)}°, {event.longitude.toFixed(3)}°
              </span>
            </div>
          </div>
          <Separator
            orientation="vertical"
            className={cn(
              "h-9 shrink-0 data-[orientation=vertical]:h-9",
              darkInk ? "bg-neutral-950/25" : "bg-white/35",
            )}
          />
          <div className="shrink-0 text-right leading-none">
            <div
              className={cn(
                "font-mono text-[8px] font-semibold uppercase tracking-[1.4px]",
                darkInk ? "text-neutral-950/70" : "text-white/75",
              )}
            >
              Magnitud
            </div>
            <div
              className={cn(
                "mt-px font-mono text-[20px] font-semibold uppercase tabular-nums tracking-tight",
                darkInk ? "text-neutral-950" : "text-white",
              )}
            >
              {formatMagnitude(mag)}
            </div>
            {magType ? (
              <div
                className={cn(
                  "mt-0.5 font-mono text-[8px] uppercase tracking-[1.1px]",
                  darkInk ? "text-neutral-950/65" : "text-white/70",
                )}
              >
                {magType}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-h-0 max-h-[min(45dvh,360px)] overflow-y-auto divide-y divide-border">
        {/* Metrics — same rhythm as Condiciones */}
        <div className="flex flex-col gap-1.5 px-3.5 py-2.5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
            Detalle
          </p>
          <div
            className={cn(
              "grid gap-2",
              event.reported_intensity_max != null
                ? "grid-cols-1"
                : "grid-cols-2",
            )}
          >
            <MetricCell
              Icon={Activity}
              label="Profundidad"
              value={formatDepth(event.depth_km)}
            />
            <MetricCell
              Icon={Clock}
              label={when.label}
              value={when.value}
              secondary={when.secondaryValue}
            />
            {event.reported_intensity_max != null ? (
              <MetricCell
                Icon={Activity}
                label="Intensidad"
                value={`Mercalli ${event.reported_intensity_max.toFixed(1)}`}
              />
            ) : null}
          </div>
        </div>

        {relatedLinks.length > 0 ? (
          <div className="flex flex-col gap-1 px-3.5 py-2">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
              Relacionados
            </p>
            {relatedLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-mono text-[10px] text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}

        {!detailUrl && event.source === "csn" ? (
          <p className="px-3.5 py-2 text-[10px] leading-snug text-muted-foreground">
            El enlace al informe se actualizará en la próxima sincronización con
            CSN.
          </p>
        ) : null}
      </div>

      {/* Footer actions — full-bleed, same style */}
      <div className="flex shrink-0 flex-col gap-px border-t border-border bg-border">
        {detailUrl ? (
          <a
            href={detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-between bg-primary px-3.5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[1.2px] text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"
          >
            <span>Informe CSN</span>
            <ExternalLink className="size-3" aria-hidden />
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-between bg-muted px-3.5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[1.2px] text-muted-foreground opacity-60"
          >
            <span>Informe CSN</span>
            <ExternalLink className="size-3" aria-hidden />
          </button>
        )}
        {intensityUrl ? (
          <a
            href={intensityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-between bg-primary px-3.5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[1.2px] text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"
          >
            <span>Informe de Senapred</span>
            <ExternalLink className="size-3" aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  )
}
