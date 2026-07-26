"use client"

import { useState, type ReactNode, type RefObject } from "react"
import { toPng } from "html-to-image"
import { Download, Share2 } from "lucide-react"

import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

/** Opaque glass + mica — not see-through white/0.06. Content stays above specular. */
export const COMUNA_ACTION_BTN_CLASS = cn(
  GLASS_PANEL_CLASS,
  GLASS_MICA_INTERACTIVE_CLASS,
  "inline-flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/90 transition-colors hover:bg-black/70 hover:text-white disabled:opacity-50",
)

export type ComunaTodayShareBarProps = {
  codComuna: number
  comunaName: string
  cardRef: RefObject<HTMLDivElement | null>
  className?: string
  /** Extra actions in the same full-width grid (e.g. Ver mapa / Mi plan). */
  children?: ReactNode
}

function ActionLabel({ children }: { children: ReactNode }) {
  return <span className="relative z-[1] inline-flex items-center gap-1.5">{children}</span>
}

export function ComunaTodayShareBar({
  codComuna,
  comunaName,
  cardRef,
  className,
  children,
}: ComunaTodayShareBarProps) {
  const [exporting, setExporting] = useState(false)
  const filename = `chilerisk-${codComuna}-hoy.png`

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

  async function webShare() {
    setExporting(true)
    try {
      const exported = await captureCard()
      if (!exported) return

      const payload: ShareData = {
        title: `${comunaName} · ChileRisk`,
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

      // Desktop / browsers without file Web Share → download the PNG
      triggerDownload(exported.dataUrl)
    } catch {
      /* ignore export errors */
    } finally {
      setExporting(false)
    }
  }

  async function downloadPng() {
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

  return (
    <div className={cn("grid w-full grid-cols-2 gap-2", className)}>
      <button
        type="button"
        onClick={() => void webShare()}
        disabled={exporting}
        className={COMUNA_ACTION_BTN_CLASS}
      >
        <ActionLabel>
          <Share2 className="size-3.5 shrink-0" aria-hidden />
          {exporting ? "Generando…" : "Compartir"}
        </ActionLabel>
      </button>
      <button
        type="button"
        onClick={() => void downloadPng()}
        disabled={exporting}
        className={COMUNA_ACTION_BTN_CLASS}
      >
        <ActionLabel>
          <Download className="size-3.5 shrink-0" aria-hidden />
          {exporting ? "Generando…" : "Descargar PNG"}
        </ActionLabel>
      </button>
      {children}
    </div>
  )
}
