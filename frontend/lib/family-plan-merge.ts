import { createDefaultFamilyPlanData } from "@/lib/family-plan-defaults"
import type { FamilyPlanData } from "@/lib/types"

function mergeKitSection(
  defaults: Record<string, boolean>,
  saved: Record<string, boolean> | undefined,
): Record<string, boolean> {
  const merged = { ...defaults }
  if (saved) {
    for (const [key, value] of Object.entries(saved)) {
      if (key in merged) merged[key] = value
    }
  }
  return merged
}

/** Merge server data with defaults so new checklist items appear after app updates. */
export function mergeFamilyPlanData(partial: Partial<FamilyPlanData> | undefined): FamilyPlanData {
  const defaults = createDefaultFamilyPlanData()
  if (!partial) return defaults

  const defaultThreatsById = new Map(defaults.threats.map((t) => [t.id, t]))
  const threats = partial.threats?.length
    ? partial.threats.map((t) => ({
        ...defaultThreatsById.get(t.id),
        ...t,
      }))
    : defaults.threats

  const defaultZonesByEmergency = new Map(
    defaults.safe_zones.map((z) => [z.emergency, z]),
  )
  const safe_zones = partial.safe_zones?.length
    ? partial.safe_zones.map((z) => ({
        ...defaultZonesByEmergency.get(z.emergency),
        ...z,
      }))
    : defaults.safe_zones

  const defaultRolesByTask = new Map(defaults.roles.map((r) => [r.task, r]))
  const roles = partial.roles?.length
    ? partial.roles.map((r) => ({
        ...defaultRolesByTask.get(r.task),
        ...r,
      }))
    : defaults.roles

  return {
    members: partial.members ?? defaults.members,
    pets: partial.pets ?? defaults.pets,
    threats,
    safe_zones,
    floor_map: {
      ...defaults.floor_map,
      ...partial.floor_map,
      rooms: partial.floor_map?.rooms ?? defaults.floor_map.rooms,
      markers: partial.floor_map?.markers ?? defaults.floor_map.markers,
      routes: partial.floor_map?.routes ?? defaults.floor_map.routes,
      zones: partial.floor_map?.zones ?? defaults.floor_map.zones,
      saved_at: partial.floor_map?.saved_at ?? defaults.floor_map.saved_at,
    },
    roles,
    contacts: partial.contacts ?? defaults.contacts,
    emergency_kit: {
      base: mergeKitSection(defaults.emergency_kit.base, partial.emergency_kit?.base),
      infant: mergeKitSection(defaults.emergency_kit.infant, partial.emergency_kit?.infant),
      pregnant: mergeKitSection(
        defaults.emergency_kit.pregnant,
        partial.emergency_kit?.pregnant,
      ),
      tea: mergeKitSection(defaults.emergency_kit.tea, partial.emergency_kit?.tea),
      pets: mergeKitSection(defaults.emergency_kit.pets, partial.emergency_kit?.pets),
    },
    drills: partial.drills ?? defaults.drills,
  }
}