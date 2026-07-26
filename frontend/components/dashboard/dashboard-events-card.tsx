"use client"

import { Activity } from "lucide-react"

import { DashboardSection } from "@/components/dashboard/dashboard-section"
import { useRecentEvents } from "@/hooks"
import { formatDepth, formatMagnitude } from "@/lib/format"

export function DashboardEventsCard({ className }: { className?: string }) {
  const { data: allEvents = [], isLoading, isError, refetch } = useRecentEvents()
  const events = allEvents.slice(0, 8)

  return (
    <DashboardSection
      eyebrow="Últimas 24h"
      title="Sismos recientes"
      icon={Activity}
      iconClassName="text-amber-300/80"
      href="/monitor"
      className={className}
    >
      {isError ? (
        <div className="border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          No se pudieron cargar los sismos.
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-3 border border-red-500/50 px-2 py-0.5 text-xs text-red-300 transition-colors hover:bg-red-500/20"
          >
            Reintentar
          </button>
        </div>
      ) : isLoading && events.length === 0 ? (
        <div className="flex flex-col gap-1.5" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-7 animate-pulse bg-white/[0.06]" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="py-2 text-sm text-white/55">Sin eventos recientes</p>
      ) : (
        <ul className="flex flex-col font-mono text-[12.5px] tabular-nums">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex items-baseline justify-between gap-3 border-b border-white/10 py-1.5 last:border-0"
            >
              <span className="min-w-0 truncate text-white/90">
                <span className="text-amber-200/90">
                  {formatMagnitude(e.magnitude)}
                </span>
                <span className="text-white/35"> · </span>
                <span className="text-white/70">{formatDepth(e.depth_km)}</span>
                {e.is_perceived ? (
                  <>
                    <span className="text-white/35"> · </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-red-300/80">
                      Percibido
                    </span>
                  </>
                ) : null}
              </span>
              <time
                dateTime={e.occurred_at}
                className="shrink-0 text-[11px] uppercase tracking-wider text-white/45"
              >
                {new Date(e.occurred_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  )
}
