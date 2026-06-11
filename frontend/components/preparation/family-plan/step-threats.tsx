"use client"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  FamilyPlanField,
  FamilyPlanSection,
  newId,
} from "@/components/preparation/family-plan/family-plan-field"
import { riskLevel, riskScore } from "@/lib/family-plan-defaults"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import type { Threat } from "@/lib/types"
import { cn } from "@/lib/utils"

function ThreatGroup({
  title,
  threats,
  onUpdate,
  onAddOther,
}: {
  title: string
  threats: Threat[]
  onUpdate: (id: string, patch: Partial<Threat>) => void
  onAddOther: () => void
}) {
  return (
    <FamilyPlanSection title={title}>
      <div className="flex flex-col gap-3">
        {threats.map((threat) => {
          const score = riskScore(threat.probability, threat.impact)
          const level = riskLevel(score)
          const levelClass =
            level === "alto"
              ? "border-red-500/40 bg-red-500/10 text-red-200"
              : level === "medio"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"

          return (
            <div
              key={threat.id}
              className={cn(
                "border border-white/10 bg-white/[0.03] p-3",
                !threat.selected && "opacity-70",
              )}
            >
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={threat.selected}
                  onCheckedChange={(checked) =>
                    onUpdate(threat.id, { selected: checked === true })
                  }
                  className="mt-0.5"
                />
                <span className="flex-1 text-[13px] text-white/85">{threat.risk}</span>
                {threat.selected ? (
                  <Badge variant="outline" className={levelClass}>
                    {level} ({score})
                  </Badge>
                ) : null}
              </label>

              {threat.selected ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <FamilyPlanField label="Probabilidad (1-5)">
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={threat.probability}
                      onChange={(e) =>
                        onUpdate(threat.id, {
                          probability: Math.min(5, Math.max(1, Number(e.target.value) || 1)),
                        })
                      }
                    />
                  </FamilyPlanField>
                  <FamilyPlanField label="Impacto (1-5)">
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={threat.impact}
                      onChange={(e) =>
                        onUpdate(threat.id, {
                          impact: Math.min(5, Math.max(1, Number(e.target.value) || 1)),
                        })
                      }
                    />
                  </FamilyPlanField>
                  <FamilyPlanField label="Acción correctiva" className="sm:col-span-2">
                    <Textarea
                      value={threat.corrective_action}
                      onChange={(e) =>
                        onUpdate(threat.id, { corrective_action: e.target.value })
                      }
                    />
                  </FamilyPlanField>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      <button
        type="button"
        onClick={onAddOther}
        className="text-[12px] text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
      >
        + Agregar otro
      </button>
    </FamilyPlanSection>
  )
}

export function StepThreats() {
  const { data, updateData } = useFamilyPlan()
  if (!data) return null

  function updateThreat(id: string, patch: Partial<Threat>) {
    updateData((prev) => ({
      ...prev,
      threats: prev.threats.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }

  function addOther(category: "internal" | "external") {
    const threat: Threat = {
      id: newId(),
      risk: "Otro",
      category,
      probability: 1,
      impact: 1,
      corrective_action: "",
      selected: true,
    }
    updateData((prev) => ({ ...prev, threats: [...prev.threats, threat] }))
  }

  const internal = data.threats.filter((t) => t.category === "internal")
  const external = data.threats.filter((t) => t.category === "external")

  return (
    <div className="flex flex-col gap-8">
      <ThreatGroup
        title="Amenazas internas"
        threats={internal}
        onUpdate={updateThreat}
        onAddOther={() => addOther("internal")}
      />
      <ThreatGroup
        title="Amenazas externas"
        threats={external}
        onUpdate={updateThreat}
        onAddOther={() => addOther("external")}
      />
    </div>
  )
}