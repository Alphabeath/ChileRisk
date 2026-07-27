"use client"

import { useRef, useState } from "react"
import { toPng } from "html-to-image"
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Share2,
  ShieldCheck,
} from "lucide-react"

import { EmergencySheet } from "@/components/emergency/emergency-sheet"
import {
  ALERT_SOURCE_META,
  getActiveAlertMainText,
  timeAgo,
} from "@/lib/alerts-display"
import {
  EMERGENCY_STRIPE_BAR_CLASS,
  emergencyVisual,
} from "@/lib/emergency-ui"
import { cn } from "@/lib/utils"
import type { ActiveAlert, AlertLevel } from "@/lib/types"

export type EmergencyShareCardProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  alert: ActiveAlert
  severity: AlertLevel
  hazardLabel: string
  comunaName: string | null
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function buildShareText(opts: {
  severity: AlertLevel
  hazardLabel: string
  comunaName: string | null
}): string {
  const place = opts.comunaName ?? "mi comuna"
  const now = new Date()
  const date = now.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  const time = now.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const level = opts.severity === "roja" ? "ROJA" : "NARANJA"
  return `ALERTA ${level} — ${opts.hazardLabel} en ${place}. Estoy seguro/a · ChileRisk · ${date}, ${time} · chilerisk.cl`
}

const ACTION_BTN_CLASS =
  "inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40 disabled:opacity-60"

export function EmergencyShareCard({
  open,
  onOpenChange,
  alert,
  severity,
  hazardLabel,
  comunaName,
}: EmergencyShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [copied, setCopied] = useState(false)

  const visual = emergencyVisual(severity)
  const isRoja = severity === "roja"
  const place = comunaName ?? alert.region_name ?? "tu zona"
  const sourceMeta = ALERT_SOURCE_META[alert.source] ?? ALERT_SOURCE_META.senapred
  const mainText = getActiveAlertMainText(alert)
  const text = buildShareText({ severity, hazardLabel, comunaName })
  const now = new Date()
  const dateLabel = now.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const timeLabel = now.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const filename = `chilerisk-alerta-${severity}-${slugify(comunaName ?? "zona")}.png`

  async function captureCard(): Promise<{ dataUrl: string; file: File } | null> {
    const node = cardRef.current
    if (!node) return null
    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#0a0e14",
    })
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], filename, { type: "image/png" })
    return { dataUrl, file }
  }

  function triggerDownload(dataUrl: string) {
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = filename
    a.click()
  }

  async function handleShare() {
    setExporting(true)
    try {
      const exported = await captureCard()
      if (!exported) return

      const payload: ShareData = {
        title: `ALERTA ${isRoja ? "ROJA" : "NARANJA"} — ${hazardLabel} en ${place}`,
        text,
        files: [exported.file],
      }

      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare(payload)
      ) {
        try {
          await navigator.share(payload)
          return
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return
        }
      }

      triggerDownload(exported.dataUrl)
    } catch {
      /* ignore export errors */
    } finally {
      setExporting(false)
    }
  }

  async function handleDownload() {
    setExporting(true)
    try {
      const exported = await captureCard()
      if (!exported) return
      triggerDownload(exported.dataUrl)
    } catch {
      /* ignore export errors */
    } finally {
      setExporting(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <EmergencySheet
      open={open}
      onOpenChange={onOpenChange}
      title="Compartir estado"
      description="Avisa a tu familia o contactos que estás a salvo — con la alerta de contexto como imagen."
      footer={
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={exporting}
            className={cn(
              ACTION_BTN_CLASS,
              "flex-1 bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/25 hover:-translate-y-px hover:bg-emerald-400 active:translate-y-0",
            )}
          >
            <Share2 className="size-3.5" aria-hidden />
            {exporting ? "Generando…" : "Compartir imagen"}
          </button>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={exporting}
            className={cn(
              ACTION_BTN_CLASS,
              "flex-1 border-2 border-white/60 text-white hover:-translate-y-px hover:bg-white/10 active:translate-y-0",
            )}
          >
            <Download className="size-3.5" aria-hidden />
            {exporting ? "Generando…" : "Descargar PNG"}
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className={cn(
              ACTION_BTN_CLASS,
              "flex-1 border border-white/25 bg-white/[0.06] text-white/85 hover:bg-white/10 hover:text-white",
            )}
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-300" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
            {copied ? "Copiado" : "Copiar texto"}
          </button>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-[34rem]">
        <div
          ref={cardRef}
          className={cn(
            "group relative w-full overflow-hidden border",
            visual.bannerBorder,
            visual.bannerBg,
          )}
        >
          <div className={cn(EMERGENCY_STRIPE_BAR_CLASS, "h-2.5")} />

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 18% -10%, rgba(255,255,255,0.16), transparent 48%), radial-gradient(ellipse at 88% 112%, rgba(0,0,0,0.5), transparent 55%)",
            }}
            aria-hidden
          />

          <div className="relative px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-white/75">
                ChileRisk · {dateLabel}
              </p>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                {timeLabel} hrs
              </p>
            </div>

            <div className="mt-4 flex items-start gap-3.5">
              <div
                className="flex size-12 shrink-0 items-center justify-center border-2 border-white/85 bg-black/25"
                aria-hidden
              >
                <AlertTriangle className="size-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h3 className="text-3xl font-black uppercase leading-none tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)] sm:text-4xl">
                  Alerta {isRoja ? "Roja" : "Naranja"}
                </h3>
                <p
                  className={cn(
                    "mt-1.5 text-[11px] font-bold uppercase tracking-[0.16em]",
                    visual.accentText,
                  )}
                >
                  {hazardLabel} en {place}
                </p>
              </div>
            </div>

            <div className="mt-4 border-l-2 border-white/45 bg-black/25 px-3 py-2.5">
              <p className="line-clamp-3 text-[13px] leading-snug text-white/90">
                {mainText}
              </p>
              <p className="mt-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Fuente: {sourceMeta.label}
                {alert.issued_at ? ` · emitida hace ${timeAgo(alert.issued_at)}` : null}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-3 border border-emerald-300/50 bg-emerald-950/70 px-3.5 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center bg-emerald-500">
                <ShieldCheck className="size-5 text-emerald-950" strokeWidth={2.5} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-emerald-200">
                  <span className="emergency-live-dot size-2 rounded-full bg-emerald-300" />
                  Estoy seguro/a
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-emerald-100/75">
                  Reportado desde {place} · {timeLabel} hrs
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/25 pt-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">
                chilerisk.cl
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/50">
                Monitoreo multi-amenaza · Chile
              </p>
            </div>
          </div>

          <div className={cn(EMERGENCY_STRIPE_BAR_CLASS, "h-2.5")} />
        </div>

        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-white/45">
          La imagen incluye la alerta activa y tu estado. El texto se adjunta al
          compartir.
        </p>
      </div>
    </EmergencySheet>
  )
}
