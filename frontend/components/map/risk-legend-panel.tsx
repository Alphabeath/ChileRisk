"use client"

import { useState } from "react"
import { ChevronDown, Eye, Layers, ShieldAlert, Wind } from "lucide-react"
import { useDraggablePanel } from "@/hooks"
import { MAP_PANEL_DRAG_HANDLE_CLASS, MAP_PANEL_HEADER_LABEL_CLASS, MAP_PANEL_SHELL_CLASS } from "@/lib/map-panel-styles"
import { MAP_RISK_BUCKETS } from "@/lib/risk-scale"
import { ALERT_LEVEL_META } from "@/lib/alerts-display"
import {
  AIR_QUALITY_LEVEL_META,
  AIR_QUALITY_LEVELS,
  AIR_QUALITY_UNCOVERED_HEX,
} from "@/lib/air-quality-display"
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

const AIR_GLOSSARY: { level: keyof typeof AIR_QUALITY_LEVEL_META; description: string }[] = [
  {
    level: "bueno",
    description: "MP2.5 0–50 µg/m³. Condición favorable; seguir recomendaciones generales.",
  },
  {
    level: "regular",
    description: "MP2.5 51–79 µg/m³. Evitar incremento de contaminación; precaución sensible.",
  },
  {
    level: "alerta",
    description: "MP2.5 80–109 µg/m³. Episodio crítico: restricciones de leña según polígonos.",
  },
  {
    level: "preemergencia",
    description: "MP2.5 110–169 µg/m³. Restricciones ampliadas (horarios y fuentes).",
  },
  {
    level: "emergencia",
    description: "MP2.5 ≥ 170 µg/m³. Máximas restricciones GEC durante 24 h.",
  },
]

function LegendRow({
  color,
  title,
  description,
  trailing,
}: {
  color: string
  title: string
  description?: string
  trailing?: string
}) {
  return (
    <li className="grid grid-cols-[0.75rem_1fr] items-start gap-x-1.5">
      <span
        className="mt-px size-3 shrink-0 rounded-[2px] border border-white/20"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <div className="min-w-0">
        <div className="flex min-w-0 items-baseline justify-between gap-1.5">
          <span className="text-[10px] font-semibold leading-3 text-white/90">
            {title}
          </span>
          {trailing ? (
            <span className="shrink-0 font-mono text-[9px] leading-3 tabular-nums text-white/45">
              {trailing}
            </span>
          ) : null}
        </div>
        {description ? (
          <span className="mt-0.5 block text-[10px] leading-snug text-white/50">
            {description}
          </span>
        ) : null}
      </div>
    </li>
  )
}

function MapIndicators({ mode }: { mode: "risk" | "alerts" | "air" }) {
  return (
    <div className="mt-1 border-t border-white/[0.06] pt-1.5">
      <p className="text-[10px] font-semibold leading-tight text-white/70">
        Indicadores en el mapa
      </p>
      <ul className="mt-1 flex flex-col gap-1" role="list">
        <LegendRow
          color="rgba(255,255,255,0.85)"
          title="Borde blanco"
          description="Delimita regiones y comunas; no codifica severidad."
        />
        {mode === "alerts" && (
          <LegendRow
            color="rgba(255,255,255,0.5)"
            title="Relleno oscilante"
            description="El color del relleno late con la severidad de la alerta (roja → más rápido)."
          />
        )}
        {mode === "air" && (
          <LegendRow
            color={AIR_QUALITY_UNCOVERED_HEX}
            title="Gris"
            description="Comuna fuera de zonas GEC Aire Chile (cobertura parcial)."
          />
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
          <LegendRow
            key={bucket.severity}
            color={bucket.color}
            title={bucket.label}
            trailing={bucket.scoreRangeLabel}
          />
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
        Niveles SERNAPRED / ChileRisk en el mapa (modo Alertas).
      </p>
      <ul className="flex flex-col gap-1.5" role="list">
        {ALERT_GLOSSARY.map(({ level, description }) => (
          <LegendRow
            key={level}
            color={ALERT_LEVEL_META[level].hex}
            title={ALERT_LEVEL_META[level].label}
            description={description}
          />
        ))}
        <LegendRow
          color={NO_ACTIVE_ALERT_HEX}
          title="Sin alerta activa — riesgo bajo"
          description={
            'Color de relleno cuando no hay alerta vigente en la región o comuna. Mismo verde que el bucket "Bajo" en el modo Riesgo.'
          }
        />
      </ul>
      <MapIndicators mode="alerts" />
    </div>
  )
}

function AirGlossaryContent() {
  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      <p className="text-[10px] leading-tight text-white/50">
        Condición GEC oficial (Aire Chile MMA). Solo zonas saturadas PPDA.
      </p>
      <ul className="flex flex-col gap-1.5" role="list">
        {[...AIR_GLOSSARY].reverse().map(({ level, description }) => (
          <LegendRow
            key={level}
            color={AIR_QUALITY_LEVEL_META[level].hex}
            title={AIR_QUALITY_LEVEL_META[level].label}
            description={description}
          />
        ))}
        <LegendRow
          color={AIR_QUALITY_UNCOVERED_HEX}
          title="Sin cobertura GEC"
          description="Comunas fuera de los planes Aire Chile."
        />
      </ul>
      <MapIndicators mode="air" />
    </div>
  )
}

function tabValue(mode: "risk" | "alerts" | "air"): string {
  if (mode === "alerts") return "alertas"
  if (mode === "air") return "aire"
  return "riesgo"
}

function modeFromTab(v: string): "risk" | "alerts" | "air" {
  if (v === "alertas") return "alerts"
  if (v === "aire") return "air"
  return "risk"
}

function RiskLegendTabs({ alertsMaxHeightClass }: { alertsMaxHeightClass: string }) {
  const mapColorMode = useUIStore((s) => s.mapColorMode)
  const setMapColorMode = useUIStore((s) => s.setMapColorMode)

  return (
    <Tabs
      value={tabValue(mapColorMode)}
      onValueChange={(v) => setMapColorMode(modeFromTab(v))}
      className="flex flex-col"
    >
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-0 rounded-none border-b border-white/[0.06] bg-transparent px-2"
      >
        <TabsTrigger
          value="riesgo"
          className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[1.2px] text-white/50 data-[state=active]:text-white/90 data-[state=active]:shadow-none"
        >
          <Layers aria-hidden />
          Riesgo
        </TabsTrigger>
        <TabsTrigger
          value="alertas"
          className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[1.2px] text-white/50 data-[state=active]:text-white/90 data-[state=active]:shadow-none"
        >
          <ShieldAlert aria-hidden />
          Alertas
        </TabsTrigger>
        <TabsTrigger
          value="aire"
          className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[1.2px] text-white/50 data-[state=active]:text-white/90 data-[state=active]:shadow-none"
        >
          <Wind aria-hidden />
          Aire
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
        className={cn(
          "mt-0 overflow-y-auto px-2 data-[state=inactive]:hidden",
          alertsMaxHeightClass,
        )}
      >
        <AlertGlossaryContent />
      </TabsContent>
      <TabsContent
        value="aire"
        className={cn(
          "mt-0 overflow-y-auto px-2 data-[state=inactive]:hidden",
          alertsMaxHeightClass,
        )}
      >
        <AirGlossaryContent />
      </TabsContent>
    </Tabs>
  )
}

function RiskLegendPanelEmbedded() {
  return (
    <div
      className="flex w-full max-h-[min(60dvh,480px)] flex-col overflow-hidden"
      role="group"
      aria-label="Vistas de mapa (Riesgo / Alertas / Aire)"
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RiskLegendTabs alertsMaxHeightClass="max-h-[min(50dvh,400px)]" />
      </div>
    </div>
  )
}

function RiskLegendPanelOverlay({ flow }: { flow: boolean }) {
  const [expanded, setExpanded] = useState(true)
  const mapColorMode = useUIStore((s) => s.mapColorMode)
  const { ref, handleProps, style, isDragging } = useDraggablePanel({
    id: "risk-legend-panel",
    corner: flow ? undefined : "bottom-right",
    cornerInset: 16,
    flow,
  })

  const stripColors =
    mapColorMode === "alerts"
      ? [
          ALERT_LEVEL_META.informativa.hex,
          ALERT_LEVEL_META.preventiva.hex,
          ALERT_LEVEL_META.amarilla.hex,
          ALERT_LEVEL_META.naranja.hex,
          ALERT_LEVEL_META.roja.hex,
        ]
      : mapColorMode === "air"
        ? [...AIR_QUALITY_LEVELS].map((l) => AIR_QUALITY_LEVEL_META[l].hex)
        : [...MAP_RISK_BUCKETS].reverse().map((b) => b.color)

  return (
    <div
      ref={ref}
      className={cn(MAP_PANEL_SHELL_CLASS, "flex flex-col", "max-h-[min(420px,50dvh)]")}
      style={style}
      role="group"
      aria-label="Vistas de mapa (Riesgo / Alertas / Aire)"
    >
      <div
        className={cn(
          "flex items-stretch",
          expanded && "border-b border-white/10",
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
              {stripColors.map((color, i) => (
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
              !expanded && "-rotate-90",
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
        <RiskLegendTabs alertsMaxHeightClass="max-h-[min(300px,38dvh)]" />
      </div>
    </div>
  )
}

export function RiskLegendPanel({
  flow = false,
  embedded = false,
}: {
  flow?: boolean
  embedded?: boolean
}) {
  if (embedded) return <RiskLegendPanelEmbedded />
  return <RiskLegendPanelOverlay flow={flow} />
}
