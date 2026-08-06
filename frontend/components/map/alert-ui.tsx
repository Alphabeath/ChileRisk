"use client"

import {
  Clock,
  ExternalLink,
  MapPin,
} from "lucide-react"

import type { ActiveAlert, AirQualityZone } from "@/lib/alert-types"
import { AIR_QUALITY_LEVEL_META } from "@/lib/air-quality-display"
import {
  ALERT_LEVEL_META,
  ALERT_SOURCE_META,
  alertLevelUsesDarkInk,
  getActiveAlertMainText,
  senapredSourceLabel,
  shortenRegionName,
  timeAgo,
} from "@/lib/alerts-display"
import { cn } from "@/lib/utils"

const TINT_PCT = 12

function tintBackground(color: string): string {
  return `color-mix(in srgb, ${color} ${TINT_PCT}%, var(--background))`
}

function LevelBadge({
  label,
  color,
  darkInk,
}: {
  label: string
  color: string
  darkInk: boolean
}) {
  return (
    <span
      className={cn(
        "shrink-0 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[1.2px]",
        darkInk ? "text-neutral-950" : "text-white",
      )}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  )
}

function alertCardSurfaceStyle(color: string) {
  return {
    borderLeftColor: color,
    backgroundColor: tintBackground(color),
  } as const
}

const ALERT_CARD_SHELL_CLASS =
  "group relative block border-l-[3px] py-2.5 pl-3.5 pr-3.5 transition-opacity"

export function ActiveAlertCard({
  alert,
  showRegion = true,
}: {
  alert: ActiveAlert
  compact?: boolean
  showRegion?: boolean
}) {
  const levelMeta = ALERT_LEVEL_META[alert.level] ?? ALERT_LEVEL_META.preventiva
  const darkInk = alertLevelUsesDarkInk(alert.level)
  const color = levelMeta.hex
  const sourceMeta = ALERT_SOURCE_META[alert.source] ?? ALERT_SOURCE_META.senapred
  const sourceLabel =
    alert.source === "senapred" ? senapredSourceLabel(alert) : sourceMeta.label
  const region = showRegion ? shortenRegionName(alert.region_name) : null
  const href = alert.external_url
  const isClickable =
    (alert.source === "senapred" ||
      alert.source === "sernageomin" ||
      alert.source === "meteochile") &&
    !!href

  const body = (
    <>
      <div className="mb-1.5 flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[1.3px] text-foreground">
            {sourceLabel}
          </div>
          {/* Spacer: keeps fuente ↔ título gap (was Monitoreo chip). */}
          <div className="mt-0.5 h-3" aria-hidden />
        </div>
        <LevelBadge label={levelMeta.label} color={color} darkInk={darkInk} />
      </div>

      <p className="line-clamp-4 text-[12px] font-medium leading-snug text-foreground">
        {getActiveAlertMainText(alert)}
      </p>

      <div className="mt-2 border-t border-border pt-2">
        <div className="flex items-center justify-end gap-1.5 font-mono text-[10px] font-semibold tabular-nums text-muted-foreground">
          {region ? (
            <span className="flex max-w-[min(180px,60%)] items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{region}</span>
            </span>
          ) : null}
          {region ? <span aria-hidden>·</span> : null}
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="size-3" aria-hidden />
            {timeAgo(alert.issued_at)}
          </span>
        </div>
      </div>

      {isClickable ? (
        <ExternalLink
          className="absolute right-2.5 top-2.5 size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70"
          aria-hidden
        />
      ) : null}
    </>
  )

  if (isClickable) {
    return (
      <a
        href={href!}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          ALERT_CARD_SHELL_CLASS,
          "hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40",
        )}
        style={alertCardSurfaceStyle(color)}
      >
        {body}
      </a>
    )
  }

  return (
    <div className={ALERT_CARD_SHELL_CLASS} style={alertCardSurfaceStyle(color)}>
      {body}
    </div>
  )
}

function airUsesDarkInk(level: AirQualityZone["level"]): boolean {
  return level !== "emergencia"
}

function airMainText(zone: AirQualityZone): string {
  const parts = [zone.zone_name]
  if (zone.forecast_level) {
    parts.push(
      `Pronóstico ${AIR_QUALITY_LEVEL_META[zone.forecast_level].label}`,
    )
  }
  if (zone.pm25_range_label) parts.push(zone.pm25_range_label)
  return parts.join(" · ")
}

/** Same shell as ActiveAlertCard — rail + tint + badge; link to Aire Chile. */
export function AirQualityAlertCard({
  zone,
  showRegion = true,
}: {
  zone: AirQualityZone
  compact?: boolean
  showRegion?: boolean
}) {
  const meta = AIR_QUALITY_LEVEL_META[zone.level]
  const darkInk = airUsesDarkInk(zone.level)
  const color = meta.hex
  const href = zone.external_url || null
  const place = showRegion
    ? `${zone.comuna_codes.length} comuna${zone.comuna_codes.length === 1 ? "" : "s"}`
    : null

  const body = (
    <>
      <div className="mb-1.5 flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[1.3px] text-foreground">
            Aire Chile
          </div>
          <div className="mt-0.5 h-3" aria-hidden />
        </div>
        <LevelBadge label={meta.label} color={color} darkInk={darkInk} />
      </div>

      <p className="line-clamp-4 text-[12px] font-medium leading-snug text-foreground">
        {airMainText(zone)}
      </p>

      <div className="mt-2 border-t border-border pt-2">
        <div className="flex items-center justify-end gap-1.5 font-mono text-[10px] font-semibold tabular-nums text-muted-foreground">
          {place ? (
            <span className="flex max-w-[min(180px,60%)] items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{place}</span>
            </span>
          ) : null}
          {place ? <span aria-hidden>·</span> : null}
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="size-3" aria-hidden />
            {timeAgo(zone.synced_at)}
          </span>
        </div>
      </div>

      {href ? (
        <ExternalLink
          className="absolute right-2.5 top-2.5 size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70"
          aria-hidden
        />
      ) : null}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          ALERT_CARD_SHELL_CLASS,
          "hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40",
        )}
        style={alertCardSurfaceStyle(color)}
      >
        {body}
      </a>
    )
  }

  return (
    <div className={ALERT_CARD_SHELL_CLASS} style={alertCardSurfaceStyle(color)}>
      {body}
    </div>
  )
}
