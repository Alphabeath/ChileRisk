import { pointInGeometry } from "@/lib/geo"
import { formatDepth, formatMagnitude } from "@/lib/format"
import { getSeismicAccentColor, getSeismicDetailUrl, getSeismicLocation, isSeismicPerceived } from "@/lib/seismic"
import type { SeismicEvent } from "@/lib/types"
import type { ComunaProperties } from "@/components/map/map-config"

export const POPUP_SEISMIC_MIN_MAGNITUDE = 4
/** Minimum magnitude for perceived events to show in popups (matches marker threshold). */
export const POPUP_SEISMIC_MIN_PERCEIVED_MAGNITUDE = 3

export interface PopupSeismicItem {
  event: SeismicEvent
  distanceKm?: number
  estimatedIntensity?: number
}

/** Events above this magnitude are always shown (offshore/interplate). */
export const POPUP_SEISMIC_OFFSHORE_MIN_MAGNITUDE = 5

export function filterRecentEventsInGeometry(
  events: SeismicEvent[],
  geometry: { type?: string; coordinates?: unknown } | null | undefined,
  minMagnitude = POPUP_SEISMIC_MIN_MAGNITUDE,
  alertDetailUrls?: Set<string>
): SeismicEvent[] {
  return events
    .filter(
      (e) =>
        e.longitude != null &&
        e.latitude != null &&
        typeof e.magnitude === "number" &&
        (e.magnitude >= POPUP_SEISMIC_OFFSHORE_MIN_MAGNITUDE ||
          pointInGeometry(e.longitude, e.latitude, geometry) ||
          (isSeismicPerceived(e) && e.magnitude >= POPUP_SEISMIC_MIN_PERCEIVED_MAGNITUDE))
    )
    .sort((a, b) => {
      const magDiff = b.magnitude - a.magnitude
      if (magDiff !== 0) return magDiff
      return new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    })
}

export function buildPopupSeismicItems(
  events: SeismicEvent[],
  seismicImpact?: ComunaProperties["seismic_impact"] | null
): PopupSeismicItem[] {
  const byId = new Map<number, PopupSeismicItem>()

  for (const event of events) {
    byId.set(event.id, { event })
  }

  if (seismicImpact && typeof seismicImpact.magnitude === "number") {
    const existing = byId.get(seismicImpact.event_id)
    if (existing) {
      byId.set(seismicImpact.event_id, {
        event: existing.event,
        distanceKm: seismicImpact.distance_km,
        estimatedIntensity: seismicImpact.estimated_intensity,
      })
    } else {
      byId.set(seismicImpact.event_id, {
        event: {
          id: seismicImpact.event_id,
          latitude: 0,
          longitude: 0,
          magnitude: seismicImpact.magnitude,
          depth_km: 0,
          occurred_at: seismicImpact.occurred_at ?? new Date(0).toISOString(),
          source: "impact",
          detail_url: seismicImpact.detail_url,
        },
        distanceKm: seismicImpact.distance_km,
        estimatedIntensity: seismicImpact.estimated_intensity,
      })
    }
  }

  return [...byId.values()].sort((a, b) => {
    const magDiff = b.event.magnitude - a.event.magnitude
    if (magDiff !== 0) return magDiff
    return new Date(b.event.occurred_at).getTime() - new Date(a.event.occurred_at).getTime()
  })
}

export function formatPopupSeismicMeta(item: PopupSeismicItem): string {
  const parts: string[] = [formatMagnitude(item.event.magnitude)]
  if (item.distanceKm != null) parts.push(`${item.distanceKm.toFixed(0)} km`)
  if (item.estimatedIntensity != null) parts.push(`I ${item.estimatedIntensity.toFixed(1)}`)
  if (item.event.depth_km > 0) parts.push(formatDepth(item.event.depth_km))
  return parts.join(" · ")
}

export function getPopupSeismicAccent(item: PopupSeismicItem): string {
  return getSeismicAccentColor(item.event.magnitude)
}

export function getPopupSeismicTitle(item: PopupSeismicItem): string {
  return getSeismicLocation(item.event) ?? `Sismo M${item.event.magnitude.toFixed(1)}`
}

export function getPopupSeismicDetailUrl(item: PopupSeismicItem): string | null {
  return getSeismicDetailUrl(item.event)
}