import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  ALERT_BUCKETS,
  ALERT_HEX,
  ALERT_MAP_HEX,
  alertLevelFromScore,
  bucketForAlert,
  mapAirFillColorExpression,
  mapAlertFillColorExpression,
} from "./risk-scale"
import {
  AIR_QUALITY_LEVEL_META,
  AIR_QUALITY_UNCOVERED_HEX,
} from "./air-quality-display"

describe("alertLevelFromScore", () => {
  it("maps scores to the three ChileRisk alert gate levels", () => {
    assert.equal(alertLevelFromScore(0), "preventiva")
    assert.equal(alertLevelFromScore(34), "preventiva")
    assert.equal(alertLevelFromScore(35), "amarilla")
    assert.equal(alertLevelFromScore(54), "amarilla")
    assert.equal(alertLevelFromScore(55), "roja")
    assert.equal(alertLevelFromScore(100), "roja")
  })
})

describe("bucketForAlert", () => {
  it("accepts alert level names and legacy severity strings", () => {
    assert.equal(bucketForAlert("amarilla").level, "amarilla")
    assert.equal(bucketForAlert("moderado").level, "amarilla")
    assert.equal(bucketForAlert("critico").level, "roja")
    assert.equal(bucketForAlert(undefined, 60).level, "roja")
  })

  it("exposes cssVar for UI and hex for MapLibre", () => {
    const b = bucketForAlert("roja")
    assert.equal(b.cssVar, "var(--alert-roja)")
    assert.equal(b.hex, ALERT_HEX.roja)
  })
})

describe("mapAlertFillColorExpression", () => {
  it("reads feature-state first, then property, then unavailable gray", () => {
    const expr = mapAlertFillColorExpression() as unknown[]
    assert.equal(expr[0], "match")
    assert.deepEqual(expr[1], [
      "coalesce",
      ["feature-state", "alert_level"],
      ["get", "alert_level"],
      "",
    ])
    assert.equal(expr[expr.length - 1], ALERT_MAP_HEX.unavailable)
  })

  it("maps each ChileRisk / national level to map hex", () => {
    const expr = mapAlertFillColorExpression() as unknown[]
    const asPairs: Record<string, string> = {}
    for (let i = 2; i < expr.length - 1; i += 2) {
      asPairs[expr[i] as string] = expr[i + 1] as string
    }
    assert.equal(asPairs.roja, ALERT_MAP_HEX.roja)
    assert.equal(asPairs.amarilla, ALERT_MAP_HEX.amarilla)
    assert.equal(asPairs.preventiva, ALERT_MAP_HEX.preventiva)
  })

  it("buckets are ordered low→high without gaps or overlaps", () => {
    assert.ok(ALERT_BUCKETS[0].maxScore < ALERT_BUCKETS[1].minScore)
    assert.ok(ALERT_BUCKETS[1].maxScore < ALERT_BUCKETS[2].minScore)
    assert.equal(ALERT_BUCKETS[0].minScore, 0)
    assert.equal(ALERT_BUCKETS[2].maxScore, 100)
    assert.equal(ALERT_BUCKETS.length, 3)
  })
})

describe("mapAirFillColorExpression", () => {
  it("reads feature-state first, then property, then uncovered gray", () => {
    const expr = mapAirFillColorExpression() as unknown[]
    assert.equal(expr[0], "match")
    assert.deepEqual(expr[1], [
      "coalesce",
      ["feature-state", "air_level"],
      ["get", "air_level"],
      "",
    ])
    assert.equal(expr[expr.length - 1], AIR_QUALITY_UNCOVERED_HEX)
  })

  it("maps each GEC level to its display hex", () => {
    const expr = mapAirFillColorExpression() as unknown[]
    const asPairs: Record<string, string> = {}
    for (let i = 2; i < expr.length - 1; i += 2) {
      asPairs[expr[i] as string] = expr[i + 1] as string
    }
    assert.equal(asPairs.bueno, AIR_QUALITY_LEVEL_META.bueno.hex)
    assert.equal(asPairs.emergencia, AIR_QUALITY_LEVEL_META.emergencia.hex)
    assert.equal(asPairs.alerta, AIR_QUALITY_LEVEL_META.alerta.hex)
  })
})
