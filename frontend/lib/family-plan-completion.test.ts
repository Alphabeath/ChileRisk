import { describe, expect, test } from "bun:test"

import type { FamilyPlanData } from "./types"
import {
  computeCompletionPct,
  firstIncompleteStep,
  isStepCompleted,
} from "./family-plan-completion"

function emptyPlan(): FamilyPlanData {
  return {
    members: [],
    pets: [],
    threats: [],
    safe_zones: [],
    floor_map: {
      rooms: [],
      markers: [],
      routes: [],
      zones: [],
      active_layer: "safe",
      saved_at: null,
    },
    roles: [],
    contacts: [],
    emergency_kit: {
      base: {},
      infant: {},
      pregnant: {},
      tea: {},
      pets: {},
    },
    drills: [],
  }
}

describe("family-plan-completion", () => {
  test("empty plan is 0% and step 1 incomplete", () => {
    const data = emptyPlan()
    expect(computeCompletionPct(data)).toBe(0)
    expect(firstIncompleteStep(data)).toBe(1)
    expect(isStepCompleted(data, 1)).toBe(false)
  })

  test("member with name completes step 1", () => {
    const data = emptyPlan()
    data.members = [
      {
        id: "1",
        first_name: "Ana",
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
      },
    ]
    expect(isStepCompleted(data, 1)).toBe(true)
    expect(firstIncompleteStep(data)).toBe(2)
    expect(computeCompletionPct(data)).toBe(13)
  })
})
