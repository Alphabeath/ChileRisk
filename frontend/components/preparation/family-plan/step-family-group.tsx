"use client"

import { Plus, Trash2 } from "lucide-react"

import {
  FamilyPlanField,
  FamilyPlanSection,
  newId,
} from "@/components/preparation/family-plan/family-plan-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FAMILY_MEMBER_FLAGS } from "@/lib/family-plan-defaults"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import type { FamilyMember, Pet } from "@/lib/types"

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

  return (
    <div className="flex flex-col gap-8">
      <FamilyPlanSection
        title="Integrantes"
        description="Registra a todas las personas que viven en la vivienda."
      >
        <div className="flex flex-col gap-4">
          {data.members.map((member, index) => (
            <article
              key={member.id}
              className="border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="text-[12px] font-medium text-white/85">
                  Integrante {index + 1}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeMember(member.id)}
                  aria-label={`Eliminar integrante ${index + 1}`}
                >
                  <Trash2 data-icon="inline-only" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FamilyPlanField label="Nombre" htmlFor={`${member.id}-first`}>
                  <Input
                    id={`${member.id}-first`}
                    value={member.first_name}
                    onChange={(e) => updateMember(member.id, { first_name: e.target.value })}
                  />
                </FamilyPlanField>
                <FamilyPlanField label="Apellidos" htmlFor={`${member.id}-last`}>
                  <Input
                    id={`${member.id}-last`}
                    value={member.last_name}
                    onChange={(e) => updateMember(member.id, { last_name: e.target.value })}
                  />
                </FamilyPlanField>
                <FamilyPlanField label="Documento" htmlFor={`${member.id}-doc`}>
                  <Input
                    id={`${member.id}-doc`}
                    value={member.document}
                    onChange={(e) => updateMember(member.id, { document: e.target.value })}
                  />
                </FamilyPlanField>
                <FamilyPlanField label="Sexo" htmlFor={`${member.id}-sex`}>
                  <Input
                    id={`${member.id}-sex`}
                    value={member.sex}
                    onChange={(e) => updateMember(member.id, { sex: e.target.value })}
                  />
                </FamilyPlanField>
                <FamilyPlanField label="Edad" htmlFor={`${member.id}-age`}>
                  <Input
                    id={`${member.id}-age`}
                    type="number"
                    min={0}
                    value={member.age ?? ""}
                    onChange={(e) =>
                      updateMember(member.id, {
                        age: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </FamilyPlanField>
                <FamilyPlanField label="Nacionalidad" htmlFor={`${member.id}-nat`}>
                  <Input
                    id={`${member.id}-nat`}
                    value={member.nationality}
                    onChange={(e) => updateMember(member.id, { nationality: e.target.value })}
                  />
                </FamilyPlanField>
                <FamilyPlanField label="Teléfono" htmlFor={`${member.id}-phone`}>
                  <Input
                    id={`${member.id}-phone`}
                    value={member.phone}
                    onChange={(e) => updateMember(member.id, { phone: e.target.value })}
                  />
                </FamilyPlanField>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FamilyPlanField label="Condiciones médicas">
                  <Textarea
                    value={member.medical_conditions}
                    onChange={(e) =>
                      updateMember(member.id, { medical_conditions: e.target.value })
                    }
                  />
                </FamilyPlanField>
                <FamilyPlanField label="Contraindicaciones">
                  <Textarea
                    value={member.contraindications}
                    onChange={(e) =>
                      updateMember(member.id, { contraindications: e.target.value })
                    }
                  />
                </FamilyPlanField>
              </div>

              <FamilyPlanField label="Necesidades especiales" className="mt-3">
                <Textarea
                  value={member.special_needs}
                  onChange={(e) =>
                    updateMember(member.id, { special_needs: e.target.value })
                  }
                />
              </FamilyPlanField>

              <fieldset className="mt-3">
                <legend className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/55">
                  Condiciones especiales
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {FAMILY_MEMBER_FLAGS.map((flag) => (
                    <label
                      key={flag.id}
                      className="flex items-center gap-2 text-[12px] text-white/75"
                    >
                      <Checkbox
                        checked={member.flags.includes(flag.id)}
                        onCheckedChange={(checked) => {
                          const flags = checked
                            ? [...member.flags, flag.id]
                            : member.flags.filter((f) => f !== flag.id)
                          updateMember(member.id, { flags })
                        }}
                      />
                      {flag.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </article>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={addMember}>
          <Plus data-icon="inline-start" />
          Agregar integrante
        </Button>
      </FamilyPlanSection>

      <FamilyPlanSection title="Mascotas" description="Incluye mascotas que viven en el hogar.">
        <div className="flex flex-col gap-4">
          {data.pets.map((pet, index) => (
            <article
              key={pet.id}
              className="border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="text-[12px] font-medium text-white/85">
                  Mascota {index + 1}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removePet(pet.id)}
                  aria-label={`Eliminar mascota ${index + 1}`}
                >
                  <Trash2 data-icon="inline-only" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FamilyPlanField label="Nombre">
                  <Input
                    value={pet.name}
                    onChange={(e) => updatePet(pet.id, { name: e.target.value })}
                  />
                </FamilyPlanField>
                <FamilyPlanField label="Especie">
                  <Input
                    value={pet.species}
                    onChange={(e) => updatePet(pet.id, { species: e.target.value })}
                  />
                </FamilyPlanField>
                <FamilyPlanField label="Edad">
                  <Input
                    type="number"
                    min={0}
                    value={pet.age ?? ""}
                    onChange={(e) =>
                      updatePet(pet.id, {
                        age: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </FamilyPlanField>
                <FamilyPlanField label="Características">
                  <Input
                    value={pet.characteristics}
                    onChange={(e) =>
                      updatePet(pet.id, { characteristics: e.target.value })
                    }
                  />
                </FamilyPlanField>
              </div>
              <FamilyPlanField label="Necesidades especiales" className="mt-3">
                <Textarea
                  value={pet.special_needs}
                  onChange={(e) => updatePet(pet.id, { special_needs: e.target.value })}
                />
              </FamilyPlanField>
            </article>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={addPet}>
          <Plus data-icon="inline-start" />
          Agregar mascota
        </Button>
      </FamilyPlanSection>
    </div>
  )
}