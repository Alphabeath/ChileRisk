"use client"

import Link from "next/link"
import { MapPin } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"

import { DashboardSection } from "@/components/dashboard/dashboard-section"
import {
  useAirQualityByComuna,
  useComunaRisk,
  useNearestComuna,
  useUserProfile,
} from "@/hooks"
import { AIR_QUALITY_LEVEL_META } from "@/lib/air-quality-display"
import { formatHazardLabel } from "@/lib/alerts-display"
import { severityColor } from "@/lib/format"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

type GeoStatus = "idle" | "pending" | "ready" | "denied" | "unsupported"

function StatCell({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="border border-white/10 bg-white/[0.03] px-2.5 py-2">
      <p className={cn(PREPARATION_EYEBROW_CLASS, "text-white/45")}>{label}</p>
      <div className="mt-1 truncate text-sm text-white/90">{children}</div>
    </div>
  )
}

export function DashboardComunaCard({ className }: { className?: string }) {
  const { data: profile, isLoading: profileLoading } = useUserProfile()
  const homeCode = profile?.home_comuna_code ?? null
  const homeName = profile?.home_comuna_name ?? null

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle")
  const geoRequestedRef = useRef(false)

  const needsGeo = !profileLoading && !homeCode

  useEffect(() => {
    if (!needsGeo || geoRequestedRef.current) return
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
      { enableHighAccuracy: true, timeout: 12000 },
    )
    return () => window.clearTimeout(watch)
  }, [needsGeo])

  const { data: nearest, isLoading: nearestLoading } = useNearestComuna(
    needsGeo ? coords : null,
  )

  const fromHome = Boolean(homeCode && homeCode > 0)
  const fromGeo = !fromHome && Boolean(nearest?.cod_comuna)
  const codComuna = fromHome ? homeCode! : (nearest?.cod_comuna ?? 0)
  const comunaName = fromHome ? homeName : (nearest?.name ?? null)
  const hasComuna = codComuna > 0

  const {
    data: risk,
    isLoading: riskLoading,
    isError: riskError,
    refetch: refetchRisk,
  } = useComunaRisk(codComuna)
  const { data: air, isLoading: airLoading } = useAirQualityByComuna(codComuna)

  const resolvingGeo =
    needsGeo &&
    (geoStatus === "idle" ||
      geoStatus === "pending" ||
      (geoStatus === "ready" && nearestLoading))

  const loading =
    profileLoading ||
    resolvingGeo ||
    (hasComuna && (riskLoading || airLoading))

  const airMeta = air ? AIR_QUALITY_LEVEL_META[air.level] : null
  const sourceLabel = fromHome ? "Hogar" : fromGeo ? "Ubicación" : null

  function retryGeo() {
    setCoords(null)
    setGeoStatus("pending")
    if (!navigator.geolocation) {
      setGeoStatus("unsupported")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setGeoStatus("ready")
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  return (
    <DashboardSection
      eyebrow={sourceLabel ? `Tu zona · ${sourceLabel}` : "Tu zona"}
      title={comunaName ?? "Mi comuna"}
      icon={MapPin}
      iconClassName="text-cyan-300/80"
      href="/monitor"
      className={className}
    >
      {riskError && hasComuna ? (
        <div className="border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          No se pudo cargar el riesgo de tu comuna.
          <button
            type="button"
            onClick={() => refetchRisk()}
            className="ml-3 border border-red-500/50 px-2 py-0.5 text-xs text-red-300 transition-colors hover:bg-red-500/20"
          >
            Reintentar
          </button>
        </div>
      ) : loading ? (
        <div className="flex gap-4" aria-hidden>
          <div className="h-20 w-24 shrink-0 animate-pulse bg-white/[0.06]" />
          <div className="grid flex-1 grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse bg-white/[0.06]" />
            ))}
          </div>
        </div>
      ) : !hasComuna ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-white/70">
            {geoStatus === "denied" || geoStatus === "unsupported"
              ? "No pudimos usar tu ubicación. Activa la geolocalización o guarda tu comuna de hogar."
              : "No encontramos una comuna cercana. Guarda tu comuna de hogar en la cuenta."}
          </p>
          <div className="flex flex-wrap gap-2">
            {geoStatus === "denied" || geoStatus === "unsupported" ? (
              <button
                type="button"
                onClick={retryGeo}
                className="inline-flex border border-white/20 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80 transition-colors hover:bg-white/[0.1]"
              >
                Reintentar ubicación
              </button>
            ) : null}
            <Link
              href="/account"
              className="inline-flex border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-500/20"
            >
              Ir a mi cuenta
            </Link>
          </div>
        </div>
      ) : risk ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
          <div className="flex shrink-0 flex-col justify-center border border-white/10 bg-black/35 px-4 py-3 sm:min-w-[7.5rem]">
            <p className={cn(PREPARATION_EYEBROW_CLASS, "text-white/45")}>
              Riesgo
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums leading-none text-white sm:text-4xl">
              {risk.composite_score.toFixed(1)}
            </p>
            <span
              className={cn(
                "mt-2 w-fit px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                severityColor(risk.severity),
              )}
            >
              {risk.severity}
            </span>
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
            <StatCell label="Amenaza">
              <span className="text-[13px]">
                {formatHazardLabel(risk.dominant_hazard)}
              </span>
            </StatCell>
            <StatCell label="Aire">
              {airMeta ? (
                <span
                  className={cn(
                    "inline-block border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    airMeta.badge,
                  )}
                >
                  {airMeta.label}
                </span>
              ) : (
                <span className="text-xs text-white/45">Sin GEC</span>
              )}
            </StatCell>
            <StatCell label="Temp.">
              {risk.temperature_c != null ? (
                <span className="font-mono tabular-nums text-blue-300">
                  {risk.temperature_c.toFixed(1)}°C
                </span>
              ) : (
                <span className="text-white/45">—</span>
              )}
            </StatCell>
            <StatCell label="Viento">
              {risk.wind_speed_kmh != null ? (
                <span className="font-mono tabular-nums text-cyan-300">
                  {risk.wind_speed_kmh.toFixed(0)} km/h
                </span>
              ) : (
                <span className="text-white/45">—</span>
              )}
            </StatCell>
          </div>
        </div>
      ) : (
        <p className="py-2 text-sm text-white/55">
          Sin datos de riesgo para tu comuna
        </p>
      )}
    </DashboardSection>
  )
}
