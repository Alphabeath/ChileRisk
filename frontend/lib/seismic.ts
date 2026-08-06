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

/** Accent by magnitude — matches pulsing-dot colors on the map. */
export function getSeismicAccentColor(magnitude: number): string {
  if (magnitude >= 5.5) return "#DA291C"
  if (magnitude >= 5) return "#e07020"
  return "#cc9e23"
}

/** Dark ink on amber/orange; white on roja (≥5.5). */
export function seismicUsesDarkInk(magnitude: number): boolean {
  return magnitude < 5.5
}

export function getSeismicLocation(event: SeismicEvent): string | null {
  const loc = event.raw_data?.location
  return typeof loc === "string" && loc.trim() ? loc : null
}

export function getSeismicMagnitudeType(event: SeismicEvent): string | null {
  const t = event.raw_data?.magnitude_type
  return typeof t === "string" && t.trim() ? t : null
}

/** Compact ops time only: `19:07` (24h). Date comes from the Fecha control. */
function formatSeismicTime(
  iso: string,
  timeZone: string = "America/Santiago",
): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return "—"

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ""

  return `${get("hour")}:${get("minute")}`
}

export function formatSeismicWhen(event: SeismicEvent): {
  label: string
  value: string
  secondaryValue?: string
} {
  if (event.occurred_at_local) {
    return {
      label: "Hora Chile",
      value: formatSeismicTime(event.occurred_at_local),
    }
  }

  return {
    label: "Hora UTC",
    value: formatSeismicTime(event.occurred_at, "UTC"),
  }
}
