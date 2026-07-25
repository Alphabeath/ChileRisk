import { describe, expect, test } from "bun:test"

import { normalizeActiveAlert, normalizeActiveAlerts } from "./alerts-display"

describe("alerts-display", () => {
  test("normalizeActiveAlert maps legacy senapred_url and defaults", () => {
    const alert = normalizeActiveAlert({
      id: "abc",
      level: "roja",
      title: "Alerta roja",
      senapred_url: "https://senapred.cl/alerta/1",
      issued_at: "2026-07-01T12:00:00Z",
      synced_at: "2026-07-01T12:05:00Z",
    })
    expect(alert.source).toBe("senapred")
    expect(alert.level).toBe("roja")
    expect(alert.external_url).toBe("https://senapred.cl/alerta/1")
    expect(alert.affected_scope).toBe("unknown")
    expect(alert.comuna_codes).toEqual([])
    expect(alert.record_kind).toBe("alerta")
  })

  test("normalizeActiveAlert infers chilerisk from id prefix", () => {
    const alert = normalizeActiveAlert({
      id: "cr-region-13-sismo",
      title: "Riesgo",
    })
    expect(alert.source).toBe("chilerisk")
  })

  test("normalizeActiveAlert accepts sernageomin source and id prefix", () => {
    const bySource = normalizeActiveAlert({
      id: "sernageomin:nevados-de-chillan",
      source: "sernageomin",
      level: "amarilla",
      title: "Alerta Amarilla",
      external_url: "https://www.sernageomin.cl/alertas-volcanicas/",
    })
    expect(bySource.source).toBe("sernageomin")
    expect(bySource.external_url).toContain("sernageomin")

    const byId = normalizeActiveAlert({
      id: "sernageomin:villarrica",
      title: "Alerta",
    })
    expect(byId.source).toBe("sernageomin")
  })

  test("normalizeActiveAlerts ignores non-arrays", () => {
    expect(normalizeActiveAlerts(null)).toEqual([])
    expect(normalizeActiveAlerts({ id: "x" })).toEqual([])
    expect(normalizeActiveAlerts([{ id: "1", level: "amarilla", title: "A" }])).toHaveLength(
      1,
    )
  })
})
