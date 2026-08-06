"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Flame,
  MapPin,
  Mountain,
  Route,
  TreePine,
  Waves,
} from "lucide-react"

import {
  EVACUATION_ICON_URLS,
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
} from "@/components/map/evacuacion-config"
import type { EvacuationLayerVisibility } from "@/lib/evacuacion-layers"
import {
  MAP_PANEL_TITLE_CLASS,
  MAP_PANEL_WIDTH_CLASS,
} from "@/lib/citizen-layout"
import { SURFACE_PANEL_SHELL_CLASS } from "@/lib/surface"
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
  /** Original KMZ badge image (PE / PET). */
  swatchImageSrc?: string
  swatchIconClass?: string
}

const TSUNAMI_LAYERS: LayerConfigItem[] = [
  {
    key: "areas",
    label: "Áreas de evacuación",
    description: "Zonas a evacuar ante alerta de tsunami.",
    icon: AlertTriangle,
    swatchClass: "bg-red-500/70",
  },
  {
    key: "routes",
    label: "Vías de evacuación",
    description: "Rutas hacia puntos de encuentro.",
    icon: Route,
    swatchColor: EVACUATION_ROUTE_COLOR,
  },
  {
    key: "meetingPoints",
    label: "Puntos de encuentro (PE)",
    description: "Puntos de encuentro oficiales (SENAPRED).",
    icon: MapPin,
    swatchColor: EVACUATION_MEETING_POINT_COLOR,
    swatchImageSrc: EVACUATION_ICON_URLS.meetingPointTsunamiPe,
  },
]

const VOLCANIC_LAYERS: LayerConfigItem[] = [
  {
    key: "volcanoes",
    label: "Volcanes activos",
    description: "Marcadores con categoría eruptiva.",
    icon: AlertTriangle,
    swatchClass: "bg-orange-500/70",
  },
  {
    key: "volcanicRoutes",
    label: "Vías de evacuación",
    description: "Rutas ante erupciones y lahares.",
    icon: Route,
    swatchColor: VOLCANIC_ROUTE_COLOR,
  },
  {
    key: "volcanicMeetingPointsPe",
    label: "Puntos de encuentro (PE)",
    description: "Puntos de encuentro oficiales.",
    icon: MapPin,
    swatchColor: EVACUATION_MEETING_POINT_COLOR,
    swatchImageSrc: EVACUATION_ICON_URLS.meetingPointPe,
  },
  {
    key: "volcanicMeetingPointsPet",
    label: "Puntos de encuentro (PET)",
    description: "Puntos de encuentro transitorio.",
    icon: MapPin,
    swatchColor: VOLCANIC_MEETING_POINT_COLOR,
    swatchImageSrc: EVACUATION_ICON_URLS.meetingPointPet,
  },
  {
    key: "volcanicRadii",
    label: "Radios de amenaza",
    description: "Distancias 5–40 km alrededor.",
    icon: AlertTriangle,
    swatchColor: "#f97316",
  },
  {
    key: "volcanicHazards",
    label: "Zonas de peligro",
    description: "Peligro eruptivo (SERNAGEOMIN).",
    icon: AlertTriangle,
    swatchClass: "bg-red-600/60",
  },
]

const WILDFIRE_LAYERS: LayerConfigItem[] = [
  {
    key: "wildfireOccurrence",
    label: "Ocurrencia de incendios",
    description: "Densidad de ocurrencia (kernel 1 km).",
    icon: Flame,
    swatchColor: WILDFIRE_COLOR_4,
  },
]

const HAZARD_LEVELS = [
  { label: "Alto", color: VOLCANIC_HAZARD_COLOR_ALTO },
  { label: "Medio", color: VOLCANIC_HAZARD_COLOR_MEDIO },
  { label: "Bajo", color: VOLCANIC_HAZARD_COLOR_BAJO },
] as const

const WILDFIRE_LEVELS = [
  { label: "Muy alta", color: WILDFIRE_COLOR_5 },
  { label: "Alta", color: WILDFIRE_COLOR_4 },
  { label: "Media", color: WILDFIRE_COLOR_3 },
  { label: "Baja", color: WILDFIRE_COLOR_2 },
  { label: "Muy baja", color: WILDFIRE_COLOR_1 },
] as const

const TAB_LAYERS: Record<DisasterTab, LayerConfigItem[]> = {
  tsunami: TSUNAMI_LAYERS,
  volcanic: VOLCANIC_LAYERS,
  wildfire: WILDFIRE_LAYERS,
}

const TAB_META: Record<
  DisasterTab,
  { icon: typeof Waves; label: string }
> = {
  tsunami: { icon: Waves, label: "Tsunami" },
  volcanic: { icon: Mountain, label: "Volcán" },
  wildfire: { icon: TreePine, label: "Fuego" },
}

interface EvacuationLayersLegendProps {
  visibility: EvacuationLayerVisibility
  onToggle: (key: LayerKey) => void
  embedded?: boolean
  /** Title + body without outer shell (parent provides the panel frame). */
  framed?: boolean
  defaultExpanded?: boolean
  className?: string
}

export function EvacuationLayersLegend({
  visibility,
  onToggle,
  embedded = false,
  framed = true,
  defaultExpanded = true,
  className,
}: EvacuationLayersLegendProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [tab, setTab] = useState<DisasterTab>("tsunami")

  const body = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="grid shrink-0 grid-cols-3 gap-1 border-b border-border px-2 py-1.5"
        role="radiogroup"
        aria-label="Tipo de amenaza"
      >
        {(Object.keys(TAB_META) as DisasterTab[]).map((key) => {
          const meta = TAB_META[key]
          const Icon = meta.icon
          const active = tab === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex min-w-0 items-center justify-center gap-1 border px-1.5 py-1.5 font-mono text-[8px] font-semibold uppercase tracking-[1.1px] transition-colors",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring/30",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-3" aria-hidden />
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* Scroll lista + leyenda juntos para que Volcán no corte filas. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ul className="divide-y divide-border" role="list">
          {TAB_LAYERS[tab].map((layer) => {
            const Icon = layer.icon
            const active = visibility[layer.key]
            const inputId = `evacuacion-legend-${layer.key}`
            return (
              <li key={layer.key}>
                <label
                  htmlFor={inputId}
                  className={cn(
                    "flex w-full cursor-pointer items-stretch gap-0 transition-colors",
                    active
                      ? "bg-muted/30"
                      : "opacity-70 hover:bg-muted/25 hover:opacity-100",
                  )}
                >
                  <span className="flex w-11 shrink-0 items-center justify-center py-2">
                    {layer.swatchImageSrc ? (
                      <img
                        src={layer.swatchImageSrc}
                        alt=""
                        className={cn(
                          "size-7 object-contain",
                          !active && "opacity-45",
                        )}
                        aria-hidden
                      />
                    ) : (
                      <span
                        className={cn(
                          "inline-flex size-7 items-center justify-center border border-border",
                          layer.swatchClass,
                          !active && "opacity-45",
                        )}
                        style={
                          layer.swatchColor
                            ? { backgroundColor: `${layer.swatchColor}cc` }
                            : undefined
                        }
                        aria-hidden
                      >
                        <Icon
                          className={cn(
                            "size-3.5 drop-shadow-sm",
                            layer.swatchIconClass ?? "text-white",
                          )}
                        />
                      </span>
                    )}
                  </span>

                  <span
                    className="w-px shrink-0 self-stretch bg-border"
                    aria-hidden
                  />

                  <span className="flex min-w-0 flex-1 items-start gap-2 px-2.5 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-semibold leading-tight text-foreground">
                        {layer.label}
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                        {layer.description}
                      </span>
                    </span>
                    <span className="relative mt-0.5 size-3.5 shrink-0">
                      <input
                        id={inputId}
                        type="checkbox"
                        className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
                        checked={active}
                        onChange={() => onToggle(layer.key)}
                      />
                      <span
                        className={cn(
                          "pointer-events-none flex size-full items-center justify-center border transition-colors",
                          "peer-focus-visible:ring-1 peer-focus-visible:ring-inset peer-focus-visible:ring-ring/30",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40 bg-transparent",
                        )}
                        aria-hidden
                      >
                        {active ? (
                          <Check className="size-2.5" strokeWidth={3} />
                        ) : null}
                      </span>
                    </span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>

        {tab === "volcanic" ? (
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border px-3 py-2">
            {HAZARD_LEVELS.map((level) => (
              <span
                key={level.label}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
              >
                <span
                  className="size-2.5"
                  style={{ backgroundColor: level.color }}
                  aria-hidden
                />
                {level.label}
              </span>
            ))}
          </div>
        ) : null}
        {tab === "wildfire" ? (
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border px-3 py-2">
            {WILDFIRE_LEVELS.map((level) => (
              <span
                key={level.label}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
              >
                <span
                  className="size-2.5"
                  style={{ backgroundColor: level.color }}
                  aria-hidden
                />
                {level.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )

  if (embedded) {
    return (
      <div className="flex max-h-[min(60dvh,28rem)] flex-col overflow-hidden">
        {body}
      </div>
    )
  }

  const header = (
    <button
      type="button"
      className="flex h-10 w-full shrink-0 items-center justify-between gap-2 px-3 text-left"
      onClick={() => setExpanded((v) => !v)}
      aria-expanded={expanded}
    >
      <span className={MAP_PANEL_TITLE_CLASS}>Capas</span>
      <ChevronDown
        className={cn(
          "size-4 text-muted-foreground transition-transform",
          expanded && "rotate-180",
        )}
        aria-hidden
      />
    </button>
  )

  const section = (
    <>
      {header}
      {expanded ? body : null}
    </>
  )

  const layoutClass = cn(
    "flex min-h-0 flex-col overflow-hidden",
    "shrink",
    className,
  )

  if (!framed) {
    return <div className={layoutClass}>{section}</div>
  }

  return (
    <section
      className={cn(
        SURFACE_PANEL_SHELL_CLASS,
        MAP_PANEL_WIDTH_CLASS,
        layoutClass,
      )}
    >
      {section}
    </section>
  )
}
