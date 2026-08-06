import type { FeatureCollection, Point } from "geojson"
import { evacuationFeatureFields } from "@/lib/evacuacion-popup"

export interface EvacuationMeetingPoint {
  id: string
  comuna: string
  provincia: string
  sector: string
  lng: number
  lat: number
  distanceKm: number | null
}

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

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function extractMeetingPointsFromGeoJSON(
  collection: FeatureCollection,
  idPrefix = "meeting",
): Omit<EvacuationMeetingPoint, "distanceKm">[] {
  return collection.features.flatMap((feature, index) => {
    if (feature.geometry?.type !== "Point") return []
    const [lng, lat] = (feature.geometry as Point).coordinates
    const fields = evacuationFeatureFields(
      (feature.properties ?? {}) as Record<string, unknown>,
    )
    return [
      {
        id: `${idPrefix}-${index}`,
        comuna: fields.comuna,
        provincia: fields.provincia,
        sector: fields.sector,
        lng,
        lat,
      },
    ]
  })
}

export function nearestMeetingPoints(
  points: Omit<EvacuationMeetingPoint, "distanceKm">[],
  origin: { lng: number; lat: number } | null,
  limit = 5,
): EvacuationMeetingPoint[] {
  if (!origin) return []

  return points
    .map((point) => ({
      ...point,
      distanceKm: haversineDistanceKm(
        origin.lat,
        origin.lng,
        point.lat,
        point.lng,
      ),
    }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, limit)
}
