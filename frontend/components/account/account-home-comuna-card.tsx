"use client"

import { useState } from "react"
import { Loader2, MapPinned, Navigation } from "lucide-react"

import { ComunaCombobox } from "@/components/account/comuna-combobox"
import { Button } from "@/components/ui/button"
import { useUpdateUserProfile } from "@/hooks"
import { getNearestComuna } from "@/lib/api"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

function readGeoPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocalización no disponible en este dispositivo"))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12_000,
      maximumAge: 60_000,
    })
  })
}

export function AccountHomeComunaCard({
  initialCode,
  homeName,
  className,
}: {
  initialCode: number | null
  homeName: string | null
  className?: string
}) {
  const updateProfile = useUpdateUserProfile()
  const [draftCode, setDraftCode] = useState<number | null>(initialCode)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [geoPending, setGeoPending] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const dirty = draftCode !== initialCode
  const busy = updateProfile.isPending || geoPending

  async function saveComuna() {
    setSaveMsg(null)
    setGeoError(null)
    try {
      const updated = await updateProfile.mutateAsync(draftCode)
      setSaveMsg(
        updated.home_comuna_name
          ? `Guardado: ${updated.home_comuna_name}`
          : "Comuna de hogar limpiada",
      )
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "No se pudo guardar")
    }
  }

  async function clearComuna() {
    setDraftCode(null)
    setSaveMsg(null)
    setGeoError(null)
    try {
      await updateProfile.mutateAsync(null)
      setSaveMsg("Comuna de hogar limpiada")
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "No se pudo guardar")
    }
  }

  async function locateNearestComuna() {
    setGeoError(null)
    setSaveMsg(null)
    setGeoPending(true)
    try {
      const pos = await readGeoPosition()
      const nearest = await getNearestComuna({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      })
      setDraftCode(nearest.cod_comuna)
      setSaveMsg(
        `Sugerida: ${nearest.name} (a ${nearest.distance_km.toFixed(1)} km). Guarda para confirmar.`,
      )
    } catch (err) {
      let msg = "No pudimos obtener tu ubicación. Elige la comuna en el listado."
      if (err && typeof err === "object" && "code" in err) {
        const code = Number((err as { code: number }).code)
        if (code === 1) {
          msg =
            "Permiso de ubicación denegado. Elige la comuna en el listado."
        }
      } else if (err instanceof Error && err.message) {
        msg = err.message
      }
      setGeoError(msg)
    } finally {
      setGeoPending(false)
    }
  }

  return (
    <section
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col gap-5 p-5 sm:p-6",
        className,
      )}
    >
      <header>
        <p className={cn(PREPARATION_EYEBROW_CLASS, "text-white/45")}>
          Ubicación
        </p>
        <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight text-white/90">
          <MapPinned
            className="size-5 shrink-0 text-emerald-300/80"
            aria-hidden
          />
          Comuna de hogar
        </h2>
        <p className="mt-1 text-[12.5px] leading-snug text-white/50">
          Personaliza riesgo, alertas y el resumen de Inicio. Busca por nombre o
          región — no necesitas el código CUT.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <label
          htmlFor="account-home-comuna"
          className={cn(PREPARATION_EYEBROW_CLASS, "text-white/45")}
        >
          Comuna
        </label>
        <ComunaCombobox
          id="account-home-comuna"
          value={draftCode}
          onChange={(code) => {
            setDraftCode(code)
            setSaveMsg(null)
            setGeoError(null)
          }}
          disabled={busy}
        />
        {homeName && draftCode === initialCode ? (
          <p className="text-[12px] text-white/45">
            Actual: <span className="text-white/70">{homeName}</span>
          </p>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          className="w-full justify-center border-white/15 bg-transparent text-white/80 hover:bg-white/[0.06] hover:text-white"
          onClick={() => void locateNearestComuna()}
        >
          {geoPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Navigation className="size-3.5" aria-hidden />
          )}
          Usar mi ubicación
        </Button>
      </div>

      <div className="mt-auto flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          size="sm"
          disabled={busy || !dirty}
          className="flex-1"
          onClick={() => void saveComuna()}
        >
          {updateProfile.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : null}
          Guardar comuna
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || (initialCode == null && draftCode == null)}
          className="flex-1 border-white/15 bg-transparent text-white/70 hover:bg-white/[0.06] hover:text-white"
          onClick={() => void clearComuna()}
        >
          Quitar comuna
        </Button>
      </div>

      {geoError ? (
        <p className="text-[12px] text-amber-200/90" role="status">
          {geoError}
        </p>
      ) : null}
      {saveMsg ? (
        <p className="text-[12px] text-white/55" role="status">
          {saveMsg}
        </p>
      ) : null}
    </section>
  )
}
