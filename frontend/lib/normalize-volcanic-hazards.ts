import rewind from "@mapbox/geojson-rewind"
import type { Feature, FeatureCollection, Polygon, Position } from "geojson"

function dedupeRing(ring: Position[]): Position[] {
  if (ring.length < 2) return ring

  const out: Position[] = [ring[0]]
  for (let i = 1; i < ring.length; i++) {
    const prev = out[out.length - 1]
    const curr = ring[i]
    if (prev[0] === curr[0] && prev[1] === curr[1]) continue
    out.push(curr)
  }

  const first = out[0]
  const last = out[out.length - 1]
  if (out.length > 3 && first[0] === last[0] && first[1] === last[1]) {
    out.pop()
  }

  if (out.length < 3) return ring
  out.push([first[0], first[1]])
  return out
}

function pointInRing(point: Position, ring: Position[]): boolean {
  const [x, y] = point
  let inside = false

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }

  return inside
}

function ringInsideExterior(inner: Position[], exterior: Position[]): boolean {
  if (inner.length < 4 || exterior.length < 4) return false

  for (const point of inner) {
    if (!pointInRing(point, exterior)) return false
  }

  return true
}

function ringSignedArea(ring: Position[]): number {
  let area = 0
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  }
  return area / 2
}

/**
 * Shapefile exports often attach out-of-bounds rings as holes. MapLibre then fills
 * them incorrectly (negative area / detached patches). Keep only true interior holes.
 */
export function sanitizeVolcanicHazardFeature(
  feature: Feature<Polygon>,
): Feature<Polygon>[] {
  const rings = feature.geometry.coordinates.map(dedupeRing)
  if (!rings.length || rings[0].length < 4) return []

  const exterior = rings[0]
  const exteriorArea = Math.abs(ringSignedArea(exterior))
  const validHoles: Position[][] = []

  for (let i = 1; i < rings.length; i++) {
    const ring = rings[i]
    if (ring.length < 4) continue
    if (!ringInsideExterior(ring, exterior)) continue

    const holeArea = Math.abs(ringSignedArea(ring))
    if (exteriorArea > 0 && holeArea / exteriorArea > 0.9) continue

    validHoles.push(ring)
  }

  let coordinates: Position[][] = [exterior, ...validHoles]

  const holeAreaSum = validHoles.reduce((sum, ring) => sum + Math.abs(ringSignedArea(ring)), 0)
  if (holeAreaSum >= exteriorArea) {
    coordinates = [exterior]
  }

  const result: Feature<Polygon> = {
    type: "Feature",
    properties: { ...feature.properties },
    geometry: { type: "Polygon", coordinates },
  }

  rewind(result)
  return [result]
}

export function normalizeVolcanicHazards(
  collection: FeatureCollection<Polygon>,
): FeatureCollection<Polygon> {
  const features = collection.features.flatMap((feature) => {
    if (feature.geometry?.type !== "Polygon") return []
    return sanitizeVolcanicHazardFeature(feature as Feature<Polygon>)
  })

  return { type: "FeatureCollection", features }
}