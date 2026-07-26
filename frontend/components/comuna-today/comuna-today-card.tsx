"use client"

import { forwardRef } from "react"
import {
  AlertTriangle,
  CalendarCheck2,
  Mountain,
  Waves,
  Wind,
} from "lucide-react"

import type { ComunaTodayData } from "@/hooks/use-comuna-today"
import { AIR_QUALITY_LEVEL_META } from "@/lib/air-quality-display"
import {
  ALERT_LEVEL_META,
  ALERT_SOURCE_META,
  formatHazardLabel,
  getActiveAlertMainText,
  sortActiveAlertsBySeverity,
} from "@/lib/alerts-display"
import { severityColor } from "@/lib/format"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

const MAX_ALERTS = 5

function Row({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: typeof Wind
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-start gap-2.5 border-t border-white/10 py-2.5 first:border-t-0 first:pt-0">
      <Icon className="mt-0.5 size-4 shrink-0 text-white/45" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className={cn(PREPARATION_EYEBROW_CLASS, "text-white/40")}>{label}</p>
        <p className={cn("mt-0.5 text-sm text-white/88", valueClassName)}>{value}</p>
      </div>
    </div>
  )
}

export const ComunaTodayCard = forwardRef<
  HTMLDivElement,
  { data: ComunaTodayData; className?: string }
>(function ComunaTodayCard({ data, className }, ref) {
  const risk = data.risk
  const score = risk?.composite_score ?? 0
  const severity = risk?.severity ?? "moderado"
  const barPct = Math.max(4, Math.min(100, score))
  const airMeta = data.air ? AIR_QUALITY_LEVEL_META[data.air.level] : null
  const volcanoLevel = data.volcanoAlert
    ? ALERT_LEVEL_META[data.volcanoAlert.level]
    : null

  const listedAlerts = sortActiveAlertsBySeverity(data.alerts).slice(0, MAX_ALERTS)

  const drillLabel = data.nextDrill
    ? (() => {
        const d = data.nextDrill.drill_date
        const formatted = new Date(`${d}T12:00:00`).toLocaleDateString("es-CL", {
          day: "numeric",
          month: "short",
        })
        const region =
          data.nextDrill.region_name ??
          (data.nextDrill.region_code != null
            ? `Región ${data.nextDrill.region_code}`
            : "nacional")
        return `${formatted} (${region})`
      })()
    : null

  return (
    <div
      ref={ref}
      className={cn(
        GLASS_PANEL_CLASS,
        "relative overflow-hidden p-5 sm:p-6",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, rgba(0,80,160,0.35), transparent 55%), radial-gradient(ellipse at 90% 100%, rgba(218,41,28,0.12), transparent 45%)",
        }}
        aria-hidden
      />
      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[1.6px] text-white/50">
          ChileRisk · {data.dateLabel}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {data.comunaName}
        </h2>
        {data.regionName ? (
          <p className="mt-1 text-sm text-white/55">Región de {data.regionName}</p>
        ) : null}

        <div className="mt-5 border border-white/12 bg-black/40 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className={cn(PREPARATION_EYEBROW_CLASS, "text-white/45")}>
                Riesgo hoy
              </p>
              <p className="mt-1 font-mono text-4xl font-semibold tabular-nums text-white">
                {score.toFixed(0)}
                <span className="text-lg text-white/40">/100</span>
              </p>
            </div>
            <span
              className={cn(
                "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                severityColor(severity),
              )}
            >
              {severity}
            </span>
          </div>
          <div className="mt-3 h-2 w-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-500/80 to-orange-500/80 transition-[width]"
              style={{ width: `${barPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/60">
            Dominante:{" "}
            <span className="text-white/85">
              {formatHazardLabel(risk?.dominant_hazard)}
            </span>
          </p>
        </div>

        <div className="mt-4">
          <Row
            icon={Wind}
            label="Aire"
            value={
              airMeta
                ? `${airMeta.label}${
                    data.air?.measures_current?.length
                      ? ` (${data.air.measures_current[0]})`
                      : ""
                  }`
                : "Sin episodio GEC"
            }
            valueClassName={airMeta ? undefined : "text-white/45"}
          />
          <Row
            icon={Waves}
            label="Último sismo"
            value={
              data.lastQuake
                ? `M${data.lastQuake.magnitude.toFixed(1)} · ${data.lastQuake.label}`
                : "Sin sismos recientes"
            }
            valueClassName={data.lastQuake ? undefined : "text-white/45"}
          />
          <Row
            icon={Mountain}
            label="Volcán"
            value={
              data.volcanoAlert
                ? `${data.volcanoAlert.title || "Alerta"} · ${volcanoLevel?.label ?? data.volcanoAlert.level}`
                : "Sin alerta SERNAGEOMIN"
            }
            valueClassName={data.volcanoAlert ? undefined : "text-white/45"}
          />
          {drillLabel ? (
            <Row
              icon={CalendarCheck2}
              label="Próximo simulacro"
              value={drillLabel}
            />
          ) : null}

          <div className="border-t border-white/10 py-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-white/45"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className={cn(PREPARATION_EYEBROW_CLASS, "text-white/40")}>
                  Alertas en tu comuna
                </p>
                {listedAlerts.length === 0 ? (
                  <p className="mt-0.5 text-sm text-white/45">
                    Ninguna en tu comuna
                  </p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-2">
                    {listedAlerts.map((alert) => {
                      const levelMeta = ALERT_LEVEL_META[alert.level]
                      const sourceMeta =
                        ALERT_SOURCE_META[alert.source] ??
                        ALERT_SOURCE_META.senapred
                      return (
                        <li
                          key={alert.id}
                          className="border border-white/10 bg-black/25 px-2.5 py-2"
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={cn(
                                "border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                                levelMeta.badge,
                              )}
                            >
                              {levelMeta.label}
                            </span>
                            <span
                              className={cn(
                                "border px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
                                sourceMeta.badge,
                              )}
                            >
                              {sourceMeta.label}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm leading-snug text-white/88">
                            {getActiveAlertMainText(alert)}
                          </p>
                        </li>
                      )
                    })}
                    {data.alertCount > MAX_ALERTS ? (
                      <li className="text-[11px] text-white/45">
                        +{data.alertCount - MAX_ALERTS} más en el monitor
                      </li>
                    ) : null}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-5 border-t border-white/10 pt-4 text-sm leading-relaxed text-white/70">
          {data.ctaCopy}
        </p>
      </div>
    </div>
  )
})
