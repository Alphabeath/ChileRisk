"use client"

import { Plus, Trash2 } from "lucide-react"

import {
  FamilyPlanField,
  FamilyPlanSection,
  newId,
} from "@/components/preparation/family-plan/family-plan-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NATIONAL_EMERGENCY_NUMBERS } from "@/lib/family-plan-defaults"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import type { FamilyContact } from "@/lib/types"

export function StepContacts() {
  const { data, updateData } = useFamilyPlan()
  if (!data) return null

  function updateContact(id: string, patch: Partial<FamilyContact>) {
    updateData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }

  function addContact(type: "family" | "institution") {
    const contact: FamilyContact = {
      id: newId(),
      name: "",
      phone: "",
      address: "",
      type,
    }
    updateData((prev) => ({ ...prev, contacts: [...prev.contacts, contact] }))
  }

  function removeContact(id: string) {
    updateData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
    }))
  }

  const familyContacts = data.contacts.filter((c) => c.type === "family")
  const institutionContacts = data.contacts.filter((c) => c.type === "institution")

  return (
    <div className="flex flex-col gap-8">
      <FamilyPlanSection title="Emergencias nacionales (Chile)">
        <div className="grid gap-2 sm:grid-cols-2">
          {NATIONAL_EMERGENCY_NUMBERS.map((item) => (
            <div
              key={item.service}
              className="glass-mica interactive-mica flex items-center justify-between border border-white/15 bg-white/[0.04] px-3 py-2"
            >
              <span className="text-[12px] text-white/75">{item.service}</span>
              <span className="font-mono text-sm text-emerald-300">{item.phone}</span>
            </div>
          ))}
        </div>
      </FamilyPlanSection>

      <ContactList
        title="Contactos familiares"
        contacts={familyContacts}
        onUpdate={updateContact}
        onRemove={removeContact}
        onAdd={() => addContact("family")}
      />

      <ContactList
        title="Instituciones"
        contacts={institutionContacts}
        onUpdate={updateContact}
        onRemove={removeContact}
        onAdd={() => addContact("institution")}
      />
    </div>
  )
}

function ContactList({
  title,
  contacts,
  onUpdate,
  onRemove,
  onAdd,
}: {
  title: string
  contacts: FamilyContact[]
  onUpdate: (id: string, patch: Partial<FamilyContact>) => void
  onRemove: (id: string) => void
  onAdd: () => void
}) {
  return (
    <FamilyPlanSection title={title}>
      <div className="flex flex-col gap-3">
        {contacts.map((contact, index) => (
          <article
            key={contact.id}
            className="glass-mica interactive-mica border border-white/15 bg-white/[0.04] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] text-white/70">Contacto {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onRemove(contact.id)}
                aria-label={`Eliminar contacto ${index + 1}`}
              >
                <Trash2 data-icon="inline-only" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FamilyPlanField label="Nombre">
                <Input
                  value={contact.name}
                  onChange={(e) => onUpdate(contact.id, { name: e.target.value })}
                />
              </FamilyPlanField>
              <FamilyPlanField label="Teléfono">
                <Input
                  value={contact.phone}
                  onChange={(e) => onUpdate(contact.id, { phone: e.target.value })}
                />
              </FamilyPlanField>
              <FamilyPlanField label="Dirección" className="sm:col-span-2">
                <Input
                  value={contact.address}
                  onChange={(e) => onUpdate(contact.id, { address: e.target.value })}
                />
              </FamilyPlanField>
              <FamilyPlanField label="Tipo">
                <Select
                  value={contact.type}
                  onValueChange={(value) =>
                    onUpdate(contact.id, {
                      type: value as FamilyContact["type"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Familiar</SelectItem>
                    <SelectItem value="institution">Institución</SelectItem>
                  </SelectContent>
                </Select>
              </FamilyPlanField>
            </div>
          </article>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={onAdd}>
        <Plus data-icon="inline-start" />
        Agregar contacto
      </Button>
    </FamilyPlanSection>
  )
}