"use client"

import { Activity, Clock, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  formatPopupSeismicMeta,
  getPopupSeismicAccent,
  getPopupSeismicDetailUrl,
  getPopupSeismicTitle,
  type PopupSeismicItem,
} from "@/lib/seismic-events"

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function SeismicRow({ item }: { item: PopupSeismicItem }) {
  const accent = getPopupSeismicAccent(item)
  const detailUrl = getPopupSeismicDetailUrl(item)
  const title = getPopupSeismicTitle(item)
  const meta = formatPopupSeismicMeta(item)

  const inner = (
    <>
      <div
        className="mt-0.5 size-2 shrink-0 rounded-full"
        style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}99` }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-medium leading-snug text-white/90">{title}</div>
        <div className="mt-0.5 font-mono text-[10px] tabular-nums text-white/55">{meta}</div>
        {item.event.occurred_at && (
          <div className="mt-0.5 flex items-center gap-1 font-mono text-[9px] text-white/40">
            <Clock className="size-2.5 shrink-0" />
            {formatWhen(item.event.occurred_at)}
          </div>
        )}
      </div>
      {detailUrl && (
        <ExternalLink className="size-3 shrink-0 text-white/40" aria-hidden />
      )}
    </>
  )

  if (detailUrl) {
    return (
      <a
        href={detailUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex gap-2 border-l-[3px] bg-white/[0.03] py-2 pl-2.5 pr-2 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
        style={{ borderLeftColor: accent }}
      >
        {inner}
      </a>
    )
  }

  return (
    <div
      className="flex gap-2 border-l-[3px] bg-white/[0.03] py-2 pl-2.5 pr-2"
      style={{ borderLeftColor: accent }}
    >
      {inner}
    </div>
  )
}

export function PopupSeismicSection({
  items,
  isLoading = false,
}: {
  items: PopupSeismicItem[]
  isLoading?: boolean
}) {
  const hasItems = items.length > 0

  return (
    <section className="border-t border-white/[0.07]" aria-labelledby="popup-seismic-heading">
      <div className="flex items-center justify-between gap-2 px-3.5 py-2">
        <h4
          id="popup-seismic-heading"
          className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[1.3px] text-white/55"
        >
          <Activity className="size-3 shrink-0 text-orange-300/90" />
          Sismos recientes
        </h4>
        {!isLoading && (
          <span
            className={cn(
              "rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-semibold tabular-nums",
              hasItems
                ? "border-orange-400/35 bg-orange-500/15 text-orange-200/90"
                : "border-white/10 bg-white/[0.06] text-white/50"
            )}
          >
            {items.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 px-3 pb-2.5">
          <div className="h-12 animate-pulse rounded-sm bg-white/[0.06]" />
        </div>
      ) : !hasItems ? (
        <p className="px-3.5 pb-2.5 text-[10px] leading-snug text-white/45">
          Sin sismos significativos (M≥4.5) en las últimas 24 h en esta zona.
        </p>
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {items.map((item) => (
            <SeismicRow key={item.event.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}