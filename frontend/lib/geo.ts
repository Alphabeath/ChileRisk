type Position = [number, number]
type LinearRing = Position[]
type PolygonCoords = LinearRing[]
type MultiPolygonCoords = PolygonCoords[]

const EARTH_RADIUS_KM = 6371

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const lat1Rad = (lat1 * Math.PI) / 180
  const lat2Rad = (lat2 * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function closestPointOnSegment(
  lat: number,
  lng: number,
  latA: number,
  lngA: number,
  latB: number,
  lngB: number,
): { lat: number; lng: number } {
  const cosLat = Math.cos(((latA + latB) / 2) * Math.PI / 180)
  const dx = lngB - lngA
  const dy = latB - latA
  const lenSq = dx * dx * cosLat * cosLat + dy * dy
  if (lenSq === 0) return { lat: latA, lng: lngA }
  let t = ((lng - lngA) * dx * cosLat * cosLat + (lat - latA) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return { lat: latA + t * dy, lng: lngA + t * dx }
}

function distanceToRingKm(lat: number, lng: number, ring: LinearRing): number {
  let min = Infinity
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [lngA, latA] = ring[j]
    const [lngB, latB] = ring[i]
    const cp = closestPointOnSegment(lat, lng, latA, lngA, latB, lngB)
    const d = haversineDistanceKm(lat, lng, cp.lat, cp.lng)
    if (d < min) min = d
  }
  return min
}

function distanceToPolygonKm(lat: number, lng: number, coords: PolygonCoords): number {
  if (!coords[0]?.length) return Infinity
  return distanceToRingKm(lat, lng, coords[0])
}

export function distanceToGeometryKm(
  lat: number,
  lng: number,
  geometry: { type?: string; coordinates?: unknown } | null | undefined,
): number {
  if (!geometry?.coordinates) return Infinity
  if (geometry.type === "Polygon") {
    return distanceToPolygonKm(lat, lng, geometry.coordinates as PolygonCoords)
  }
  if (geometry.type === "MultiPolygon") {
    const polys = geometry.coordinates as MultiPolygonCoords
    let min = Infinity
    for (const poly of polys) {
      const d = distanceToPolygonKm(lat, lng, poly)
      if (d < min) min = d
    }
    return min
  }
  return Infinity
}

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