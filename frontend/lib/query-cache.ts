/** TanStack Query TTL policy: live “hoy” vs historical `?date=`. */

import { todayIsoDate } from "@/lib/query-date"

/** Live (today) stale times — aligned to backend scheduler intervals. */
export const STALE = {
  /** SENAPRED ~10m, AAA ~15m */
  alerts: 5 * 60 * 1000,
  /** Aire Chile sync ~180m */
  air: 15 * 60 * 1000,
  /** risk_refresh ~15m */
  risk: 10 * 60 * 1000,
  /** CSN sync ~5m */
  events: 3 * 60 * 1000,
  /** Past Chile calendar days — nearly immutable snapshots */
  historical: 60 * 60 * 1000,
  /** Simulacros calendar list */
  simulacros: 60 * 60 * 1000,
  /** Next upcoming drill */
  simulacroNext: 15 * 60 * 1000,
} as const

export function isQueryDateToday(
  date: string,
  reference = todayIsoDate(),
): boolean {
  return date === reference
}

/**
 * Today → `liveMs`; past `?date=` → {@link STALE.historical}.
 * Use for all monitor GET hooks keyed by query date.
 */
export function staleTimeForLive(
  date: string,
  liveMs: number,
  reference = todayIsoDate(),
): number {
  return isQueryDateToday(date, reference) ? liveMs : STALE.historical
}
