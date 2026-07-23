"use client"

import { useState } from "react"
import {
  Building2,
  Check,
  Copy,
  Flame,
  HeartPulse,
  Shield,
  ShieldCheck,
  Trash2,
  Trees,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

import {
  FamilyPlanField,
  FamilyPlanSection,
  newId,
} from "@/components/preparation/family-plan/family-plan-field"
import {
  FAMILY_PLAN_FORM_FULL_CLASS,
  FamilyPlanAddCta,
  FamilyPlanAddPanel,
  FamilyPlanCategoryShell,
  FamilyPlanEmptyState,
  FamilyPlanFormGrid,
  FamilyPlanItemCard,
  FamilyPlanStatusBanner,
  FamilyPlanStatusChip,
  FamilyPlanStepRoot,
} from "@/components/preparation/family-plan/family-plan-layout"
import { Input } from "@/components/ui/input"
import { NATIONAL_EMERGENCY_NUMBERS } from "@/lib/family-plan-defaults"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import type { FamilyContact } from "@/lib/types"
import { cn } from "@/lib/utils"

type ContactType = FamilyContact["type"]

const CATEGORY_META: Record<
  ContactType,
  {
    title: string
    description: string
    icon: LucideIcon
    accent: string
    chip: string
    itemAccent: string
    emptyHint: string
  }
> = {
  family: {
    title: "Contactos familiares",
    description: "Familiares o amigos cercanos a quien llamar en una emergencia.",
    icon: Users,
    accent: "border-l-emerald-500/60",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    itemAccent: "border-l-emerald-500/50",
    emptyHint:
      "Agrega al menos un familiar o amigo de confianza. Te servirá si necesitas apoyo inmediato.",
  },
  institution: {
    title: "Instituciones",
    description: "Clínicas, colegios, veterinarias u otras instituciones relevantes.",
    icon: Building2,
    accent: "border-l-blue-500/60",
    chip: "border-blue-500/30 bg-blue-500/10 text-blue-200",
    itemAccent: "border-l-blue-500/50",
    emptyHint:
      "Agrega instituciones que te interese tener a mano (clínica, colegio, veterinaria, etc.).",
  },
}

const SERVICE_META: Record<
  (typeof NATIONAL_EMERGENCY_NUMBERS)[number]["service"],
  { icon: LucideIcon; chip: string }
> = {
  Ambulancia: {
    icon: HeartPulse,
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  },
  Bomberos: {
    icon: Flame,
    chip: "border-orange-500/30 bg-orange-500/10 text-orange-200",
  },
  Carabineros: {
    icon: Shield,
    chip: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  },
  PDI: {
    icon: ShieldCheck,
    chip: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  },
  CONAF: {
    icon: Trees,
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },
  SERNAMEG: {
    icon: UserCheck,
    chip: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  },
}

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

function getInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed.charAt(0).toUpperCase() || "?"
}

function isContactComplete(c: FamilyContact): boolean {
  return c.name.trim().length > 0 && c.phone.trim().length > 0
}

function ContactAvatar({ name, id }: { name: string; id: string }) {
  const palette = getPalette(id)
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center border font-mono text-[11px] font-semibold uppercase",
        palette.bg,
        palette.text,
        palette.border,
      )}
      aria-hidden
    >
      {getInitial(name)}
    </span>
  )
}

function ProgressBanner({
  done,
  total,
  familyCount,
  institutionCount,
}: {
  done: number
  total: number
  familyCount: number
  institutionCount: number
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
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
        >
          {allDone ? <Check className="size-4" /> : `${pct}%`}
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/85">
            Directorio de emergencia
          </p>
          <p className="mt-0.5 text-[11.5px] text-white/55">
            {total === 0
              ? "Aún no agregas contactos"
              : `${done} de ${total} contactos completos`}
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[12rem] sm:items-end">
        <div className="relative h-1.5 w-full border border-white/10 bg-white/5 sm:max-w-xs">
          <span
            className={cn(
              "block h-full transition-all duration-300",
              allDone ? "bg-emerald-400/80" : "bg-white/40",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <FamilyPlanStatusChip tone={familyCount === 0 ? "empty" : "started"}>
            <Users className="size-3" aria-hidden />
            {familyCount}
          </FamilyPlanStatusChip>
          <FamilyPlanStatusChip
            tone={institutionCount === 0 ? "empty" : "started"}
          >
            <Building2 className="size-3" aria-hidden />
            {institutionCount}
          </FamilyPlanStatusChip>
        </div>
      </div>
    </FamilyPlanStatusBanner>
  )
}

function ServiceRow({
  service,
  phone,
}: {
  service: (typeof NATIONAL_EMERGENCY_NUMBERS)[number]["service"]
  phone: string
}) {
  const meta = SERVICE_META[service]
  const Icon = meta.icon
  return (
    <div
      className={cn(
        "glass-mica interactive-mica flex min-h-11 items-center justify-between gap-2 border border-white/15 bg-white/[0.04] px-3 py-2 transition-colors hover:border-white/25",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center border",
            meta.chip,
          )}
          aria-hidden
        >
          <Icon className="size-3.5" />
        </span>
        <span className="truncate text-[12px] text-white/85">{service}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[14px] font-semibold tabular-nums text-emerald-300">
          {phone}
        </span>
        <CopyButton value={phone} label={`Copiar ${phone}`} />
      </div>
    </div>
  )
}

function CopyButton({
  value,
  label,
}: {
  value: string
  label: string
}) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center border border-white/15 bg-white/[0.04] text-white/55 transition-colors",
        "hover:border-white/30 hover:bg-white/[0.10] hover:text-white",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-300" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </button>
  )
}

function ContactCard({
  contact,
  onUpdate,
  onRemove,
}: {
  contact: FamilyContact
  onUpdate: (patch: Partial<FamilyContact>) => void
  onRemove: () => void
}) {
  const complete = isContactComplete(contact)
  const meta = CATEGORY_META[contact.type]
  return (
    <FamilyPlanItemCard
      accentClassName={meta.itemAccent}
      className={cn(!complete && "border-dashed")}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <ContactAvatar name={contact.name} id={contact.id} />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] text-white/90">
              {contact.name.trim() || "Contacto sin nombre"}
            </p>
            <p className="font-mono text-[11px] tabular-nums text-white/45">
              {contact.phone.trim() || "Sin teléfono"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
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
          <button
            type="button"
            onClick={onRemove}
            aria-label="Eliminar contacto"
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center border border-white/10 bg-transparent text-white/55 transition-colors",
              "hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
            )}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </header>
      <FamilyPlanFormGrid>
        <FamilyPlanField label="Nombre">
          <Input
            value={contact.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Ej. Mamá"
          />
        </FamilyPlanField>
        <FamilyPlanField label="Teléfono">
          <Input
            value={contact.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="+56 9 ..."
            inputMode="tel"
          />
        </FamilyPlanField>
        <FamilyPlanField label="Dirección" className={FAMILY_PLAN_FORM_FULL_CLASS}>
          <Input
            value={contact.address}
            onChange={(e) => onUpdate({ address: e.target.value })}
            placeholder="Calle, número, comuna"
          />
        </FamilyPlanField>
      </FamilyPlanFormGrid>
    </FamilyPlanItemCard>
  )
}

function AddContactPanel({
  category,
  onAdd,
}: {
  category: ContactType
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
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/85">
            Agregar a {meta.title.toLowerCase()}
          </p>
          <p className="mt-0.5 text-[11.5px] text-white/45">{meta.emptyHint}</p>
        </div>
      </header>
      <FamilyPlanAddCta onClick={onAdd} label="Agregar contacto" icon={Icon} />
    </FamilyPlanAddPanel>
  )
}

function ContactCategoryCard({
  category,
  contacts,
  onAdd,
  onUpdate,
  onRemove,
}: {
  category: ContactType
  contacts: FamilyContact[]
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<FamilyContact>) => void
  onRemove: (id: string) => void
}) {
  const meta = CATEGORY_META[category]
  const Icon = meta.icon
  const completed = contacts.filter(isContactComplete).length
  const tone =
    contacts.length === 0
      ? "empty"
      : completed === contacts.length
        ? "complete"
        : "pending"

  return (
    <FamilyPlanCategoryShell
      accentClassName={meta.accent}
      header={
        <>
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
          <FamilyPlanStatusChip tone={tone}>
            {contacts.length === 0 ? "Vacío" : `${completed}/${contacts.length}`}
          </FamilyPlanStatusChip>
        </>
      }
    >
      {contacts.length === 0 ? (
        <FamilyPlanEmptyState className="gap-3 px-3 py-6">
          <Icon className="size-6 text-white/35" aria-hidden />
          <p className="text-[12px] text-white/55">
            Aún no has agregado contactos en esta categoría.
          </p>
          <p className="max-w-sm text-[11px] text-white/40">{meta.emptyHint}</p>
          <FamilyPlanAddCta
            onClick={onAdd}
            label="Agregar contacto"
            icon={Icon}
            className="sm:self-center"
          />
        </FamilyPlanEmptyState>
      ) : (
        <div className="flex flex-col gap-2">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onUpdate={(patch) => onUpdate(contact.id, patch)}
              onRemove={() => onRemove(contact.id)}
            />
          ))}
        </div>
      )}
      {contacts.length > 0 ? (
        <AddContactPanel category={category} onAdd={onAdd} />
      ) : null}
    </FamilyPlanCategoryShell>
  )
}

export function StepContacts() {
  const { data, updateData } = useFamilyPlan()
  if (!data) return null

  function addContact(type: ContactType) {
    const contact: FamilyContact = {
      id: newId(),
      name: "",
      phone: "",
      address: "",
      type,
    }
    updateData((prev) => ({ ...prev, contacts: [...prev.contacts, contact] }))
  }

  function updateContact(id: string, patch: Partial<FamilyContact>) {
    updateData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }

  function removeContact(id: string) {
    updateData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
    }))
  }

  const familyContacts = data.contacts.filter((c) => c.type === "family")
  const institutionContacts = data.contacts.filter(
    (c) => c.type === "institution",
  )
  const totalContacts = data.contacts.length
  const completedContacts = data.contacts.filter(isContactComplete).length

  return (
    <FamilyPlanStepRoot>
      <ProgressBanner
        done={completedContacts}
        total={totalContacts}
        familyCount={familyContacts.length}
        institutionCount={institutionContacts.length}
      />

      <FamilyPlanSection
        title="Emergencias nacionales (Chile)"
        description="Números oficiales disponibles 24/7 en todo el país. Toca el ícono para copiar."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {NATIONAL_EMERGENCY_NUMBERS.map((item) => (
            <ServiceRow
              key={item.service}
              service={item.service}
              phone={item.phone}
            />
          ))}
        </div>
      </FamilyPlanSection>

      <ContactCategoryCard
        category="family"
        contacts={familyContacts}
        onAdd={() => addContact("family")}
        onUpdate={updateContact}
        onRemove={removeContact}
      />
      <ContactCategoryCard
        category="institution"
        contacts={institutionContacts}
        onAdd={() => addContact("institution")}
        onUpdate={updateContact}
        onRemove={removeContact}
      />
    </FamilyPlanStepRoot>
  )
}
