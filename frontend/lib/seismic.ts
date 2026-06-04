import type { SeismicEvent } from "@/lib/types"

export function getSeismicDetailUrl(event: SeismicEvent): string | null {
  if (event.detail_url) return event.detail_url
  const fromRaw = event.raw_data?.detail_url
  return typeof fromRaw === "string" && fromRaw.trim() ? fromRaw : null
}

export function getSeismicIntensityReportUrl(event: SeismicEvent): string | null {
  if (event.intensity_report_url) return event.intensity_report_url
  const fromRaw = event.raw_data?.intensity_report_url
  return typeof fromRaw === "string" && fromRaw.trim() ? fromRaw : null
}

export function isSeismicPerceived(event: SeismicEvent): boolean {
  if (event.is_perceived) return true
  return Boolean(event.raw_data?.is_perceived)
}

export function getSeismicAccentColor(magnitude: number): string {
  if (magnitude >= 5.5) return "#DA291C"
  if (magnitude >= 5) return "#e07020"
  return "#cc9e23"
}

export function getSeismicLocation(event: SeismicEvent): string | null {
  const loc = event.raw_data?.location
  return typeof loc === "string" && loc.trim() ? loc : null
}

export function getSeismicMagnitudeType(event: SeismicEvent): string | null {
  const t = event.raw_data?.magnitude_type
  return typeof t === "string" && t.trim() ? t : null
}