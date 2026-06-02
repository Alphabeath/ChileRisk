type Position = [number, number]
type LinearRing = Position[]
type PolygonCoords = LinearRing[]
type MultiPolygonCoords = PolygonCoords[]

function pointInRing(lng: number, lat: number, ring: LinearRing): boolean {
  if (ring.length < 3) return false
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function pointInPolygonCoords(lng: number, lat: number, coords: PolygonCoords): boolean {
  if (!coords[0]?.length) return false
  if (!pointInRing(lng, lat, coords[0])) return false
  for (let h = 1; h < coords.length; h++) {
    if (pointInRing(lng, lat, coords[h])) return false
  }
  return true
}

export function pointInGeometry(
  lng: number,
  lat: number,
  geometry: { type?: string; coordinates?: unknown } | null | undefined
): boolean {
  if (!geometry?.coordinates) return false
  if (geometry.type === "Polygon") {
    return pointInPolygonCoords(lng, lat, geometry.coordinates as PolygonCoords)
  }
  if (geometry.type === "MultiPolygon") {
    const polys = geometry.coordinates as MultiPolygonCoords
    return polys.some((poly) => pointInPolygonCoords(lng, lat, poly))
  }
  return false
}