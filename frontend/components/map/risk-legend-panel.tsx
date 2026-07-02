"use client"

import { useState } from "react"
import { ChevronDown, Eye, Layers, ShieldAlert } from "lucide-react"
import { useDraggablePanel } from "@/hooks"
import { MAP_PANEL_DRAG_HANDLE_CLASS, MAP_PANEL_HEADER_LABEL_CLASS, MAP_PANEL_SHELL_CLASS } from "@/lib/map-panel-styles"
import { MAP_RISK_BUCKETS } from "@/lib/risk-scale"
import { ALERT_LEVEL_META } from "@/lib/alerts-display"
import type { AlertLevel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUIStore } from "@/stores/ui-store"

const ALERT_GLOSSARY: { level: AlertLevel; description: string }[] = [
  {
    level: "roja",
    description:
      "Emergencia declarada. Afectación grave a personas, infraestructura o servicios. Seguir instrucciones oficiales de evacuación o refugio.",
  },
  {
    level: "naranja",
    description:
      "Alerta avanzada. Riesgo alto de impacto significativo. Prepararse para posibles evacuaciones y cortes de servicios.",
  },
  {
    level: "amarilla",
    description:
      "Alerta preventiva mayor. Condiciones adversas probables. Mantenerse informado y revisar plan de emergencia familiar.",
  },
  {
    level: "preventiva",
    description:
      "Aviso de prevención. Posible amenaza en desarrollo. Estado de vigilancia, sin acción inmediata requerida.",
  },
  {
    level: "informativa",
    description:
      "Evento o monitoreo activo. Información de seguimiento sin riesgo directo a la población.",
  },
]

/** Color shown on the map in `alerts` mode when no active alert applies to a region/comuna. */
const NO_ACTIVE_ALERT_HEX = MAP_RISK_BUCKETS[0].color

function MapIndicators({ mode }: { mode: "risk" | "alerts" }) {
  return (
    <div className="mt-1 border-t border-white/[0.06] pt-1.5">
      <p className="text-[10px] font-semibold leading-tight text-white/70">
        Indicadores en el mapa
      </p>
      <ul className="mt-1 flex flex-col gap-1" role="list">
        <li className="flex items-start gap-1.5">
          <span
            className="mt-[3px] inline-block size-2 shrink-0 rounded-full"
            style={{
              backgroundColor: "rgba(255,255,255,0.85)",
              boxShadow: "0 0 4px rgba(255,255,255,0.4)",
            }}
            aria-hidden
          />
          <span className="text-[9px] leading-snug text-white/50">
            <strong className="text-white/70">Borde blanco:</strong> delimita regiones y comunas; no codifica severidad.
          </span>
        </li>
        {mode === "alerts" && (
          <li className="flex items-start gap-1.5">
            <span
              className="mt-[3px] inline-block size-2 shrink-0 rounded-full"
              style={{
                backgroundColor: "rgba(255,255,255,0.5)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
              aria-hidden
            />
            <span className="text-[9px] leading-snug text-white/50">
              <strong className="text-white/70">Relleno oscilante:</strong> el color del relleno late con la severidad de la alerta (roja → más rápido).
            </span>
          </li>
        )}
      </ul>
    </div>
  )
}

function RiskLegendContent() {
  return (
    <>
      <p className="mb-1.5 text-[10px] leading-tight text-white/50">
        Puntuación compuesta (0–100) del día: sismo, calor, frío y viento.
      </p>
      <ul className="flex flex-col gap-1" role="list">
        {[...MAP_RISK_BUCKETS].reverse().map((bucket) => (
          <li key={bucket.severity} className="flex items-center gap-1.5">
            <span
              className="size-3 shrink-0 rounded-[2px] border border-white/20"
              style={{ backgroundColor: bucket.color }}
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-1.5">
              <span className="text-[10px] font-medium text-white/90">
                {bucket.label}
              </span>
              <span className="shrink-0 font-mono text-[9px] tabular-nums text-white/45">
                {bucket.scoreRangeLabel}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 border-t border-white/[0.06] pt-1.5 text-[9px] leading-tight text-white/40">
        Regiones al alejar; comunas al acercar. Sin dato → moderado (35).
      </p>
      <MapIndicators mode="risk" />
    </>
  )
}

function AlertGlossaryContent() {
  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      <p className="text-[10px] leading-tight text-white/50">
        Niveles de alerta según SERNAPRED, de mayor a menor gravedad. El
        relleno del mapa usa estos colores y oscila según la severidad.
      </p>
      <ul className="flex flex-col gap-1.5" role="list">
        {ALERT_GLOSSARY.map(({ level, description }) => {
          const meta = ALERT_LEVEL_META[level]
          return (
            <li key={level} className="flex items-start gap-2">
              <span
                className="mt-[3px] size-2.5 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: meta.hex,
                  boxShadow: `0 0 6px ${meta.hex}66`,
                }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold leading-none text-white/90">
                  {meta.label}
                </span>
                <span className="mt-0.5 block text-[10px] leading-snug text-white/50">
                  {description}
                </span>
              </div>
            </li>
          )
        })}
        <li className="flex items-start gap-2 border-t border-white/[0.06] pt-1.5">
          <span
            className="mt-[3px] size-2.5 shrink-0 rounded-[2px]"
            style={{
              backgroundColor: NO_ACTIVE_ALERT_HEX,
              boxShadow: `0 0 6px ${NO_ACTIVE_ALERT_HEX}66`,
            }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold leading-none text-white/90">
              Sin alerta activa — riesgo bajo
            </span>
            <span className="mt-0.5 block text-[10px] leading-snug text-white/50">
              Color de relleno cuando no hay alerta vigente en la región o
              comuna. Mismo verde que el bucket &ldquo;Bajo&rdquo; en el modo Riesgo.
            </span>
          </div>
        </li>
      </ul>
      <MapIndicators mode="alerts" />
    </div>
  )
}

export function RiskLegendPanel({ flow = false }: { flow?: boolean }) {
  const [expanded, setExpanded] = useState(true)
  const mapColorMode = useUIStore((s) => s.mapColorMode)
  const setMapColorMode = useUIStore((s) => s.setMapColorMode)
  const { ref, handleProps, style, isDragging } = useDraggablePanel({
    id: "risk-legend-panel",
    corner: flow ? undefined : "bottom-right",
    cornerInset: 16,
    flow,
  })

  return (
    <div
      ref={ref}
      className={cn(MAP_PANEL_SHELL_CLASS, "flex flex-col", "max-h-[min(420px,50dvh)]")}
      style={style}
      role="group"
      aria-label="Vistas de mapa (Riesgo / Alertas)"
    >
      <div
        className={cn(
          "flex items-stretch",
          expanded && "border-b border-white/10"
        )}
      >
        <div
          {...handleProps}
          className={cn(MAP_PANEL_DRAG_HANDLE_CLASS, "gap-1.5 py-1.5")}
          style={{ touchAction: "none" }}
          data-dragging={isDragging || undefined}
          aria-label="Arrastrar panel de vistas"
        >
          <Eye className="size-3 shrink-0 text-white/55" aria-hidden />
          <span className={MAP_PANEL_HEADER_LABEL_CLASS}>Vistas</span>
          {!expanded && (
            <div
              className="flex h-2 w-[4.5rem] shrink-0 overflow-hidden rounded-[2px] border border-white/15"
              aria-hidden
            >
              {(mapColorMode === "alerts"
                ? [
                    ALERT_LEVEL_META.informativa.hex,
                    ALERT_LEVEL_META.preventiva.hex,
                    ALERT_LEVEL_META.amarilla.hex,
                    ALERT_LEVEL_META.naranja.hex,
                    ALERT_LEVEL_META.roja.hex,
                  ]
                : [...MAP_RISK_BUCKETS].reverse().map((b) => b.color)
              ).map((color, i) => (
                <span
                  key={i}
                  className="min-w-0 flex-1"
                  style={{ backgroundColor: color }}
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
            setExpanded((v) => !v)
          }}
          aria-expanded={expanded}
          aria-controls="risk-legend-panel-body"
          aria-label={expanded ? "Colapsar panel de vistas" : "Expandir panel de vistas"}
          className="flex shrink-0 items-center border-l border-white/10 px-2 text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
        >
          <ChevronDown
            className={cn(
              "size-3 transition-transform duration-200",
              !expanded && "-rotate-90"
            )}
            aria-hidden
          />
        </button>
      </div>

      <div
        id="risk-legend-panel-body"
        className={cn(!expanded && "hidden")}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Tabs
          value={mapColorMode === "risk" ? "riesgo" : "alertas"}
          onValueChange={(v) => setMapColorMode(v === "riesgo" ? "risk" : "alerts")}
          className="flex flex-col"
        >
          <TabsList
            variant="line"
            className="h-auto w-full justify-start gap-0 rounded-none border-b border-white/[0.06] bg-transparent px-2"
          >
            <TabsTrigger
              value="riesgo"
              className="px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[1.2px] text-white/50 data-[state=active]:text-white/90 data-[state=active]:shadow-none"
            >
              <Layers aria-hidden />
              Riesgo
            </TabsTrigger>
            <TabsTrigger
              value="alertas"
              className="px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[1.2px] text-white/50 data-[state=active]:text-white/90 data-[state=active]:shadow-none"
            >
              <ShieldAlert aria-hidden />
              Alertas
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="riesgo"
            className="mt-0 px-2 py-1.5 data-[state=inactive]:hidden"
          >
            <RiskLegendContent />
          </TabsContent>
          <TabsContent
            value="alertas"
            className="mt-0 max-h-[min(300px,38dvh)] overflow-y-auto px-2 data-[state=inactive]:hidden"
          >
            <AlertGlossaryContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
