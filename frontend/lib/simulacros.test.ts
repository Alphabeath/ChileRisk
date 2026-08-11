import assert from "node:assert/strict"
import test from "node:test"

import type { Simulacro } from "@/lib/types"
import {
  DRILL_TYPE_COLORS,
  DRILL_TYPE_LABELS,
  formatSimulacroDate,
  hasSimulacroDetailPage,
  partitionSimulacros,
} from "@/lib/simulacros"

function item(slug: string, drill_date: string): Simulacro {
  return {
    slug,
    title: slug,
    drill_date,
    region_code: null,
    region_name: null,
    drill_type: "otro",
    participating_comunas: [],
    summary: null,
    detail_url: "https://senapred.cl/simulacros/",
    mensaje_sae: false,
    source: drill_date < "2026-08-06" ? "recent" : "future",
    synced_at: "2026-08-06T00:00:00Z",
  }
}

test("formatSimulacroDate uses Chilean calendar labels", () => {
  assert.deepEqual(formatSimulacroDate("2026-08-13"), {
    weekday: "jueves",
    day: "13",
    month: "ago",
    year: "2026",
  })
})

test("DRILL_TYPE_LABELS covers the public drill type contract", () => {
  assert.deepEqual(DRILL_TYPE_LABELS, {
    sismo_tsunami_borde_costero: "Sismo y tsunami · borde costero",
    sismo_tsunami_educacion: "Sismo y tsunami · educación",
    erupcion_volcanica: "Erupción volcánica",
    remocion_en_masa: "Remoción en masa",
    otro: "Otro simulacro",
  })
})


test("DRILL_TYPE_COLORS covers every public drill type", () => {
  assert.deepEqual(
    Object.keys(DRILL_TYPE_COLORS).sort(),
    Object.keys(DRILL_TYPE_LABELS).sort(),
  )
  for (const colors of Object.values(DRILL_TYPE_COLORS)) {
    assert.match(colors.accent, /^#[0-9a-fA-F]{6}$/)
    assert.match(colors.ink, /^#[0-9a-fA-F]{6}$/)
  }
})


test("hasSimulacroDetailPage rejects the calendar fallback URL", () => {
  assert.equal(
    hasSimulacroDetailPage(
      "https://senapred.cl/simulacros_t/srm-ohiggins-2026/",
    ),
    true,
  )
  assert.equal(
    hasSimulacroDetailPage(
      "https://senapred.cl/simulacros_t/srm-ohiggins-2026/?ref=calendar",
    ),
    true,
  )
  assert.equal(
    hasSimulacroDetailPage("https://senapred.cl/simulacros/"),
    false,
  )
  assert.equal(hasSimulacroDetailPage("not a url"), false)
})

test("partitionSimulacros includes today, sorts, and preserves input", () => {
  const items = [
    item("future-late", "2026-08-20"),
    item("past-early", "2026-08-01"),
    item("today", "2026-08-06"),
    item("past-late", "2026-08-05"),
    item("future-early", "2026-08-07"),
  ]
  const originalOrder = items.map((entry) => entry.slug)

  const result = partitionSimulacros(items, "2026-08-06")

  assert.deepEqual(
    result.upcoming.map((entry) => entry.slug),
    ["today", "future-early", "future-late"],
  )
  assert.deepEqual(result.past.map((entry) => entry.slug), ["past-late", "past-early"])
  assert.deepEqual(
    items.map((entry) => entry.slug),
    originalOrder,
  )
})
