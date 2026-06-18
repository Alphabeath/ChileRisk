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
  Waves,
  Wind,
} from "lucide-react"

import {
  FamilyPlanSection,
} from "@/components/preparation/family-plan/family-plan-field"
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
    <div className="flex flex-col gap-1.5">
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

function isZoneComplete(zone: SafeZone): boolean {
  return (
    zone.safe_place.trim().length > 0 ||
    zone.evacuation_route.trim().length > 0 ||
    zone.safe_zone.trim().length > 0 ||
    zone.meeting_point.trim().length > 0
  )
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
  const complete = isZoneComplete(zone)

  return (
    <article
      className={cn(
        "glass-mica interactive-mica border-l-[3px] border border-white/15 bg-white/[0.04] p-4 transition-colors hover:border-white/25",
        meta.accent,
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center border",
              meta.chip,
            )}
            aria-hidden
          >
            <Icon className="size-4" />
          </span>
          <h3 className="text-[12px] font-semibold uppercase tracking-[1.4px] text-white/85">
            {zone.emergency}
          </h3>
        </div>
        <span
          className={cn(
            "inline-flex h-8 items-center gap-1.5 border px-2 text-[9px] font-semibold uppercase tracking-[1.2px]",
            complete
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-white/10 bg-white/[0.03] text-white/45",
          )}
        >
          {complete ? (
            <Check className="size-3" aria-hidden />
          ) : (
            <span
              className="inline-block size-1.5 rounded-full bg-white/40"
              aria-hidden
            />
          )}
          {complete ? "Iniciado" : "Pendiente"}
        </span>
      </header>

      <div className="flex flex-col gap-3">
        {SAFE_ZONE_FIELDS.map((fieldKey) => (
          <SafeZoneFieldInput
            key={fieldKey}
            fieldKey={fieldKey}
            value={zone[fieldKey]}
            onChange={(value) => onUpdate({ [fieldKey]: value })}
          />
        ))}
      </div>

      {!complete ? (
        <p className="mt-3 border-t border-white/10 pt-3 text-[11px] leading-snug text-white/45">
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
    </article>
  )
}

function GuidanceBanner() {
  return (
    <aside
      className={cn(
        "glass-mica interactive-mica flex flex-col gap-3 border border-white/15 bg-white/[0.04] p-4 sm:flex-row sm:items-start sm:justify-between",
      )}
      role="region"
      aria-label="Orientación del paso"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center border border-blue-400/30 bg-blue-500/10 text-blue-200"
          aria-hidden
        >
          <AlertTriangle className="size-4" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/85">
            ¿Cómo actúo en cada emergencia?
          </p>
          <p className="mt-1 text-[12px] leading-snug text-white/55">
            Define un lugar seguro, una ruta de salida, una zona amplia y un
            punto de encuentro para cada escenario. Pasa el cursor sobre el
            icono{" "}
            <Info className="inline size-3 align-[-2px] text-white/55" aria-hidden />{" "}
            junto a cada etiqueta para ver su definición. Si no los conoces,
            consulta el mapa oficial con los puntos de encuentro cercanos a tu
            comuna.
          </p>
        </div>
      </div>
      <Link
        href="/evacuation"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex shrink-0 items-center gap-2 self-center border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[1.2px] text-white transition-colors sm:self-start",
          "hover:border-white/30 hover:bg-white/15",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
        )}
      >
        Abrir mapa de evacuación
        <ArrowUpRight className="size-3.5" aria-hidden />
      </Link>
    </aside>
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
    <div className="flex flex-col gap-4">
      <GuidanceBanner />

      <FamilyPlanSection
        title="Protocolos por emergencia"
        description="Completa al menos el lugar seguro de cada escenario. Los demás campos podrás afinarlos después."
      >
        <div className="flex flex-col gap-3">
          {data.safe_zones.map((zone) => (
            <SafeZoneCard
              key={zone.emergency}
              zone={zone}
              onUpdate={(patch) => updateZone(zone.emergency, patch)}
            />
          ))}
        </div>
      </FamilyPlanSection>
    </div>
  )
}
