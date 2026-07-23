"use client"

import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Check,
  Droplets,
  ExternalLink,
  Flame,
  Info,
  Map,
  Waves,
  Wind,
} from "lucide-react"

import {
  FamilyPlanCategoryShell,
  FamilyPlanFormGrid,
  FamilyPlanItemCard,
  FamilyPlanStatusBanner,
  FamilyPlanStatusChip,
  FamilyPlanStepRoot,
} from "@/components/preparation/family-plan/family-plan-layout"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SAFE_ZONE_GLOSSARY } from "@/lib/family-plan-defaults"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import type { LucideIcon } from "lucide-react"
import type { SafeZone } from "@/lib/types"
import { cn } from "@/lib/utils"

const EMERGENCY_META: Record<
  string,
  { icon: LucideIcon; accent: string; chip: string }
> = {
  Sismo: {
    icon: Activity,
    accent: "border-l-red-500/60",
    chip: "border-red-500/30 bg-red-500/10 text-red-200",
  },
  Incendio: {
    icon: Flame,
    accent: "border-l-orange-500/60",
    chip: "border-orange-500/30 bg-orange-500/10 text-orange-200",
  },
  Tsunami: {
    icon: Waves,
    accent: "border-l-cyan-500/60",
    chip: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  },
  Inundación: {
    icon: Droplets,
    accent: "border-l-blue-500/60",
    chip: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  },
  "Fuga de gas": {
    icon: Wind,
    accent: "border-l-amber-500/60",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
}

const DEFAULT_EMERGENCY_META: {
  icon: LucideIcon
  accent: string
  chip: string
} = {
  icon: AlertTriangle,
  accent: "border-l-white/30",
  chip: "border-white/20 bg-white/10 text-white/85",
}

function getEmergencyMeta(emergency: string) {
  return EMERGENCY_META[emergency] ?? DEFAULT_EMERGENCY_META
}

const SAFE_ZONE_FIELDS = [
  "safe_place",
  "evacuation_route",
  "safe_zone",
  "meeting_point",
] as const satisfies readonly (keyof typeof SAFE_ZONE_GLOSSARY)[]

function SafeZoneFieldInput({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: keyof typeof SAFE_ZONE_GLOSSARY
  value: string
  onChange: (value: string) => void
}) {
  const entry = SAFE_ZONE_GLOSSARY[fieldKey]
  return (
    <div className="flex flex-col gap-2">
      <span className="inline-flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/65">
          {entry.label}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Ver definición de ${entry.label}`}
              className="inline-flex size-4 items-center justify-center text-white/45 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
            >
              <Info className="size-3" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs leading-snug">
            {entry.definition}
          </TooltipContent>
        </Tooltip>
      </span>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={entry.definition}
        rows={2}
        className="w-full"
      />
    </div>
  )
}

function filledFieldsCount(zone: SafeZone): number {
  return SAFE_ZONE_FIELDS.filter((key) => zone[key].trim().length > 0).length
}

function isZoneComplete(zone: SafeZone): boolean {
  return filledFieldsCount(zone) > 0
}

function SafeZoneCard({
  zone,
  onUpdate,
}: {
  zone: SafeZone
  onUpdate: (patch: Partial<SafeZone>) => void
}) {
  const meta = getEmergencyMeta(zone.emergency)
  const Icon = meta.icon
  const filled = filledFieldsCount(zone)
  const complete = filled > 0
  const chipTone =
    filled === SAFE_ZONE_FIELDS.length
      ? "complete"
      : filled > 0
        ? "started"
        : "empty"

  return (
    <FamilyPlanItemCard
      accentClassName={meta.accent}
      className={!complete ? "border-dashed" : undefined}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center border",
              meta.chip,
            )}
            aria-hidden
          >
            <Icon className="size-4" />
          </span>
          <h3 className="truncate text-[12px] font-semibold uppercase tracking-[1.4px] text-white/85">
            {zone.emergency}
          </h3>
        </div>
        <FamilyPlanStatusChip tone={chipTone} className="self-start sm:self-auto">
          {filled}/{SAFE_ZONE_FIELDS.length}
        </FamilyPlanStatusChip>
      </header>

      <FamilyPlanFormGrid>
        {SAFE_ZONE_FIELDS.map((fieldKey) => (
          <SafeZoneFieldInput
            key={fieldKey}
            fieldKey={fieldKey}
            value={zone[fieldKey]}
            onChange={(value) => onUpdate({ [fieldKey]: value })}
          />
        ))}
      </FamilyPlanFormGrid>

      {!complete ? (
        <p className="border-t border-white/10 pt-3 text-[11px] leading-snug text-white/45">
          No has completado este escenario.{" "}
          <Link
            href="/evacuation"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-white/75 underline underline-offset-2 transition-colors hover:text-white"
          >
            Consulta el mapa de evacuación
            <ExternalLink className="size-3" aria-hidden />
          </Link>{" "}
          si no conoces la zona.
        </p>
      ) : null}
    </FamilyPlanItemCard>
  )
}

function SafeZonesSummaryBanner({ zones }: { zones: SafeZone[] }) {
  const total = zones.length
  const started = zones.filter(isZoneComplete).length
  const pending = total - started
  const pct = total === 0 ? 0 : Math.round((started / total) * 100)
  const allDone = total > 0 && started === total

  return (
    <FamilyPlanStatusBanner>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center border font-mono text-[13px] font-semibold tabular-nums",
            allDone
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
              : "border-white/20 bg-white/10 text-white",
          )}
          aria-hidden
        >
          {allDone ? <Check className="size-4" /> : `${pct}%`}
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/85">
            Protocolos de emergencia
          </p>
          <p className="mt-0.5 text-[11.5px] text-white/55">
            {total === 0
              ? "Define lugar seguro, ruta y punto de encuentro por escenario"
              : `${started} de ${total} escenarios iniciados`}
            {pending > 0 ? ` · ${pending} pendiente${pending === 1 ? "" : "s"}` : ""}
          </p>
        </div>
      </div>
      {total > 0 ? (
        <div className="relative h-1.5 w-full border border-white/10 bg-white/5 sm:max-w-xs">
          <span
            className={cn(
              "block h-full transition-all duration-300",
              allDone ? "bg-emerald-400/80" : "bg-blue-400/70",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </FamilyPlanStatusBanner>
  )
}

function EvacuationMapCta() {
  return (
    <Link
      href="/evacuation"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex w-full shrink-0 items-center justify-center gap-2 border border-cyan-500/35 bg-cyan-500/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-cyan-100 transition-colors sm:w-fit",
        "hover:border-cyan-500/55 hover:bg-cyan-500/20",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
      )}
    >
      <Map className="size-3.5" aria-hidden />
      Usar mapa de evacuación
      <ArrowUpRight className="size-3.5" aria-hidden />
    </Link>
  )
}

export function StepSafeZones() {
  const { data, updateData } = useFamilyPlan()
  if (!data) return null

  function updateZone(emergency: string, patch: Partial<SafeZone>) {
    updateData((prev) => ({
      ...prev,
      safe_zones: prev.safe_zones.map((z) =>
        z.emergency === emergency ? { ...z, ...patch } : z,
      ),
    }))
  }

  return (
    <FamilyPlanStepRoot>
      <SafeZonesSummaryBanner zones={data.safe_zones} />

      <FamilyPlanCategoryShell
        accentClassName="border-l-cyan-500/50"
        header={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="flex size-7 shrink-0 items-center justify-center border border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
                aria-hidden
              >
                <Map className="size-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[11px] font-semibold uppercase tracking-[1.4px] text-white/85">
                  Protocolos por emergencia
                </h3>
                <p className="mt-0.5 text-[11.5px] leading-snug text-white/45">
                  Completa cada escenario. Si no conoces zonas o puntos de
                  encuentro, abre el mapa oficial de la plataforma.
                </p>
              </div>
            </div>
            <EvacuationMapCta />
          </div>
        }
      >
        <div className="flex flex-col gap-2">
          {data.safe_zones.map((zone) => (
            <SafeZoneCard
              key={zone.emergency}
              zone={zone}
              onUpdate={(patch) => updateZone(zone.emergency, patch)}
            />
          ))}
        </div>
      </FamilyPlanCategoryShell>
    </FamilyPlanStepRoot>
  )
}
