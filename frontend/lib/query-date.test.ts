import { describe, expect, test } from "bun:test"

import {
  QUERY_DATE_MAX_DAYS_BACK,
  addDaysIso,
  clampQueryDate,
  formatIsoDate,
  formatQueryDateLabel,
  minQueryDateIso,
  parseIsoDate,
  todayIsoDate,
} from "./query-date"

describe("query-date", () => {
  test("formatIsoDate / parseIsoDate round-trip", () => {
    expect(formatIsoDate(parseIsoDate("2026-07-13"))).toBe("2026-07-13")
  })

  test("minQueryDateIso is 29 days before reference (30-day window)", () => {
    expect(minQueryDateIso("2026-07-13")).toBe("2026-06-14")
    expect(QUERY_DATE_MAX_DAYS_BACK).toBe(30)
  })

  test("clampQueryDate clamps below and above window", () => {
    const ref = "2026-07-13"
    expect(clampQueryDate("2026-01-01", ref)).toBe("2026-06-14")
    expect(clampQueryDate("2026-12-31", ref)).toBe("2026-07-13")
    expect(clampQueryDate("2026-07-01", ref)).toBe("2026-07-01")
  })

  test("addDaysIso clamps when stepping past today", () => {
    const today = todayIsoDate()
    expect(addDaysIso(today, 1)).toBe(today)
    const yesterday = (() => {
      const d = parseIsoDate(today)
      d.setDate(d.getDate() - 1)
      return formatIsoDate(d)
    })()
    expect(addDaysIso(today, -1)).toBe(yesterday)
  })

  test("formatQueryDateLabel Hoy / Ayer / date", () => {
    expect(formatQueryDateLabel("2026-07-13", "2026-07-13")).toBe("Hoy")
    expect(formatQueryDateLabel("2026-07-12", "2026-07-13")).toBe("Ayer")
    expect(formatQueryDateLabel("2026-07-01", "2026-07-13")).toBe("01/07/2026")
  })
})
