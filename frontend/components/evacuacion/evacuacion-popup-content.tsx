"use client"

import { ChevronRight, ExternalLink, X } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import {
  buildEvacuationPopupFields,
  buildGoogleMapsPlaceUrl,
  evacuationAccentUsesDarkInk,
  getDisasterGuideHref,
  getDisasterGuideLabel,
  getEvacuationPopupDescription,
  getEvacuationPopupHeroSideLabel,
  getEvacuationPopupMeta,
  getEvacuationPopupTitle,
  isEvacuationMeetingPointLayer,
  resolveEvacuationPopupAccent,
  volcanicHazardColor,
} from "@/lib/evacuacion-popup"
import { cn } from "@/lib/utils"

const FOOTER_PRIMARY_CLASS =
  "flex w-full items-center justify-between bg-primary px-3.5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[1.2px] text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"

const FOOTER_SECONDARY_CLASS =
  "flex w-full items-center justify-between bg-background px-3.5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[1.2px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"

function PeligroBadge({ value }: { value: string }) {
  const color = volcanicHazardColor(value)
  if (!color) {
    return (
      <span className="text-[12px] font-medium leading-snug text-foreground">
        {value}
      </span>
    )
  }
  const darkInk = evacuationAccentUsesDarkInk(color)
  return (
    <span
      className={cn(
        "inline-flex shrink-0 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[1.2px]",
        darkInk ? "text-neutral-950" : "text-white",
      )}
      style={{ backgroundColor: color }}
    >
      {value}
    </span>
  )
}

export function EvacuationPopupContent({
  layerId,
  properties,
  lng,
  lat,
  onClose,
  className,
}: {
  layerId: string
  properties: Record<string, unknown>
  lng: number
  lat: number
  onClose?: () => void
  className?: string
}) {
  const meta = getEvacuationPopupMeta(layerId)
  const title = getEvacuationPopupTitle(layerId, meta.title)
  const description = getEvacuationPopupDescription(layerId, properties)
  const fields = buildEvacuationPopupFields(layerId, properties)
  const isMeeting = isEvacuationMeetingPointLayer(layerId)
  const accentColor = resolveEvacuationPopupAccent(
    layerId,
    properties,
    meta.accentColor,
  )
  const darkInk = evacuationAccentUsesDarkInk(accentColor)
  const sideLabel = getEvacuationPopupHeroSideLabel(meta.badge)

  return (
    <div
      className={cn(
        "relative z-10 flex min-w-[240px] max-w-[310px] flex-col text-foreground",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-2.5 py-1">
        <p className="min-w-0 truncate font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
          {meta.badge}
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

      <div
        className="shrink-0 border-b border-border px-3.5 py-2.5"
        style={{ backgroundColor: accentColor }}
      >
        <div className="flex items-center gap-x-2.5">
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "font-sans text-[11px] font-semibold uppercase leading-snug tracking-[0.4px]",
                darkInk ? "text-neutral-950" : "text-white",
              )}
            >
              {title}
            </h3>
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
              Capa
            </div>
            <div
              className={cn(
                "mt-px max-w-[5.5rem] font-mono text-[11px] font-semibold uppercase leading-tight tracking-tight",
                darkInk ? "text-neutral-950" : "text-white",
              )}
            >
              {sideLabel}
            </div>
          </div>
        </div>
      </div>

      {description || fields.length > 0 ? (
        <div className="min-h-0 max-h-[min(40dvh,280px)] overflow-y-auto">
          <div className="flex flex-col gap-1.5 px-3.5 py-2.5">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
              Detalle
            </p>
            {description ? (
              <p className="text-[12px] leading-snug text-foreground">
                {description}
              </p>
            ) : null}
            {fields.length > 0 ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                {fields.map((field) => (
                  <div key={field.label} className="contents">
                    <dt className="font-mono text-[9px] uppercase tracking-[1.1px] text-muted-foreground">
                      {field.label}
                    </dt>
                    <dd className="justify-self-end text-right text-[12px] font-medium leading-snug text-foreground">
                      {field.label === "Peligro" ? (
                        <PeligroBadge value={field.value} />
                      ) : (
                        field.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex shrink-0 flex-col gap-px border-t border-border bg-border">
        {isMeeting ? (
          <a
            href={buildGoogleMapsPlaceUrl(lat, lng)}
            target="_blank"
            rel="noopener noreferrer"
            className={FOOTER_PRIMARY_CLASS}
          >
            <span>Abrir en Maps</span>
            <ExternalLink className="size-3" aria-hidden />
          </a>
        ) : null}
        <a
          href={getDisasterGuideHref(layerId)}
          className={isMeeting ? FOOTER_SECONDARY_CLASS : FOOTER_PRIMARY_CLASS}
        >
          <span>{getDisasterGuideLabel(layerId)}</span>
          <ChevronRight className="size-3" aria-hidden />
        </a>
      </div>
    </div>
  )
}
