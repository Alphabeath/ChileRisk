"use client"

import {
  Activity,
  MapPin,
  Snowflake,
  Thermometer,
  Waves,
  Wind,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { ActiveAlertCard, AirQualityAlertCard } from "@/components/map/alert-ui"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ALERT_LEVEL_META,
  alertLevelUsesDarkInk,
  mostSevereAlertLevel,
} from "@/lib/alerts-display"
import {
  AIR_QUALITY_LEVEL_META,
  sortZonesBySeverity,
} from "@/lib/air-quality-display"
import { bucketForAlert } from "@/lib/risk-scale"
import type { ActiveAlert, AirQualityZone, TerritoryRiskFields } from "@/lib/types"
import { cn } from "@/lib/utils"

export type TerritoryDetailStatus = "loading" | "empty" | "ready"

export interface TerritoryDetailContentProps {
  title: string
  parent?: string
  kind?: "region" | "comuna"
  /** CUT region code (1–16); shown as Roman in chrome. */
  codregion?: number
  status: TerritoryDetailStatus
  risk?: Partial<TerritoryRiskFields> | null
  /** Alerts that affect this territory (already filtered + sorted). */
  alerts?: ActiveAlert[]
  /** GEC zones covering this territory (already filtered). */
  airZones?: AirQualityZone[]
  alertsLoading?: boolean
  density?: "compact" | "comfortable"
  onClose?: () => void
  className?: string
}

const HAZARD_ROWS: {
  key: keyof TerritoryRiskFields
  label: string
  Icon: LucideIcon
}[] = [
  { key: "sismo_score", label: "Sismo", Icon: Activity },
  { key: "ola_calor_score", label: "Calor", Icon: Thermometer },
  { key: "ola_frio_score", label: "Frío", Icon: Snowflake },
  { key: "viento_score", label: "Viento", Icon: Wind },
  { key: "inundacion_score", label: "Inundación", Icon: Waves },
]


type HeaderAlert = {
  level: string
  label: string
  /** CSS color (var or hex) for header fill. */
  cssVar: string
  darkInk: boolean
}

/** Header from most severe ActiveAlert, else worst GEC zone. */
function resolveHeaderAlert(
  alerts: ActiveAlert[],
  airZones: AirQualityZone[],
): HeaderAlert | undefined {
  const fromAlerts = mostSevereAlertLevel(alerts)
  if (fromAlerts) {
    const meta = ALERT_LEVEL_META[fromAlerts]
    return {
      level: fromAlerts,
      label: meta.label,
      cssVar: meta.cssVar,
      darkInk: alertLevelUsesDarkInk(fromAlerts),
    }
  }
  if (airZones.length === 0) return undefined
  const worst = sortZonesBySeverity(airZones)[0]!
  const meta = AIR_QUALITY_LEVEL_META[worst.level]
  return {
    level: worst.level,
    label: meta.label,
    cssVar: meta.hex,
    darkInk: worst.level !== "emergencia",
  }
}

/** Chile CUT → Roman (RM for Metropolitana). */
function regionRoman(codregion: number | undefined): string | null {
  if (codregion == null || codregion <= 0) return null
  if (codregion === 13) return "RM"
  const map: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ]
  let n = codregion
  let out = ""
  for (const [v, s] of map) {
    while (n >= v) {
      out += s
      n -= v
    }
  }
  return out || null
}

function chromeRegionLabel(
  kind: "region" | "comuna" | undefined,
  codregion: number | undefined,
): string {
  const roman = regionRoman(codregion)
  if (!roman) return kind === "comuna" ? "Comuna" : "Región"
  return kind === "comuna" ? `Comuna · ${roman}` : `Región ${roman}`
}

function HazardRow({
  label,
  score,
  Icon,
}: {
  label: string
  score: number
  Icon: LucideIcon
}) {
  const bucket = bucketForAlert(undefined, score)
  const pct = Math.min(100, Math.max(0, score))
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
      <span className="w-[4.5rem] shrink-0 truncate font-mono text-[9px] uppercase tracking-[1.1px] text-muted-foreground">
        {label}
      </span>
      <div className="h-1 min-w-0 flex-1 overflow-hidden bg-muted">
        <div
          className="h-full max-w-full"
          style={{ width: `${pct}%`, backgroundColor: bucket.cssVar }}
        />
      </div>
      <span className="w-6 shrink-0 text-right font-mono text-[10px] font-semibold tabular-nums text-foreground">
        {score.toFixed(0)}
      </span>
    </div>
  )
}

function WeatherCell({
  Icon,
  value,
  unit,
  label,
  accentClass,
}: {
  Icon: LucideIcon
  value: string
  unit?: string
  label: string
  accentClass: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 px-1 py-0.5">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center border border-border bg-muted/50",
          accentClass,
        )}
      >
        <Icon className="size-3.5" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
          {value}
          {unit ? (
            <span className="ml-0.5 text-[10px] font-medium text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[1.1px] text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  )
}

function WeatherRow({
  temp,
  wind,
}: {
  temp?: number | null
  wind?: number | null
}) {
  if (temp == null && wind == null) return null
  return (
    <div className="flex flex-col gap-1.5 px-3.5 py-2.5">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
        Condiciones
      </p>
      <div
        className={cn(
          "grid gap-2",
          temp != null && wind != null ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        {temp != null ? (
          <WeatherCell
            Icon={Thermometer}
            value={temp.toFixed(1)}
            unit="°C"
            label="Temperatura"
            accentClass="text-sky-600 dark:text-sky-300"
          />
        ) : null}
        {wind != null ? (
          <WeatherCell
            Icon={Wind}
            value={wind.toFixed(0)}
            unit="km/h"
            label="Viento"
            accentClass="text-cyan-700 dark:text-cyan-300"
          />
        ) : null}
      </div>
    </div>
  )
}

function AlertsSection({
  alerts,
  airZones,
  alertsLoading,
}: {
  alerts: ActiveAlert[]
  airZones: AirQualityZone[]
  alertsLoading: boolean
}) {
  const count = alerts.length + airZones.length
  const showSkeleton = alertsLoading && count === 0

  return (
    <div className="flex flex-col">
      <p className="px-3.5 pt-2.5 pb-1.5 font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
        Alertas
        {!showSkeleton ? (
          <span className="tabular-nums"> · {count}</span>
        ) : null}
      </p>
      <div
        className="flex w-full flex-col gap-1.5 border-y border-border bg-background"
        aria-label="Alertas del territorio"
        aria-busy={showSkeleton || undefined}
      >
        {showSkeleton ? (
          Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="space-y-2 bg-background px-3.5 py-2.5">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))
        ) : count === 0 ? (
          <p className="bg-background px-3.5 py-2 font-mono text-[10px] uppercase tracking-[1.1px] text-muted-foreground">
            Sin alertas activas
          </p>
        ) : (
          <>
            {alerts.map((alert) => (
              <ActiveAlertCard
                key={`${alert.source}-${alert.id}`}
                alert={alert}
                showRegion={false}
              />
            ))}
            {airZones.map((zone) => (
              <AirQualityAlertCard
                key={`air-${zone.zone_slug}`}
                zone={zone}
                showRegion={false}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col" aria-busy aria-label="Cargando riesgo">
      <div className="border-b border-border px-3.5 pt-2.5 pb-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-8 w-10" />
        </div>
      </div>
      <div className="flex flex-col gap-2 px-3.5 py-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  )
}

export function TerritoryDetailContent({
  title,
  parent,
  kind,
  codregion,
  status,
  risk,
  alerts = [],
  airZones = [],
  alertsLoading = false,
  onClose,
  className,
}: TerritoryDetailContentProps) {
  if (status === "loading") {
    return (
      <div
        className={cn(
          "relative z-10 flex min-w-[240px] max-w-[310px] flex-col",
          className,
        )}
      >
        <LoadingSkeleton />
      </div>
    )
  }

  const alert = resolveHeaderAlert(alerts, airZones)
  const accent = alert?.cssVar
  const darkInk = alert?.darkInk ?? false

  const hazards =
    status === "ready"
      ? HAZARD_ROWS.filter((h) => typeof risk?.[h.key] === "number")
      : []

  const topLabel = chromeRegionLabel(kind, codregion)

  return (
    <div
      className={cn(
        "relative z-10 flex min-w-[240px] max-w-[310px] flex-col text-foreground",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-2.5 py-1">
        <p className="min-w-0 truncate font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
          {topLabel}
        </p>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex size-7 shrink-0 items-center justify-center border-0 bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"
          >
            <X className="size-3.5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          "shrink-0 border-b border-border px-3.5 py-2.5",
          !accent && "bg-muted/30",
        )}
        style={accent ? { backgroundColor: accent } : undefined}
      >
        <div className="flex items-center gap-x-2.5">
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "font-sans text-[11px] font-semibold uppercase leading-tight tracking-[0.4px]",
                alert
                  ? darkInk
                    ? "text-neutral-950"
                    : "text-white"
                  : "text-foreground",
              )}
            >
              {title}
            </h3>
            {parent ? (
              <div
                className={cn(
                  "mt-0.5 flex items-center gap-1 text-[9px] leading-tight",
                  alert
                    ? darkInk
                      ? "text-neutral-950/75"
                      : "text-white/80"
                    : "text-muted-foreground",
                )}
              >
                <MapPin className="size-2.5 shrink-0" aria-hidden />
                <span className="truncate">{parent}</span>
              </div>
            ) : null}
          </div>
          {alert ? (
            <>
              <Separator
                orientation="vertical"
                className={cn(
                  "h-8 shrink-0 data-[orientation=vertical]:h-8",
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
                  Alerta
                </div>
                <div
                  className={cn(
                    "mt-px font-mono text-[18px] font-semibold uppercase tabular-nums tracking-tight",
                    darkInk ? "text-neutral-950" : "text-white",
                  )}
                >
                  {alert.label}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 max-h-[min(50dvh,400px)] overflow-y-auto divide-y divide-border">
        <AlertsSection
          alerts={alerts}
          airZones={airZones}
          alertsLoading={alertsLoading}
        />
        {status === "empty" ? (
          <p className="px-3.5 py-3 text-[12px] leading-snug text-muted-foreground">
            Sin datos de riesgo para este territorio
          </p>
        ) : (
          <>
            <WeatherRow
              temp={risk?.temperature_c}
              wind={risk?.wind_speed_kmh}
            />
            {hazards.length > 0 ? (
              <div className="flex min-w-0 flex-col gap-1 px-3.5 py-2">
                {hazards.map(({ key, label, Icon }) => (
                  <HazardRow
                    key={key}
                    label={label}
                    score={risk![key] as number}
                    Icon={Icon}
                  />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>

    </div>
  )
}
