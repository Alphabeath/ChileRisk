"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Calendar, Plus, Trash2 } from "lucide-react"

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

function buildPrefillFromQuery(
  search: URLSearchParams
): Pick<Drill, "date" | "emergency_type" | "outcome"> | null {
  const source = search.get("source")
  if (source !== "senapred") return null
  const date = search.get("date") ?? ""
  const emergencyRaw = search.get("emergency_type") ?? ""
  const outcome = search.get("outcome") ?? ""
  if (!date && !emergencyRaw && !outcome) return null
  return { date, emergency_type: emergencyRaw, outcome }
}

export function StepDrills() {
  const { data, updateData } = useFamilyPlan()
  const searchParams = useSearchParams()
  const prefilledRef = useRef(false)

  useEffect(() => {
    if (!data || prefilledRef.current) return
    const prefill = buildPrefillFromQuery(searchParams)
    if (!prefill) {
      prefilledRef.current = true
      return
    }
    const lastDrill = data.drills[data.drills.length - 1]
    const lastEmpty =
      lastDrill &&
      !lastDrill.date &&
      !lastDrill.emergency_type &&
      !lastDrill.outcome
    if (lastEmpty) {
      updateData((prev) => ({
        ...prev,
        drills: prev.drills.map((d, i) =>
          i === prev.drills.length - 1 ? { ...d, ...prefill } : d,
        ),
      }))
    } else {
      const drill: Drill = {
        id: newId(),
        date: prefill.date,
        emergency_type: prefill.emergency_type,
        outcome: prefill.outcome,
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
    prefilledRef.current = true
  }, [data, searchParams, updateData])

  if (!data) return null

  const fromSimulacros = searchParams.get("source") === "senapred"

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
      {!fromSimulacros ? (
        <a
          href="/preparation/simulacros"
          className="inline-flex w-fit items-center gap-1.5 border border-rose-300/30 bg-rose-500/10 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-rose-100/95 transition-colors hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
        >
          Ver calendario oficial de SERNAPRED →
        </a>
      ) : null}
      {fromSimulacros ? (
        <aside
          className="flex flex-col gap-2 border border-rose-300/30 bg-rose-500/10 p-3 text-[12px] text-white/80 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p className="flex items-start gap-2">
            <Calendar className="mt-0.5 size-3.5 shrink-0 text-rose-200" aria-hidden />
            <span>
              Datos pre-cargados desde el calendario SERNAPRED. Edita los
              campos y registra tu evaluación.
            </span>
          </p>
          <a
            href="/preparation/simulacros"
            className="inline-flex shrink-0 items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-rose-100/85 underline underline-offset-2 hover:text-white"
          >
            Volver al calendario
          </a>
        </aside>
      ) : null}
      <div className="flex flex-col gap-4">
        {data.drills.map((drill, index) => (
          <article
            key={drill.id}
            className="glass-mica interactive-mica border border-white/15 bg-white/[0.04] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
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