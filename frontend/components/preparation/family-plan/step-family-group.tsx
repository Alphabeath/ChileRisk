"use client"

import {
  Accessibility,
  Check,
  HeartPulse,
  IdCard,
  type LucideIcon,
  PawPrint,
  Phone,
  Plus,
  Stethoscope,
  Trash2,
  User,
  Users,
} from "lucide-react"

import {
  FamilyPlanField,
  newId,
} from "@/components/preparation/family-plan/family-plan-field"
import {
  FAMILY_PLAN_ADD_CTA_CLASS,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FAMILY_MEMBER_FLAGS } from "@/lib/family-plan-defaults"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import type { FamilyMember, Pet } from "@/lib/types"
import { cn } from "@/lib/utils"

type GroupCategory = "members" | "pets"

const SEX_OPTIONS = [
  { value: "Femenino", label: "Femenino" },
  { value: "Masculino", label: "Masculino" },
  { value: "Otro", label: "Otro" },
]

const CATEGORY_META = {
  members: {
    title: "Integrantes",
    description: "Personas que viven en la vivienda.",
    icon: Users,
    accent: "border-l-blue-500/60",
    chip: "border-blue-500/30 bg-blue-500/10 text-blue-200",
    itemAccent: "border-l-blue-500/50",
    emptyHint:
      "Agrega al primer integrante para empezar a registrar el grupo familiar.",
    addLabel: "Agregar integrante",
  },
  pets: {
    title: "Mascotas",
    description: "Mascotas que viven en el hogar.",
    icon: PawPrint,
    accent: "border-l-emerald-500/60",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    itemAccent: "border-l-emerald-500/50",
    emptyHint:
      "Si tienes mascotas, agrégalas. Necesitarás cuidarlas en la emergencia.",
    addLabel: "Agregar mascota",
  },
} as const

const PALETTE: Array<{ bg: string; text: string; border: string }> = [
  { bg: "bg-blue-500/15", text: "text-blue-200", border: "border-blue-400/30" },
  {
    bg: "bg-emerald-500/15",
    text: "text-emerald-200",
    border: "border-emerald-400/30",
  },
  {
    bg: "bg-violet-500/15",
    text: "text-violet-200",
    border: "border-violet-400/30",
  },
  { bg: "bg-amber-500/15", text: "text-amber-200", border: "border-amber-400/30" },
  { bg: "bg-rose-500/15", text: "text-rose-200", border: "border-rose-400/30" },
  { bg: "bg-cyan-500/15", text: "text-cyan-200", border: "border-cyan-400/30" },
  { bg: "bg-pink-500/15", text: "text-pink-200", border: "border-pink-400/30" },
  {
    bg: "bg-orange-500/15",
    text: "text-orange-200",
    border: "border-orange-400/30",
  },
]

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function getPalette(id: string) {
  return PALETTE[hashId(id) % PALETTE.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function isMemberComplete(m: FamilyMember): boolean {
  return m.first_name.trim().length > 0 && m.last_name.trim().length > 0
}

function isPetComplete(p: Pet): boolean {
  return p.name.trim().length > 0 && p.species.trim().length > 0
}

function memberFullName(m: FamilyMember) {
  return `${m.first_name} ${m.last_name}`.trim() || "Sin nombre"
}

function memberSummary(m: FamilyMember): string {
  const parts: string[] = []
  if (m.age != null) parts.push(`${m.age} años`)
  if (m.sex.trim()) parts.push(m.sex.trim())
  if (m.nationality.trim()) parts.push(m.nationality.trim())
  return parts.join(" · ")
}

function petSummary(p: Pet): string {
  const parts: string[] = []
  if (p.species.trim()) parts.push(p.species.trim())
  if (p.age != null) parts.push(`${p.age} años`)
  return parts.join(" · ")
}

function PersonAvatar({ name, id }: { name: string; id: string }) {
  const palette = getPalette(id)
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center border font-mono text-[12px] font-semibold uppercase",
        palette.bg,
        palette.text,
        palette.border,
      )}
      aria-hidden
    >
      {getInitials(name)}
    </span>
  )
}

function RemoveButton({
  onClick,
  label,
}: {
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center border border-white/10 bg-transparent text-white/55 transition-colors",
        "hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
      )}
    >
      <Trash2 className="size-3.5" aria-hidden />
    </button>
  )
}

function GroupSummaryBanner({
  members,
  pets,
}: {
  members: FamilyMember[]
  pets: Pet[]
}) {
  const membersDone = members.filter(isMemberComplete).length
  const petsDone = pets.filter(isPetComplete).length
  const total = members.length + pets.length
  const done = membersDone + petsDone
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const specialNeeds = members.filter((m) => m.flags.length > 0).length
  const allDone = total > 0 && done === total

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
            Grupo familiar
          </p>
          <p className="mt-0.5 text-[11.5px] text-white/55">
            {total === 0
              ? "Registra personas y mascotas del hogar"
              : `${done} de ${total} fichas completas · ${members.length} integrantes · ${pets.length} mascotas`}
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[12rem] sm:items-end">
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
        <div className="flex flex-wrap items-center gap-1.5">
          <FamilyPlanStatusChip
            tone={members.length === 0 ? "empty" : membersDone === members.length ? "complete" : "started"}
          >
            <Users className="size-3" aria-hidden />
            {members.length}
          </FamilyPlanStatusChip>
          <FamilyPlanStatusChip
            tone={pets.length === 0 ? "empty" : petsDone === pets.length ? "complete" : "started"}
          >
            <PawPrint className="size-3" aria-hidden />
            {pets.length}
          </FamilyPlanStatusChip>
          {specialNeeds > 0 ? (
            <FamilyPlanStatusChip tone="pending">
              <Accessibility className="size-3" aria-hidden />
              {specialNeeds} cond.
            </FamilyPlanStatusChip>
          ) : null}
        </div>
      </div>
    </FamilyPlanStatusBanner>
  )
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: LucideIcon
  title: string
}) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
      <Icon className="size-3.5 text-white/55" aria-hidden />
      <span className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/55">
        {title}
      </span>
    </div>
  )
}

function CardStatusChip({ complete }: { complete: boolean }) {
  return (
    <FamilyPlanStatusChip tone={complete ? "complete" : "empty"}>
      {complete ? (
        <Check className="size-3" aria-hidden />
      ) : (
        <span
          className="inline-block size-1.5 rounded-full bg-white/40"
          aria-hidden
        />
      )}
      {complete ? "Completo" : "Pendiente"}
    </FamilyPlanStatusChip>
  )
}

function MemberCard({
  member,
  onUpdate,
  onRemove,
}: {
  member: FamilyMember
  onUpdate: (patch: Partial<FamilyMember>) => void
  onRemove: () => void
}) {
  const complete = isMemberComplete(member)
  const flagLabels = member.flags
    .map((f) => FAMILY_MEMBER_FLAGS.find((flag) => flag.id === f)?.label ?? f)
    .join(", ")

  return (
    <FamilyPlanItemCard
      accentClassName={CATEGORY_META.members.itemAccent}
      className={!complete ? "border-dashed" : undefined}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar name={memberFullName(member)} id={member.id} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-white/90">
              {memberFullName(member)}
            </p>
            <p className="truncate text-[11px] text-white/45">
              {memberSummary(member) || "Completa nombre y apellidos"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
          {member.flags.length > 0 ? (
            <FamilyPlanStatusChip tone="pending" title={flagLabels}>
              <Accessibility className="size-3" aria-hidden />
              {member.flags.length} cond.
            </FamilyPlanStatusChip>
          ) : null}
          <CardStatusChip complete={complete} />
          <RemoveButton onClick={onRemove} label="Eliminar integrante" />
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <SectionHeader icon={User} title="Datos personales" />
        <FamilyPlanFormGrid>
          <FamilyPlanField
            htmlFor={`${member.id}-first`}
            icon={User}
            label="Nombre"
          >
            <Input
              id={`${member.id}-first`}
              value={member.first_name}
              onChange={(e) => onUpdate({ first_name: e.target.value })}
              placeholder="Ej. María"
            />
          </FamilyPlanField>
          <FamilyPlanField
            htmlFor={`${member.id}-last`}
            icon={User}
            label="Apellidos"
          >
            <Input
              id={`${member.id}-last`}
              value={member.last_name}
              onChange={(e) => onUpdate({ last_name: e.target.value })}
              placeholder="Ej. González Pérez"
            />
          </FamilyPlanField>
          <FamilyPlanField htmlFor={`${member.id}-age`} label="Edad">
            <Input
              id={`${member.id}-age`}
              type="number"
              min={0}
              max={120}
              value={member.age ?? ""}
              onChange={(e) =>
                onUpdate({
                  age: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="—"
            />
          </FamilyPlanField>
          <FamilyPlanField htmlFor={`${member.id}-sex`} label="Sexo">
            <Select
              value={member.sex || "none"}
              onValueChange={(value) =>
                onUpdate({ sex: value === "none" ? "" : value })
              }
            >
              <SelectTrigger id={`${member.id}-sex`}>
                <SelectValue placeholder="Sin especificar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin especificar</SelectItem>
                {SEX_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FamilyPlanField>
          <FamilyPlanField htmlFor={`${member.id}-nat`} label="Nacionalidad">
            <Input
              id={`${member.id}-nat`}
              value={member.nationality}
              onChange={(e) => onUpdate({ nationality: e.target.value })}
              placeholder="Ej. Chilena"
            />
          </FamilyPlanField>
          <FamilyPlanField
            htmlFor={`${member.id}-doc`}
            icon={IdCard}
            label="Documento"
          >
            <Input
              id={`${member.id}-doc`}
              value={member.document}
              onChange={(e) => onUpdate({ document: e.target.value })}
              placeholder="RUN / DNI"
            />
          </FamilyPlanField>
          <FamilyPlanField
            htmlFor={`${member.id}-phone`}
            icon={Phone}
            label="Teléfono"
            className={FAMILY_PLAN_FORM_FULL_CLASS}
          >
            <Input
              id={`${member.id}-phone`}
              value={member.phone}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              placeholder="+56 9 ..."
              inputMode="tel"
            />
          </FamilyPlanField>
        </FamilyPlanFormGrid>
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader icon={HeartPulse} title="Salud" />
        <FamilyPlanFormGrid>
          <FamilyPlanField icon={Stethoscope} label="Condiciones médicas">
            <Textarea
              value={member.medical_conditions}
              onChange={(e) => onUpdate({ medical_conditions: e.target.value })}
              rows={2}
              placeholder="Diabetes, hipertensión, alergias…"
            />
          </FamilyPlanField>
          <FamilyPlanField label="Contraindicaciones">
            <Textarea
              value={member.contraindications}
              onChange={(e) => onUpdate({ contraindications: e.target.value })}
              rows={2}
              placeholder="Medicamentos contraindicados, alergias a fármacos…"
            />
          </FamilyPlanField>
          <FamilyPlanField
            icon={Accessibility}
            label="Necesidades especiales"
            className={FAMILY_PLAN_FORM_FULL_CLASS}
            helper="Apoyo permanente, dispositivos o asistencia en evacuación."
          >
            <Textarea
              value={member.special_needs}
              onChange={(e) => onUpdate({ special_needs: e.target.value })}
              rows={2}
              placeholder="Asistencia, dispositivos, apoyo permanente…"
            />
          </FamilyPlanField>
        </FamilyPlanFormGrid>
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader icon={Accessibility} title="Condiciones especiales" />
        <FamilyPlanFormGrid className="gap-2">
          {FAMILY_MEMBER_FLAGS.map((flag) => {
            const checked = member.flags.includes(flag.id)
            return (
              <label
                key={flag.id}
                className={cn(
                  "glass-mica interactive-mica flex min-h-11 items-center gap-2.5 border px-3 py-2.5 text-[12px] transition-colors",
                  checked
                    ? "border-amber-400/35 bg-amber-500/[0.08] text-amber-50"
                    : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/25 hover:bg-white/[0.06]",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) => {
                    const flags = next
                      ? [...member.flags, flag.id]
                      : member.flags.filter((f) => f !== flag.id)
                    onUpdate({ flags })
                  }}
                />
                {flag.label}
              </label>
            )
          })}
        </FamilyPlanFormGrid>
      </div>
    </FamilyPlanItemCard>
  )
}

function PetCard({
  pet,
  onUpdate,
  onRemove,
}: {
  pet: Pet
  onUpdate: (patch: Partial<Pet>) => void
  onRemove: () => void
}) {
  const complete = isPetComplete(pet)
  return (
    <FamilyPlanItemCard
      accentClassName={CATEGORY_META.pets.itemAccent}
      className={!complete ? "border-dashed" : undefined}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar name={pet.name} id={pet.id} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-white/90">
              {pet.name.trim() || "Mascota sin nombre"}
            </p>
            <p className="truncate text-[11px] text-white/45">
              {petSummary(pet) || "Completa nombre y especie"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
          <CardStatusChip complete={complete} />
          <RemoveButton onClick={onRemove} label="Eliminar mascota" />
        </div>
      </header>

      <FamilyPlanFormGrid>
        <FamilyPlanField icon={PawPrint} label="Nombre">
          <Input
            value={pet.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Ej. Firulais"
          />
        </FamilyPlanField>
        <FamilyPlanField label="Especie">
          <Input
            value={pet.species}
            onChange={(e) => onUpdate({ species: e.target.value })}
            placeholder="Perro, gato, ..."
          />
        </FamilyPlanField>
        <FamilyPlanField label="Edad">
          <Input
            type="number"
            min={0}
            max={50}
            value={pet.age ?? ""}
            onChange={(e) =>
              onUpdate({ age: e.target.value ? Number(e.target.value) : null })
            }
            placeholder="—"
          />
        </FamilyPlanField>
        <FamilyPlanField label="Características">
          <Input
            value={pet.characteristics}
            onChange={(e) => onUpdate({ characteristics: e.target.value })}
            placeholder="Tamaño, raza, señas particulares..."
          />
        </FamilyPlanField>
        <FamilyPlanField
          icon={Accessibility}
          label="Necesidades especiales"
          className={FAMILY_PLAN_FORM_FULL_CLASS}
          helper="Medicación, dieta o apoyo en evacuación."
        >
          <Textarea
            value={pet.special_needs}
            onChange={(e) => onUpdate({ special_needs: e.target.value })}
            rows={2}
            placeholder="Medicación, dieta, apoyo..."
          />
        </FamilyPlanField>
      </FamilyPlanFormGrid>
    </FamilyPlanItemCard>
  )
}

function AddCategoryPanel({
  category,
  onAdd,
}: {
  category: GroupCategory
  onAdd: () => void
}) {
  const meta = CATEGORY_META[category]
  const Icon = meta.icon
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
            Agregar a {meta.title.toLowerCase()}
          </p>
          <p className="mt-0.5 text-[11.5px] text-white/45">{meta.emptyHint}</p>
        </div>
      </header>
      <button
        type="button"
        onClick={onAdd}
        className={cn(
          FAMILY_PLAN_ADD_CTA_CLASS,
          "hover:border-white/30 hover:bg-white/15",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {meta.addLabel}
      </button>
    </FamilyPlanAddPanel>
  )
}

function CategorySection({
  category,
  count,
  doneCount,
  onAdd,
  children,
}: {
  category: GroupCategory
  count: number
  doneCount: number
  onAdd: () => void
  children: React.ReactNode
}) {
  const meta = CATEGORY_META[category]
  const Icon = meta.icon
  const chipTone =
    count === 0 ? "empty" : doneCount === count ? "complete" : "pending"

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
          <FamilyPlanStatusChip tone={chipTone}>
            {count === 0 ? "Vacío" : `${doneCount}/${count}`}
          </FamilyPlanStatusChip>
        </>
      }
    >
      {count === 0 ? (
        <FamilyPlanEmptyState className="gap-3 px-3 py-6">
          <Icon className="size-6 text-white/35" aria-hidden />
          <p className="text-[12px] text-white/55">
            Aún no hay registros en esta categoría.
          </p>
          <p className="max-w-sm text-[11px] text-white/40">{meta.emptyHint}</p>
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              FAMILY_PLAN_ADD_CTA_CLASS,
              "sm:self-center",
              "hover:border-white/30 hover:bg-white/15",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
            )}
          >
            <Plus className="size-3.5" aria-hidden />
            {meta.addLabel}
          </button>
        </FamilyPlanEmptyState>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}

      {count > 0 ? (
        <AddCategoryPanel category={category} onAdd={onAdd} />
      ) : null}
    </FamilyPlanCategoryShell>
  )
}

export function StepFamilyGroup() {
  const { data, updateData } = useFamilyPlan()
  if (!data) return null

  function updateMember(id: string, patch: Partial<FamilyMember>) {
    updateData((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }))
  }

  function addMember() {
    const member: FamilyMember = {
      id: newId(),
      first_name: "",
      last_name: "",
      document: "",
      sex: "",
      age: null,
      nationality: "",
      phone: "",
      medical_conditions: "",
      contraindications: "",
      special_needs: "",
      flags: [],
    }
    updateData((prev) => ({ ...prev, members: [...prev.members, member] }))
  }

  function removeMember(id: string) {
    updateData((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
    }))
  }

  function updatePet(id: string, patch: Partial<Pet>) {
    updateData((prev) => ({
      ...prev,
      pets: prev.pets.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
  }

  function addPet() {
    const pet: Pet = {
      id: newId(),
      name: "",
      species: "",
      age: null,
      characteristics: "",
      special_needs: "",
    }
    updateData((prev) => ({ ...prev, pets: [...prev.pets, pet] }))
  }

  function removePet(id: string) {
    updateData((prev) => ({
      ...prev,
      pets: prev.pets.filter((p) => p.id !== id),
    }))
  }

  const membersDone = data.members.filter(isMemberComplete).length
  const petsDone = data.pets.filter(isPetComplete).length

  return (
    <FamilyPlanStepRoot>
      <GroupSummaryBanner members={data.members} pets={data.pets} />

      <CategorySection
        category="members"
        count={data.members.length}
        doneCount={membersDone}
        onAdd={addMember}
      >
        {data.members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onUpdate={(patch) => updateMember(member.id, patch)}
            onRemove={() => removeMember(member.id)}
          />
        ))}
      </CategorySection>

      <CategorySection
        category="pets"
        count={data.pets.length}
        doneCount={petsDone}
        onAdd={addPet}
      >
        {data.pets.map((pet) => (
          <PetCard
            key={pet.id}
            pet={pet}
            onUpdate={(patch) => updatePet(pet.id, patch)}
            onRemove={() => removePet(pet.id)}
          />
        ))}
      </CategorySection>
    </FamilyPlanStepRoot>
  )
}
