"use client"

import { useMemo, useState } from "react"
import {
  Baby,
  Backpack,
  Check,
  Heart,
  type LucideIcon,
  PawPrint,
  Sparkles,
  X,
} from "lucide-react"

import { EmergencyKitGuideLink } from "@/components/preparation/emergency-kit/emergency-kit-guide-link"
import {
  FamilyPlanCategoryShell,
  FamilyPlanStatusBanner,
  FamilyPlanStatusChip,
  type FamilyPlanStatusChipTone,
  FamilyPlanStepRoot,
} from "@/components/preparation/family-plan/family-plan-layout"
import { Checkbox } from "@/components/ui/checkbox"
import {
  KIT_ITEMS_BASE,
  KIT_ITEMS_INFANT,
  KIT_ITEMS_PETS,
  KIT_ITEMS_PREGNANT,
  KIT_ITEMS_TEA,
} from "@/lib/family-plan-defaults"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import type { EmergencyKit } from "@/lib/types"
import { cn } from "@/lib/utils"

type KitSectionKey = keyof EmergencyKit

const SECTION_META: Record<
  KitSectionKey,
  {
    title: string
    description: string
    icon: LucideIcon
    accent: string
    chip: string
  }
> = {
  base: {
    title: "Kit base (72 horas)",
    description: "Esenciales para todas las familias durante las primeras 72h.",
    icon: Backpack,
    accent: "border-l-amber-500/60",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
  infant: {
    title: "Kit para lactantes",
    description: "Artículos para bebés en período de lactancia.",
    icon: Baby,
    accent: "border-l-pink-500/60",
    chip: "border-pink-500/30 bg-pink-500/10 text-pink-200",
  },
  pregnant: {
    title: "Kit para embarazadas",
    description: "Documentación y contactos médicos clave.",
    icon: Heart,
    accent: "border-l-rose-500/60",
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  },
  tea: {
    title: "Kit para personas TEA",
    description: "Objetos y credenciales para personas con trastorno del espectro autista.",
    icon: Sparkles,
    accent: "border-l-violet-500/60",
    chip: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  },
  pets: {
    title: "Kit para mascotas",
    description: "Insumos y documentos para las mascotas del hogar.",
    icon: PawPrint,
    accent: "border-l-emerald-500/60",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },
}

const SECTION_ITEMS: Record<KitSectionKey, readonly string[]> = {
  base: KIT_ITEMS_BASE,
  infant: KIT_ITEMS_INFANT,
  pregnant: KIT_ITEMS_PREGNANT,
  tea: KIT_ITEMS_TEA,
  pets: KIT_ITEMS_PETS,
}

function KitSummaryBanner({
  sections,
  itemsBySection,
  valuesBySection,
}: {
  sections: KitSectionKey[]
  itemsBySection: Record<KitSectionKey, readonly string[]>
  valuesBySection: Record<KitSectionKey, Record<string, boolean>>
}) {
  let total = 0
  let checked = 0
  let sectionsComplete = 0
  for (const section of sections) {
    const items = itemsBySection[section]
    const values = valuesBySection[section]
    const sectionChecked = items.reduce(
      (acc, item) => (values[item] ? acc + 1 : acc),
      0,
    )
    total += items.length
    checked += sectionChecked
    if (items.length > 0 && sectionChecked === items.length) {
      sectionsComplete += 1
    }
  }
  const pct = total === 0 ? 0 : Math.round((checked / total) * 100)
  const allDone = total > 0 && checked === total

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
        >
          {allDone ? <Check className="size-4" /> : `${pct}%`}
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/85">
            Kit de emergencia
          </p>
          <p className="mt-0.5 text-[11.5px] text-white/55">
            {total === 0
              ? "Aún no marcas ítems del kit"
              : `${checked} de ${total} ítems listos · ${sections.length} kit${
                  sections.length === 1 ? "" : "s"
                } activo${sections.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[12rem] sm:items-end">
        <div className="relative h-1.5 w-full border border-white/10 bg-white/5 sm:max-w-xs">
          <span
            className={cn(
              "block h-full transition-all duration-300",
              allDone ? "bg-emerald-400/80" : "bg-amber-400/70",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <FamilyPlanStatusChip tone={sections.length === 0 ? "empty" : "started"}>
            <Backpack className="size-3" aria-hidden />
            {sections.length}
          </FamilyPlanStatusChip>
          <FamilyPlanStatusChip
            tone={
              sectionsComplete === 0
                ? "empty"
                : sectionsComplete === sections.length
                  ? "complete"
                  : "pending"
            }
          >
            <Check className="size-3" aria-hidden />
            {sectionsComplete}/{sections.length}
          </FamilyPlanStatusChip>
        </div>
      </div>
    </FamilyPlanStatusBanner>
  )
}

function KitItemRow({
  label,
  checked,
  onToggle,
}: {
  label: string
  checked: boolean
  onToggle: (checked: boolean) => void
}) {
  return (
    <label
      className={cn(
        "glass-mica interactive-mica flex min-h-11 items-start gap-2 border px-3 py-2 text-[12px] transition-colors",
        checked
          ? "border-emerald-500/30 bg-emerald-500/[0.06] text-white"
          : "border-white/15 bg-white/[0.04] text-white/80 hover:border-white/25 hover:bg-white/[0.07]",
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onToggle(value === true)}
        className="mt-0.5"
      />
      <span className="flex-1">{label}</span>
      {checked ? (
        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-300" aria-hidden />
      ) : null}
    </label>
  )
}

function KitSectionCard({
  section,
  items,
  values,
  onToggle,
  onBulk,
}: {
  section: KitSectionKey
  items: readonly string[]
  values: Record<string, boolean>
  onToggle: (item: string, checked: boolean) => void
  onBulk: (checked: boolean) => void
}) {
  const meta = SECTION_META[section]
  const Icon = meta.icon
  const checkedCount = useMemo(
    () => items.reduce((acc, item) => (values[item] ? acc + 1 : acc), 0),
    [items, values],
  )
  const allChecked = checkedCount === items.length
  const noneChecked = checkedCount === 0
  const countTone: FamilyPlanStatusChipTone = noneChecked
    ? "empty"
    : allChecked
      ? "complete"
      : "pending"

  return (
    <FamilyPlanCategoryShell
      accentClassName={meta.accent}
      header={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center border",
                meta.chip,
              )}
              aria-hidden
            >
              <Icon className="size-3.5" />
            </span>
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[1.4px] text-white/85">
                {meta.title}
              </h3>
              <p className="mt-0.5 text-[11.5px] text-white/45">
                {meta.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={() => onBulk(!allChecked)}
              disabled={items.length === 0}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 border border-white/10 bg-white/[0.03] px-2.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/65 transition-colors",
                "hover:border-white/25 hover:bg-white/[0.08] hover:text-white",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-white/[0.03] disabled:hover:text-white/65",
              )}
            >
              {allChecked ? (
                <>
                  <X className="size-3" aria-hidden />
                  Limpiar
                </>
              ) : (
                <>
                  <Check className="size-3" aria-hidden />
                  Marcar todos
                </>
              )}
            </button>
            <FamilyPlanStatusChip tone={countTone} className="font-mono normal-case tracking-normal">
              {checkedCount}/{items.length}
            </FamilyPlanStatusChip>
          </div>
        </div>
      }
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item}>
            <KitItemRow
              label={item}
              checked={values[item] ?? false}
              onToggle={(checked) => onToggle(item, checked)}
            />
          </li>
        ))}
      </ul>
    </FamilyPlanCategoryShell>
  )
}

function HiddenSectionHint({
  section,
  hint,
}: {
  section: KitSectionKey
  hint: string
}) {
  const meta = SECTION_META[section]
  const Icon = meta.icon
  return (
    <div
      className={cn(
        "flex items-center gap-3 border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-[12px] text-white/55",
        meta.accent.replace("border-l-", "border-l-"),
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center border",
          meta.chip,
          "opacity-60",
        )}
        aria-hidden
      >
        <Icon className="size-3.5" />
      </span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/55">
          {meta.title} · No aplica
        </p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-white/45">{hint}</p>
      </div>
    </div>
  )
}

export function StepEmergencyKit() {
  const { data, updateData } = useFamilyPlan()
  const [bulkConfirm, setBulkConfirm] = useState<KitSectionKey | null>(null)
  if (!data) return null

  function toggleItem(section: KitSectionKey, item: string, checked: boolean) {
    updateData((prev) => ({
      ...prev,
      emergency_kit: {
        ...prev.emergency_kit,
        [section]: {
          ...prev.emergency_kit[section],
          [item]: checked,
        },
      },
    }))
  }

  function setSectionBulk(section: KitSectionKey, checked: boolean) {
    const items = SECTION_ITEMS[section]
    const next: Record<string, boolean> = {}
    for (const item of items) {
      next[item] = checked
    }
    updateData((prev) => ({
      ...prev,
      emergency_kit: {
        ...prev.emergency_kit,
        [section]: next,
      },
    }))
    setBulkConfirm(null)
  }

  const kit = data.emergency_kit
  const hasInfant = data.members.some((m) => m.flags.includes("lactation"))
  const hasPregnant = data.members.some((m) => m.flags.includes("pregnancy"))
  const hasTea = data.members.some((m) =>
    m.special_needs.toLowerCase().includes("tea"),
  )
  const hasPets = data.pets.length > 0

  const visibleSections: KitSectionKey[] = ["base"]
  if (hasInfant) visibleSections.push("infant")
  if (hasPregnant) visibleSections.push("pregnant")
  if (hasTea) visibleSections.push("tea")
  if (hasPets) visibleSections.push("pets")

  const hiddenHints: Array<{ section: KitSectionKey; hint: string }> = []
  if (!hasInfant) {
    hiddenHints.push({
      section: "infant",
      hint: "Agrega un integrante con la condición \"Lactancia\" en el paso 1 para ver este kit.",
    })
  }
  if (!hasPregnant) {
    hiddenHints.push({
      section: "pregnant",
      hint: "Agrega un integrante con la condición \"Embarazo\" en el paso 1 para ver este kit.",
    })
  }
  if (!hasTea) {
    hiddenHints.push({
      section: "tea",
      hint: "Marca TEA en las necesidades especiales de un integrante para activar este kit.",
    })
  }
  if (!hasPets) {
    hiddenHints.push({
      section: "pets",
      hint: "Agrega al menos una mascota en el paso 1 para ver este kit.",
    })
  }

  const valuesBySection = Object.fromEntries(
    visibleSections.map((section) => [section, kit[section]]),
  ) as Record<KitSectionKey, Record<string, boolean>>
  const itemsBySection = Object.fromEntries(
    visibleSections.map((section) => [section, SECTION_ITEMS[section]]),
  ) as Record<KitSectionKey, readonly string[]>

  return (
    <FamilyPlanStepRoot>
      <KitSummaryBanner
        sections={visibleSections}
        itemsBySection={itemsBySection}
        valuesBySection={valuesBySection}
      />

      <EmergencyKitGuideLink variant="banner" />

      <div className="flex flex-col gap-3">
        {visibleSections.map((section) => (
          <KitSectionCard
            key={section}
            section={section}
            items={SECTION_ITEMS[section]}
            values={kit[section]}
            onToggle={(item, checked) => toggleItem(section, item, checked)}
            onBulk={(checked) => {
              if (checked) {
                setBulkConfirm(section)
              } else {
                setSectionBulk(section, false)
              }
            }}
          />
        ))}

        {hiddenHints.map(({ section, hint }) => (
          <HiddenSectionHint key={section} section={section} hint={hint} />
        ))}
      </div>

      {bulkConfirm ? (
        <div
          className={cn(
            "glass-mica interactive-mica flex flex-col gap-3 border border-amber-500/30 bg-amber-500/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between",
          )}
          role="alertdialog"
          aria-label="Confirmar marcado masivo"
        >
          <p className="text-[12px] text-white/85">
            ¿Marcar todos los items de{" "}
            <strong className="text-white">
              {SECTION_META[bulkConfirm].title}
            </strong>{" "}
            como listos?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBulkConfirm(null)}
              className={cn(
                "inline-flex h-8 items-center border border-white/15 bg-white/[0.04] px-3 text-[10.5px] font-semibold uppercase tracking-[1.2px] text-white/75 transition-colors",
                "hover:border-white/30 hover:bg-white/[0.08] hover:text-white",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
              )}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setSectionBulk(bulkConfirm, true)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 border border-amber-500/40 bg-amber-500/15 px-3 text-[10.5px] font-semibold uppercase tracking-[1.2px] text-amber-100 transition-colors",
                "hover:border-amber-500/60 hover:bg-amber-500/25",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
              )}
            >
              <Check className="size-3" aria-hidden />
              Confirmar
            </button>
          </div>
        </div>
      ) : null}
    </FamilyPlanStepRoot>
  )
}
