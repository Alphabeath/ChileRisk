"use client"

import { Siren } from "lucide-react"

import { DashboardSection } from "@/components/dashboard/dashboard-section"
import { ActiveAlertCard } from "@/components/map/alert-ui"
import { useActiveAlerts } from "@/hooks"
import { sortActiveAlertsBySeverity } from "@/lib/alerts-display"

export function DashboardAlertsCard({ className }: { className?: string }) {
  const { data: alerts = [], isLoading, isError, refetch } = useActiveAlerts()
  const top = sortActiveAlertsBySeverity(alerts).slice(0, 5)

  return (
    <DashboardSection
      eyebrow="Nacional"
      title="Alertas activas"
      icon={Siren}
      iconClassName="text-red-300/80"
      href="/monitor"
      className={className}
    >
      {isError ? (
        <div className="border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          No se pudieron cargar las alertas.
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-3 border border-red-500/50 px-2 py-0.5 text-xs text-red-300 transition-colors hover:bg-red-500/20"
          >
            Reintentar
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse bg-white/[0.06]" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <p className="py-2 text-sm text-white/55">Sin alertas activas</p>
      ) : (
        <div className="flex flex-col gap-2">
          {top.map((alert) => (
            <ActiveAlertCard key={alert.id} alert={alert} compact showRegion />
          ))}
        </div>
      )}
    </DashboardSection>
  )
}
