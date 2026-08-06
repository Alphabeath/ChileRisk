#!/usr/bin/env bun
/**
 * Build `frontend/public/data/comunas_labels.geojson` — one anchor point per
 * comuna (pole of inaccessibility approximation), computed offline so the
 * monitor map never runs `findPoleOfInaccessibility` over full rings at
 * runtime.
 *
 * Input:  comunas_simplified.geojson (345 features)
 * Output: comunas_labels.geojson    (345 Point features, { name })
 *
 * Usage: bun scripts/build-comunas-labels.mjs
 */
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(scriptDir, "../public/data")
const inputPath = path.join(publicDir, "comunas_simplified.geojson")
const outputPath = path.join(publicDir, "comunas_labels.geojson")

/** Pole-of-inaccessibility approximation (same algorithm the map used). */
function findPoleOfInaccessibility(ring) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const [x, y] of ring) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  const cosLat = Math.cos(((minY + maxY) / 2) * (Math.PI / 180))

  const pointInRing = (x, y) => {
    let inside = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0],
        yi = ring[i][1]
      const xj = ring[j][0],
        yj = ring[j][1]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
        inside = !inside
    }
    return inside
  }

  const distSqToRing = (x, y) => {
    const px = x * cosLat,
      py = y
    let best = Infinity
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const ax = ring[i][0] * cosLat,
        ay = ring[i][1]
      const bx = ring[j][0] * cosLat,
        by = ring[j][1]
      const abx = bx - ax,
        aby = by - ay
      const t = Math.max(
        0,
        Math.min(
          1,
          ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby),
        ),
      )
      const dx = ax + t * abx - px,
        dy = ay + t * aby - py
      const d = dx * dx + dy * dy
      if (d < best) best = d
    }
    return best
  }

  const bestInCells = (samples) => {
    let bx = 0,
      by = 0,
      bd = -1
    for (const [x, y] of samples) {
      if (!pointInRing(x, y)) continue
      const d = distSqToRing(x, y)
      if (d > bd) {
        bd = d
        bx = x
        by = y
      }
    }
    return [bx, by, bd]
  }

  const G = 10
  const coarse = []
  for (let i = 0; i < G; i++)
    for (let j = 0; j < G; j++) {
      coarse.push([
        minX + ((i + 0.5) / G) * (maxX - minX),
        minY + ((j + 0.5) / G) * (maxY - minY),
      ])
    }
  const [cx, cy, cd] = bestInCells(coarse)
  if (cd < 0) return [(minX + maxX) / 2, (minY + maxY) / 2]

  const cellW = (maxX - minX) / G,
    cellH = (maxY - minY) / G
  const F = 6
  const fine = []
  for (let i = 0; i < F; i++)
    for (let j = 0; j < F; j++) {
      fine.push([
        cx - 1.25 * cellW + (i / (F - 1)) * 2.5 * cellW,
        cy - 1.25 * cellH + (j / (F - 1)) * 2.5 * cellH,
      ])
    }
  const [fx, fy] = bestInCells(fine)
  return [fx, fy]
}

function largestRing(geometry) {
  const parts =
    geometry.type === "Polygon"
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((p) => p[0])

  let best = null
  let bestArea = -1
  for (const ring of parts) {
    if (!ring || ring.length < 3) continue
    let area = 0
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      area += ring[i][0] * ring[j][1] - ring[j][0] * ring[i][1]
    }
    area = Math.abs(area) / 2
    if (area > bestArea) {
      bestArea = area
      best = ring
    }
  }
  return best
}

const fc = JSON.parse(readFileSync(inputPath, "utf8"))
const features = []

for (const f of fc.features) {
  const name = f.properties?.Comuna
  const cod = f.properties?.cod_comuna
  if (typeof cod !== "number" || !name) continue
  const ring = largestRing(f.geometry)
  if (!ring) continue
  features.push({
    type: "Feature",
    properties: { name },
    geometry: { type: "Point", coordinates: findPoleOfInaccessibility(ring) },
  })
}

const out = { type: "FeatureCollection", features }
writeFileSync(outputPath, JSON.stringify(out))
console.log(
  `wrote ${outputPath}: ${features.length} label points, ${Math.round(
    Buffer.byteLength(JSON.stringify(out)) / 1024,
  )} KB`,
)
