"use client"

import { Activity, ExternalLink } from "lucide-react"

import { DashboardSection } from "@/components/dashboard/dashboard-section"
import { useRecentEvents } from "@/hooks"
import { timeAgo } from "@/lib/alerts-display"
import { formatDepth, formatMagnitude } from "@/lib/format"
import {
  getSeismicAccentColor,
  getSeismicDetailUrl,
  getSeismicLocation,
  getSeismicMagnitudeType,
  isSeismicPerceived,
} from "@/lib/seismic"
import type { SeismicEvent } from "@/lib/types"
import { cn } from "@/lib/utils"

const LIST_LIMIT = 6

function sortByRelevance(events: SeismicEvent[]): SeismicEvent[] {
  return [...events].sort((a, b) => {
    const perceivedDiff =
      Number(isSeismicPerceived(b)) - Number(isSeismicPerceived(a))
    if (perceivedDiff !== 0) return perceivedDiff
    if (b.magnitude !== a.magnitude) return b.magnitude - a.magnitude
    return new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  })
}

function EventRow({ event }: { event: SeismicEvent }) {
  const location = getSeismicLocation(event)
  const magType = getSeismicMagnitudeType(event)
  const detailUrl = getSeismicDetailUrl(event)
  const perceived = isSeismicPerceived(event)
  const accent = getSeismicAccentColor(event.magnitude)
  const title = location ?? `Sismo ${formatMagnitude(event.magnitude)}`
  const ago = timeAgo(event.occurred_at)
  const agoLabel = ago === "ahora" ? "ahora" : `hace ${ago}`

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "min-w-0 truncate text-[12.5px] leading-snug text-white/90",
            perceived ? "font-semibold" : "font-medium",
          )}
          title={title}
        >
          {title}
        </p>
        <time
          dateTime={event.occurred_at}
          className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-white/45"
          title={new Date(event.occurred_at).toLocaleString("es-CL")}
        >
          {agoLabel}
        </time>
      </div>

      <p className="mt-0.5 font-mono text-[11px] tabular-nums text-white/65">
        <span className="font-semibold" style={{ color: accent }}>
          {formatMagnitude(event.magnitude)}
        </span>
        {magType ? <span className="text-white/40"> {magType}</span> : null}
        <span className="text-white/30"> · </span>
        <span>Prof. {formatDepth(event.depth_km)}</span>
        {event.reported_intensity_max != null ? (
          <>
            <span className="text-white/30"> · </span>
            <span>Mercalli {event.reported_intensity_max.toFixed(0)}</span>
          </>
        ) : null}
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {perceived ? (
          <span className="border border-orange-400/40 bg-orange-500/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[1px] text-orange-200/90">
            Percibido
          </span>
        ) : (
          <span className="border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[1px] text-white/45">
            Instrumental
          </span>
        )}
        <span className="font-mono text-[9px] uppercase tracking-[1px] text-white/35">
          {event.source === "csn" ? "CSN" : event.source}
        </span>
        {detailUrl ? (
          <span className="ml-auto inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[1px] text-white/40">
            Informe
            <ExternalLink className="size-2.5" aria-hidden />
          </span>
        ) : null}
      </div>
    </>
  )

  const rowClass = cn(
    "group relative block border-l-[3px] py-2 pl-2.5 pr-2 transition-colors",
  )

  if (detailUrl) {
    return (
      <li>
        <a
          href={detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            rowClass,
            "hover:bg-white/[0.05] focus-visible:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
          )}
          style={{ borderLeftColor: accent }}
        >
          {content}
        </a>
      </li>
    )
  }

  return (
    <li className={rowClass} style={{ borderLeftColor: accent }}>
      {content}
    </li>
  )
}

export function DashboardEventsCard({ className }: { className?: string }) {
  const { data: allEvents = [], isLoading, isError, refetch } = useRecentEvents()
  const events = sortByRelevance(allEvents).slice(0, LIST_LIMIT)

  return (
    <DashboardSection
      eyebrow="Más relevantes · 24h"
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
        <div className="flex flex-col gap-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse bg-white/[0.06]" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="py-2 text-sm text-white/55">Sin eventos recientes</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </ul>
      )}
    </DashboardSection>
  )
}
