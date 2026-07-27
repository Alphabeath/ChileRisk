"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import {
  useActiveAlerts,
  useComunaRisk,
  useNearestComuna,
  useUserProfile,
} from "@/hooks"
import {
  alertAppliesToComuna,
  formatHazardLabel,
  sortActiveAlertsBySeverity,
} from "@/lib/alerts-display"
import type { ActiveAlert, AlertLevel } from "@/lib/types"

const DISMISS_STORAGE_PREFIX = "chilerisk:emergency-dismiss:"
const EMERGENCY_LEVELS = new Set<AlertLevel>(["naranja", "roja"])

export type EvacuationHazardParam = "tsunami" | "volcanic"

export type EmergencyModeState = {
  active: boolean
  alert: ActiveAlert | null
  hazard: string
  hazardLabel: string
  severity: AlertLevel | null
  comunaCode: number | null
  comunaName: string | null
  regionCode: number | null
  coords: { lat: number; lon: number } | null
  dismissed: boolean
  dismiss: () => void
  reactivate: () => void
  evacuationHazard: EvacuationHazardParam | null
  isResolving: boolean
}

function readDismissed(alertId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return sessionStorage.getItem(`${DISMISS_STORAGE_PREFIX}${alertId}`) === "1"
  } catch {
    return false
  }
}

function writeDismissed(alertId: string) {
  try {
    sessionStorage.setItem(`${DISMISS_STORAGE_PREFIX}${alertId}`, "1")
  } catch {
    /* ignore quota / private mode */
  }
}

function clearDismissed(alertId: string) {
  try {
    sessionStorage.removeItem(`${DISMISS_STORAGE_PREFIX}${alertId}`)
  } catch {
    /* ignore quota / private mode */
  }
}

export function mapHazardToEvacuation(
  hazard: string | null | undefined,
  category?: string | null,
): EvacuationHazardParam | null {
  const key = (hazard ?? category ?? "").toLowerCase()
  if (!key) return null
  if (key.includes("volcan")) return "volcanic"
  if (
    key.includes("tsunami") ||
    key.includes("sismo") ||
    key.includes("borde") ||
    key.includes("costero")
  ) {
    return "tsunami"
  }
  return null
}

export type EmergencyTarget = {
  code: number
  name: string | null
  region: number | null
}

export type EmergencyAlertMatch = {
  alert: ActiveAlert
  target: EmergencyTarget
}

type ResolvedTarget = EmergencyTarget & { region: number }

/**
 * Multi-target matching: an emergency alert fires if it applies to the GPS
 * location OR the home comuna. The matched target drives display fields; geo
 * wins when the winning alert also applies there ("you are here").
 */
export function matchEmergencyAlert(
  alerts: ActiveAlert[],
  geo: EmergencyTarget | null,
  home: EmergencyTarget | null,
): EmergencyAlertMatch | null {
  const targets: ResolvedTarget[] = [geo, home].filter(
    (t): t is ResolvedTarget => t != null && t.region != null,
  )
  if (targets.length === 0) return null

  const seen = new Set<string>()
  const candidates: ActiveAlert[] = []
  for (const alert of alerts) {
    if (!EMERGENCY_LEVELS.has(alert.level)) continue
    if (seen.has(alert.id)) continue
    const applies = targets.some((t) => alertAppliesToComuna(alert, t.region, t.code))
    if (!applies) continue
    seen.add(alert.id)
    candidates.push(alert)
  }
  if (candidates.length === 0) return null

  const alert = sortActiveAlertsBySeverity(candidates)[0]
  if (!alert) return null

  const target =
    geo != null &&
    geo.region != null &&
    alertAppliesToComuna(alert, geo.region, geo.code)
      ? geo
      : (targets.find((t) => alertAppliesToComuna(alert, t.region, t.code)) ??
        targets[0])

  return { alert, target }
}

export function useEmergencyMode(): EmergencyModeState {
  const { data: profile, isLoading: profileLoading, isError: profileError } =
    useUserProfile()
  const {
    data: alerts = [],
    isLoading: alertsLoading,
    isFetched: alertsFetched,
  } = useActiveAlerts()

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [geoDone, setGeoDone] = useState(false)
  const geoRequestedRef = useRef(false)
  /** Session + in-memory dismiss ids — never cleared on brief alert nulls. */
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const lastDismissIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (geoRequestedRef.current) return
    geoRequestedRef.current = true

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      const id = window.setTimeout(() => setGeoDone(true), 0)
      return () => window.clearTimeout(id)
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setGeoDone(true)
      },
      () => setGeoDone(true),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const { data: nearest, isLoading: nearestLoading } = useNearestComuna(coords)

  const homeCode =
    profileError || profileLoading
      ? null
      : (profile?.home_comuna_code ?? null)
  const homeName = profileError ? null : (profile?.home_comuna_name ?? null)

  /** Home region comes from its risk score (same source as `useComunaToday`). */
  const { data: homeRisk } = useComunaRisk(homeCode ?? 0)
  const homeRegion = homeRisk?.codregion ?? null

  const geoTarget: EmergencyTarget | null = nearest?.cod_comuna
    ? {
        code: nearest.cod_comuna,
        name: nearest.name ?? null,
        region: nearest.codregion ?? null,
      }
    : null
  const homeTarget: EmergencyTarget | null =
    homeCode && homeCode > 0
      ? { code: homeCode, name: homeName, region: homeRegion }
      : null
  const match = matchEmergencyAlert(alerts, geoTarget, homeTarget)

  const emergencyAlert = match?.alert ?? null
  const matchedTarget = match?.target ?? null

  const comunaCode =
    matchedTarget?.code ??
    (nearest?.cod_comuna ?? (homeCode && homeCode > 0 ? homeCode : null))
  const comunaName =
    matchedTarget?.name ??
    (nearest?.cod_comuna ? (nearest.name ?? null) : homeName)
  const regionCode =
    matchedTarget?.region ?? (nearest?.codregion ?? homeRegion)

  useEffect(() => {
    if (emergencyAlert) lastDismissIdRef.current = emergencyAlert.id
  }, [emergencyAlert])

  const dismissed = useMemo(() => {
    if (!emergencyAlert) return false
    if (dismissedIds.has(emergencyAlert.id)) return true
    return readDismissed(emergencyAlert.id)
  }, [emergencyAlert, dismissedIds])

  function dismiss() {
    const id = emergencyAlert?.id ?? lastDismissIdRef.current
    if (!id) return
    writeDismissed(id)
    setDismissedIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  /** Undo a dismiss (reopen chip) — banner reappears while the alert is active. */
  function reactivate() {
    const id = emergencyAlert?.id ?? lastDismissIdRef.current
    if (!id) return
    clearDismissed(id)
    setDismissedIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const hazard =
    emergencyAlert?.hazard_type ??
    emergencyAlert?.dominant_hazard ??
    emergencyAlert?.category ??
    null
  const hazardLabel = formatHazardLabel(hazard, emergencyAlert?.category)
  const evacuationHazard = mapHazardToEvacuation(
    hazard,
    emergencyAlert?.category,
  )

  const geoReady = Boolean(nearest?.cod_comuna) && nearest?.codregion != null
  const waitingHomeOrGeo =
    !geoReady && (profileLoading || (!geoDone && !profileError && !homeCode))
  const waitingNearest = Boolean(coords) && nearestLoading && !nearest
  const waitingAlerts = alertsLoading && !alertsFetched

  const isResolving = waitingHomeOrGeo || waitingNearest || waitingAlerts

  const active = Boolean(emergencyAlert) && !dismissed && !isResolving

  return {
    active,
    alert: emergencyAlert,
    hazard: hazard ?? "riesgo",
    hazardLabel,
    severity: emergencyAlert?.level ?? null,
    comunaCode,
    comunaName,
    regionCode,
    coords,
    dismissed,
    dismiss,
    reactivate,
    evacuationHazard,
    isResolving,
  }
}
