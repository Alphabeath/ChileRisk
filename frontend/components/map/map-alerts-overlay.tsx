"use client"

import { useCallback, useEffect, useState } from "react"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { ActiveAlertsPanel } from "@/components/map/active-alerts-panel"
import { useMonitorLiveData } from "@/components/map/monitor-live-data"
import { QueryDateControl } from "@/components/map/query-date-control"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useQueryDate } from "@/hooks"
import {
  CITIZEN_NAVBAR_CLEARANCE_PX,
  MAP_DESKTOP_ONLY_CLASS,
  MAP_MOBILE_ONLY_CLASS,
  MAP_PANEL_LEFT_INSET_PX,
  MAP_PANEL_LEFT_POSITION_CLASS,
} from "@/lib/citizen-layout"
import {
  formatQueryDateLabel,
  todayIsoDate,
} from "@/lib/query-date"
import { SURFACE_PANEL_SHELL_CLASS } from "@/lib/surface"
import { useCloseOnDesktopMd } from "@/lib/use-close-on-desktop-md"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

function DesktopLeftColumn() {
  return (
    <div
      className={cn(
        "pointer-events-none fixed z-20 flex-col items-start gap-2",
        MAP_DESKTOP_ONLY_CLASS,
        MAP_PANEL_LEFT_POSITION_CLASS,
      )}
      style={{
        top: CITIZEN_NAVBAR_CLEARANCE_PX + MAP_PANEL_LEFT_INSET_PX,
        maxHeight: `calc(100dvh - ${CITIZEN_NAVBAR_CLEARANCE_PX + MAP_PANEL_LEFT_INSET_PX * 2}px)`,
      }}
      aria-label="Alertas y fecha del mapa"
    >
      <div className="pointer-events-auto flex min-h-0 shrink flex-col">
        <ActiveAlertsPanel flow />
      </div>
      <div className="pointer-events-auto flex shrink-0 flex-col">
        <QueryDateControl flow />
      </div>
    </div>
  )
}

function MobileAlertsEntry() {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  useCloseOnDesktopMd(close)
  const { alerts, air } = useMonitorLiveData()
  const count = alerts.length + (air?.items.length ?? 0)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          SURFACE_PANEL_SHELL_CLASS,
          "relative z-10 inline-flex items-center gap-2 px-2.5 py-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30",
        )}
        aria-label={
          count > 0 ? `Abrir alertas, ${count} activas` : "Abrir alertas"
        }
      >
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
          Alertas
        </span>
        <span
          className={cn(
            "inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-bold tabular-nums",
            count > 0
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className={cn(
            SURFACE_PANEL_SHELL_CLASS,
            "max-h-[min(70dvh,520px)] gap-0 overflow-hidden rounded-none p-0 sm:max-w-none",
          )}
        >
          <SheetHeader className="relative z-10 flex-row items-center justify-between gap-2 border-b border-border px-2.5 py-1">
            <SheetTitle className="font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
              Alertas
            </SheetTitle>
            <SheetDescription className="sr-only">
              Alertas activas SENAPRED, ChileRisk, SERNAGEOMIN y Aire Chile
            </SheetDescription>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="inline-flex size-7 shrink-0 items-center justify-center border-0 bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"
            >
              <X className="size-3.5" strokeWidth={2} aria-hidden />
            </button>
          </SheetHeader>
          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
            <ActiveAlertsPanel embedded />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function MobileDateEntry() {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  useCloseOnDesktopMd(close)
  const { selectedDate } = useQueryDate()
  const dateLabel = formatQueryDateLabel(selectedDate, todayIsoDate())

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          SURFACE_PANEL_SHELL_CLASS,
          "relative z-10 inline-flex items-center gap-2 px-2.5 py-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30",
        )}
        aria-label={`Abrir fecha de consulta, ${dateLabel}`}
      >
        <CalendarIcon className="size-3.5 text-muted-foreground" aria-hidden />
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
          Fecha
        </span>
        <span className="font-mono text-[10px] font-semibold tabular-nums text-foreground">
          {dateLabel}
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className={cn(
            SURFACE_PANEL_SHELL_CLASS,
            "max-h-[min(50dvh,360px)] gap-0 overflow-hidden rounded-none p-0 sm:max-w-none",
          )}
        >
          <SheetHeader className="relative z-10 flex-row items-center justify-between gap-2 border-b border-border px-2.5 py-1">
            <SheetTitle className="font-mono text-[9px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
              Fecha
            </SheetTitle>
            <SheetDescription className="sr-only">
              Selector de día de consulta del mapa
            </SheetDescription>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="inline-flex size-7 shrink-0 items-center justify-center border-0 bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"
            >
              <X className="size-3.5" strokeWidth={2} aria-hidden />
            </button>
          </SheetHeader>
          <div className="relative z-10">
            <QueryDateControl embedded />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function MobileMapChrome() {
  return (
    <div
      className={cn(
        "fixed z-20 flex flex-col items-start gap-2",
        MAP_MOBILE_ONLY_CLASS,
      )}
      style={{ left: 16, bottom: 16 }}
    >
      <MobileDateEntry />
      <MobileAlertsEntry />
    </div>
  )
}

/** Floating left-column UI for `/monitor` — Alertas + Fecha (desktop) and FABs (móvil). */
export function MapAlertsOverlay() {
  useEffect(() => {
    void useUIStore.persist.rehydrate()
  }, [])

  return (
    <>
      <DesktopLeftColumn />
      <MobileMapChrome />
    </>
  )
}
