"use client"

import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Eye, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ALERT_LEVEL_META,
  formatAlertCategory,
  shortenRegionName,
  timeAgo,
} from "@/lib/senapred-display"
import type { SenapredAlert } from "@/lib/types"

export function AlertLevelBadge({ level }: { level: SenapredAlert["level"] }) {
  const meta = ALERT_LEVEL_META[level]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider",
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

export function SenapredAlertCard({
  alert,
  compact = false,
  showRegion = true,
}: {
  alert: SenapredAlert
  compact?: boolean
  showRegion?: boolean
}) {
  const meta = ALERT_LEVEL_META[alert.level]
  const href = alert.senapred_url
  const isClickable = !!href
  const region = showRegion ? shortenRegionName(alert.region_name) : null

  return (
    <a
      href={href ?? "#"}
      target={isClickable ? "_blank" : undefined}
      rel={isClickable ? "noopener noreferrer" : undefined}
      aria-disabled={!isClickable}
      onClick={(e) => {
        if (!isClickable) e.preventDefault()
      }}
      className={cn(
        "group relative block border-l-[3px] transition-colors focus-visible:outline-none",
        compact ? "py-2 pl-2.5 pr-2" : "py-2.5 pl-3 pr-2.5",
        isClickable
          ? "hover:bg-white/[0.05] focus-visible:bg-white/[0.07] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
          : "cursor-not-allowed opacity-50"
      )}
      style={{ borderLeftColor: meta.hex }}
    >
      <div className={cn("flex items-center justify-between gap-2", compact ? "mb-1" : "mb-1.5")}>
        <AlertLevelBadge level={alert.level} />
        {alert.is_monitor && (
          <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-cyan-300/80">
            <Eye className="size-2.5" />
            Monitoreo
          </span>
        )}
      </div>
      <h4
        className={cn(
          "line-clamp-2 font-medium leading-snug text-white/90 group-hover:text-white",
          compact ? "text-[11px]" : "text-[12.5px]"
        )}
      >
        {alert.title}
      </h4>
      <div
        className={cn(
          "mt-1 flex items-center justify-between gap-2 text-white/55",
          compact ? "text-[9px]" : "text-[10px]"
        )}
      >
        <span className="truncate font-mono uppercase tracking-wider">
          {formatAlertCategory(alert.category)}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 font-mono tabular-nums">
          {region && (
            <span className="flex max-w-[88px] items-center gap-1">
              <MapPin className="size-2.5 shrink-0" />
              <span className="truncate">{region}</span>
            </span>
          )}
          <span className="flex items-center gap-0.5 text-white/40">
            <Clock className="size-2.5" />
            {timeAgo(alert.issued_at)}
          </span>
        </span>
      </div>
      {isClickable && (
        <ExternalLink
          className="absolute right-2 top-2 size-3 text-white/60 opacity-0 transition-opacity group-hover:opacity-50"
          aria-hidden
        />
      )}
    </a>
  )
}

export function ActiveAlertsSection({
  alerts,
  isLoading = false,
  compact = false,
  showRegion = false,
}: {
  alerts: SenapredAlert[]
  isLoading?: boolean
  compact?: boolean
  showRegion?: boolean
}) {
  const hasAlerts = alerts.length > 0

  return (
    <section className="border-t border-white/[0.07]" aria-labelledby="popup-active-alerts-heading">
      <div className="flex items-center justify-between gap-2 px-3.5 py-2">
        <h4
          id="popup-active-alerts-heading"
          className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[1.3px] text-white/55"
        >
          <AlertTriangle className="size-3 shrink-0 text-[#DA291C]/80" />
          Alertas activas
        </h4>
        {!isLoading && (
          <span
            className={cn(
              "rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-semibold tabular-nums",
              hasAlerts
                ? "border-[#DA291C]/40 bg-[#DA291C]/20 text-[#ff9a9a]"
                : "border-white/10 bg-white/[0.06] text-white/50"
            )}
          >
            {alerts.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 px-3 pb-2.5">
          <div className="h-10 animate-pulse rounded-sm bg-white/[0.06]" />
          <div className="h-10 animate-pulse rounded-sm bg-white/[0.04]" />
        </div>
      ) : !hasAlerts ? (
        <div className="flex items-center gap-2 px-3.5 pb-2.5 text-[10px] text-white/45">
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400/60" />
          Sin alertas SERNAPRED en esta zona
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {alerts.map((alert) => (
            <SenapredAlertCard
              key={alert.id}
              alert={alert}
              compact={compact}
              showRegion={showRegion}
            />
          ))}
        </div>
      )}
    </section>
  )
}