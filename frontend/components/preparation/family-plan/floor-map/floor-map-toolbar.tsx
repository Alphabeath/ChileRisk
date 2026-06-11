"use client"

import { useId } from "react"
import {
  AlertTriangle,
  ChevronDown,
  Eye,
  LayoutGrid,
  MapPinned,
  MousePointer2,
  Route,
  ShieldCheck,
  Siren,
  Undo2,
} from "lucide-react"

import {
  FloorMapLayerToggles,
  type LayerVisibility,
} from "@/components/preparation/family-plan/floor-map-layer-toggles"
import { Button } from "@/components/ui/button"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  EMERGENCY_MARKER_TYPES,
  ROOM_TYPES,
} from "@/lib/family-plan-defaults"
import type { FloorMapPhase } from "@/lib/floor-map-phases"
import {
  DEFAULT_MARKER_STYLE,
  DEFAULT_ROOM_STYLE,
  MARKER_STYLES,
  ROOM_STYLES,
} from "@/lib/floor-map-constants"
import {
  FLOOR_MAP_SELECT_TOOL,
  isSameTool,
  type FloorMapTool,
} from "@/lib/floor-map-tools"
import { ZONE_VISUALS } from "@/lib/floor-map-zone-styles"
import { GLASS_PANEL_CLASS, SOLID_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

interface FloorMapToolbarProps {
  phase: FloorMapPhase
  activeTool: FloorMapTool
  onToolChange: (tool: FloorMapTool) => void
  visibility: LayerVisibility
  onToggleVisibility: (key: keyof LayerVisibility, value: boolean) => void
  counts: { rooms: number; markers: number; routes: number; zones: number }
  routeDraftLength: number
  onUndoRoutePoint?: () => void
  className?: string
}

function menubarTriggerClass(active: boolean) {
  return cn(
    "h-auto cursor-pointer gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white data-open:bg-white/10 data-open:text-white",
    active && "bg-white/10 text-white ring-1 ring-inset ring-white/15",
  )
}

function menubarContentClass() {
  return cn(
    SOLID_PANEL_CLASS,
    "min-w-52 border-white/15 bg-neutral-950 p-1 text-white ring-white/10",
  )
}

function menubarItemClass(active: boolean) {
  return cn(
    "cursor-pointer gap-2 rounded-none px-2.5 py-2 text-[10px] font-medium normal-case tracking-normal text-white/80 transition-colors focus:bg-white/10 focus:text-white data-highlighted:bg-white/[0.06]",
    active && "bg-white/10 text-white",
  )
}

export function FloorMapToolbar({
  phase,
  activeTool,
  onToolChange,
  visibility,
  onToggleVisibility,
  counts,
  routeDraftLength,
  onUndoRoutePoint,
  className,
}: FloorMapToolbarProps) {
  function selectTool(tool: FloorMapTool) {
    onToolChange(tool)
  }

  const hiddenLayers = (Object.keys(visibility) as (keyof LayerVisibility)[]).filter(
    (key) => !visibility[key],
  ).length

  const showUndo =
    phase === "zones" &&
    activeTool.mode === "route" &&
    routeDraftLength > 0 &&
    onUndoRoutePoint

  return (
    <TooltipProvider delayDuration={400}>
      <div
        className={cn(
          GLASS_PANEL_CLASS,
          "flex w-full items-center gap-2 border-0 border-b border-white/10 bg-black/60 px-1 py-1",
          className,
        )}
      >
        <Menubar className="h-auto min-h-0 flex-1 flex-wrap gap-0.5 border-0 bg-transparent p-0">
          <ToolbarDivider />

          <Tooltip>
            <TooltipTrigger asChild>
              <MenubarAction
                active={activeTool.mode === "select"}
                onClick={() => onToolChange(FLOOR_MAP_SELECT_TOOL)}
                aria-label="Seleccionar y mover elementos"
              >
                <MousePointer2 className="size-3.5" aria-hidden />
                Seleccionar
              </MenubarAction>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Mover y redimensionar en el plano
            </TooltipContent>
          </Tooltip>

          {phase === "layout" ? (
            <>
              <ToolbarDivider />
              <MenubarMenu>
                <MenubarTrigger
                  className={menubarTriggerClass(activeTool.mode === "room")}
                >
                  <LayoutGrid className="size-3.5 shrink-0" aria-hidden />
                  Habitaciones
                  <ChevronDown className="size-3 opacity-50" aria-hidden />
                </MenubarTrigger>
                <MenubarContent className={menubarContentClass()} align="start">
                  <MenubarLabel className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] text-white/50">
                    <LayoutGrid className="size-3" aria-hidden />
                    Colocar habitación
                  </MenubarLabel>
                  <MenubarSeparator className="bg-white/10" />
                  {ROOM_TYPES.map((room) => {
                    const tool: FloorMapTool = { mode: "room", type: room.id }
                    const active = isSameTool(activeTool, tool)
                    const style = ROOM_STYLES[room.id] ?? DEFAULT_ROOM_STYLE
                    const Icon = style.icon
                    return (
                      <MenubarItem
                        key={room.id}
                        className={menubarItemClass(active)}
                        onClick={() => selectTool(tool)}
                      >
                        <Icon className="size-3.5 shrink-0" aria-hidden />
                        {room.label}
                      </MenubarItem>
                    )
                  })}
                </MenubarContent>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger
                  className={menubarTriggerClass(activeTool.mode === "marker")}
                >
                  <Siren className="size-3.5 shrink-0" aria-hidden />
                  Emergencia
                  <ChevronDown className="size-3 opacity-50" aria-hidden />
                </MenubarTrigger>
                <MenubarContent className={menubarContentClass()} align="start">
                  <MenubarLabel className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] text-white/50">
                    <Siren className="size-3" aria-hidden />
                    Puntos de emergencia
                  </MenubarLabel>
                  <MenubarSeparator className="bg-white/10" />
                  {EMERGENCY_MARKER_TYPES.map((marker) => {
                    const tool: FloorMapTool = { mode: "marker", type: marker.id }
                    const active = isSameTool(activeTool, tool)
                    const style = MARKER_STYLES[marker.id] ?? DEFAULT_MARKER_STYLE
                    const Icon = style.icon
                    return (
                      <MenubarItem
                        key={marker.id}
                        className={menubarItemClass(active)}
                        onClick={() => selectTool(tool)}
                      >
                        <Icon className="size-3.5 shrink-0" aria-hidden />
                        {marker.label}
                      </MenubarItem>
                    )
                  })}
                </MenubarContent>
              </MenubarMenu>
            </>
          ) : null}

          {phase === "zones" ? (
            <>
              <ToolbarDivider />
              <MenubarMenu>
                <MenubarTrigger
                  className={menubarTriggerClass(
                    activeTool.mode === "safe" || activeTool.mode === "risk",
                  )}
                >
                  <MapPinned className="size-3.5 shrink-0" aria-hidden />
                  Zonas
                  <ChevronDown className="size-3 opacity-50" aria-hidden />
                </MenubarTrigger>
                <MenubarContent className={menubarContentClass()} align="start">
                  <MenubarLabel className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] text-white/50">
                    <MapPinned className="size-3" aria-hidden />
                    Tipo de zona
                  </MenubarLabel>
                  <MenubarSeparator className="bg-white/10" />
                  <MenubarItem
                    className={menubarItemClass(activeTool.mode === "safe")}
                    onClick={() => selectTool({ mode: "safe" })}
                  >
                    <ZoneSwatch
                      stroke={ZONE_VISUALS.safe.stroke}
                      fill={ZONE_VISUALS.safe.fill}
                    />
                    <ShieldCheck className="size-3.5 shrink-0 text-emerald-300" aria-hidden />
                    Lugar seguro
                  </MenubarItem>
                  <MenubarItem
                    className={menubarItemClass(activeTool.mode === "risk")}
                    onClick={() => selectTool({ mode: "risk" })}
                  >
                    <ZoneSwatch
                      stroke={ZONE_VISUALS.risk.stroke}
                      fill={ZONE_VISUALS.risk.fill}
                    />
                    <AlertTriangle className="size-3.5 shrink-0 text-red-300" aria-hidden />
                    Zona de riesgo
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <MenubarAction
                    active={activeTool.mode === "route"}
                    onClick={() => selectTool({ mode: "route" })}
                    aria-label="Trazar ruta de evacuación"
                  >
                    <Route className="size-3.5" aria-hidden />
                    Rutas
                  </MenubarAction>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Haz clic en el plano para trazar puntos de la ruta
                </TooltipContent>
              </Tooltip>
            </>
          ) : null}

          <ToolbarDivider />

          <MenubarMenu>
            <MenubarTrigger className={menubarTriggerClass(hiddenLayers > 0)}>
              <Eye className="size-3.5 shrink-0" aria-hidden />
              Visibilidad
              {hiddenLayers > 0 ? (
                <span className="flex size-4 items-center justify-center bg-white/15 text-[9px] font-bold text-white">
                  {hiddenLayers}
                </span>
              ) : null}
              <ChevronDown className="size-3 opacity-50" aria-hidden />
            </MenubarTrigger>
            <MenubarContent className={cn(menubarContentClass(), "min-w-56 p-2")} align="start">
              <FloorMapLayerToggles
                visibility={visibility}
                onToggle={onToggleVisibility}
                counts={counts}
                flyout
              />
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        {showUndo ? (
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="shrink-0"
            onClick={onUndoRoutePoint}
          >
            <Undo2 data-icon="inline-start" />
            Deshacer punto
          </Button>
        ) : null}
      </div>
    </TooltipProvider>
  )
}

function ToolbarDivider() {
  return <div className="mx-0.5 h-6 w-px shrink-0 bg-white/10" aria-hidden />
}

function MenubarAction({
  active,
  onClick,
  children,
  "aria-label": ariaLabel,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  "aria-label"?: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-none px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest outline-hidden transition-colors hover:bg-white/[0.08]",
        active
          ? "bg-white/10 text-white ring-1 ring-inset ring-white/15"
          : "text-white/80",
      )}
    >
      {children}
    </button>
  )
}

function ZoneSwatch({
  stroke,
  fill,
  dashed = false,
}: {
  stroke: string
  fill: string
  dashed?: boolean
}) {
  const patternId = useId()

  return (
    <svg
      className="size-4 shrink-0 border border-white/15"
      viewBox="0 0 20 20"
      aria-hidden
    >
      {dashed ? (
        <>
          <rect width="20" height="20" fill={fill} />
          <line
            x1="2"
            y1="18"
            x2="18"
            y2="2"
            stroke={stroke}
            strokeWidth="2"
            strokeDasharray="3 2"
          />
        </>
      ) : (
        <>
          <defs>
            <pattern
              id={patternId}
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="4" stroke={stroke} strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect
            width="20"
            height="20"
            fill={`url(#${patternId})`}
            stroke={stroke}
            strokeWidth="1"
          />
        </>
      )}
    </svg>
  )
}