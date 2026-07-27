"use client"

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ComponentType,
  type SVGProps,
} from "react"
import { createPortal } from "react-dom"
import { MAP_MOBILE_ONLY_CLASS } from "@/lib/citizen-layout"
import { GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

type TabIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>

export interface MapMobileBottomSheetTab {
  id: string
  label: string
  icon: TabIcon
}

interface MapMobileBottomSheetProps {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  activeTab: string
  onActiveTabChange: (tabId: string) => void
  tabs: MapMobileBottomSheetTab[]
  status: React.ReactNode
  children: React.ReactNode
  /** When true, sheet is not rendered (e.g. location prompt). */
  hidden?: boolean
  "aria-label"?: string
  /** Guided-tour anchor (`data-tour`). */
  "data-tour"?: string
}

const SHEET_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
const SHEET_DURATION_MS = 320

/**
 * Persistent map bottom sheet (TrueRisk-inspired, ChileRisk glass).
 * Collapsed: handle + status + tabs pinned to viewport bottom.
 * Expanded: grows upward + light scrim (animated).
 */
export function MapMobileBottomSheet({
  expanded,
  onExpandedChange,
  activeTab,
  onActiveTabChange,
  tabs,
  status,
  children,
  hidden = false,
  "aria-label": ariaLabel = "Controles del mapa",
  "data-tour": dataTour,
}: MapMobileBottomSheetProps) {
  const isClient = useIsClient()
  const titleId = useId()
  const dragStartY = useRef<number | null>(null)

  // Lock document scroll while the mobile sheet is mounted (map pages are full-viewport).
  useEffect(() => {
    if (!isClient || hidden) return
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(max-width: 767px)")
    const lock = () => {
      if (!mq.matches) return
      document.documentElement.style.overflow = "hidden"
      document.body.style.overflow = "hidden"
      document.body.style.overscrollBehavior = "none"
    }
    const unlock = () => {
      document.documentElement.style.overflow = ""
      document.body.style.overflow = ""
      document.body.style.overscrollBehavior = ""
    }
    const sync = () => {
      if (mq.matches) lock()
      else unlock()
    }
    sync()
    mq.addEventListener("change", sync)
    return () => {
      mq.removeEventListener("change", sync)
      unlock()
    }
  }, [isClient, hidden])

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExpandedChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expanded, onExpandedChange])

  const handleTabClick = useCallback(
    (tabId: string) => {
      if (tabId === activeTab && expanded) {
        onExpandedChange(false)
        return
      }
      onActiveTabChange(tabId)
      onExpandedChange(true)
    },
    [activeTab, expanded, onActiveTabChange, onExpandedChange],
  )

  const onHandlePointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onHandlePointerUp = (e: React.PointerEvent) => {
    if (dragStartY.current == null) return
    const delta = e.clientY - dragStartY.current
    dragStartY.current = null
    if (Math.abs(delta) < 8) {
      onExpandedChange(!expanded)
      return
    }
    if (delta > 40) onExpandedChange(false)
    else if (delta < -40) onExpandedChange(true)
  }

  if (!isClient || hidden) return null

  return createPortal(
    <div
      className={MAP_MOBILE_ONLY_CLASS}
      data-slot="map-mobile-bottom-sheet"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 70 }}
    >
      <button
        type="button"
        aria-label="Cerrar panel"
        aria-hidden={!expanded}
        tabIndex={expanded ? 0 : -1}
        className={cn(
          "border-0 bg-black/40 p-0 transition-opacity motion-reduce:transition-none",
          expanded ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 69,
          transitionDuration: `${SHEET_DURATION_MS}ms`,
          transitionTimingFunction: SHEET_EASE,
        }}
        onClick={() => onExpandedChange(false)}
      />

      <div
        role="dialog"
        aria-modal={expanded ? true : undefined}
        aria-labelledby={titleId}
        aria-label={ariaLabel}
        data-tour={dataTour}
        className={cn(
          "flex max-h-[min(72dvh,640px)] flex-col border-t border-white/10",
          GLASS_PANEL_CLASS,
          GLASS_MICA_INTERACTIVE_CLASS,
        )}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          top: "auto",
          zIndex: 70,
          pointerEvents: "auto",
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
          touchAction: "manipulation",
        }}
      >
        <span id={titleId} className="sr-only">
          {ariaLabel}
        </span>

        <button
          type="button"
          className="flex w-full shrink-0 cursor-grab touch-none flex-col items-center pt-2 pb-1 active:cursor-grabbing"
          aria-expanded={expanded}
          aria-label={expanded ? "Colapsar panel" : "Expandir panel"}
          onPointerDown={onHandlePointerDown}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={() => {
            dragStartY.current = null
          }}
        >
          <span className="h-1 w-10 bg-white/30" aria-hidden />
        </button>

        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-3 py-2">
          {status}
        </div>

        <div
          role="tablist"
          aria-label="Secciones"
          className="flex shrink-0 gap-1 border-b border-white/10 px-2 py-1.5"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2 py-2.5",
                  "text-[9px] font-semibold uppercase tracking-[1.2px] transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
                  selected
                    ? "border border-white/20 bg-white/[0.08] text-white"
                    : "border border-transparent text-white/50 hover:bg-white/[0.04] hover:text-white/80",
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Animated expand: grid 0fr → 1fr keeps height tween without JS measure. */}
        <div
          className="grid min-h-0 transition-[grid-template-rows] motion-reduce:transition-none"
          style={{
            gridTemplateRows: expanded ? "1fr" : "0fr",
            transitionDuration: `${SHEET_DURATION_MS}ms`,
            transitionTimingFunction: SHEET_EASE,
          }}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              role="tabpanel"
              className={cn(
                "min-h-0 overflow-y-auto overscroll-contain px-1 pb-1",
                "transition-[opacity,transform] motion-reduce:transition-none",
                expanded
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0",
              )}
              style={{
                maxHeight: "calc(min(72dvh, 640px) - 9rem)",
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
                transitionDuration: `${SHEET_DURATION_MS}ms`,
                transitionTimingFunction: SHEET_EASE,
                transitionDelay: expanded ? "40ms" : "0ms",
              }}
              inert={!expanded ? true : undefined}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
