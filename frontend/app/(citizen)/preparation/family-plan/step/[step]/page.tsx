import { notFound } from "next/navigation"
import { Suspense } from "react"

import { FamilyPlanWizardShell } from "@/components/preparation/family-plan/family-plan-wizard-shell"
import { StepContacts } from "@/components/preparation/family-plan/step-contacts"
import { StepDrills } from "@/components/preparation/family-plan/step-drills"
import { StepEmergencyKit } from "@/components/preparation/family-plan/step-emergency-kit"
import { StepFamilyGroup } from "@/components/preparation/family-plan/step-family-group"
import { StepFloorMap } from "@/components/preparation/family-plan/step-floor-map"
import { StepRoles } from "@/components/preparation/family-plan/step-roles"
import { StepSafeZones } from "@/components/preparation/family-plan/step-safe-zones"
import { StepThreats } from "@/components/preparation/family-plan/step-threats"
import { WIZARD_STEPS } from "@/lib/family-plan-defaults"

const STEP_CONTENT: Record<
  number,
  { title: string; description: string; component: React.ReactNode }
> = {
  1: {
    title: "Grupo familiar",
    description:
      "Registra integrantes y mascotas, incluyendo condiciones médicas y necesidades especiales.",
    component: <StepFamilyGroup />,
  },
  2: {
    title: "Identificación de amenazas",
    description:
      "Detecta amenazas internas y externas. Evalúa probabilidad e impacto para priorizar acciones.",
    component: <StepThreats />,
  },
  3: {
    title: "Zonas seguras y evacuación",
    description:
      "Define cómo actuar ante distintos escenarios: lugar seguro, ruta, zona y punto de encuentro.",
    component: <StepSafeZones />,
  },
  4: {
    title: "Mapa de la vivienda",
    description:
      "Representa tu hogar: habitaciones, puntos de emergencia, zonas seguras y rutas de evacuación.",
    component: <StepFloorMap />,
  },
  5: {
    title: "Roles y responsabilidades",
    description: "Asigna tareas específicas a cada integrante según sus capacidades.",
    component: <StepRoles />,
  },
  6: {
    title: "Directorio de emergencia",
    description:
      "Centraliza números de emergencia nacionales y contactos familiares o institucionales.",
    component: <StepContacts />,
  },
  7: {
    title: "Kit de emergencia",
    description: "Prepara recursos para 72 horas de autonomía, incluyendo necesidades especiales.",
    component: <StepEmergencyKit />,
  },
  8: {
    title: "Simulación y mejora continua",
    description: "Registra simulacros y evalúa qué funcionó y qué debes mejorar.",
    component: <StepDrills />,
  },
}

type PageProps = {
  params: Promise<{ step: string }>
}

export function generateStaticParams() {
  return WIZARD_STEPS.map((s) => ({ step: String(s.step) }))
}

export default async function FamilyPlanStepPage({ params }: PageProps) {
  const { step: stepParam } = await params
  const step = Number(stepParam)

  if (!Number.isInteger(step) || step < 1 || step > 8) {
    notFound()
  }

  const content = STEP_CONTENT[step]

  return (
    <Suspense fallback={null}>
      <FamilyPlanWizardShell
        step={step}
        title={content.title}
        description={content.description}
      >
        {content.component}
      </FamilyPlanWizardShell>
    </Suspense>
  )
}