"use client"

import { useMemo } from "react"
import { Filter, X } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"
import type { SimulacrosParams } from "@/lib/types"
import { REGION_LABELS, SIMULACRO_TYPE_LABELS } from "@/lib/simulacros-labels"
import { getDrillTypeVisual } from "@/lib/simulacros-visual"

export type SimulacrosView = "upcoming" | "past"
export type SimulacrosRange =
  | "all"
  | "month"
  | "30d"
  | "quarter"
  | "year"
  | "6m"
  | "1y"

const ALL_RANGES = "__all__"

const CHIP =
  "inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5 border px-3 text-[10px] font-semibold uppercase tracking-[1px] whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30 active:scale-[0.985]"

const UPCOMING_RANGES: { key: Exclude<SimulacrosRange, "6m" | "1y">; label: string }[] = [
  { key: "all", label: "Todo" },
  { key: "month", label: "Este mes" },
  { key: "30d", label: "30 días" },
  { key: "quarter", label: "Trimestre" },
  { key: "year", label: "1 año" },
]

const PAST_RANGES: { key: Exclude<SimulacrosRange, "month" | "quarter" | "year">; label: string }[] = [
  { key: "all", label: "Todo" },
  { key: "30d", label: "30 días" },
  { key: "6m", label: "6 meses" },
  { key: "1y", label: "1 año" },
]

interface SimulacrosFilterBarProps {
  value: SimulacrosParams
  view: SimulacrosView
  range: SimulacrosRange
  onChange: (next: SimulacrosParams) => void
  onRangeChange: (next: SimulacrosRange) => void
  onViewChange: (next: SimulacrosView) => void
  embedded?: boolean
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function rangeToBounds(
  range: SimulacrosRange,
  view: SimulacrosView,
  now: Date,
): { from?: string; to?: string } {
  if (range === "all") return {}
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (view === "upcoming") {
    const from = toIsoDate(today)
    let to: Date
    if (range === "month") {
      to = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    } else if (range === "30d") {
      to = new Date(today.getTime() + 30 * 86_400_000)
    } else if (range === "quarter") {
      to = new Date(today.getTime() + 90 * 86_400_000)
    } else {
      to = new Date(today.getTime() + 365 * 86_400_000)
    }
    return { from, to: toIsoDate(to) }
  }
  let from: Date
  if (range === "30d") {
    from = new Date(today.getTime() - 30 * 86_400_000)
  } else if (range === "6m") {
    from = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate())
  } else {
    from = new Date(today.getTime() - 365 * 86_400_000)
  }
  return { from: toIsoDate(from), to: toIsoDate(today) }
}

export function SimulacrosFilterBar({
  value,
  view,
  range,
  onChange,
  onRangeChange,
  onViewChange,
  embedded = false,
}: SimulacrosFilterBarProps) {
  const activeRegion = value.region
  const activeType = value.type
  const hasRange = range !== "all"
  const hasFilters =
    activeRegion !== undefined ||
    activeType !== undefined ||
    hasRange ||
    value.from !== undefined ||
    value.to !== undefined

  const regionOptions = useMemo(() => {
    return Object.entries(REGION_LABELS)
      .map(([code, name]) => ({ code: Number(code), name }))
      .sort((a, b) => a.code - b.code)
  }, [])

  const activeChips: { key: string; label: string; onRemove: () => void; tint?: string }[] = []
  if (activeType) {
    const visual = getDrillTypeVisual(activeType)
    activeChips.push({
      key: "type",
      label: SIMULACRO_TYPE_LABELS[activeType],
      tint: visual.chipActive,
      onRemove: () => onChange({ ...value, type: undefined }),
    })
  }
  if (activeRegion) {
    activeChips.push({
      key: "region",
      label: REGION_LABELS[activeRegion] ?? `Región ${activeRegion}`,
      onRemove: () => onChange({ ...value, region: undefined }),
    })
  }
  if (hasRange) {
    const label =
      (view === "upcoming" ? UPCOMING_RANGES : PAST_RANGES).find((r) => r.key === range)
        ?.label ?? range
    activeChips.push({
      key: "range",
      label,
      onRemove: () => onRangeChange("all"),
    })
  }

  function setView(next: SimulacrosView) {
    onViewChange(next)
    onRangeChange("all")
    onChange({
      ...value,
      upcoming_only: next === "upcoming" ? true : undefined,
      past_only: next === "past" ? true : undefined,
      from: undefined,
      to: undefined,
    })
  }

  function clearAll() {
    onRangeChange("all")
    onChange({
      upcoming_only: view === "upcoming" ? true : undefined,
      past_only: view === "past" ? true : undefined,
      limit: value.limit,
      offset: value.offset,
    })
  }

  return (
    <section
      className={cn(
        embedded ? "flex flex-col gap-3" : cn(GLASS_PANEL_CLASS, GLASS_MICA_INTERACTIVE_CLASS, "flex flex-col gap-3 p-4"),
      )}
      aria-label="Filtros y vista de simulacros"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <div className="flex items-center gap-1" role="tablist" aria-label="Vista de simulacros">
          <FilterTab active={view === "upcoming"} onClick={() => setView("upcoming")}>
            Próximos
          </FilterTab>
          <FilterTab active={view === "past"} onClick={() => setView("past")}>
            Pasados
          </FilterTab>
        </div>

        <Select
          value={activeRegion ? String(activeRegion) : ALL_RANGES}
          onValueChange={(v) =>
            onChange({ ...value, region: v === ALL_RANGES ? undefined : Number(v) })
          }
        >
          <SelectTrigger
            id="simulacros-region-select"
            size="sm"
            aria-label="Filtrar por región"
            className="h-8 w-full justify-between border border-white/10 bg-white/[0.04] px-3 text-[10px] font-semibold uppercase tracking-[1px] text-white/85 data-placeholder:text-white/40 sm:max-w-[12rem] sm:flex-1"
          >
            <SelectValue placeholder="Todas las regiones" />
          </SelectTrigger>
          <SelectContent className="border border-white/10 bg-neutral-950 text-white">
            <SelectItem value={ALL_RANGES} className="text-white/70 focus:bg-white/[0.08] focus:text-white">
              Todas las regiones
            </SelectItem>
            {regionOptions.map(({ code, name }) => (
              <SelectItem
                key={code}
                value={String(code)}
                className="text-white/85 focus:bg-white/[0.08] focus:text-white"
              >
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center gap-1">
          {(view === "upcoming" ? UPCOMING_RANGES : PAST_RANGES).map(({ key, label }) => {
            const active = range === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onRangeChange(key)
                  const bounds = rangeToBounds(key, view, new Date())
                  onChange({ ...value, ...bounds })
                }}
                aria-pressed={active}
                className={cn(
                  CHIP,
                  active
                    ? "border-white/30 bg-white/[0.16] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                    : "border-white/10 text-white/55 hover:border-white/25 hover:bg-white/[0.08] hover:text-white/90",
                )}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="hidden sm:block sm:flex-1" />

        {hasFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className={cn(
              CHIP,
              "border-white/20 bg-white/[0.06] text-white/75 hover:border-white/30 hover:bg-white/[0.12] hover:text-white",
            )}
          >
            <X className="size-3" aria-hidden />
            Limpiar
          </button>
        ) : null}
      </div>

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-3">
          <span className="inline-flex h-7 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/55">
            <Filter className="size-3" aria-hidden />
            Activos
          </span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 border px-2.5 text-[9.5px] font-semibold uppercase tracking-[1.1px] transition-opacity hover:opacity-80 max-w-full",
                chip.tint ?? "border-white/20 bg-white/[0.10] text-white",
              )}
              aria-label={`Quitar filtro ${chip.label}`}
            >
              {chip.label}
              <X className="size-2.5" aria-hidden />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative inline-flex h-8 min-w-[5.5rem] items-center justify-center gap-2 border px-4 text-[10px] font-semibold uppercase tracking-[1.2px] transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
        "active:scale-[0.985]",
        active
          ? "border-white/25 bg-white/[0.12] text-white shadow-[inset_0_-2px_0_0_rgba(255,255,255,0.4)]"
          : "border-white/10 text-white/55 hover:border-white/20 hover:bg-white/[0.06] hover:text-white/90",
      )}
    >
      {children}
    </button>
  )
}
