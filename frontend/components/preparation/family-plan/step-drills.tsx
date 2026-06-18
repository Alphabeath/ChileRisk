"use client"

import { useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  CalendarCheck2,
  CalendarX2,
  Check,
  ClipboardList,
  Plus,
  Siren,
  Trash2,
  X,
} from "lucide-react"

import { newId } from "@/components/preparation/family-plan/family-plan-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import type { Drill, DrillEvaluation } from "@/lib/types"
import { cn } from "@/lib/utils"

type TriStateValue = boolean | null
type TriStateOption = "yes" | "no" | "partial"

const EMPTY_DRILLS: Drill[] = []

const EVALUATION_QUESTIONS: Array<{
  key: keyof Omit<DrillEvaluation, "improvements">
  label: string
}> = [
  { key: "knew_route", label: "¿Todos conocían la ruta?" },
  { key: "found_kit", label: "¿Se encontró rápidamente el kit?" },
  { key: "evacuated", label: "¿Se logró evacuar?" },
  { key: "protected_pets", label: "¿Se protegieron las mascotas?" },
  { key: "roles_worked", label: "¿Funcionaron los roles asignados?" },
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

function valueToTriState(value: TriStateValue): TriStateOption | null {
  if (value === true) return "yes"
  if (value === false) return "no"
  if (value === null) return "partial"
  return null
}

function triStateToValue(option: TriStateOption | null): TriStateValue {
  if (option === "yes") return true
  if (option === "no") return false
  return null
}

const TRI_STATE_VISUAL: Record<
  TriStateOption,
  { label: string; icon: typeof Check; active: string; idle: string }
> = {
  yes: {
    label: "Sí",
    icon: Check,
    active: "border-emerald-500/50 bg-emerald-500/15 text-emerald-200",
    idle: "border-white/10 bg-white/[0.03] text-white/45 hover:border-emerald-500/30 hover:bg-emerald-500/[0.06] hover:text-emerald-200",
  },
  no: {
    label: "No",
    icon: X,
    active: "border-rose-500/50 bg-rose-500/15 text-rose-200",
    idle: "border-white/10 bg-white/[0.03] text-white/45 hover:border-rose-500/30 hover:bg-rose-500/[0.06] hover:text-rose-200",
  },
  partial: {
    label: "Parcial",
    icon: null as never,
    active: "border-amber-500/50 bg-amber-500/15 text-amber-200",
    idle: "border-white/10 bg-white/[0.03] text-white/45 hover:border-amber-500/30 hover:bg-amber-500/[0.06] hover:text-amber-200",
  },
}

function TriStateRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: TriStateValue
  onChange: (next: TriStateValue) => void
}) {
  const current = valueToTriState(value)
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] text-white/75">{label}</span>
      <div className="flex items-center gap-1.5" role="radiogroup" aria-label={label}>
        {(["yes", "no", "partial"] as const).map((option) => {
          const visual = TRI_STATE_VISUAL[option]
          const isActive = current === option
          const Icon = visual.icon
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(triStateToValue(isActive ? null : option))}
              className={cn(
                "inline-flex h-7 min-w-[58px] items-center justify-center gap-1 border px-2.5 text-[10.5px] font-semibold uppercase tracking-[1.2px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
                isActive ? visual.active : visual.idle,
              )}
            >
              {Icon ? <Icon className="size-3" aria-hidden /> : null}
              {visual.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DrillCompletionBadge({
  evaluation,
}: {
  evaluation: DrillEvaluation
}) {
  const total = EVALUATION_QUESTIONS.length
  const answered = EVALUATION_QUESTIONS.reduce(
    (acc, q) => (evaluation[q.key] === true ? acc + 1 : acc),
    0,
  )
  const state: "empty" | "partial" | "complete" =
    answered === 0 ? "empty" : answered === total ? "complete" : "partial"
  const label =
    state === "empty"
      ? "Sin evaluar"
      : state === "complete"
        ? "Evaluado"
        : "En evaluación"
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center border px-2 text-[9px] font-semibold uppercase tracking-[1.2px]",
        state === "empty"
          ? "border-white/10 bg-white/[0.03] text-white/45"
          : state === "complete"
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            : "border-amber-500/40 bg-amber-500/10 text-amber-200",
      )}
    >
      {label} · {answered}/{total}
    </span>
  )
}

function formatDateLabel(date: string): string {
  if (!date) return "Sin fecha"
  try {
    const parsed = new Date(`${date}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return date
  }
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

  const drills = data?.drills ?? EMPTY_DRILLS
  const completedCount = useMemo(
    () =>
      drills.filter(
        (d) => d.date.trim().length > 0 || d.emergency_type.trim().length > 0,
      ).length,
    [drills],
  )
  const evaluatedCount = useMemo(
    () =>
      drills.filter((d) =>
        EVALUATION_QUESTIONS.every((q) => d.evaluation[q.key] === true),
      ).length,
    [drills],
  )

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
    key: keyof DrillEvaluation,
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
    <div className="flex flex-col gap-4">
      <section
        className="glass-mica interactive-mica flex flex-col gap-3 border border-white/15 bg-white/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        aria-label="Resumen de simulacros"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex size-8 shrink-0 items-center justify-center border border-rose-500/30 bg-rose-500/10 text-rose-200"
            aria-hidden
          >
            <Siren className="size-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/55">
              Simulacros registrados
            </p>
            <p className="mt-0.5 text-[14px] font-semibold text-white/90">
              {drills.length === 0
                ? "Sin simulacros"
                : `${drills.length} ${
                    drills.length === 1 ? "simulacro" : "simulacros"
                  } · ${completedCount} ${
                    completedCount === 1 ? "completado" : "completados"
                  }`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <span
            className={cn(
              "inline-flex h-7 shrink-0 items-center border px-2 text-[9px] font-semibold uppercase tracking-[1.2px]",
              evaluatedCount === drills.length && drills.length > 0
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : evaluatedCount > 0
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                  : "border-white/10 bg-white/[0.03] text-white/45",
            )}
          >
            {evaluatedCount}/{drills.length} evaluados
          </span>
          <Link
            href="/simulacros"
            className="inline-flex h-7 items-center gap-1.5 border border-rose-500/30 bg-rose-500/10 px-2.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-rose-100/95 transition-colors hover:border-rose-500/50 hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
          >
            <CalendarCheck2 className="size-3" aria-hidden />
            Calendario SERNAPRED →
          </Link>
        </div>
      </section>

      {fromSimulacros ? (
        <aside
          className="flex flex-col gap-2 border border-rose-300/30 bg-rose-500/10 p-3 text-[12px] text-white/80 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p className="flex items-start gap-2">
            <CalendarCheck2 className="mt-0.5 size-3.5 shrink-0 text-rose-200" aria-hidden />
            <span>
              Datos pre-cargados desde el calendario SERNAPRED. Edita los
              campos y registra tu evaluación.
            </span>
          </p>
          <Link
            href="/simulacros"
            className="inline-flex shrink-0 items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-rose-100/85 underline underline-offset-2 hover:text-white"
          >
            Volver al calendario
          </Link>
        </aside>
      ) : null}

      {drills.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
          <span
            className="flex size-9 items-center justify-center border border-rose-500/30 bg-rose-500/10 text-rose-200"
            aria-hidden
          >
            <ClipboardList className="size-4" />
          </span>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[1.2px] text-white/80">
              Aún no registras simulacros
            </p>
            <p className="mt-1 text-[11.5px] text-white/55">
              Practica periódicamente y documenta lo aprendido para
              mejorar tu plan familiar.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {drills.map((drill, index) => {
            const dateLabel = formatDateLabel(drill.date)
            const hasDate = drill.date.trim().length > 0
            return (
              <section
                key={drill.id}
                className="glass-mica interactive-mica border-l-[3px] border border-white/15 bg-white/[0.04] border-l-rose-500/60 transition-colors hover:border-white/25"
                aria-label={`Simulacro ${index + 1}`}
              >
                <header className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex size-7 shrink-0 items-center justify-center border border-rose-500/30 bg-rose-500/10 text-rose-200"
                      aria-hidden
                    >
                      <Siren className="size-3.5" />
                    </span>
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-[1.4px] text-white/85">
                        Simulacro {index + 1}
                      </h3>
                      <p
                        className={cn(
                          "mt-0.5 text-[11.5px]",
                          hasDate ? "text-white/65" : "text-white/40",
                        )}
                      >
                        {dateLabel}
                        {drill.emergency_type.trim().length > 0
                          ? ` · ${drill.emergency_type}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <DrillCompletionBadge evaluation={drill.evaluation} />
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
                </header>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`drill-date-${drill.id}`}
                      className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/65"
                    >
                      Fecha
                    </label>
                    <Input
                      id={`drill-date-${drill.id}`}
                      type="date"
                      value={drill.date}
                      onChange={(e) =>
                        updateDrill(drill.id, { date: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`drill-type-${drill.id}`}
                      className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/65"
                    >
                      Tipo de emergencia
                    </label>
                    <Input
                      id={`drill-type-${drill.id}`}
                      value={drill.emergency_type}
                      onChange={(e) =>
                        updateDrill(drill.id, {
                          emergency_type: e.target.value,
                        })
                      }
                      placeholder="Ej. Sismo, incendio, tsunami…"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label
                      htmlFor={`drill-outcome-${drill.id}`}
                      className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/65"
                    >
                      Resultado
                    </label>
                    <Textarea
                      id={`drill-outcome-${drill.id}`}
                      value={drill.outcome}
                      onChange={(e) =>
                        updateDrill(drill.id, { outcome: e.target.value })
                      }
                      placeholder="Describe cómo se desarrolló el simulacro y qué ocurrió."
                    />
                  </div>
                </div>

                <fieldset className="border-t border-white/10 px-4 py-3">
                  <legend className="px-1 text-[10px] font-semibold uppercase tracking-[1.4px] text-white/65">
                    Evaluación
                  </legend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {EVALUATION_QUESTIONS.map((q) => (
                      <TriStateRow
                        key={q.key}
                        label={q.label}
                        value={drill.evaluation[q.key] as TriStateValue}
                        onChange={(next) =>
                          updateEvaluation(drill.id, q.key, next)
                        }
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5">
                    <label
                      htmlFor={`drill-improvements-${drill.id}`}
                      className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/65"
                    >
                      ¿Qué se debe mejorar?
                    </label>
                    <Textarea
                      id={`drill-improvements-${drill.id}`}
                      value={drill.evaluation.improvements}
                      onChange={(e) =>
                        updateEvaluation(
                          drill.id,
                          "improvements",
                          e.target.value,
                        )
                      }
                      placeholder="Anota las oportunidades de mejora detectadas."
                    />
                  </div>
                </fieldset>
              </section>
            )
          })}
        </div>
      )}

      <div className="flex flex-col items-stretch gap-2 border border-dashed border-white/15 bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 text-[12px] text-white/65">
          <span
            className="flex size-7 shrink-0 items-center justify-center border border-white/15 bg-white/[0.04] text-white/75"
            aria-hidden
          >
            <Plus className="size-3.5" />
          </span>
          <span>
            Registra cada simulacro familiar con su fecha, tipo de
            emergencia y evaluación tri-estado.
          </span>
        </div>
        <Button
          type="button"
          onClick={addDrill}
          className="shrink-0 sm:self-end"
        >
          <Plus data-icon="inline-start" />
          Agregar simulacro
        </Button>
      </div>

      {drills.length > 0 && drills.every((d) => !d.date && !d.emergency_type) ? (
        <p className="flex items-center gap-1.5 text-[11px] text-white/45">
          <CalendarX2 className="size-3" aria-hidden />
          Completa fecha o tipo para considerar este paso listo.
        </p>
      ) : null}
    </div>
  )
}
