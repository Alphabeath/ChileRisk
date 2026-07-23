"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Home,
  Plus,
  Trash2,
  TreePine,
} from "lucide-react"

import {
  FamilyPlanField,
  newId,
} from "@/components/preparation/family-plan/family-plan-field"
import {
  FAMILY_PLAN_FORM_FULL_CLASS,
  FamilyPlanAddPanel,
  FamilyPlanCategoryShell,
  FamilyPlanEmptyState,
  FamilyPlanFormGrid,
  FamilyPlanItemCard,
  FamilyPlanStatusBanner,
  FamilyPlanStatusChip,
  FamilyPlanStepRoot,
} from "@/components/preparation/family-plan/family-plan-layout"
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
type ThreatCategory = "internal" | "external"

const LEVEL_VISUAL: Record<
  Level,
  {
    border: string
    text: string
    fill: string
    chip: "complete" | "pending" | "danger"
    label: string
  }
> = {
  bajo: {
    border: "border-l-emerald-500/60",
    text: "text-emerald-300",
    fill: "bg-emerald-400/80",
    chip: "complete",
    label: "Bajo",
  },
  medio: {
    border: "border-l-amber-500/60",
    text: "text-amber-300",
    fill: "bg-amber-400/80",
    chip: "pending",
    label: "Medio",
  },
  alto: {
    border: "border-l-rose-500/60",
    text: "text-rose-300",
    fill: "bg-rose-400/80",
    chip: "danger",
    label: "Alto",
  },
}

const CATEGORY_META = {
  internal: {
    title: "Amenazas internas",
    description: "Riesgos dentro de la vivienda (eléctricos, gas, estructural).",
    icon: Home,
    accent: "border-l-amber-500/60",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    suggestions: INTERNAL_THREATS,
  },
  external: {
    title: "Amenazas externas",
    description: "Riesgos del entorno y fenómenos naturales.",
    icon: TreePine,
    accent: "border-l-cyan-500/60",
    chip: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
    suggestions: EXTERNAL_THREATS,
  },
} as const

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
          Riesgo (P × I)
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
        </div>
      </div>
      <div className="relative h-2 border border-white/10 bg-white/5">
        <span
          className="absolute top-0 bottom-0 w-px bg-white/30"
          style={{ left: `${bajoMedioPct}%` }}
          aria-hidden
        />
        <span
          className="absolute top-0 bottom-0 w-px bg-white/30"
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
      <div className="flex justify-between text-[9px] font-semibold uppercase tracking-[1px] text-white/35">
        <span>Bajo</span>
        <span>Medio</span>
        <span>Alto</span>
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
      className="flex w-full items-center gap-1"
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
              "flex h-9 min-h-9 flex-1 items-center justify-center border text-[12px] font-mono font-semibold tabular-nums transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
              active
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20 hover:bg-white/[0.06] hover:text-white/80",
              "active:scale-[0.97]",
            )}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

function ThreatsSummaryBanner({ threats }: { threats: Threat[] }) {
  const total = threats.length
  let alto = 0
  let medio = 0
  let bajo = 0
  for (const t of threats) {
    const level = riskLevel(riskScore(t.probability, t.impact))
    if (level === "alto") alto += 1
    else if (level === "medio") medio += 1
    else bajo += 1
  }
  const internalCount = threats.filter((t) => t.category === "internal").length
  const externalCount = threats.filter((t) => t.category === "external").length

  return (
    <FamilyPlanStatusBanner>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center border",
            alto > 0
              ? "border-rose-500/40 bg-rose-500/15 text-rose-200"
              : "border-white/20 bg-white/10 text-white",
          )}
          aria-hidden
        >
          <AlertTriangle className="size-4" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/85">
            Identificación de amenazas
          </p>
          <p className="mt-0.5 text-[11.5px] text-white/55">
            {total === 0
              ? "Prioriza riesgos internos y externos del hogar"
              : `${total} amenaza${total === 1 ? "" : "s"} · ${internalCount} internas · ${externalCount} externas`}
          </p>
        </div>
      </div>
      {total > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {alto > 0 ? (
            <FamilyPlanStatusChip tone="danger">
              {alto} alto{alto === 1 ? "" : "s"}
            </FamilyPlanStatusChip>
          ) : null}
          {medio > 0 ? (
            <FamilyPlanStatusChip tone="pending">
              {medio} medio{medio === 1 ? "" : "s"}
            </FamilyPlanStatusChip>
          ) : null}
          {bajo > 0 ? (
            <FamilyPlanStatusChip tone="complete">
              {bajo} bajo{bajo === 1 ? "" : "s"}
            </FamilyPlanStatusChip>
          ) : null}
        </div>
      ) : null}
    </FamilyPlanStatusBanner>
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
  const incomplete = !threat.risk.trim() || !threat.corrective_action.trim()

  return (
    <FamilyPlanItemCard
      accentClassName={visual.border}
      className={incomplete ? "border-dashed" : undefined}
    >
      <header className="flex items-start gap-2 sm:items-center">
        <Input
          value={threat.risk}
          onChange={(e) => onUpdate({ risk: e.target.value })}
          placeholder="Nombre de la amenaza"
          aria-label="Nombre de la amenaza"
          className="min-w-0 flex-1"
        />
        <div className="flex shrink-0 items-center gap-1.5">
          <FamilyPlanStatusChip tone={visual.chip}>
            {visual.label}
          </FamilyPlanStatusChip>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Eliminar amenaza"
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center border border-white/10 bg-transparent text-white/55 transition-colors",
              "hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
            )}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </header>

      <FamilyPlanFormGrid>
        <FamilyPlanField label="Probabilidad (1–5)">
          <ScaleStepper
            value={threat.probability}
            onChange={(n) => onUpdate({ probability: n })}
            ariaLabel="Probabilidad"
          />
        </FamilyPlanField>
        <FamilyPlanField label="Impacto (1–5)">
          <ScaleStepper
            value={threat.impact}
            onChange={(n) => onUpdate({ impact: n })}
            ariaLabel="Impacto"
          />
        </FamilyPlanField>
        <div className={cn("flex flex-col gap-2", FAMILY_PLAN_FORM_FULL_CLASS)}>
          <RiskBar score={score} level={level} />
        </div>
        <FamilyPlanField
          label="Acción correctiva"
          className={FAMILY_PLAN_FORM_FULL_CLASS}
          helper="Qué harás para reducir probabilidad o impacto."
        >
          <Textarea
            value={threat.corrective_action}
            onChange={(e) => onUpdate({ corrective_action: e.target.value })}
            placeholder="Ej. Fijar estantería a muro; revisar regulador de gas…"
            rows={2}
          />
        </FamilyPlanField>
      </FamilyPlanFormGrid>
    </FamilyPlanItemCard>
  )
}

function SuggestionChips({
  suggestions,
  onPick,
}: {
  suggestions: readonly string[]
  onPick: (risk: string) => void
}) {
  if (suggestions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onPick(suggestion)}
          className={cn(
            "inline-flex min-h-8 items-center gap-1.5 border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-white/75 transition-all duration-150",
            "hover:-translate-y-px hover:border-white/30 hover:bg-white/[0.10] hover:text-white",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
            "active:translate-y-0",
          )}
        >
          <Plus className="size-3 shrink-0" aria-hidden />
          {suggestion}
        </button>
      ))}
    </div>
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
    <FamilyPlanAddPanel>
      <header className="flex items-center gap-2.5">
        <span
          className="flex size-7 shrink-0 items-center justify-center border border-white/20 bg-white/10 text-white"
          aria-hidden
        >
          <Plus className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/85">
            Agregar amenaza
          </p>
          <p className="mt-0.5 text-[11px] text-white/45">
            Escribe un nombre o elige una sugerencia.
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
          placeholder="Nombre personalizado (ej. Mascarilla suelta en patio)"
          aria-label="Nombre de la nueva amenaza"
          className="flex-1"
        />
        <Button
          type="button"
          onClick={submitCustom}
          disabled={!customValue.trim()}
          className="w-full sm:w-fit"
        >
          <Plus data-icon="inline-start" />
          Agregar
        </Button>
      </div>
      {suggestions.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/45">
            Sugerencias
          </span>
          <SuggestionChips suggestions={suggestions} onPick={onAddSuggested} />
        </div>
      ) : null}
    </FamilyPlanAddPanel>
  )
}

function ThreatGroup({
  category,
  threats,
  onAdd,
  onUpdate,
  onRemove,
}: {
  category: ThreatCategory
  threats: Threat[]
  onAdd: (risk: string) => void
  onUpdate: (id: string, patch: Partial<Threat>) => void
  onRemove: (id: string) => void
}) {
  const meta = CATEGORY_META[category]
  const Icon = meta.icon
  const usedKeys = new Set(threats.map((t) => t.risk.trim().toLowerCase()))
  const available = meta.suggestions.filter(
    (s) => !usedKeys.has(s.toLowerCase()),
  )
  const highCount = threats.filter(
    (t) => riskLevel(riskScore(t.probability, t.impact)) === "alto",
  ).length

  return (
    <FamilyPlanCategoryShell
      accentClassName={meta.accent}
      header={
        <>
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center border",
                meta.chip,
              )}
              aria-hidden
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[11px] font-semibold uppercase tracking-[1.4px] text-white/85">
                {meta.title}
              </h3>
              <p className="mt-0.5 truncate text-[11.5px] text-white/45">
                {meta.description}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {highCount > 0 ? (
              <FamilyPlanStatusChip tone="danger">{highCount} alto</FamilyPlanStatusChip>
            ) : null}
            <FamilyPlanStatusChip
              tone={threats.length === 0 ? "empty" : "started"}
            >
              {threats.length === 0 ? "Vacío" : `${threats.length}`}
            </FamilyPlanStatusChip>
          </div>
        </>
      }
    >
      {threats.length === 0 ? (
        <FamilyPlanEmptyState className="gap-3 px-3 py-6">
          <p className="text-[12px] text-white/55">
            Aún no registras amenazas en esta categoría.
          </p>
          {available.length > 0 ? (
            <div className="flex w-full flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/40">
                Empieza con una sugerencia
              </p>
              <SuggestionChips suggestions={available} onPick={onAdd} />
            </div>
          ) : (
            <p className="text-[11px] text-white/35">
              Agrega una amenaza personalizada abajo.
            </p>
          )}
        </FamilyPlanEmptyState>
      ) : (
        <div className="flex flex-col gap-2">
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
        suggestions={threats.length === 0 ? [] : available}
        onAddSuggested={onAdd}
        onAddCustom={onAdd}
      />
    </FamilyPlanCategoryShell>
  )
}

export function StepThreats() {
  const { data, updateData } = useFamilyPlan()
  if (!data) return null

  function makeThreat(risk: string, category: ThreatCategory): Threat {
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

  function addThreat(category: ThreatCategory, risk: string) {
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
    <FamilyPlanStepRoot>
      <ThreatsSummaryBanner threats={data.threats} />
      <ThreatGroup
        category="internal"
        threats={internal}
        onAdd={(risk) => addThreat("internal", risk)}
        onUpdate={updateThreat}
        onRemove={removeThreat}
      />
      <ThreatGroup
        category="external"
        threats={external}
        onAdd={(risk) => addThreat("external", risk)}
        onUpdate={updateThreat}
        onRemove={removeThreat}
      />
    </FamilyPlanStepRoot>
  )
}
