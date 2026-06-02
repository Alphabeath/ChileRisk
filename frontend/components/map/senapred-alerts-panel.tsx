"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  MapPin,
  RotateCcw,
} from "lucide-react"
import { useActiveAlerts } from "@/hooks"
import { cn } from "@/lib/utils"
import type { SenapredAlert } from "@/lib/types"

const LEVEL_META = {
  preventiva: {
    label: "Preventiva",
    hex: "#38bdf8",
    badge: "bg-sky-500/10 text-sky-300 border-sky-400/40",
  },
  amarilla: {
    label: "Amarilla",
    hex: "#fbbf24",
    badge: "bg-amber-500/10 text-amber-300 border-amber-400/40",
  },
  naranja: {
    label: "Naranja",
    hex: "#fb923c",
    badge: "bg-orange-500/10 text-orange-300 border-orange-400/40",
  },
  roja: {
    label: "Roja",
    hex: "#DA291C",
    badge: "bg-[#DA291C]/15 text-[#ff9a9a] border-[#DA291C]/45",
  },
} as const

const LEVEL_ORDER = { roja: 0, naranja: 1, amarilla: 2, preventiva: 3 } as const

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 60_000) return "ahora"
  const m = Math.floor(ms / 60_000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function formatCategory(cat: string | null): string {
  if (!cat) return "—"
  return cat.replace(/_/g, " ").toUpperCase()
}

function shortenRegion(name: string | null): string | null {
  if (!name) return null
  return name.replace(/^Regi[oó]n de( la| las| el| los)?\s+/i, "")
}

function LevelBadge({ level }: { level: SenapredAlert["level"] }) {
  const meta = LEVEL_META[level]
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

function SkeletonCard() {
  return (
    <div className="px-3 py-2.5">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-4 w-16 animate-pulse rounded-sm bg-white/[0.06]" />
        <div className="h-3 w-12 animate-pulse rounded-sm bg-white/[0.04]" />
      </div>
      <div className="h-3 w-full animate-pulse rounded-sm bg-white/[0.08]" />
      <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded-sm bg-white/[0.08]" />
      <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded-sm bg-white/[0.04]" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-8 text-center">
      <CheckCircle2 className="size-6 text-emerald-400/70" />
      <div className="text-[12px] font-medium text-white/80">Sin alertas activas</div>
      <div className="text-[10px] text-white/45">SERNAPRED no reporta emergencias</div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-6 text-center">
      <AlertTriangle className="size-5 text-[#DA291C]/80" />
      <div className="text-[11px] font-medium text-white/80">No se pudo cargar SERNAPRED</div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/55 underline underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
      >
        Reintentar
      </button>
    </div>
  )
}

function AlertCard({ alert }: { alert: SenapredAlert }) {
  const meta = LEVEL_META[alert.level]
  const href = alert.senapred_url
  const isClickable = !!href
  const region = shortenRegion(alert.region_name)

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
        "group relative block border-l-[3px] py-2.5 pl-3 pr-2.5 transition-colors focus-visible:outline-none",
        isClickable
          ? "hover:bg-white/[0.05] focus-visible:bg-white/[0.07] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
          : "cursor-not-allowed opacity-50"
      )}
      style={{ borderLeftColor: meta.hex }}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <LevelBadge level={alert.level} />
        {alert.is_monitor && (
          <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-cyan-300/80">
            <Eye className="size-2.5" />
            Monitoreo
          </span>
        )}
      </div>
      <h4 className="line-clamp-2 text-[12.5px] font-medium leading-snug text-white/90 group-hover:text-white">
        {alert.title}
      </h4>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-white/55">
        <span className="truncate font-mono uppercase tracking-wider">
          {formatCategory(alert.category)}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 font-mono tabular-nums">
          {region && (
            <span className="flex max-w-[100px] items-center gap-1">
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

const DEFAULT_POS = { x: 16, y: 80 }
const DRAG_THRESHOLD = 4

export function SenapredAlertsPanel() {
  const [open, setOpen] = useState(true)
  const [pos, setPos] = useState<typeof DEFAULT_POS | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const panelRef = useRef<HTMLElement | null>(null)
  const dragStateRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  } | null>(null)

  const currentPos = pos ?? DEFAULT_POS
  const isMoved = pos !== null

  const { data: alerts = [], isLoading, error, refetch } = useActiveAlerts()

  const sorted = useMemo(
    () =>
      [...alerts].sort((a, b) => {
        const levelDiff = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]
        if (levelDiff !== 0) return levelDiff
        return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
      }),
    [alerts]
  )

  const hasAlerts = sorted.length > 0
  const Icon = hasAlerts ? Bell : BellOff

  useEffect(() => {
    if (pos === null) return
    const onResize = () => {
      setPos((p) => {
        if (!p || !panelRef.current) return p
        const rect = panelRef.current.getBoundingClientRect()
        const maxX = window.innerWidth - rect.width
        const maxY = window.innerHeight - rect.height
        const cx = Math.max(0, Math.min(p.x, maxX))
        const cy = Math.max(0, Math.min(p.y, maxY))
        if (cx === p.x && cy === p.y) return p
        return { x: cx, y: cy }
      })
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [pos])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest("button")) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: currentPos.x,
      originY: currentPos.y,
      moved: false,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragStateRef.current
    if (!d || !panelRef.current) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY

    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      d.moved = true
      setIsDragging(true)
    }

    const rect = panelRef.current.getBoundingClientRect()
    const maxX = window.innerWidth - rect.width
    const maxY = window.innerHeight - rect.height
    const clampedX = Math.max(0, Math.min(d.originX + dx, maxX))
    const clampedY = Math.max(0, Math.min(d.originY + dy, maxY))

    panelRef.current.style.left = `${clampedX}px`
    panelRef.current.style.top = `${clampedY}px`
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragStateRef.current
    if (!d) return

    if (e.currentTarget.hasPointerCapture(d.pointerId)) {
      e.currentTarget.releasePointerCapture(d.pointerId)
    }

    if (d.moved && panelRef.current) {
      const finalLeft = parseFloat(panelRef.current.style.left) || 0
      const finalTop = parseFloat(panelRef.current.style.top) || 0
      setPos({ x: finalLeft, y: finalTop })
    }

    setIsDragging(false)
    dragStateRef.current = null
  }

  return (
    <aside
      ref={panelRef}
      className="fixed left-4 top-20 z-20 flex w-[320px] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-7rem)] flex-col border border-white/10 bg-black/60 shadow-2xl shadow-black/40 backdrop-blur-xl"
      style={{ left: currentPos.x, top: currentPos.y }}
      aria-label="Alertas activas de SERNAPRED"
    >
      <div className="flex w-full items-stretch border-b border-white/10">
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={cn(
            "flex flex-1 select-none items-center gap-2.5 px-3 py-2.5",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{ touchAction: "none" }}
          aria-label="Arrastrar panel"
        >
          <div className="relative shrink-0">
            <Icon className={cn("size-4", hasAlerts ? "text-white" : "text-white/55")} />
            {hasAlerts && (
              <span
                className="absolute -right-1 -top-1 size-1.5 animate-pulse rounded-full bg-[#DA291C]"
                style={{ boxShadow: "0 0 4px rgba(218,41,28,0.8)" }}
                aria-hidden
              />
            )}
          </div>
          <span className="flex-1 text-[10.5px] font-semibold uppercase tracking-[1.4px] text-white/85">
            Alertas SERNAPRED
          </span>
          {isMoved && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setPos(null)
              }}
              aria-label="Restablecer posición"
              title="Restablecer posición"
              className="flex size-5 shrink-0 items-center justify-center rounded-sm text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
            >
              <RotateCcw className="size-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="senapred-alerts-list"
          aria-label={open ? "Colapsar alertas" : "Expandir alertas"}
          className="flex shrink-0 items-center gap-2 border-l border-white/10 px-3 transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
        >
          <span
            className={cn(
              "rounded-sm border px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tabular-nums",
              hasAlerts
                ? "border-[#DA291C]/40 bg-[#DA291C]/20 text-[#ff9a9a]"
                : "border-white/10 bg-white/[0.08] text-white/60"
            )}
          >
            {sorted.length}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 text-white/60 transition-transform duration-200",
              !open && "-rotate-90"
            )}
            aria-hidden
          />
        </button>
      </div>

      <div
        id="senapred-alerts-list"
        className={cn(
          "min-h-0 flex-1 divide-y divide-white/[0.06] overflow-y-auto",
          !open && "hidden"
        )}
        role="region"
        aria-live="polite"
      >
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !hasAlerts ? (
          <EmptyState />
        ) : (
          sorted.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        )}
      </div>
    </aside>
  )
}
