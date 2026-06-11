import type { FamilyPlanData } from "@/lib/types"

export interface StepStatus {
  step: number
  completed: boolean
}

export function isStepCompleted(data: FamilyPlanData, step: number): boolean {
  switch (step) {
    case 1:
      return data.members.some((m) => m.first_name.trim().length > 0)
    case 2:
      return data.threats.some(
        (t) => t.selected && t.probability >= 1 && t.impact >= 1,
      )
    case 3:
      return data.safe_zones.some((z) => z.safe_place.trim().length > 0)
    case 4:
      return data.floor_map.rooms.length >= 1 && data.floor_map.saved_at != null
    case 5:
      return data.roles.some((r) => r.member_id)
    case 6:
      return data.contacts.some(
        (c) =>
          (c.type === "family" || c.type === "institution") &&
          c.name.trim().length > 0,
      )
    case 7: {
      const { base, infant, pregnant, tea, pets } = data.emergency_kit
      return [base, infant, pregnant, tea, pets].some((section) =>
        Object.values(section).some(Boolean),
      )
    }
    case 8:
      return data.drills.some(
        (d) => d.date.trim().length > 0 || d.emergency_type.trim().length > 0,
      )
    default:
      return false
  }
}

export function getStepStatuses(data: FamilyPlanData): StepStatus[] {
  return Array.from({ length: 8 }, (_, i) => ({
    step: i + 1,
    completed: isStepCompleted(data, i + 1),
  }))
}

export function computeCompletionPct(data: FamilyPlanData): number {
  const completed = getStepStatuses(data).filter((s) => s.completed).length
  return Math.round((completed / 8) * 100)
}

export function firstIncompleteStep(data: FamilyPlanData): number {
  const statuses = getStepStatuses(data)
  const pending = statuses.find((s) => !s.completed)
  return pending?.step ?? 1
}