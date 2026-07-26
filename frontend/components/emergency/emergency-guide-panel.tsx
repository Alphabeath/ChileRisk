"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { MessageCircle, Loader2 } from "lucide-react"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { sendChatStreaming } from "@/hooks"
import { ALERT_LEVEL_META } from "@/lib/alerts-display"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"
import type { AlertLevel } from "@/lib/types"

export type EmergencyGuidePanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  severity: AlertLevel
  hazardLabel: string
  comunaCode: number | null
  comunaName: string | null
  coords: { lat: number; lon: number } | null
}

export function EmergencyGuidePanel({
  open,
  onOpenChange,
  severity,
  hazardLabel,
  comunaCode,
  comunaName,
  coords,
}: EmergencyGuidePanelProps) {
  const [text, setText] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const startedForOpen = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!open) {
      startedForOpen.current = false
      abortRef.current?.abort()
      abortRef.current = null
      return
    }
    if (startedForOpen.current) return
    startedForOpen.current = true

    const place = comunaName ?? "mi comuna"
    const levelLabel = ALERT_LEVEL_META[severity].label
    const controller = new AbortController()
    abortRef.current = controller

    setText("")
    setError(null)
    setStatus("Consultando…")
    setLoading(true)

    void sendChatStreaming(
      {
        messages: [
          {
            role: "user",
            content:
              `Estoy en ${place}` +
              (comunaCode != null ? ` (código ${comunaCode})` : "") +
              ` con alerta ${levelLabel} de ${hazardLabel}. ` +
              "Dame exactamente 3 pasos concretos de seguridad, cortos, en español. Sin preámbulo.",
          },
        ],
        comuna_code: comunaCode,
        lat: coords?.lat ?? null,
        lon: coords?.lon ?? null,
        stream: true,
      },
      {
        onStatus: (phase) => setStatus(phase),
        onToken: (token) => {
          setStatus(null)
          setText((prev) => prev + token)
        },
        onDone: (res) => {
          if (res.reply) setText(res.reply)
          setStatus(null)
          setLoading(false)
        },
        onError: (err) => {
          setError(err.message || "No se pudo obtener la guía")
          setStatus(null)
          setLoading(false)
        },
      },
      controller.signal,
    ).catch((err: unknown) => {
      if (controller.signal.aborted) return
      const msg = err instanceof Error ? err.message : "Error de red"
      setError(msg)
      setLoading(false)
      setStatus(null)
    })

    return () => {
      controller.abort()
    }
  }, [open, severity, hazardLabel, comunaCode, comunaName, coords])

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88vh]">
        <DrawerHeader>
          <DrawerTitle>¿Qué hago ahora?</DrawerTitle>
          <DrawerDescription>
            Instrucciones para alerta {ALERT_LEVEL_META[severity].label} —{" "}
            {hazardLabel}
            {comunaName ? ` en ${comunaName}` : ""}
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div
            className={cn(
              GLASS_PANEL_CLASS,
              "min-h-[8rem] whitespace-pre-wrap p-3 text-sm leading-relaxed text-white/85",
            )}
          >
            {loading && !text ? (
              <p className="flex items-center gap-2 text-white/55">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {status ?? "Generando pasos…"}
              </p>
            ) : null}
            {text}
            {error ? (
              <p className="mt-2 text-sm text-red-300">{error}</p>
            ) : null}
          </div>
        </div>
        <DrawerFooter>
          <Link
            href="/assistant"
            className="inline-flex items-center justify-center gap-2 border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-cyan-200 transition-colors hover:bg-cyan-500/20"
          >
            <MessageCircle className="size-3.5" aria-hidden />
            Preguntar más
          </Link>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
