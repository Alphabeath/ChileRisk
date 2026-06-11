"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { FamilyPlanSection } from "@/components/preparation/family-plan/family-plan-field"
import { EmergencyKitGuideLink } from "@/components/preparation/emergency-kit/emergency-kit-guide-link"
import {
  KIT_ITEMS_BASE,
  KIT_ITEMS_INFANT,
  KIT_ITEMS_PETS,
  KIT_ITEMS_PREGNANT,
  KIT_ITEMS_TEA,
} from "@/lib/family-plan-defaults"
import { useFamilyPlan } from "@/hooks/use-family-plan"

function KitChecklist({
  title,
  items,
  values,
  onToggle,
}: {
  title: string
  items: readonly string[]
  values: Record<string, boolean>
  onToggle: (item: string, checked: boolean) => void
}) {
  return (
    <FamilyPlanSection title={title}>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item}>
            <label className="flex items-start gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-white/75">
              <Checkbox
                checked={values[item] ?? false}
                onCheckedChange={(checked) => onToggle(item, checked === true)}
                className="mt-0.5"
              />
              {item}
            </label>
          </li>
        ))}
      </ul>
    </FamilyPlanSection>
  )
}

export function StepEmergencyKit() {
  const { data, updateData } = useFamilyPlan()
  if (!data) return null

  function toggleSection(
    section: "base" | "infant" | "pregnant" | "tea" | "pets",
    item: string,
    checked: boolean,
  ) {
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

  const kit = data.emergency_kit
  const hasInfant = data.members.some((m) => m.flags.includes("lactation"))
  const hasPregnant = data.members.some((m) => m.flags.includes("pregnancy"))
  const hasTea = data.members.some(
    (m) => m.special_needs.toLowerCase().includes("tea"),
  )
  const hasPets = data.pets.length > 0

  return (
    <div className="flex flex-col gap-8">
      <EmergencyKitGuideLink variant="banner" />

      <KitChecklist
        title="Kit base (72 horas)"
        items={KIT_ITEMS_BASE}
        values={kit.base}
        onToggle={(item, checked) => toggleSection("base", item, checked)}
      />
      {hasInfant ? (
        <KitChecklist
          title="Kit para lactantes"
          items={KIT_ITEMS_INFANT}
          values={kit.infant}
          onToggle={(item, checked) => toggleSection("infant", item, checked)}
        />
      ) : null}
      {hasPregnant ? (
        <KitChecklist
          title="Kit para embarazadas"
          items={KIT_ITEMS_PREGNANT}
          values={kit.pregnant}
          onToggle={(item, checked) => toggleSection("pregnant", item, checked)}
        />
      ) : null}
      {hasTea ? (
        <KitChecklist
          title="Kit para personas TEA"
          items={KIT_ITEMS_TEA}
          values={kit.tea}
          onToggle={(item, checked) => toggleSection("tea", item, checked)}
        />
      ) : null}
      {hasPets ? (
        <KitChecklist
          title="Kit para mascotas"
          items={KIT_ITEMS_PETS}
          values={kit.pets}
          onToggle={(item, checked) => toggleSection("pets", item, checked)}
        />
      ) : null}
    </div>
  )
}