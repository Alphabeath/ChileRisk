import { describe, it } from "node:test"
import assert from "node:assert/strict"

import {
  QUERY_DATE_MAX_DAYS_BACK,
  addDaysIso,
  clampQueryDate,
  formatIsoDate,
  formatQueryDateCompactLabel,
  formatQueryDateLabel,
  minQueryDateIso,
  parseIsoDate,
  todayIsoDate,
} from "./query-date"

describe("query-date", () => {
  it("formatIsoDate / parseIsoDate round-trip", () => {
    assert.equal(formatIsoDate(parseIsoDate("2026-07-13")), "2026-07-13")
  })

  it("minQueryDateIso is 29 days before reference (30-day window)", () => {
    assert.equal(minQueryDateIso("2026-07-13"), "2026-06-14")
    assert.equal(QUERY_DATE_MAX_DAYS_BACK, 30)
  })

  it("clampQueryDate clamps below and above window", () => {
    const ref = "2026-07-13"
    assert.equal(clampQueryDate("2026-01-01", ref), "2026-06-14")
    assert.equal(clampQueryDate("2026-12-31", ref), "2026-07-13")
    assert.equal(clampQueryDate("2026-07-01", ref), "2026-07-01")
  })

  it("addDaysIso clamps when stepping past today", () => {
    const today = todayIsoDate()
    assert.equal(addDaysIso(today, 1), today)
    const d = parseIsoDate(today)
    d.setDate(d.getDate() - 1)
    const yesterday = formatIsoDate(d)
    assert.equal(addDaysIso(today, -1), yesterday)
  })

  it("formatQueryDateLabel Hoy / Ayer / date", () => {
    assert.equal(formatQueryDateLabel("2026-07-13", "2026-07-13"), "Hoy")
    assert.equal(formatQueryDateLabel("2026-07-12", "2026-07-13"), "Ayer")
    assert.equal(formatQueryDateLabel("2026-07-01", "2026-07-13"), "01/07/2026")
  })

  it("formatQueryDateCompactLabel shortens full dates", () => {
    assert.equal(formatQueryDateCompactLabel("2026-07-13", "2026-07-13"), "Hoy")
    assert.equal(formatQueryDateCompactLabel("2026-07-12", "2026-07-13"), "Ayer")
    assert.equal(formatQueryDateCompactLabel("2026-07-01", "2026-07-13"), "01/07")
  })
})
