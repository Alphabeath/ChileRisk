/** Window for map `?date=` UI — mirrors backend Chile calendar day rules. See docs/QUERY-DATE.md */

export const QUERY_DATE_MAX_DAYS_BACK = 30

/** Default selected day: today (browser local TZ for UI bounds). */
export function todayIsoDate(): string {
  return formatIsoDate(new Date())
}

export function formatIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function minQueryDateIso(reference = todayIsoDate()): string {
  const ref = parseIsoDate(reference)
  const lo = new Date(ref)
  lo.setDate(lo.getDate() - (QUERY_DATE_MAX_DAYS_BACK - 1))
  return formatIsoDate(lo)
}

export function clampQueryDate(
  iso: string,
  reference = todayIsoDate()
): string {
  const value = parseIsoDate(iso)
  const lo = parseIsoDate(minQueryDateIso(reference))
  const hi = parseIsoDate(reference)
  if (value < lo) return formatIsoDate(lo)
  if (value > hi) return formatIsoDate(hi)
  return iso
}

export function addDaysIso(iso: string, delta: number): string {
  const d = parseIsoDate(iso)
  d.setDate(d.getDate() + delta)
  return clampQueryDate(formatIsoDate(d))
}

export function formatQueryDateLabel(
  iso: string,
  reference = todayIsoDate()
): string {
  if (iso === reference) return "Hoy"
  const yesterdayDate = parseIsoDate(reference)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  if (iso === formatIsoDate(yesterdayDate)) return "Ayer"
  const [y, m, day] = iso.split("-")
  return `${day}/${m}/${y}`
}

/** Short label for narrow map rails (`Hoy` / `Ayer` / `dd/mm`). */
export function formatQueryDateCompactLabel(
  iso: string,
  reference = todayIsoDate()
): string {
  const label = formatQueryDateLabel(iso, reference)
  if (label === "Hoy" || label === "Ayer") return label
  const [, m, day] = iso.split("-")
  return `${day}/${m}`
}

export function formatSeismicEmptyForDate(iso: string): string {
  const label = formatQueryDateLabel(iso)
  if (label === "Hoy") {
    return "Sin sismos registrados en este día en esta zona."
  }
  return `Sin sismos registrados el ${label} en esta zona.`
}
