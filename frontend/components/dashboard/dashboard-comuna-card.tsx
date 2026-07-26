"use client"

import Link from "next/link"
import { useRef } from "react"
import { MapPin } from "lucide-react"

import { ComunaTodayCard } from "@/components/comuna-today/comuna-today-card"
import {
  COMUNA_ACTION_BTN_CLASS,
  ComunaTodayShareBar,
} from "@/components/comuna-today/comuna-today-share-bar"
import { useComunaToday } from "@/hooks/use-comuna-today"
import { cn } from "@/lib/utils"

export function DashboardComunaCard({ className }: { className?: string }) {
  const {
    data,
    isLoading,
    isError,
    needsComuna,
    geoDenied,
    retryGeo,
    refetch,
  } = useComunaToday()
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {isLoading ? (
        <div
          className="h-[28rem] animate-pulse border border-white/10 bg-white/[0.04]"
          aria-hidden
        />
      ) : isError && data?.codComuna ? (
        <div className="border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-300">
          No se pudo cargar el riesgo de la comuna.
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-3 border border-red-500/50 px-2 py-0.5 text-xs hover:bg-red-500/20"
          >
            Reintentar
          </button>
        </div>
      ) : needsComuna || !data ? (
        <div className="border border-white/10 bg-black/40 p-5">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 text-cyan-300/80" aria-hidden />
            <div>
              <p className="text-sm text-white/80">
                {geoDenied
                  ? "No pudimos usar tu ubicación. Activa la geolocalización o guarda tu comuna de hogar."
                  : "Indica tu comuna para ver el resumen de hoy."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {geoDenied ? (
                  <button
                    type="button"
                    onClick={retryGeo}
                    className="border border-white/20 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80 hover:bg-white/10"
                  >
                    Reintentar ubicación
                  </button>
                ) : null}
                <Link
                  href="/account"
                  className="border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300 hover:bg-cyan-500/20"
                >
                  Ir a mi cuenta
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <ComunaTodayCard ref={cardRef} data={data} />
          <ComunaTodayShareBar
            codComuna={data.codComuna}
            comunaName={data.comunaName}
            cardRef={cardRef}
            summaryText={`${data.comunaName}: riesgo ${data.risk?.severity ?? "—"} (${data.risk?.composite_score.toFixed(0) ?? "—"}/100). ${data.ctaCopy}`}
          >
            <Link href="/monitor" className={COMUNA_ACTION_BTN_CLASS}>
              Ver mapa
            </Link>
            <Link
              href="/preparation"
              className={cn(
                COMUNA_ACTION_BTN_CLASS,
                "border-cyan-400/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20",
              )}
            >
              Mi plan
            </Link>
          </ComunaTodayShareBar>
        </>
      )}
    </div>
  )
}
