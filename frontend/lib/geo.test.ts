import { describe, expect, test } from "bun:test"

import { haversineDistanceKm } from "./geo"

describe("geo", () => {
  test("haversineDistanceKm is ~0 for same point", () => {
    expect(haversineDistanceKm(-33.45, -70.67, -33.45, -70.67)).toBeCloseTo(0, 5)
  })

  test("haversineDistanceKm Santiago–Valparaíso ~100 km", () => {
    const km = haversineDistanceKm(-33.4489, -70.6693, -33.0472, -71.6127)
    expect(km).toBeGreaterThan(90)
    expect(km).toBeLessThan(120)
  })
})
