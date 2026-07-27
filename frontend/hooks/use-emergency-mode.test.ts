import { describe, expect, test } from "bun:test"

import { normalizeActiveAlert } from "@/lib/alerts-display"
import type { ActiveAlert } from "@/lib/types"

import {
  matchEmergencyAlert,
  type EmergencyTarget,
} from "./use-emergency-mode"

function alert(raw: Record<string, unknown>): ActiveAlert {
  return normalizeActiveAlert({
    source: "senapred",
    affected_scope: "region",
    comuna_codes: [],
    ...raw,
  })
}

const ROJA_COQUIMBO = alert({
  id: "roja-4",
  level: "roja",
  region_code: 4,
  title: "Alerta Roja Región de Coquimbo",
})

const NARANJA_MAULE = alert({
  id: "naranja-7",
  level: "naranja",
  region_code: 7,
  title: "Alerta Naranja Maule",
})

const ROJA_ARAUCO = alert({
  id: "roja-8202",
  level: "roja",
  region_code: 8,
  affected_scope: "comuna",
  comuna_codes: [8202],
  title: "Alerta Roja comuna de Arauco",
})

const AMARILLA_4 = alert({
  id: "amarilla-4",
  level: "amarilla",
  region_code: 4,
  title: "Amarilla Coquimbo",
})

const HOME_COQUIMBO: EmergencyTarget = {
  code: 4102,
  name: "Coquimbo",
  region: 4,
}

const GEO_RM: EmergencyTarget = {
  code: 13101,
  name: "Santiago",
  region: 13,
}

const GEO_COQUIMBO: EmergencyTarget = {
  code: 4101,
  name: "La Serena",
  region: 4,
}

describe("matchEmergencyAlert", () => {
  test("matches regional alert via home comuna when geo is elsewhere", () => {
    const match = matchEmergencyAlert([ROJA_COQUIMBO], GEO_RM, HOME_COQUIMBO)
    expect(match?.alert.id).toBe("roja-4")
    expect(match?.target.code).toBe(4102)
  })

  test("prefers geo target for display when the alert also applies there", () => {
    const match = matchEmergencyAlert(
      [ROJA_COQUIMBO],
      GEO_COQUIMBO,
      HOME_COQUIMBO,
    )
    expect(match?.alert.id).toBe("roja-4")
    expect(match?.target.code).toBe(4101)
  })

  test("matches via geo when there is no home comuna", () => {
    const match = matchEmergencyAlert([ROJA_COQUIMBO], GEO_COQUIMBO, null)
    expect(match?.alert.id).toBe("roja-4")
    expect(match?.target.code).toBe(4101)
  })

  test("ignores non-emergency levels", () => {
    const match = matchEmergencyAlert([AMARILLA_4], GEO_COQUIMBO, HOME_COQUIMBO)
    expect(match).toBeNull()
  })

  test("returns null when no alert applies to any target", () => {
    const match = matchEmergencyAlert([ROJA_ARAUCO], GEO_RM, HOME_COQUIMBO)
    expect(match).toBeNull()
  })

  test("comuna-scoped alert matches only the listed comuna", () => {
    const araoco: EmergencyTarget = { code: 8202, name: "Arauco", region: 8 }
    const match = matchEmergencyAlert([ROJA_ARAUCO], null, araoco)
    expect(match?.alert.id).toBe("roja-8202")
    expect(match?.target.code).toBe(8202)
  })

  test("picks roja over naranja when both apply", () => {
    const homeMaule: EmergencyTarget = { code: 7301, name: "Talca", region: 7 }
    const match = matchEmergencyAlert(
      [NARANJA_MAULE, ROJA_COQUIMBO],
      null,
      homeMaule,
    )
    // Only naranja applies to home Maule → it wins (roja applies to no target).
    expect(match?.alert.id).toBe("naranja-7")

    const both = matchEmergencyAlert(
      [NARANJA_MAULE, ROJA_COQUIMBO],
      GEO_COQUIMBO,
      homeMaule,
    )
    expect(both?.alert.id).toBe("roja-4")
  })

  test("returns null without resolvable targets (null region)", () => {
    const noRegion: EmergencyTarget = { code: 4102, name: "Coquimbo", region: null }
    expect(matchEmergencyAlert([ROJA_COQUIMBO], null, noRegion)).toBeNull()
    expect(matchEmergencyAlert([ROJA_COQUIMBO], null, null)).toBeNull()
  })
})
