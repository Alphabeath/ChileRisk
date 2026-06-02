"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
} from "lucide-react"
import { useActiveAlerts, useDraggablePanel } from "@/hooks"
import { sortSenapredAlerts } from "@/lib/senapred-display"
import { cn } from "@/lib/utils"
import { SenapredAlertCard } from "./senapred-alert-ui"

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

const DEFAULT_POS = { x: 16, y: 80 }

export function SenapredAlertsPanel() {
  const [open, setOpen] = useState(false)
  const { ref, handleProps, style, isDragging, isMoved, resetPosition } =
    useDraggablePanel({ id: "senapred-alerts-panel", defaultPosition: DEFAULT_POS })

  const { data: alerts = [], isLoading, error, refetch } = useActiveAlerts()

  const sorted = useMemo(() => sortSenapredAlerts(alerts), [alerts])

  const hasAlerts = sorted.length > 0
  const Icon = hasAlerts ? Bell : BellOff

  return (
    <aside
      ref={ref}
      className="fixed left-4 top-20 z-20 flex w-[320px] max-w-[calc(100vw-2rem)] max-h-[min(380px,42dvh)] flex-col border border-white/10 bg-black/60 shadow-2xl shadow-black/40 backdrop-blur-xl"
      style={style}
      aria-label="Alertas activas de SERNAPRED"
    >
      <div className="flex w-full items-stretch border-b border-white/10">
        <div
          {...handleProps}
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
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                resetPosition()
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
          "divide-y divide-white/[0.06] overflow-y-auto max-h-[min(260px,32dvh)]",
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
          sorted.map((alert) => (
            <SenapredAlertCard key={alert.id} alert={alert} showRegion />
          ))
        )}
      </div>
    </aside>
  )
}