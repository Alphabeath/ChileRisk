"use client"

import { useState, type ReactNode, type RefObject } from "react"
import { toPng } from "html-to-image"
import { Download, Share2 } from "lucide-react"

import { cn } from "@/lib/utils"

export const COMUNA_ACTION_BTN_CLASS =
  "inline-flex w-full items-center justify-center gap-1.5 border border-white/20 bg-white/[0.06] px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"

export type ComunaTodayShareBarProps = {
  codComuna: number
  comunaName: string
  cardRef: RefObject<HTMLDivElement | null>
  summaryText?: string
  className?: string
  /** Extra actions in the same full-width grid (e.g. Ver mapa / Mi plan). */
  children?: ReactNode
}

export function ComunaTodayShareBar({
  codComuna,
  comunaName,
  cardRef,
  summaryText,
  className,
  children,
}: ComunaTodayShareBarProps) {
  const [exporting, setExporting] = useState(false)

  async function webShare() {
    const text =
      summaryText ??
      `${comunaName} hoy — ChileRisk. Revisa tu riesgo, aire y alertas.`
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${comunaName} · ChileRisk`,
          text,
        })
      } catch {
        /* cancelled */
      }
    }
  }

  async function downloadPng() {
    const node = cardRef.current
    if (!node) return
    setExporting(true)
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0a0e14",
      })
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `chilerisk-${codComuna}-hoy.png`
      a.click()
    } catch {
      /* ignore export errors */
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className={cn("grid w-full grid-cols-2 gap-2", className)}>
      <button
        type="button"
        onClick={() => void webShare()}
        className={COMUNA_ACTION_BTN_CLASS}
      >
        <Share2 className="size-3.5 shrink-0" aria-hidden />
        Compartir
      </button>
      <button
        type="button"
        onClick={() => void downloadPng()}
        disabled={exporting}
        className={COMUNA_ACTION_BTN_CLASS}
      >
        <Download className="size-3.5 shrink-0" aria-hidden />
        {exporting ? "Generando…" : "Descargar PNG"}
      </button>
      {children}
    </div>
  )
}
