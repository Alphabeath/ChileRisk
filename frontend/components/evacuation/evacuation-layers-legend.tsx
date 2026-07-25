"use client"

import { useState } from "react"
import { AlertTriangle, ChevronDown, Flame, Layers, MapPin, Mountain, Route, TreePine, Waves } from "lucide-react"
import { useDraggablePanel } from "@/hooks"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  EVACUATION_MEETING_POINT_COLOR,
  EVACUATION_ROUTE_COLOR,
  VOLCANIC_HAZARD_COLOR_ALTO,
  VOLCANIC_HAZARD_COLOR_BAJO,
  VOLCANIC_HAZARD_COLOR_MEDIO,
  VOLCANIC_MEETING_POINT_COLOR,
  VOLCANIC_ROUTE_COLOR,
  WILDFIRE_COLOR_1,
  WILDFIRE_COLOR_2,
  WILDFIRE_COLOR_3,
  WILDFIRE_COLOR_4,
  WILDFIRE_COLOR_5,
} from "@/components/map/map-config"
import type { EvacuationLayerVisibility } from "@/lib/evacuation-layers"
import {
  MAP_PANEL_DRAG_HANDLE_CLASS,
  MAP_PANEL_HEADER_LABEL_CLASS,
  MAP_PANEL_SHELL_CLASS,
} from "@/lib/map-panel-styles"
import { cn } from "@/lib/utils"

type LayerKey = keyof EvacuationLayerVisibility
type DisasterTab = "tsunami" | "volcanic" | "wildfire"

type LayerConfigItem = {
  key: LayerKey
  label: string
  description: string
  icon: typeof AlertTriangle
  swatchClass?: string
  swatchColor?: string
}

const TSUNAMI_LAYERS: LayerConfigItem[] = [
  {
    key: "areas",
    label: "Áreas de evacuación",
    description: "Zonas que deben evacuarse ante alerta de tsunami.",
    icon: AlertTriangle,
    swatchClass: "bg-red-500/70",
  },
  {
    key: "routes",
    label: "Vías de evacuación",
    description: "Rutas seguras hacia puntos de encuentro y zonas elevadas.",
    icon: Route,
    swatchColor: EVACUATION_ROUTE_COLOR,
  },
  {
    key: "meetingPoints",
    label: "Puntos de encuentro",
    description: "Plazas, colegios y equipamientos designados por municipalidad.",
    icon: MapPin,
    swatchColor: EVACUATION_MEETING_POINT_COLOR,
  },
]

const VOLCANIC_LAYERS: LayerConfigItem[] = [
  {
    key: "volcanoes",
    label: "Volcanes activos",
    description: "Marcadores triangulares con nombre y categoría de riesgo eruptivo.",
    icon: AlertTriangle,
    swatchClass: "bg-orange-500/70",
  },
  {
    key: "volcanicRoutes",
    label: "Vías de evacuación",
    description: "Rutas de evacuación ante erupciones y lahares.",
    icon: Route,
    swatchColor: VOLCANIC_ROUTE_COLOR,
  },
  {
    key: "volcanicMeetingPoints",
    label: "Puntos de encuentro",
    description: "Puntos designados para emergencias volcánicas.",
    icon: MapPin,
    swatchColor: VOLCANIC_MEETING_POINT_COLOR,
  },
  {
    key: "volcanicRadii",
    label: "Radios de amenaza",
    description: "Líneas de distancia (5–40 km) alrededor de volcanes activos.",
    icon: AlertTriangle,
    swatchColor: "#f97316",
  },
  {
    key: "volcanicHazards",
    label: "Zonas de peligro",
    description: "Polígonos de peligro eruptivo (lahares, flujos piroclásticos, etc.).",
    icon: AlertTriangle,
    swatchClass: "bg-red-600/60",
  },
]

const HAZARD_LEVELS = [
  { label: "Alto", color: VOLCANIC_HAZARD_COLOR_ALTO },
  { label: "Medio", color: VOLCANIC_HAZARD_COLOR_MEDIO },
  { label: "Bajo", color: VOLCANIC_HAZARD_COLOR_BAJO },
] as const

const WILDFIRE_LAYERS: LayerConfigItem[] = [
  {
    key: "wildfireOccurrence",
    label: "Ocurrencia de incendios",
    description: "Densidad kernel de ocurrencia de incendios forestales (enero 2025).",
    icon: Flame,
    swatchColor: WILDFIRE_COLOR_4,
  },
]

const WILDFIRE_LEVELS = [
  { label: "Muy alta (>10)", color: WILDFIRE_COLOR_5 },
  { label: "Alta (5-10)", color: WILDFIRE_COLOR_4 },
  { label: "Media (3-5)", color: WILDFIRE_COLOR_3 },
  { label: "Baja (1-3)", color: WILDFIRE_COLOR_2 },
  { label: "Muy baja (<1)", color: WILDFIRE_COLOR_1 },
] as const

const TAB_LAYERS: Record<DisasterTab, LayerConfigItem[]> = {
  tsunami: TSUNAMI_LAYERS,
  volcanic: VOLCANIC_LAYERS,
  wildfire: WILDFIRE_LAYERS,
}

const TAB_META: Record<DisasterTab, { icon: typeof Waves; label: string }> = {
  tsunami: { icon: Waves, label: "Tsunami" },
  volcanic: { icon: Mountain, label: "Volcánico" },
  wildfire: { icon: TreePine, label: "Incendios" },
}

function LayerSwatch({
  layer,
  active,
}: {
  layer: LayerConfigItem
  active: boolean
}) {
  return (
    <span
      className={cn(
        "mt-0.5 size-3 shrink-0 rounded-[2px] border border-white/20",
        layer.swatchClass,
        !active && "opacity-35",
      )}
      style={
        layer.swatchColor
          ? { backgroundColor: `${layer.swatchColor}cc` }
          : undefined
      }
      aria-hidden
    />
  )
}

function LayerList({
  layers,
  visibility,
  onToggle,
}: {
  layers: LayerConfigItem[]
  visibility: EvacuationLayerVisibility
  onToggle: (key: LayerKey) => void
}) {
  return (
    <ul className="flex flex-col gap-1.5" role="list">
      {layers.map((layer) => {
        const Icon = layer.icon
        const active = visibility[layer.key]
        const inputId = `evacuation-legend-${layer.key}`

        return (
          <li key={layer.key}>
            <label
              htmlFor={inputId}
              className={cn(
                "flex cursor-pointer gap-2 border border-white/10 px-2 py-2 transition-colors",
                active ? "bg-white/[0.05]" : "bg-white/[0.02] opacity-80",
                "hover:bg-white/[0.08]",
              )}
            >
              <LayerSwatch layer={layer} active={active} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <Icon className="size-3 text-white/65" aria-hidden />
                  <span className="text-[11px] font-semibold text-white/90">{layer.label}</span>
                </span>
                <span className="mt-0.5 block text-[10px] leading-snug text-white/50">
                  {layer.description}
                </span>
              </span>
              <input
                id={inputId}
                type="checkbox"
                checked={active}
                onChange={() => onToggle(layer.key)}
                className="mt-0.5 size-3.5 shrink-0 accent-amber-500"
                aria-label={`Mostrar ${layer.label}`}
              />
            </label>
          </li>
        )
      })}
    </ul>
  )
}

function HazardLevelScale() {
  return (
    <div className="mt-2 border-t border-white/[0.06] pt-2">
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[1.1px] text-white/45">
        Niveles de peligro
      </p>
      <ul className="flex flex-col gap-1" role="list">
        {HAZARD_LEVELS.map((level) => (
          <li key={level.label} className="flex items-center gap-1.5">
            <span
              className="size-3 shrink-0 rounded-[2px] border border-white/20"
              style={{ backgroundColor: `${level.color}cc` }}
              aria-hidden
            />
            <span className="text-[10px] text-white/75">{level.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function WildfireOccurrenceScale() {
  return (
    <div className="mt-2 border-t border-white/[0.06] pt-2">
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[1.1px] text-white/45">
        Densidad de ocurrencia
      </p>
      <ul className="flex flex-col gap-1" role="list">
        {WILDFIRE_LEVELS.map((level) => (
          <li key={level.label} className="flex items-center gap-1.5">
            <span
              className="size-3 shrink-0 rounded-[2px] border border-white/20"
              style={{ backgroundColor: `${level.color}cc` }}
              aria-hidden
            />
            <span className="text-[10px] text-white/75">{level.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface EvacuationLayersLegendProps {
  visibility: EvacuationLayerVisibility
  onToggle: (key: LayerKey) => void
  flow?: boolean
  embedded?: boolean
  disabled?: boolean
}

function EvacuationLayersTabs({
  visibility,
  onToggle,
  contentMaxHeightClass,
  activeTab,
  onActiveTabChange,
}: {
  visibility: EvacuationLayerVisibility
  onToggle: (key: LayerKey) => void
  contentMaxHeightClass: string
  activeTab: DisasterTab
  onActiveTabChange: (tab: DisasterTab) => void
}) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onActiveTabChange(value as DisasterTab)}
      className="flex flex-col"
    >
      <TabsList
        variant="line"
        className="h-auto w-full justify-center gap-0.5 overflow-hidden rounded-none border-b border-white/[0.06] bg-transparent px-2"
      >
        {(Object.keys(TAB_META) as DisasterTab[]).map((tab) => {
          const meta = TAB_META[tab]
          const Icon = meta.icon
          const isActive = activeTab === tab
          return (
            <TabsTrigger
              key={tab}
              value={tab}
              title={!isActive ? meta.label : undefined}
              aria-label={meta.label}
              className={cn(
                "relative flex shrink-0 items-center justify-center rounded-sm text-white/50 transition-colors data-[state=active]:text-white/90 data-[state=active]:shadow-none",
                isActive
                  ? "min-w-0 max-w-[calc(100%-3.75rem)] gap-1.5 px-2.5 py-1.5"
                  : "size-7 px-0 py-0",
              )}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden />
              {isActive ? (
                <span className="truncate text-[9px] font-semibold uppercase tracking-[1.1px]">
                  {meta.label}
                </span>
              ) : null}
            </TabsTrigger>
          )
        })}
      </TabsList>

      <TabsContent
        value="tsunami"
        className={cn(
          "mt-0 overflow-y-auto px-2 py-2 data-[state=inactive]:hidden",
          contentMaxHeightClass,
        )}
      >
        <p className="mb-2 text-[10px] leading-snug text-white/50">
          Activa o desactiva capas de evacuación por tsunami. Haz zoom en tu comuna para ver
          rutas y zonas.
        </p>
        <LayerList layers={TSUNAMI_LAYERS} visibility={visibility} onToggle={onToggle} />
        <p className="mt-2 border-t border-white/[0.06] pt-2 text-[9px] leading-snug text-white/40">
          Fuente: SENAPRED · Datos oficiales de evacuación por tsunami.
        </p>
      </TabsContent>

      <TabsContent
        value="volcanic"
        className={cn(
          "mt-0 overflow-y-auto px-2 py-2 data-[state=inactive]:hidden",
          contentMaxHeightClass,
        )}
      >
        <p className="mb-2 text-[10px] leading-snug text-white/50">
          Activa o desactiva capas de riesgo y evacuación volcánica. Haz zoom para ver rutas,
          radios y zonas de peligro.
        </p>
        <LayerList layers={VOLCANIC_LAYERS} visibility={visibility} onToggle={onToggle} />
        <HazardLevelScale />
        <p className="mt-2 border-t border-white/[0.06] pt-2 text-[9px] leading-snug text-white/40">
          Fuente: SENAPRED / SERNAGEOMIN · Datos oficiales de evacuación y peligro volcánico.
        </p>
      </TabsContent>

      <TabsContent
        value="wildfire"
        className={cn(
          "mt-0 overflow-y-auto px-2 py-2 data-[state=inactive]:hidden",
          contentMaxHeightClass,
        )}
      >
        <p className="mb-2 text-[10px] leading-snug text-white/50">
          Activa o desactiva la capa de ocurrencia de incendios forestales. Datos de densidad
          kernel (enero 2025).
        </p>
        <LayerList layers={WILDFIRE_LAYERS} visibility={visibility} onToggle={onToggle} />
        <WildfireOccurrenceScale />
        <p className="mt-2 border-t border-white/[0.06] pt-2 text-[9px] leading-snug text-white/40">
          Fuente: Análisis de densidad kernel · Datos de ocurrencia enero 2025.
        </p>
      </TabsContent>
    </Tabs>
  )
}

function EvacuationLayersLegendEmbedded({
  visibility,
  onToggle,
  disabled,
}: Omit<EvacuationLayersLegendProps, "flow" | "embedded">) {
  const [activeTab, setActiveTab] = useState<DisasterTab>("tsunami")

  return (
    <div
      className="flex w-full max-h-[min(60dvh,480px)] flex-col overflow-hidden"
      role="group"
      aria-label="Leyenda y capas de evacuación"
      inert={disabled ? true : undefined}
    >
      {/* Title omitted — tab already says "Capas". */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EvacuationLayersTabs
          visibility={visibility}
          onToggle={onToggle}
          contentMaxHeightClass="max-h-[min(50dvh,400px)]"
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
        />
      </div>
    </div>
  )
}

function EvacuationLayersLegendOverlay({
  visibility,
  onToggle,
  flow = false,
  disabled,
}: Omit<EvacuationLayersLegendProps, "embedded">) {
  const [expanded, setExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<DisasterTab>("tsunami")
  const { ref, handleProps, style, isDragging } = useDraggablePanel({
    id: "evacuation-layers-legend",
    corner: flow ? undefined : "bottom-right",
    cornerInset: 16,
    flow,
  })

  const collapsedLayers = TAB_LAYERS[activeTab]

  return (
    <div
      ref={ref}
      className={cn(MAP_PANEL_SHELL_CLASS, "flex max-h-[min(420px,50dvh)] flex-col")}
      style={style}
      role="group"
      aria-label="Leyenda y capas de evacuación"
      inert={disabled ? true : undefined}
    >
      <div className={cn("flex items-stretch", expanded && "border-b border-white/10")}>
        <div
          {...handleProps}
          className={cn(MAP_PANEL_DRAG_HANDLE_CLASS, "gap-1.5 py-1.5")}
          style={{ touchAction: "none" }}
          data-dragging={isDragging || undefined}
          aria-label="Arrastrar leyenda de capas"
        >
          <Layers className="size-3 shrink-0 text-white/55" aria-hidden />
          <span className={MAP_PANEL_HEADER_LABEL_CLASS}>Capas</span>
          {!expanded && (
            <div
              className="flex h-2 w-[4.5rem] shrink-0 overflow-hidden rounded-[2px] border border-white/15"
              aria-hidden
            >
              {collapsedLayers.map((layer) => (
                <span
                  key={layer.key}
                  className={cn(
                    "min-w-0 flex-1",
                    layer.swatchClass,
                    !visibility[layer.key] && "opacity-30",
                  )}
                  style={
                    layer.swatchColor
                      ? { backgroundColor: `${layer.swatchColor}cc` }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((value) => !value)
          }}
          aria-expanded={expanded}
          aria-controls="evacuation-layers-legend-body"
          aria-label={expanded ? "Colapsar leyenda" : "Expandir leyenda"}
          className="flex shrink-0 items-center border-l border-white/10 px-2 text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
        >
          <ChevronDown
            className={cn("size-3 transition-transform duration-200", !expanded && "-rotate-90")}
            aria-hidden
          />
        </button>
      </div>

      <div
        id="evacuation-layers-legend-body"
        className={cn(!expanded && "hidden")}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <EvacuationLayersTabs
          visibility={visibility}
          onToggle={onToggle}
          contentMaxHeightClass="max-h-[min(280px,36dvh)]"
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
        />
      </div>
    </div>
  )
}

export function EvacuationLayersLegend({
  embedded = false,
  ...props
}: EvacuationLayersLegendProps) {
  if (embedded) return <EvacuationLayersLegendEmbedded {...props} />
  return <EvacuationLayersLegendOverlay {...props} />
}