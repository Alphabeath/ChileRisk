"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import {
  useActiveAlerts,
  useAirQualityByComuna,
  useComunaRisk,
  useNearestComuna,
  useNextSimulacro,
  useRecentEvents,
  useUserProfile,
} from "@/hooks"
import { filterAlertsForComuna, timeAgo } from "@/lib/alerts-display"
import { REGION_LABELS } from "@/lib/simulacros-labels"
import type {
  ActiveAlert,
  AirQualityZone,
  ComunaRisk,
  SeismicEvent,
  Simulacro,
} from "@/lib/types"

export type ComunaTodayData = {
  codComuna: number
  comunaName: string
  regionCode: number | null
  regionName: string | null
  source: "home" | "geo"
  risk: ComunaRisk | null
  air: AirQualityZone | null
  alerts: ActiveAlert[]
  alertCount: number
  volcanoAlert: ActiveAlert | null
  nextDrill: Simulacro | null
  lastQuake: {
    magnitude: number
    label: string
    occurredAt: string | null
  } | null
  ctaCopy: string
  dateLabel: string
}

export type UseComunaTodayResult = {
  data: ComunaTodayData | null
  hasComuna: boolean
  isLoading: boolean
  isError: boolean
  needsComuna: boolean
  geoDenied: boolean
  retryGeo: () => void
  refetch: () => void
}

function severityCta(severity: ComunaRisk["severity"] | undefined): string {
  switch (severity) {
    case "critico":
      return "Tu comuna está en riesgo CRÍTICO hoy. Revisa tu plan familiar y puntos de encuentro."
    case "alto":
      return "Tu comuna está en riesgo ALTO hoy. Revisa tu plan familiar."
    case "moderado":
      return "Riesgo moderado en tu comuna. Mantén tu kit y plan al día."
    case "bajo":
      return "Riesgo bajo hoy. Buen momento para preparar tu plan familiar."
    default:
      return "Revisa el estado de tu comuna y mantente preparado."
  }
}

function drillApplies(
  drill: Simulacro,
  regionCode: number | null,
  comunaName: string | null,
): boolean {
  if (regionCode != null && drill.region_code === regionCode) return true
  const name = comunaName?.trim().toLowerCase()
  if (
    name &&
    drill.participating_comunas.some((c) => c.trim().toLowerCase() === name)
  ) {
    return true
  }
  return false
}

export function useComunaToday(): UseComunaTodayResult {
  const { data: profile, isLoading: profileLoading, isError: profileError } =
    useUserProfile()
  const homeCode =
    !profileLoading && !profileError
      ? (profile?.home_comuna_code ?? null)
      : null
  const homeName = profileError ? null : (profile?.home_comuna_name ?? null)

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "pending" | "ready" | "denied" | "unsupported"
  >("idle")
  const geoRequestedRef = useRef(false)

  // Start GPS in parallel with profile (don't wait for profile to finish).
  useEffect(() => {
    if (geoRequestedRef.current) return
    geoRequestedRef.current = true

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      const id = window.setTimeout(() => setGeoStatus("unsupported"), 0)
      return () => window.clearTimeout(id)
    }

    const watch = window.setTimeout(() => setGeoStatus("pending"), 0)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setGeoStatus("ready")
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 120_000 },
    )
    return () => window.clearTimeout(watch)
  }, [])

  const needsGeo = !homeCode || homeCode <= 0
  const { data: nearest, isLoading: nearestLoading } = useNearestComuna(
    needsGeo || !homeCode ? coords : null,
  )

  // Prefer home (instant once profile loads); GPS as fallback / override when no home.
  const source: ComunaTodayData["source"] | null =
    homeCode && homeCode > 0
      ? "home"
      : nearest?.cod_comuna
        ? "geo"
        : null

  const codComuna =
    source === "home" ? homeCode! : (nearest?.cod_comuna ?? 0)

  const {
    data: risk,
    isLoading: riskLoading,
    isError: riskError,
    isFetched: riskFetched,
    refetch: refetchRisk,
  } = useComunaRisk(codComuna)

  const regionCode = risk?.codregion ?? nearest?.codregion ?? null

  // Secondary — do not block first paint of the card.
  const { data: air } = useAirQualityByComuna(codComuna)
  const { data: alerts = [] } = useActiveAlerts(
    regionCode != null ? { region: regionCode } : {},
  )
  const { data: nextDrill } = useNextSimulacro()
  const { data: events = [] } = useRecentEvents()

  const comunaName =
    risk?.name ??
    (source === "home" ? homeName : null) ??
    nearest?.name ??
    (codComuna > 0 ? `Comuna ${codComuna}` : "Mi comuna")

  const regionName =
    regionCode != null
      ? (REGION_LABELS[regionCode] ?? `Región ${regionCode}`)
      : null

  const comunaAlerts = useMemo(() => {
    if (codComuna <= 0 || regionCode == null) return []
    return filterAlertsForComuna(alerts, regionCode, codComuna)
  }, [alerts, codComuna, regionCode])

  const volcanoAlert = useMemo(
    () =>
      comunaAlerts.find((a) => a.source === "sernageomin") ??
      alerts.find(
        (a) =>
          a.source === "sernageomin" &&
          (a.comuna_codes ?? []).includes(codComuna),
      ) ??
      null,
    [alerts, codComuna, comunaAlerts],
  )

  const relevantDrill = useMemo(() => {
    if (!nextDrill) return null
    if (!drillApplies(nextDrill, regionCode, comunaName)) return null
    return nextDrill
  }, [nextDrill, regionCode, comunaName])

  const lastQuake = useMemo(() => {
    if (risk?.seismic_impact) {
      const impact = risk.seismic_impact
      return {
        magnitude: impact.magnitude,
        label:
          impact.occurred_at != null
            ? `hace ${timeAgo(impact.occurred_at)}`
            : `${impact.distance_km.toFixed(0)} km`,
        occurredAt: impact.occurred_at ?? null,
      }
    }
    const top = events.reduce<SeismicEvent | null>((best, ev) => {
      if (!best || ev.magnitude > best.magnitude) return ev
      return best
    }, null)
    if (!top) return null
    return {
      magnitude: top.magnitude,
      label: `hace ${timeAgo(top.occurred_at)}`,
      occurredAt: top.occurred_at,
    }
  }, [events, risk])

  const dateLabel = new Date().toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  const resolvingGeo =
    needsGeo &&
    !nearest?.cod_comuna &&
    (geoStatus === "idle" ||
      geoStatus === "pending" ||
      (geoStatus === "ready" && nearestLoading))

  const hasComuna = codComuna > 0

  // Block only until we can show the core card (comuna + risk).
  // Air / alerts / drill / events stream in afterward.
  const isLoading =
    (needsGeo && resolvingGeo && !hasComuna) ||
    (profileLoading && !hasComuna) ||
    (hasComuna && riskLoading && !riskFetched)

  const data: ComunaTodayData | null =
    hasComuna && source
      ? {
          codComuna,
          comunaName: comunaName ?? `Comuna ${codComuna}`,
          regionCode,
          regionName,
          source,
          risk: risk ?? null,
          air: air ?? null,
          alerts: comunaAlerts,
          alertCount: comunaAlerts.length,
          volcanoAlert,
          nextDrill: relevantDrill,
          lastQuake,
          ctaCopy: severityCta(risk?.severity),
          dateLabel,
        }
      : null

  function retryGeo() {
    setCoords(null)
    setGeoStatus("pending")
    geoRequestedRef.current = false
    if (!navigator.geolocation) {
      setGeoStatus("unsupported")
      return
    }
    geoRequestedRef.current = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setGeoStatus("ready")
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 120_000 },
    )
  }

  return {
    data,
    hasComuna,
    isLoading,
    isError: riskError,
    needsComuna: !hasComuna && !isLoading,
    geoDenied: geoStatus === "denied" || geoStatus === "unsupported",
    retryGeo,
    refetch: () => {
      void refetchRisk()
    },
  }
}
