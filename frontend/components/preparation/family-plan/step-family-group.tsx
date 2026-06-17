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

import { newId } from "@/components/preparation/family-plan/family-plan-field"
import { FamilyPlanSection } from "@/components/preparation/family-plan/family-plan-field"
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
    emptyHint:
      "Agrega al primer integrante para empezar a registrar el grupo familiar.",
  },
  pets: {
    title: "Mascotas",
    description: "Mascotas que viven en el hogar.",
    icon: PawPrint,
    accent: "border-l-emerald-500/60",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    emptyHint:
      "Si tienes mascotas, agrégalas. Necesitarás cuidarlas en la emergencia.",
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

function GroupSummary({
  membersTotal,
  petsTotal,
}: {
  membersTotal: number
  petsTotal: number
}) {
  return (
    <div
      className={cn(
        "glass-mica interactive-mica flex flex-col gap-3 border border-white/15 bg-white/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center border border-white/20 bg-white/10 text-white"
          aria-hidden
        >
          <Users className="size-4" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/85">
            Grupo familiar
          </p>
          <p className="mt-0.5 text-[11.5px] text-white/55">
            {membersTotal === 0 && petsTotal === 0
              ? "Sin integrantes ni mascotas registrados"
              : `Resumen de personas y mascotas en el hogar`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[1.2px] text-blue-200"
        >
          <Users className="size-3" aria-hidden />
          <span className="font-mono tabular-nums">{membersTotal}</span>
          Integrantes
        </span>
        <span
          className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[1.2px] text-emerald-200"
        >
          <PawPrint className="size-3" aria-hidden />
          <span className="font-mono tabular-nums">{petsTotal}</span>
          Mascotas
        </span>
      </div>
    </div>
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

function FieldLabel({
  htmlFor,
  icon: Icon,
  children,
}: {
  htmlFor?: string
  icon?: LucideIcon
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[1.4px] text-white/55"
    >
      {Icon ? <Icon className="size-3" aria-hidden /> : null}
      {children}
    </label>
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
  return (
    <article
      className={cn(
        "glass-mica interactive-mica flex flex-col gap-4 border border-white/15 bg-white/[0.04] p-4 transition-colors hover:border-white/25",
        !complete && "border-dashed",
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar name={memberFullName(member)} id={member.id} />
          <div className="min-w-0">
            <p className="truncate text-[13px] text-white/90">
              {memberFullName(member)}
            </p>
            <p className="truncate text-[11px] text-white/45">
              {memberSummary(member) || "Sin datos adicionales"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {member.flags.length > 0 ? (
            <span
              className="inline-flex items-center gap-1 border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[1.2px] text-amber-200"
              title={member.flags
                .map(
                  (f) =>
                    FAMILY_MEMBER_FLAGS.find((flag) => flag.id === f)?.label ??
                    f,
                )
                .join(", ")}
            >
              <Accessibility className="size-3" aria-hidden />
              {member.flags.length}
            </span>
          ) : null}
          <span
            className={cn(
              "inline-flex items-center gap-1 border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[1.2px]",
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
            {complete ? "Completo" : "Pendiente"}
          </span>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Eliminar integrante"
            className={cn(
              "inline-flex size-7 shrink-0 items-center justify-center border border-white/10 bg-transparent text-white/55 transition-colors",
              "hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
            )}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <SectionHeader icon={User} title="Datos personales" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={`${member.id}-first`} icon={User}>
              Nombre
            </FieldLabel>
            <Input
              id={`${member.id}-first`}
              value={member.first_name}
              onChange={(e) => onUpdate({ first_name: e.target.value })}
              placeholder="Ej. María"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={`${member.id}-last`} icon={User}>
              Apellidos
            </FieldLabel>
            <Input
              id={`${member.id}-last`}
              value={member.last_name}
              onChange={(e) => onUpdate({ last_name: e.target.value })}
              placeholder="Ej. González Pérez"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={`${member.id}-age`}>Edad</FieldLabel>
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
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={`${member.id}-sex`}>Sexo</FieldLabel>
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
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={`${member.id}-nat`}>Nacionalidad</FieldLabel>
            <Input
              id={`${member.id}-nat`}
              value={member.nationality}
              onChange={(e) => onUpdate({ nationality: e.target.value })}
              placeholder="Ej. Chilena"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={`${member.id}-doc`} icon={IdCard}>
              Documento
            </FieldLabel>
            <Input
              id={`${member.id}-doc`}
              value={member.document}
              onChange={(e) => onUpdate({ document: e.target.value })}
              placeholder="RUN / DNI"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${member.id}-phone`} icon={Phone}>
            Teléfono
          </FieldLabel>
          <Input
            id={`${member.id}-phone`}
            value={member.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="+56 9 ..."
            inputMode="tel"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader icon={HeartPulse} title="Salud" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <FieldLabel icon={Stethoscope}>Condiciones médicas</FieldLabel>
            <Textarea
              value={member.medical_conditions}
              onChange={(e) => onUpdate({ medical_conditions: e.target.value })}
              rows={2}
              placeholder="Diabetes, hipertensión, alergias…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Contraindicaciones</FieldLabel>
            <Textarea
              value={member.contraindications}
              onChange={(e) => onUpdate({ contraindications: e.target.value })}
              rows={2}
              placeholder="Medicamentos contraindicados, alergias a fármacos…"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel icon={Accessibility}>Necesidades especiales</FieldLabel>
          <Textarea
            value={member.special_needs}
            onChange={(e) => onUpdate({ special_needs: e.target.value })}
            rows={2}
            placeholder="Asistencia, dispositivos, apoyo permanente…"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader icon={Accessibility} title="Condiciones especiales" />
        <div className="grid gap-2 sm:grid-cols-2">
          {FAMILY_MEMBER_FLAGS.map((flag) => (
            <label
              key={flag.id}
              className="glass-mica interactive-mica flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-white/80 transition-colors hover:border-white/25 hover:bg-white/[0.06]"
            >
              <Checkbox
                checked={member.flags.includes(flag.id)}
                onCheckedChange={(checked) => {
                  const flags = checked
                    ? [...member.flags, flag.id]
                    : member.flags.filter((f) => f !== flag.id)
                  onUpdate({ flags })
                }}
              />
              {flag.label}
            </label>
          ))}
        </div>
      </div>
    </article>
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
    <article
      className={cn(
        "glass-mica interactive-mica flex flex-col gap-4 border border-white/15 bg-white/[0.04] p-4 transition-colors hover:border-white/25",
        !complete && "border-dashed",
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar name={pet.name} id={pet.id} />
          <div className="min-w-0">
            <p className="truncate text-[13px] text-white/90">
              {pet.name.trim() || "Mascota sin nombre"}
            </p>
            <p className="truncate text-[11px] text-white/45">
              {petSummary(pet) || "Sin datos"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[1.2px]",
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
            {complete ? "Completo" : "Pendiente"}
          </span>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Eliminar mascota"
            className={cn(
              "inline-flex size-7 shrink-0 items-center justify-center border border-white/10 bg-transparent text-white/55 transition-colors",
              "hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
            )}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <FieldLabel icon={PawPrint}>Nombre</FieldLabel>
          <Input
            value={pet.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Ej. Firulais"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Especie</FieldLabel>
          <Input
            value={pet.species}
            onChange={(e) => onUpdate({ species: e.target.value })}
            placeholder="Perro, gato, ..."
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Edad</FieldLabel>
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
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Características</FieldLabel>
        <Input
          value={pet.characteristics}
          onChange={(e) => onUpdate({ characteristics: e.target.value })}
          placeholder="Tamaño, raza, señas particulares..."
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FieldLabel icon={Accessibility}>Necesidades especiales</FieldLabel>
        <Textarea
          value={pet.special_needs}
          onChange={(e) => onUpdate({ special_needs: e.target.value })}
          rows={2}
          placeholder="Medicación, dieta, apoyo..."
        />
      </div>
    </article>
  )
}

function AddCategoryPanel({
  category,
  onAdd,
}: {
  category: "members" | "pets"
  onAdd: () => void
}) {
  const meta = CATEGORY_META[category]
  const Icon = meta.icon
  return (
    <div className="flex flex-col gap-3 border border-dashed border-white/25 bg-white/[0.025] p-4 transition-colors hover:border-white/35 hover:bg-white/[0.04]">
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
          "inline-flex w-fit items-center gap-2 self-start border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[1.2px] text-white transition-colors",
          "hover:border-white/30 hover:bg-white/15",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {category === "members" ? "Agregar integrante" : "Agregar mascota"}
      </button>
    </div>
  )
}

function CategorySection({
  category,
  children,
  count,
  doneCount,
}: {
  category: "members" | "pets"
  children: React.ReactNode
  count: number
  doneCount: number
}) {
  const meta = CATEGORY_META[category]
  const Icon = meta.icon
  return (
    <section
      className={cn(
        "glass-mica interactive-mica border-l-[3px] border border-white/15 bg-white/[0.04] transition-colors hover:border-white/25",
        meta.accent,
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
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
        <span
          className={cn(
            "shrink-0 border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[1.2px]",
            count === 0
              ? "border-white/10 bg-white/[0.03] text-white/45"
              : doneCount === count
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-amber-500/40 bg-amber-500/10 text-amber-200",
          )}
        >
          {count === 0 ? "Vacío" : `${doneCount}/${count}`}
        </span>
      </header>
      <div className="flex flex-col gap-2 p-3">
        {count === 0 ? (
          <p className="border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center text-[11.5px] text-white/45">
            Aún no hay registros en esta categoría.
          </p>
        ) : (
          children
        )}
      </div>
    </section>
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
  const total = data.members.length + data.pets.length
  const totalEmpty = total === 0

  return (
    <div className="flex flex-col gap-4">
      <GroupSummary
        membersTotal={data.members.length}
        petsTotal={data.pets.length}
      />

      <FamilyPlanSection
        title="Personas y mascotas"
        description="Registra integrantes del hogar y, si tienes, las mascotas que viven contigo."
      >
        {totalEmpty ? (
          <div
            className={cn(
              "glass-mica interactive-mica flex flex-col items-center gap-2 border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center",
            )}
          >
            <Users className="size-6 text-white/35" aria-hidden />
            <p className="text-[12px] text-white/55">
              Aún no has agregado integrantes ni mascotas.
            </p>
            <p className="max-w-md text-[11.5px] text-white/40">
              Usa los botones &quot;Agregar integrante&quot; o &quot;Agregar mascota&quot; en
              cada categoría para empezar.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <CategorySection
            category="members"
            count={data.members.length}
            doneCount={membersDone}
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

          <div className="rounded-none">
            <AddCategoryPanel category="members" onAdd={addMember} />
          </div>

          <CategorySection
            category="pets"
            count={data.pets.length}
            doneCount={petsDone}
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

          <AddCategoryPanel category="pets" onAdd={addPet} />
        </div>
      </FamilyPlanSection>
    </div>
  )
}
