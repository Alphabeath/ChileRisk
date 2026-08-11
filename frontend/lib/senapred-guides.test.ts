import { it } from "node:test"
import assert from "node:assert/strict"

import { formatGuideTitle } from "./senapred-guides"

it("normalizes guide titles to sentence case", () => {
  assert.equal(
    formatGuideTitle("ENOS – El Niño y La Niña"),
    "Enos – el niño y la niña",
  )
  assert.equal(formatGuideTitle("Erupciones Volcánicas"), "Erupciones volcánicas")
})

it("trims whitespace and preserves an empty result", () => {
  assert.equal(formatGuideTitle("  SISMOS  "), "Sismos")
  assert.equal(formatGuideTitle(""), "")
})
