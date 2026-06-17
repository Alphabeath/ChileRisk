"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import {
  FamilyPlanField,
  FamilyPlanSection,
  newId,
} from "@/components/preparation/family-plan/family-plan-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  EXTERNAL_THREATS,
  INTERNAL_THREATS,
  riskLevel,
  riskScore,
} from "@/lib/family-plan-defaults"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import type { Threat } from "@/lib/types"
import { cn } from "@/lib/utils"

type Level = "bajo" | "medio" | "alto"

const LEVEL_VISUAL: Record<
  Level,
  { border: string; text: string; fill: string }
> = {
  bajo: {
    border: "border-emerald-500/40",
    text: "text-emerald-300",
    fill: "bg-emerald-400/80",
  },
  medio: {
    border: "border-amber-500/40",
    text: "text-amber-300",
    fill: "bg-amber-400/80",
  },
  alto: {
    border: "border-rose-500/40",
    text: "text-rose-300",
    fill: "bg-rose-400/80",
  },
}

const RISK_MAX = 25
const RISK_BOUNDARIES = { bajoMedio: 5, medioAlto: 15 }

function RiskBar({
  score,
  level,
}: {
  score: number
  level: Level
}) {
  const visual = LEVEL_VISUAL[level]
  const pct = Math.max(0, Math.min(100, (score / RISK_MAX) * 100))
  const bajoMedioPct = (RISK_BOUNDARIES.bajoMedio / RISK_MAX) * 100
  const medioAltoPct = (RISK_BOUNDARIES.medioAlto / RISK_MAX) * 100

  return (
    <div
      className="flex flex-col gap-1.5"
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={RISK_MAX}
      aria-label={`Riesgo calculado: ${score} de ${RISK_MAX}, nivel ${level}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/55">
          Riesgo
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-sm font-semibold tabular-nums text-white">
            {score}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/35">
            /
          </span>
          <span className="font-mono text-[11px] tabular-nums text-white/45">
            {RISK_MAX}
          </span>
          <span
            className={cn(
              "ml-1 text-[10px] font-semibold uppercase tracking-[1.2px]",
              visual.text,
            )}
          >
            {level}
          </span>
        </div>
      </div>
      <div className="relative h-1.5 border border-white/10 bg-white/5">
        <span
          className="absolute top-0 bottom-0 w-px bg-white/25"
          style={{ left: `${bajoMedioPct}%` }}
          aria-hidden
        />
        <span
          className="absolute top-0 bottom-0 w-px bg-white/25"
          style={{ left: `${medioAltoPct}%` }}
          aria-hidden
        />
        <span
          className={cn(
            "block h-full transition-all duration-300",
            visual.fill,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function ScaleStepper({
  value,
  onChange,
  ariaLabel,
}: {
  value: number
  onChange: (n: number) => void
  ariaLabel: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n === value
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${ariaLabel} ${n}`}
            onClick={() => onChange(n)}
            className={cn(
              "size-7 border text-[11px] font-mono font-semibold tabular-nums transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
              active
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20 hover:bg-white/[0.06] hover:text-white/80",
              "active:scale-95",
            )}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

function ThreatCard({
  threat,
  onUpdate,
  onRemove,
}: {
  threat: Threat
  onUpdate: (patch: Partial<Threat>) => void
  onRemove: () => void
}) {
  const score = riskScore(threat.probability, threat.impact)
  const level = riskLevel(score) as Level
  const visual = LEVEL_VISUAL[level]

  return (
    <article
      className={cn(
        "glass-mica interactive-mica border-l-[3px] border border-white/15 bg-white/[0.04] p-4 transition-colors hover:border-white/25",
        visual.border,
      )}
    >
      <div className="flex items-start gap-3">
        <Input
          value={threat.risk}
          onChange={(e) => onUpdate({ risk: e.target.value })}
          placeholder="Nombre de la amenaza"
          aria-label="Nombre de la amenaza"
          className="flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Eliminar amenaza"
        >
          <Trash2 data-icon="inline-only" />
        </Button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/55">
              Probabilidad
            </span>
            <ScaleStepper
              value={threat.probability}
              onChange={(n) => onUpdate({ probability: n })}
              ariaLabel="Probabilidad"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/55">
              Impacto
            </span>
            <ScaleStepper
              value={threat.impact}
              onChange={(n) => onUpdate({ impact: n })}
              ariaLabel="Impacto"
            />
          </div>
        </div>
        <RiskBar score={score} level={level} />
      </div>

      <FamilyPlanField label="Acción correctiva" className="mt-3">
        <Textarea
          value={threat.corrective_action}
          onChange={(e) => onUpdate({ corrective_action: e.target.value })}
          placeholder="¿Cómo reducir el riesgo?"
          rows={2}
        />
      </FamilyPlanField>
    </article>
  )
}

function AddThreatForm({
  suggestions,
  onAddSuggested,
  onAddCustom,
}: {
  suggestions: readonly string[]
  onAddSuggested: (risk: string) => void
  onAddCustom: (risk: string) => void
}) {
  const [customValue, setCustomValue] = useState("")

  function submitCustom() {
    const trimmed = customValue.trim()
    if (!trimmed) return
    onAddCustom(trimmed)
    setCustomValue("")
  }

  return (
    <div className="flex flex-col gap-4 border border-dashed border-white/25 bg-white/[0.025] p-4 transition-colors hover:border-white/35 hover:bg-white/[0.04]">
      <header className="flex items-center gap-2.5">
        <span
          className="flex size-7 shrink-0 items-center justify-center border border-white/20 bg-white/10 text-white"
          aria-hidden
        >
          <Plus className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/85">
            Agregar nueva amenaza
          </p>
          <p className="mt-0.5 text-[11px] text-white/45">
            Escribe un nombre o elige una sugerencia predefinida.
          </p>
        </div>
      </header>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              submitCustom()
            }
          }}
          placeholder="Nombre de la amenaza (ej. Mascarilla suelta en patio)"
          aria-label="Nombre de la nueva amenaza"
          className="flex-1"
        />
        <Button
          type="button"
          onClick={submitCustom}
          disabled={!customValue.trim()}
        >
          <Plus data-icon="inline-start" />
          Agregar
        </Button>
      </div>
      {suggestions.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/45">
            Sugerencias predefinidas
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onAddSuggested(suggestion)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 border border-white/15 bg-white/[0.04] px-2.5 text-[11px] text-white/75 transition-all duration-150",
                  "hover:-translate-y-px hover:border-white/30 hover:bg-white/[0.10] hover:text-white",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
                  "active:translate-y-0",
                )}
              >
                <Plus className="size-3" aria-hidden />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ThreatGroup({
  title,
  description,
  suggestions,
  threats,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string
  description: string
  suggestions: readonly string[]
  threats: Threat[]
  onAdd: (risk: string) => void
  onUpdate: (id: string, patch: Partial<Threat>) => void
  onRemove: (id: string) => void
}) {
  const usedKeys = new Set(threats.map((t) => t.risk.trim().toLowerCase()))
  const available = suggestions.filter((s) => !usedKeys.has(s.toLowerCase()))

  return (
    <FamilyPlanSection title={title} description={description}>
      {threats.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center">
          <p className="text-[12px] text-white/55">
            Aún no registras amenazas en esta categoría.
          </p>
          <p className="text-[11px] text-white/35">
            Usa las sugerencias o agrega una personalizada.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {threats.map((threat) => (
            <ThreatCard
              key={threat.id}
              threat={threat}
              onUpdate={(patch) => onUpdate(threat.id, patch)}
              onRemove={() => onRemove(threat.id)}
            />
          ))}
        </div>
      )}

      <AddThreatForm
        suggestions={available}
        onAddSuggested={onAdd}
        onAddCustom={onAdd}
      />
    </FamilyPlanSection>
  )
}

export function StepThreats() {
  const { data, updateData } = useFamilyPlan()
  if (!data) return null

  function makeThreat(risk: string, category: "internal" | "external"): Threat {
    return {
      id: newId(),
      risk,
      category,
      probability: 1,
      impact: 1,
      corrective_action: "",
      selected: true,
    }
  }

  function addThreat(category: "internal" | "external", risk: string) {
    const trimmed = risk.trim()
    if (!trimmed) return
    updateData((prev) => {
      const exists = prev.threats.some(
        (t) =>
          t.category === category &&
          t.risk.trim().toLowerCase() === trimmed.toLowerCase(),
      )
      if (exists) return prev
      return {
        ...prev,
        threats: [...prev.threats, makeThreat(trimmed, category)],
      }
    })
  }

  function updateThreat(id: string, patch: Partial<Threat>) {
    updateData((prev) => ({
      ...prev,
      threats: prev.threats.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }

  function removeThreat(id: string) {
    updateData((prev) => ({
      ...prev,
      threats: prev.threats.filter((t) => t.id !== id),
    }))
  }

  const internal = data.threats.filter((t) => t.category === "internal")
  const external = data.threats.filter((t) => t.category === "external")

  return (
    <div className="flex flex-col gap-8">
      <ThreatGroup
        title="Amenazas internas"
        description="Riesgos dentro de la vivienda (eléctricos, gas, estructural)."
        suggestions={INTERNAL_THREATS}
        threats={internal}
        onAdd={(risk) => addThreat("internal", risk)}
        onUpdate={updateThreat}
        onRemove={removeThreat}
      />
      <ThreatGroup
        title="Amenazas externas"
        description="Riesgos del entorno y fenómenos naturales."
        suggestions={EXTERNAL_THREATS}
        threats={external}
        onAdd={(risk) => addThreat("external", risk)}
        onUpdate={updateThreat}
        onRemove={removeThreat}
      />
    </div>
  )
}
