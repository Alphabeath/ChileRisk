"use client"

import { createRoot, type Root } from "react-dom/client"
import type { ReactNode } from "react"
import { Activity, Thermometer, Snowflake, Wind, ChevronRight, AlertTriangle } from "lucide-react"
import type { RegionProperties, ComunaProperties } from "./map-config"
import { Button } from "@/components/ui/button"

const HAZARD_META: Record<string, { label: string; Icon: typeof Activity }> = {
  sismo: { label: "Sismo", Icon: Activity },
  ola_calor: { label: "Calor", Icon: Thermometer },
  ola_frio: { label: "Frío", Icon: Snowflake },
  viento: { label: "Viento", Icon: Wind },
}

function getRiskAccent(severity?: string, score?: number): string {
  const s = score ?? 0
  if (severity === "critico" || s >= 75) return "#DA291C"
  if (severity === "alto" || s >= 55) return "#e07020"
  if (severity === "moderado" || s >= 35) return "#cc9e23"
  return "#15803d"
}

function hazardColor(score: number): string {
  if (score >= 75) return "bg-[#DA291C]"
  if (score >= 55) return "bg-[#e07020]"
  if (score >= 35) return "bg-[#cc9e23]"
  return "bg-[#15803d]"
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critico: "bg-[#DA291C]/20 text-[#ff9a9a] border-[#DA291C]/35",
    alto: "bg-orange-500/20 text-orange-300 border-orange-400/40",
    moderado: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    bajo: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
  }
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${colors[severity] || colors.bajo}`}
    >
      {severity}
    </span>
  )
}

function HazardRow({ label, score, Icon }: { label: string; score: number; Icon: typeof Activity }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3 shrink-0 text-muted-foreground/60" />
      <span className="w-9 text-[10px] text-muted-foreground/90">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full ${hazardColor(score)}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className="w-5 text-right font-mono text-[10px] tabular-nums text-foreground/90">
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
    <div className="flex items-center gap-1.5 rounded bg-white/5 px-2 py-1">
      <Icon className={`size-3.5 shrink-0 ${accent}`} />
      <div className="flex flex-col leading-tight">
        <span className={`font-mono text-[11px] font-semibold tabular-nums ${accent}`}>{value}</span>
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground/60">{label}</span>
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
  children,
  onViewDetail,
  actionLabel,
  compositeScore,
  accentColor,
}: {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  onViewDetail?: () => void
  actionLabel?: string
  compositeScore?: number
  accentColor?: string
}) {
  return (
    <div className="min-w-[240px] divide-y divide-white/10">
      {accentColor && <div className="h-0.5 w-full" style={{ backgroundColor: accentColor }} />}
      <div className="px-3.5 pt-2 pb-1.5">
        <div className="flex items-start justify-between gap-x-3">
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold leading-tight tracking-[-0.1px] text-foreground">{title}</h3>
            {subtitle && <div className="mt-1 flex items-center gap-1.5 text-[10px]">{subtitle}</div>}
          </div>
          {compositeScore != null && (
            <div className="shrink-0 text-right leading-none">
              <div className="text-[9px] font-medium uppercase tracking-[1.5px] text-muted-foreground/60">RIESGO</div>
              <div className="font-mono text-[22px] font-semibold tabular-nums text-foreground/95 mt-px">
                {compositeScore.toFixed(1)}
              </div>
            </div>
          )}
        </div>
      </div>

      {children}

      {onViewDetail && (
        <div className="px-3 py-2">
          <Button
            variant="default"
            size="xs"
            onClick={onViewDetail}
            className="w-full justify-between"
          >
            <span>{actionLabel || "Ver detalle"}</span>
            <ChevronRight className="size-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

function HazardScores({ properties }: { properties: RegionProperties | ComunaProperties }) {
  const hazards = [
    { key: "sismo_score" as const, meta: HAZARD_META.sismo },
    { key: "ola_calor_score" as const, meta: HAZARD_META.ola_calor },
    { key: "ola_frio_score" as const, meta: HAZARD_META.ola_frio },
    { key: "viento_score" as const, meta: HAZARD_META.viento },
  ].filter((h) => properties[h.key] != null)

  if (hazards.length === 0) return null

  return (
    <div className="px-3.5 py-2 space-y-1">
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
  const meta = properties.dominant_hazard ? HAZARD_META[properties.dominant_hazard] : null
  return (
    <>
      {properties.severity && <SeverityBadge severity={properties.severity} />}
      {meta && (
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
          <meta.Icon className="size-3" />
          {meta.label}
        </span>
      )}
    </>
  )
}

export function RegionPopupContent({ properties, onViewDetail }: RegionPopupContentProps) {
  return (
    <PopupShell
      title={properties.Region}
      subtitle={<HeaderExtras properties={properties} />}
      onViewDetail={onViewDetail}
      actionLabel="Ver comunas"
      compositeScore={properties.composite_score}
      accentColor={getRiskAccent(properties.severity, properties.composite_score)}
    >
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

export function ComunaPopupContent({ properties, onViewDetail }: ComunaPopupContentProps) {
  return (
    <PopupShell
      title={properties.Comuna}
      subtitle={
        <>
          <HeaderExtras properties={properties} />
          <span className="text-[10px] text-muted-foreground/60">· {properties.Region}</span>
        </>
      }
      onViewDetail={onViewDetail}
      compositeScore={properties.composite_score}
      accentColor={getRiskAccent(properties.severity, properties.composite_score)}
    >
      {properties.seismic_impact && typeof properties.seismic_impact.magnitude === "number" && (
        <div className="mx-2.5 my-1.5 flex gap-2 border-l-[3px] border-orange-400/70 bg-orange-500/10 pl-2.5 pr-2 py-1.5">
          <AlertTriangle className="size-3.5 shrink-0 text-orange-300" />
          <div className="text-[10px] leading-snug text-orange-200/90">
            <div className="font-semibold">Sismo M{properties.seismic_impact.magnitude.toFixed(1)}</div>
            <div className="text-orange-300/70">
              {(properties.seismic_impact.distance_km ?? 0).toFixed(0)} km · I{" "}
              {(properties.seismic_impact.estimated_intensity ?? 0).toFixed(1)}
            </div>
            {properties.seismic_impact.occurred_at && (
              <div className="text-[9px] text-orange-300/60 mt-0.5">
                {new Date(properties.seismic_impact.occurred_at).toLocaleString("es-CL", { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>
        </div>
      )}

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
  onViewDetail?: () => void
}

interface ComunaPopupContentProps {
  properties: ComunaProperties
  onViewDetail?: () => void
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
