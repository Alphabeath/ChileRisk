"use client"

import type maplibregl from "maplibre-gl"
import Link from "next/link"
import { createRoot, type Root } from "react-dom/client"
import type { ReactNode } from "react"
import {
  Activity,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  Snowflake,
  Waves,
  Thermometer,
  Wind,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDepth } from "@/lib/format"
import {
  getSeismicAccentColor,
  getSeismicDetailUrl,
  getSeismicIntensityReportUrl,
  getSeismicLocation,
  getSeismicMagnitudeType,
  isSeismicPerceived,
} from "@/lib/seismic"
import type { ActiveAlert, AirQualityZone, SeismicEvent } from "@/lib/types"
import type { PopupSeismicItem } from "@/lib/seismic-events"
import type { RegionProperties, ComunaProperties } from "./map-config"
import { POPUP_MAX_ALERTS } from "@/lib/alerts-display"
import { GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { todayIsoDate } from "@/lib/query-date"
import { ActiveAlertsSection } from "./alert-ui"
import { PopupSeismicSection } from "./popup-seismic-section"

/** @deprecated Use GLASS_PANEL_CLASS from @/lib/glass-panel */
export const MAP_POPUP_GLASS_CLASS = GLASS_PANEL_CLASS

const HAZARD_META: Record<string, { label: string; Icon: typeof Activity }> = {
  sismo: { label: "Sismo", Icon: Activity },
  ola_calor: { label: "Calor", Icon: Thermometer },
  ola_frio: { label: "Frío", Icon: Snowflake },
  viento: { label: "Viento", Icon: Wind },
  inundacion: { label: "Inundación", Icon: Waves },
}

const SEVERITY_META = {
  critico: {
    label: "Crítico",
    hex: "#DA291C",
    badge: "bg-[#DA291C]/15 text-[#ff9a9a] border-[#DA291C]/45",
  },
  alto: {
    label: "Alto",
    hex: "#e07020",
    badge: "bg-orange-500/10 text-orange-300 border-orange-400/40",
  },
  moderado: {
    label: "Moderado",
    hex: "#cc9e23",
    badge: "bg-amber-500/10 text-amber-300 border-amber-400/40",
  },
  bajo: {
    label: "Bajo",
    hex: "#15803d",
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-400/40",
  },
} as const

type Severity = keyof typeof SEVERITY_META

function resolveSeverity(severity?: string, score?: number): Severity {
  const s = score ?? 0
  if (severity === "critico" || s >= 75) return "critico"
  if (severity === "alto" || s >= 55) return "alto"
  if (severity === "moderado" || s >= 35) return "moderado"
  return "bajo"
}

function severityFromScore(score: number): Severity {
  if (score >= 75) return "critico"
  if (score >= 55) return "alto"
  if (score >= 35) return "moderado"
  return "bajo"
}

function getRiskAccent(severity?: string, score?: number): string {
  return SEVERITY_META[resolveSeverity(severity, score)].hex
}

function SeverityBadge({ severity }: { severity: string }) {
  const meta = SEVERITY_META[severity as Severity] ?? SEVERITY_META.bajo
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[1px]",
        meta.badge
      )}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: meta.hex, boxShadow: `0 0 6px ${meta.hex}99` }}
        aria-hidden
      />
      {meta.label}
    </span>
  )
}

function HazardRow({ label, score, Icon }: { label: string; score: number; Icon: typeof Activity }) {
  const meta = SEVERITY_META[severityFromScore(score)]
  const pct = Math.min(100, Math.max(0, score))
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="size-3 shrink-0 text-white/55" aria-hidden />
      <span className="w-[4.5rem] shrink-0 truncate font-mono text-[9px] uppercase tracking-[1.1px] text-white/55">
        {label}
      </span>
      <div className="h-1 min-w-0 flex-1 overflow-hidden bg-white/[0.08]">
        <div
          className="h-full max-w-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: meta.hex }}
        />
      </div>
      <span className="w-6 shrink-0 text-right font-mono text-[10px] font-semibold tabular-nums text-white/90">
        {score.toFixed(0)}
      </span>
    </div>
  )
}

function WeatherCell({
  Icon,
  value,
  label,
  accent,
}: {
  Icon: typeof Activity
  value: string
  label: string
  accent: string
}) {
  return (
    <div className="flex items-center gap-1.5 border-l-[2px] border-white/15 bg-white/[0.04] px-2 py-1">
      <Icon className={`size-3.5 shrink-0 ${accent}`} />
      <div className="flex flex-col leading-tight">
        <span className={`font-mono text-[11px] font-semibold tabular-nums ${accent}`}>{value}</span>
        <span className="font-mono text-[9px] uppercase tracking-[1.1px] text-white/50">{label}</span>
      </div>
    </div>
  )
}

function WeatherRow({ temp, wind }: { temp?: number | null; wind?: number | null }) {
  if (temp == null && wind == null) return null
  return (
    <div className="grid grid-cols-2 gap-1.5 px-3.5 py-2">
      {temp != null && (
        <WeatherCell
          Icon={Thermometer}
          value={`${temp.toFixed(1)}°C`}
          label="Temp"
          accent="text-blue-300"
        />
      )}
      {wind != null && (
        <WeatherCell
          Icon={Wind}
          value={`${wind.toFixed(0)} km/h`}
          label="Viento"
          accent="text-cyan-300"
        />
      )}
    </div>
  )
}

function PopupShell({
  title,
  subtitle,
  parent,
  children,
  onViewDetail,
  actionLabel,
  routeHref,
  routeLabel,
  detailHref,
  detailLabel,
  onClose,
  compositeScore,
  scoreLabel = "Riesgo",
  scoreNote,
  accentColor,
  className,
}: {
  title: string
  subtitle?: ReactNode
  parent?: ReactNode
  children: ReactNode
  onViewDetail?: () => void
  actionLabel?: string
  routeHref?: string
  routeLabel?: string
  detailHref?: string
  detailLabel?: string
  onClose?: () => void
  compositeScore?: number
  scoreLabel?: string
  scoreNote?: string
  accentColor?: string
  className?: string
}) {
  const actionClass =
    "flex w-full items-center justify-between border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[1.2px] text-white/85 transition-colors hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
  const closeActionClass =
    "flex w-full items-center justify-between border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[1.2px] text-white/85 transition-colors hover:border-[#DA291C]/45 hover:bg-[#DA291C]/20 hover:text-[#ff9a9a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#DA291C]/50"
  return (
    <div
      className={cn(
        "flex min-w-[240px] max-w-[310px] flex-col",
        MAP_POPUP_GLASS_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        className
      )}
    >
      {accentColor && <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: accentColor }} />}
      <div className="shrink-0 border-b border-white/[0.07] px-3.5 pt-2.5 pb-1.5">
        <div className="flex items-start justify-between gap-x-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-semibold leading-tight tracking-[-0.1px] text-white">{title}</h3>
            {parent && (
              <div className="mt-0.5 flex items-center gap-1 text-[10px] leading-tight text-white/55">
                <MapPin className="size-2.5 shrink-0" />
                <span className="truncate">{parent}</span>
              </div>
            )}
            {subtitle && <div className="mt-1 flex items-center gap-1.5 text-[10px]">{subtitle}</div>}
          </div>
          {compositeScore != null && (
            <div className="shrink-0 text-right leading-none">
              <div className="font-mono text-[9px] font-semibold uppercase tracking-[1.4px] text-white/55">
                {scoreLabel}
              </div>
              <div className="mt-px font-mono text-[22px] font-semibold tabular-nums text-white/95">
                {compositeScore.toFixed(1)}
              </div>
              {scoreNote && (
                <div className="mt-0.5 font-mono text-[10px] font-medium text-white/55">{scoreNote}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0 max-h-[min(50dvh,400px)] overflow-y-auto divide-y divide-white/[0.07]">
        {children}
      </div>

      {(onViewDetail || routeHref || detailHref || onClose) && (
        <div className="flex shrink-0 flex-col gap-1.5 border-t border-white/[0.07] px-3 py-2">
          {onViewDetail && (
            <button type="button" onClick={onViewDetail} className={actionClass}>
              <span>{actionLabel || "Ver detalle"}</span>
              <ChevronRight className="size-3" />
            </button>
          )}
          {routeHref && (
            <Link href={routeHref} className={actionClass}>
              <span>{routeLabel || "Ver guía"}</span>
              <ChevronRight className="size-3 shrink-0" aria-hidden />
            </Link>
          )}
          {detailHref && (
            <a href={detailHref} target="_blank" rel="noopener noreferrer" className={actionClass}>
              <span>{detailLabel || "Ver informe CSN"}</span>
              <ExternalLink className="size-3 shrink-0" aria-hidden />
            </a>
          )}
          {onClose && (
            <button type="button" onClick={onClose} className={closeActionClass}>
              <span>Cerrar</span>
              <X className="size-3 shrink-0" strokeWidth={2.25} aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function SeismicStat({
  label,
  value,
  secondaryValue,
  Icon,
}: {
  label: string
  value: string
  secondaryValue?: string
  Icon: typeof Activity
}) {
  return (
    <div className="flex gap-2.5 border-l-[2px] border-white/15 bg-white/[0.04] px-2.5 py-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-white/55" />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[9px] uppercase tracking-[1.1px] text-white/50">{label}</div>
        <div className="mt-0.5 font-mono text-[11px] font-semibold leading-snug tabular-nums text-white/90">
          {value}
        </div>
        {secondaryValue && (
          <div className="mt-0.5 font-mono text-[10px] leading-snug tabular-nums text-white/55">
            {secondaryValue}
          </div>
        )}
      </div>
    </div>
  )
}

function formatSeismicWhen(event: SeismicEvent): {
  label: string
  value: string
  secondaryValue?: string
} {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("es-CL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })

  if (event.occurred_at_local) {
    const local = fmt(event.occurred_at_local)
    const utc = fmt(event.occurred_at)
    return {
      label: "Fecha y hora",
      value: local,
      secondaryValue: local !== utc ? `UTC ${utc}` : undefined,
    }
  }

  return { label: "Fecha y hora (UTC)", value: fmt(event.occurred_at) }
}

export function SeismicEventPopupContent({
  event,
  onClose,
}: {
  event: SeismicEvent
  onClose?: () => void
}) {
  const mag = event.magnitude
  const accent = getSeismicAccentColor(mag)
  const location = getSeismicLocation(event)
  const magType = getSeismicMagnitudeType(event)
  const detailUrl = getSeismicDetailUrl(event)
  const intensityUrl = getSeismicIntensityReportUrl(event)
  const perceived = isSeismicPerceived(event)
  const when = formatSeismicWhen(event)
  const relatedEvents = event.related_senapred_events ?? []
  const relatedAlerts = event.related_senapred_alerts ?? []

  return (
    <PopupShell
      title={location ?? "Sismo registrado"}
      subtitle={
        <span className="inline-flex flex-wrap items-center gap-1">
          <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/70">
            <Activity className="size-2.5" />
            {event.source === "csn" ? "CSN · sismologia.cl" : event.source}
          </span>
          {perceived && (
            <span className="rounded-sm border border-orange-400/40 bg-orange-500/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-orange-200/90">
              Percibido
            </span>
          )}
        </span>
      }
      parent={
        <span className="font-mono tabular-nums">
          {event.latitude.toFixed(3)}°, {event.longitude.toFixed(3)}°
        </span>
      }
      compositeScore={mag}
      scoreLabel="Magnitud"
      scoreNote={magType ?? undefined}
      accentColor={accent}
      detailHref={detailUrl ?? undefined}
      detailLabel="Ver informe CSN"
      onClose={onClose}
    >
      <div className="flex flex-col gap-1.5 px-3 py-2.5">
        <SeismicStat Icon={Activity} label="Profundidad" value={formatDepth(event.depth_km)} />
        <SeismicStat
          Icon={Clock}
          label={when.label}
          value={when.value}
          secondaryValue={when.secondaryValue}
        />
        {event.reported_intensity_max != null && (
          <SeismicStat
            Icon={Activity}
            label="Intensidad reportada"
            value={`Mercalli ${event.reported_intensity_max.toFixed(1)}`}
          />
        )}
      </div>
      {(intensityUrl || relatedEvents.length > 0 || relatedAlerts.length > 0) && (
        <div className="flex flex-col gap-1 border-t border-white/[0.07] px-3 py-2">
          {intensityUrl && (
            <a
              href={intensityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[1px] text-white/85 hover:border-white/20 hover:bg-white/[0.08]"
            >
              <span>Reporte de intensidades (SERNAPRED)</span>
              <ExternalLink className="size-3 shrink-0" aria-hidden />
            </a>
          )}
          {relatedEvents.map((rel) =>
            rel.external_url ? (
              <a
                key={rel.id}
                href={rel.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate px-1 py-0.5 font-mono text-[10px] text-sky-300/90 hover:text-sky-200"
              >
                {rel.title}
              </a>
            ) : null
          )}
          {relatedAlerts.map((rel) =>
            rel.external_url ? (
              <a
                key={rel.id}
                href={rel.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate px-1 py-0.5 font-mono text-[10px] text-amber-300/80 hover:text-amber-200"
              >
                Alerta: {rel.title}
              </a>
            ) : null
          )}
        </div>
      )}
      {!detailUrl && event.source === "csn" && (
        <p className="px-3.5 pb-2 text-[10px] leading-snug text-white/45">
          El enlace al informe se actualizará en la próxima sincronización con CSN.
        </p>
      )}
    </PopupShell>
  )
}

function HazardScores({ properties }: { properties: RegionProperties | ComunaProperties }) {
  const hazards = [
    { key: "sismo_score" as const, meta: HAZARD_META.sismo },
    { key: "ola_calor_score" as const, meta: HAZARD_META.ola_calor },
    { key: "ola_frio_score" as const, meta: HAZARD_META.ola_frio },
    { key: "viento_score" as const, meta: HAZARD_META.viento },
    { key: "inundacion_score" as const, meta: HAZARD_META.inundacion },
  ].filter((h) => properties[h.key] != null)

  if (hazards.length === 0) return null

  return (
    <div className="flex min-w-0 flex-col gap-1 px-3.5 py-2">
      {hazards.map(({ key, meta }) => (
        <HazardRow
          key={key}
          label={meta.label}
          score={properties[key] as number}
          Icon={meta.Icon}
        />
      ))}
    </div>
  )
}

function HeaderExtras({ properties }: { properties: RegionProperties | ComunaProperties }) {
  if (!properties.severity) return null
  return <SeverityBadge severity={properties.severity} />
}

export function RegionPopupContent({
  properties,
  alerts = [],
  airZones = [],
  seismicItems = [],
  alertsLoading = false,
  queryDate = todayIsoDate(),
  onViewDetail,
  onClose,
}: RegionPopupContentProps) {
  return (
    <PopupShell
      title={properties.Region}
      subtitle={<HeaderExtras properties={properties} />}
      onViewDetail={onViewDetail}
      actionLabel="Ver comunas"
      onClose={onClose}
      compositeScore={properties.composite_score}
      accentColor={getRiskAccent(properties.severity, properties.composite_score)}
    >
      <ActiveAlertsSection
        alerts={alerts}
        airZones={airZones}
        isLoading={alertsLoading}
        compact
        showRegion={false}
        collapsedLimit={POPUP_MAX_ALERTS}
      />
      <PopupSeismicSection items={seismicItems} queryDate={queryDate} collapsedLimit={2} />
      {properties.composite_score != null && (
        <div>
          <WeatherRow
            temp={properties.avg_temperature_c}
            wind={properties.avg_wind_speed_kmh}
          />
          <HazardScores properties={properties} />
        </div>
      )}
    </PopupShell>
  )
}

export function ComunaPopupContent({
  properties,
  alerts = [],
  airZones = [],
  seismicItems = [],
  alertsLoading = false,
  queryDate = todayIsoDate(),
  onViewDetail,
  onClose,
}: ComunaPopupContentProps) {
  return (
    <PopupShell
      title={properties.Comuna}
      parent={properties.Region}
      subtitle={<HeaderExtras properties={properties} />}
      onViewDetail={onViewDetail}
      onClose={onClose}
      compositeScore={properties.composite_score}
      accentColor={getRiskAccent(properties.severity, properties.composite_score)}
    >
      <ActiveAlertsSection
        alerts={alerts}
        airZones={airZones}
        isLoading={alertsLoading}
        compact
        showRegion={false}
        collapsedLimit={POPUP_MAX_ALERTS}
      />
      <PopupSeismicSection items={seismicItems} queryDate={queryDate} collapsedLimit={2} />
      {properties.composite_score != null && (
        <div>
          <WeatherRow temp={properties.temperature_c} wind={properties.wind_speed_kmh} />
          <HazardScores properties={properties} />
        </div>
      )}
    </PopupShell>
  )
}

interface RegionPopupContentProps {
  properties: RegionProperties
  alerts?: ActiveAlert[]
  airZones?: AirQualityZone[]
  seismicItems?: PopupSeismicItem[]
  alertsLoading?: boolean
  queryDate?: string
  onViewDetail?: () => void
  onClose?: () => void
}

interface ComunaPopupContentProps {
  properties: ComunaProperties
  alerts?: ActiveAlert[]
  airZones?: AirQualityZone[]
  seismicItems?: PopupSeismicItem[]
  alertsLoading?: boolean
  queryDate?: string
  onViewDetail?: () => void
  onClose?: () => void
}

function PopupDetailRow({
  label,
  value,
  Icon = MapPin,
}: {
  label: string
  value: string
  Icon?: typeof MapPin
}) {
  return (
    <div className="flex gap-2.5 border-l-[2px] border-white/15 bg-white/[0.04] px-2.5 py-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-white/55" />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[9px] uppercase tracking-[1.1px] text-white/50">{label}</div>
        <div className="mt-0.5 text-[11px] font-medium leading-snug text-white/90">{value}</div>
      </div>
    </div>
  )
}

export interface EvacuationAreaPopupProps {
  comuna?: string
  provincia?: string
  sector?: string
  onClose?: () => void
}

export function EvacuationAreaPopupContent({
  comuna,
  provincia,
  sector,
  onClose,
}: EvacuationAreaPopupProps) {
  return (
    <PopupShell
      title="Área de evacuación"
      subtitle={
        <span className="inline-flex items-center gap-1 rounded-sm border border-red-400/40 bg-red-500/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-red-200/90">
          Tsunami · SENAPRED
        </span>
      }
      parent={comuna}
      accentColor="#ef4444"
      routeHref="/disasters/tsunami"
      routeLabel="Guía de preparación · tsunami"
      onClose={onClose}
    >
      <div className="flex flex-col gap-1.5 px-3 py-2.5">
        {provincia ? <PopupDetailRow label="Provincia" value={provincia} /> : null}
        {sector ? <PopupDetailRow label="Sector" value={sector} /> : null}
      </div>
    </PopupShell>
  )
}

export interface EvacuationKmzPopupProps {
  title: string
  badge: string
  accentColor: string
  fields: { label: string; value: string }[]
  routeHref?: string
  routeLabel?: string
  detailHref?: string
  detailLabel?: string
  onClose?: () => void
}

export function EvacuationKmzPopupContent({
  title,
  badge,
  accentColor,
  fields,
  routeHref,
  routeLabel,
  detailHref,
  detailLabel,
  onClose,
}: EvacuationKmzPopupProps) {
  return (
    <PopupShell
      title={title}
      subtitle={
        <span
          className="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider"
          style={{
            borderColor: `${accentColor}66`,
            backgroundColor: `${accentColor}22`,
            color: accentColor,
          }}
        >
          {badge}
        </span>
      }
      accentColor={accentColor}
      routeHref={routeHref}
      routeLabel={routeLabel}
      detailHref={detailHref}
      detailLabel={detailLabel}
      onClose={onClose}
    >
      <div className="flex flex-col gap-1.5 px-3 py-2.5">
        {fields.map((field) => (
          <PopupDetailRow key={field.label} label={field.label} value={field.value} />
        ))}
      </div>
    </PopupShell>
  )
}

/** MapLibre popups live inside `.maplibregl-map` (overflow:hidden), which blocks backdrop-filter. */
export function addPopupToOverlay(map: maplibregl.Map, popup: maplibregl.Popup): maplibregl.Popup {
  popup.addTo(map)
  const el = popup.getElement()
  const overlay = map.getContainer().parentElement
  if (el && overlay && el.parentElement !== overlay) {
    overlay.appendChild(el)
  }
  return popup
}

export function createPopupContent(node: ReactNode): { element: HTMLDivElement; destroy: () => void } {
  const element = document.createElement("div")
  const root: Root = createRoot(element)
  root.render(node)
  let unmounted = false
  return {
    element,
    destroy: () => {
      if (!unmounted) {
        unmounted = true
        queueMicrotask(() => root.unmount())
      }
    },
  }
}
