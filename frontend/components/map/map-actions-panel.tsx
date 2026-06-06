"use client"

import { RefreshCw, RotateCcw, SlidersHorizontal } from "lucide-react"
import { useDraggablePanel, useRefreshMapData } from "@/hooks"
import {
  MAP_PANEL_ACTION_BUTTON_CLASS,
  MAP_PANEL_DRAG_HANDLE_CLASS,
  MAP_PANEL_HEADER_LABEL_CLASS,
  MAP_PANEL_SHELL_CLASS,
} from "@/lib/map-panel-styles"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"

export const MAP_ACTIONS_PANEL_ID = "map-actions-panel"

export function MapActionsPanel({ flow = false }: { flow?: boolean }) {
  const { ref, handleProps, style, isDragging } = useDraggablePanel({
    id: MAP_ACTIONS_PANEL_ID,
    corner: flow ? undefined : "top-left",
    cornerInset: 16,
    flow,
  })

  const resetAllPanelPositions = useUIStore((s) => s.resetAllPanelPositions)
  const hasCustomPositions = useUIStore(
    (s) => Object.keys(s.panelPositions).length > 0,
  )
  const { refresh, isRefreshing } = useRefreshMapData()

  return (
    <div
      ref={ref}
      className={MAP_PANEL_SHELL_CLASS}
      style={style}
      role="toolbar"
      aria-label="Controles del mapa"
    >
      <div className="flex w-full items-stretch border-b border-white/10">
        <div
          {...handleProps}
          className={cn(MAP_PANEL_DRAG_HANDLE_CLASS, "py-2.5")}
          style={{ touchAction: "none" }}
          data-dragging={isDragging || undefined}
          aria-label="Arrastrar panel de controles"
        >
          <SlidersHorizontal className="size-3.5 shrink-0 text-white/55" aria-hidden />
          <span className={MAP_PANEL_HEADER_LABEL_CLASS}>Controles</span>
        </div>
      </div>

      <div className="flex divide-x divide-white/10">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => resetAllPanelPositions()}
          disabled={!hasCustomPositions}
          aria-label="Reiniciar posición de todos los paneles"
          title="Reiniciar posición de todos los paneles"
          className={MAP_PANEL_ACTION_BUTTON_CLASS}
        >
          <RotateCcw className="size-3.5 shrink-0" aria-hidden />
          <span>Reiniciar</span>
        </button>

        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => void refresh()}
          disabled={isRefreshing}
          aria-label="Actualizar datos del mapa"
          title="Actualizar datos del mapa"
          className={cn(
            MAP_PANEL_ACTION_BUTTON_CLASS,
            isRefreshing && "cursor-wait opacity-60",
          )}
        >
          <RefreshCw
            className={cn("size-3.5 shrink-0", isRefreshing && "animate-spin")}
            aria-hidden
          />
          <span>Actualizar</span>
        </button>
      </div>
    </div>
  )
}