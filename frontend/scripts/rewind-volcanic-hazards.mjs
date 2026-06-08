#!/usr/bin/env node
/**
 * Normalize volcanic-hazards.geojson for MapLibre (winding + invalid holes).
 *
 * Usage: node scripts/rewind-volcanic-hazards.mjs [input] [output]
 */
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { normalizeVolcanicHazards } from "../lib/normalize-volcanic-hazards.ts"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const input = process.argv[2] ?? join(root, "public/data/volcanos/volcanic-hazards.geojson")
const output =
  process.argv[3] ?? join(root, "public/data/volcanos/volcanic-hazards.geojson")

const geojson = JSON.parse(readFileSync(input, "utf8"))
const normalized = normalizeVolcanicHazards(geojson)
writeFileSync(output, JSON.stringify(normalized))

console.log(
  `Normalized ${geojson.features?.length ?? 0} → ${normalized.features.length} features → ${output}`,
)