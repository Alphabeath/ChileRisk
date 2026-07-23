import { describe, expect, test } from "bun:test"

import { MAP_RISK_BUCKETS, MAP_RISK_DEFAULT_SCORE } from "./risk-scale"

function severityForScore(score: number): string {
  for (let i = MAP_RISK_BUCKETS.length - 1; i >= 0; i--) {
    if (score >= MAP_RISK_BUCKETS[i].minScore) return MAP_RISK_BUCKETS[i].severity
  }
  return MAP_RISK_BUCKETS[0].severity
}

describe("risk-scale", () => {
  test("default score sits in moderado bucket", () => {
    expect(severityForScore(MAP_RISK_DEFAULT_SCORE)).toBe("moderado")
  })

  test("bucket boundaries", () => {
    expect(severityForScore(0)).toBe("bajo")
    expect(severityForScore(34)).toBe("bajo")
    expect(severityForScore(35)).toBe("moderado")
    expect(severityForScore(54)).toBe("moderado")
    expect(severityForScore(55)).toBe("alto")
    expect(severityForScore(74)).toBe("alto")
    expect(severityForScore(75)).toBe("critico")
    expect(severityForScore(100)).toBe("critico")
  })

  test("buckets are contiguous 0–100", () => {
    expect(MAP_RISK_BUCKETS[0].minScore).toBe(0)
    expect(MAP_RISK_BUCKETS.at(-1)?.maxScore).toBe(100)
    for (let i = 1; i < MAP_RISK_BUCKETS.length; i++) {
      expect(MAP_RISK_BUCKETS[i].minScore).toBe(MAP_RISK_BUCKETS[i - 1].maxScore + 1)
    }
  })
})
