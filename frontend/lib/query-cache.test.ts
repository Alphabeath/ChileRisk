import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { STALE, staleTimeForLive } from "./query-cache"
import { todayIsoDate } from "./query-date"

describe("staleTimeForLive", () => {
  const today = todayIsoDate()
  const yesterday = (() => {
    const [y, m, d] = today.split("-").map(Number)
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() - 1)
    const yy = dt.getFullYear()
    const mm = String(dt.getMonth() + 1).padStart(2, "0")
    const dd = String(dt.getDate()).padStart(2, "0")
    return `${yy}-${mm}-${dd}`
  })()

  it("today uses live TTL", () => {
    assert.equal(staleTimeForLive(today, STALE.alerts), STALE.alerts)
    assert.equal(staleTimeForLive(today, STALE.events), STALE.events)
  })

  it("historical date uses STALE.historical", () => {
    assert.equal(staleTimeForLive(yesterday, STALE.alerts), STALE.historical)
    assert.equal(staleTimeForLive(yesterday, STALE.risk), STALE.historical)
  })
})
