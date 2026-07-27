import { describe, expect, test } from "bun:test"

import {
  htmlToPlainText,
  normalizeActiveAlert,
  normalizeActiveAlerts,
  sanitizeAlertHtml,
} from "./alerts-display"

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

  test("htmlToPlainText strips SERNAPRED content HTML", () => {
    const html =
      '<p><strong><span style="color: black">De acuerdo con la información proporcionada por la Dirección Meteorológica de Chile (DMC)</span></strong><span style="color: black">, se ha cancelado el siguiente...</span></p>'
    expect(htmlToPlainText(html)).toBe(
      "De acuerdo con la información proporcionada por la Dirección Meteorológica de Chile (DMC), se ha cancelado el siguiente...",
    )
  })

  test("htmlToPlainText keeps table cells separated", () => {
    const html =
      "<table><tr><th>Alertamiento</th><th>Pronóstico</th></tr><tr><td>Aviso A347-4</td><td>Viento normal</td></tr></table>"
    const plain = htmlToPlainText(html)
    expect(plain).toContain("Alertamiento")
    expect(plain).toContain("Pronóstico")
    expect(plain).toContain("Aviso A347-4")
    expect(plain).not.toContain("AlertamientoPronóstico")
    expect(plain).not.toContain("Aviso A347-4Viento")
  })

  test("htmlToPlainText decodes entities and collapses whitespace", () => {
    expect(htmlToPlainText("<p>A&nbsp;&amp;&nbsp;B</p>")).toBe("A & B")
    expect(htmlToPlainText("  plain  ")).toBe("plain")
    expect(htmlToPlainText("")).toBe("")
  })

  test("sanitizeAlertHtml keeps structure and strips unsafe attrs", () => {
    const html =
      '<p><strong><span style="color: black">DMC</span></strong></p>' +
      '<table><tr><th onclick="alert(1)">Alertamiento</th><td>Aviso</td></tr></table>' +
      '<script>evil()</script>'
    const clean = sanitizeAlertHtml(html)
    expect(clean).toContain("<p>")
    expect(clean).toContain("<strong>")
    expect(clean).toContain("<table>")
    expect(clean).toContain("<th>Alertamiento</th>")
    expect(clean).toContain("<td>Aviso</td>")
    expect(clean).not.toContain("style=")
    expect(clean).not.toContain("onclick")
    expect(clean).not.toContain("<script")
    expect(clean).not.toContain("evil")
  })
})
