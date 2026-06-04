"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ALERT_LEVEL_META,
  ALERT_SOURCE_META,
  CHILERISK_SEVERITY_META,
  getActiveAlertMainText,
  resolveChileRiskSeverity,
  senapredSourceLabel,
  shortenRegionName,
  timeAgo,
} from "@/lib/alerts-display"
import type { ActiveAlert, AlertLevel } from "@/lib/types"

const ALERT_BADGE_CLASS =
  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"

/** Nivel SERNAPRED (Preventiva, Naranja, …). */
export function AlertLevelBadge({ level }: { level: AlertLevel }) {
  const meta = ALERT_LEVEL_META[level] ?? ALERT_LEVEL_META.preventiva
  return (
    <span className={cn(ALERT_BADGE_CLASS, meta.badge)}>
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: meta.hex, boxShadow: `0 0 6px ${meta.hex}99` }}
        aria-hidden
      />
      {meta.label}
    </span>
  )
}

/** Grado algorítmico ChileRisk (Crítico, Alto, Moderado). */
export function ChileRiskSeverityBadge({ alert }: { alert: ActiveAlert }) {
  const severity = resolveChileRiskSeverity(alert)
  const meta = CHILERISK_SEVERITY_META[severity]
  return (
    <span className={cn(ALERT_BADGE_CLASS, meta.badge)}>
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: meta.hex, boxShadow: `0 0 6px ${meta.hex}99` }}
        aria-hidden
      />
      {meta.label}
    </span>
  )
}

/** Fuente (SERNAPRED / ChileRisk). */
export function AlertSourceBadge({ alert }: { alert: ActiveAlert }) {
  const meta = ALERT_SOURCE_META[alert.source] ?? ALERT_SOURCE_META.senapred
  const label =
    alert.source === "senapred" ? senapredSourceLabel(alert) : meta.label
  return (
    <span className={cn(ALERT_BADGE_CLASS, "font-mono tracking-[1px]", meta.badge)}>
      {label}
    </span>
  )
}

function AlertCardMetaFooter({
  alert,
  compact,
}: {
  alert: ActiveAlert
  compact: boolean
}) {
  const region = shortenRegionName(alert.region_name)

  return (
    <div
      className={cn(
        "mt-1.5 flex items-center justify-end gap-1.5 font-mono tabular-nums",
        compact ? "text-[9px]" : "text-[10px]",
        "text-white/45"
      )}
    >
      {region && (
        <span className="flex max-w-[min(140px,55%)] items-center gap-0.5">
          <MapPin className="size-2.5 shrink-0" aria-hidden />
          <span className="truncate">{region}</span>
        </span>
      )}
      {region && (
        <span className="text-white/25" aria-hidden>
          ·
        </span>
      )}
      <span className="flex shrink-0 items-center gap-0.5 text-white/40">
        <Clock className="size-2.5" aria-hidden />
        {timeAgo(alert.issued_at)}
      </span>
    </div>
  )
}

function AlertCardMainContent({
  alert,
  compact,
  isClickable,
}: {
  alert: ActiveAlert
  compact: boolean
  isClickable: boolean
}) {
  return (
    <p
      className={cn(
        "line-clamp-4 font-medium leading-snug text-white/90",
        isClickable && "group-hover:text-white",
        compact ? "text-[11px]" : "text-[12.5px]"
      )}
    >
      {getActiveAlertMainText(alert)}
    </p>
  )
}

export function ActiveAlertCard({
  alert,
  compact = false,
}: {
  alert: ActiveAlert
  compact?: boolean
  /** @deprecated La ubicación siempre se muestra en el pie cuando existe en la alerta. */
  showRegion?: boolean
}) {
  const isChileRisk = alert.source === "chilerisk"
  const levelMeta = ALERT_LEVEL_META[alert.level] ?? ALERT_LEVEL_META.preventiva
  const severityMeta = isChileRisk
    ? CHILERISK_SEVERITY_META[resolveChileRiskSeverity(alert)]
    : null
  const accentHex = isChileRisk ? severityMeta!.hex : levelMeta.hex

  const href = alert.external_url
  const isClickable = alert.source === "senapred" && !!href
  const Wrapper = isClickable ? "a" : "div"

  return (
    <Wrapper
      {...(isClickable
        ? {
            href: href!,
            target: "_blank",
            rel: "noopener noreferrer",
          }
        : {})}
      className={cn(
        "group relative block border-l-[3px] transition-colors",
        compact ? "py-2 pl-2.5 pr-2" : "py-2.5 pl-3 pr-2.5",
        isClickable &&
          "hover:bg-white/[0.05] focus-visible:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
      )}
      style={{ borderLeftColor: accentHex }}
    >
      <div className={cn("flex flex-wrap items-center gap-1.5", compact ? "mb-1" : "mb-1.5")}>
        {isChileRisk ? (
          <ChileRiskSeverityBadge alert={alert} />
        ) : (
          <AlertLevelBadge level={alert.level} />
        )}
        <AlertSourceBadge alert={alert} />
        {alert.is_monitor && alert.source === "senapred" && (
          <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-wider text-cyan-300/80">
            <Eye className="size-2.5" />
            Monitoreo
          </span>
        )}
      </div>

      <AlertCardMainContent alert={alert} compact={compact} isClickable={isClickable} />
      <AlertCardMetaFooter alert={alert} compact={compact} />

      {isClickable && (
        <ExternalLink
          className="absolute right-2 top-2 size-3 text-white/60 opacity-0 transition-opacity group-hover:opacity-50"
          aria-hidden
        />
      )}
    </Wrapper>
  )
}

export function ActiveAlertsSection({
  alerts,
  isLoading = false,
  compact = false,
  showRegion = false,
  collapsedLimit,
}: {
  alerts: ActiveAlert[]
  isLoading?: boolean
  compact?: boolean
  /** @deprecated El pie unificado siempre muestra ubicación cuando la trae la alerta. */
  showRegion?: boolean
  /** Si se define, muestra solo N alertas hasta expandir. */
  collapsedLimit?: number
}) {
  const hasAlerts = alerts.length > 0
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setExpanded(false)
  }, [alerts.length, collapsedLimit])

  const canCollapse =
    collapsedLimit != null && alerts.length > collapsedLimit && !expanded
  const displayedAlerts = canCollapse ? alerts.slice(0, collapsedLimit) : alerts
  const hiddenCount = canCollapse ? alerts.length - collapsedLimit! : 0

  return (
    <section className="border-t border-white/[0.07]" aria-labelledby="popup-active-alerts-heading">
      <div className="flex items-center justify-between gap-2 px-3.5 py-2">
        <h4
          id="popup-active-alerts-heading"
          className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[1.3px] text-white/55"
        >
          <AlertTriangle className="size-3 shrink-0 text-[#DA291C]/80" />
          Alertas
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
          Sin alertas activas en esta zona
        </div>
      ) : (
        <>
          <div className="divide-y divide-white/[0.06]">
            {displayedAlerts.map((alert) => (
              <ActiveAlertCard
                key={`${alert.source}-${alert.id}`}
                alert={alert}
                compact={compact}
                showRegion={showRegion}
              />
            ))}
          </div>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex w-full items-center justify-center gap-1 border-t border-white/[0.06] px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-wider text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
            >
              Ver todas ({alerts.length})
              <ChevronDown className="size-3" aria-hidden />
            </button>
          )}
          {expanded && collapsedLimit != null && alerts.length > collapsedLimit && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="flex w-full items-center justify-center gap-1 border-t border-white/[0.06] px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-wider text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
            >
              Mostrar menos
              <ChevronDown className="size-3 rotate-180" aria-hidden />
            </button>
          )}
        </>
      )}
    </section>
  )
}