"use client"

import { Plus, Trash2 } from "lucide-react"

import {
  FamilyPlanField,
  FamilyPlanSection,
  newId,
} from "@/components/preparation/family-plan/family-plan-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import type { Drill } from "@/lib/types"

const EVALUATION_QUESTIONS = [
  { key: "knew_route" as const, label: "¿Todos conocían la ruta?" },
  { key: "found_kit" as const, label: "¿Se encontró rápidamente el kit?" },
  { key: "evacuated" as const, label: "¿Se logró evacuar?" },
  { key: "protected_pets" as const, label: "¿Se protegieron las mascotas?" },
  { key: "roles_worked" as const, label: "¿Funcionaron los roles asignados?" },
]

export function StepDrills() {
  const { data, updateData } = useFamilyPlan()
  if (!data) return null

  function updateDrill(id: string, patch: Partial<Drill>) {
    updateData((prev) => ({
      ...prev,
      drills: prev.drills.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }))
  }

  function updateEvaluation(
    id: string,
    key: keyof Drill["evaluation"],
    value: boolean | string | null,
  ) {
    updateData((prev) => ({
      ...prev,
      drills: prev.drills.map((d) =>
        d.id === id
          ? { ...d, evaluation: { ...d.evaluation, [key]: value } }
          : d,
      ),
    }))
  }

  function addDrill() {
    const drill: Drill = {
      id: newId(),
      date: "",
      emergency_type: "",
      outcome: "",
      improvements: [],
      evaluation: {
        knew_route: null,
        found_kit: null,
        evacuated: null,
        protected_pets: null,
        roles_worked: null,
        improvements: "",
      },
    }
    updateData((prev) => ({ ...prev, drills: [...prev.drills, drill] }))
  }

  function removeDrill(id: string) {
    updateData((prev) => ({
      ...prev,
      drills: prev.drills.filter((d) => d.id !== id),
    }))
  }

  return (
    <FamilyPlanSection
      title="Registro de simulacros"
      description="Practica y documenta mejoras continuas del plan."
    >
      <div className="flex flex-col gap-4">
        {data.drills.map((drill, index) => (
          <article
            key={drill.id}
            className="border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-[12px] font-medium text-white/85">
                Simulacro {index + 1}
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeDrill(drill.id)}
                aria-label={`Eliminar simulacro ${index + 1}`}
              >
                <Trash2 data-icon="inline-only" />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FamilyPlanField label="Fecha">
                <Input
                  type="date"
                  value={drill.date}
                  onChange={(e) => updateDrill(drill.id, { date: e.target.value })}
                />
              </FamilyPlanField>
              <FamilyPlanField label="Tipo de emergencia">
                <Input
                  value={drill.emergency_type}
                  onChange={(e) =>
                    updateDrill(drill.id, { emergency_type: e.target.value })
                  }
                />
              </FamilyPlanField>
              <FamilyPlanField label="Resultado" className="sm:col-span-2">
                <Textarea
                  value={drill.outcome}
                  onChange={(e) => updateDrill(drill.id, { outcome: e.target.value })}
                />
              </FamilyPlanField>
            </div>

            <fieldset className="mt-4">
              <legend className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/55">
                Evaluación
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {EVALUATION_QUESTIONS.map((q) => (
                  <label
                    key={q.key}
                    className="flex items-center gap-2 text-[12px] text-white/75"
                  >
                    <Checkbox
                      checked={drill.evaluation[q.key] === true}
                      onCheckedChange={(checked) =>
                        updateEvaluation(drill.id, q.key, checked === true)
                      }
                    />
                    {q.label}
                  </label>
                ))}
              </div>
              <FamilyPlanField label="¿Qué se debe mejorar?" className="mt-3">
                <Textarea
                  value={drill.evaluation.improvements}
                  onChange={(e) =>
                    updateEvaluation(drill.id, "improvements", e.target.value)
                  }
                />
              </FamilyPlanField>
            </fieldset>
          </article>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={addDrill}>
        <Plus data-icon="inline-start" />
        Agregar simulacro
      </Button>
    </FamilyPlanSection>
  )
}