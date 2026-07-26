"use client"

import { useState } from "react"
import { Check, Copy, Share2 } from "lucide-react"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

export type EmergencyShareCardProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  comunaName: string | null
}

function buildShareText(comunaName: string | null): string {
  const place = comunaName ?? "mi comuna"
  const date = new Date().toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  return `Estoy seguro/a en ${place} — ChileRisk ${date}`
}

export function EmergencyShareCard({
  open,
  onOpenChange,
  comunaName,
}: EmergencyShareCardProps) {
  const text = buildShareText(comunaName)
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "ChileRisk — Estoy a salvo", text })
        return
      } catch {
        /* user cancelled or share failed → clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Compartir estado</DrawerTitle>
          <DrawerDescription>
            Avisa a tu familia o contactos que estás a salvo.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-3">
          <div
            className={cn(
              GLASS_PANEL_CLASS,
              "border-emerald-500/30 bg-emerald-950/40 p-4 text-center",
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-emerald-300/80">
              ChileRisk
            </p>
            <p className="mt-3 text-lg font-medium text-white/95">{text}</p>
          </div>
        </div>
        <DrawerFooter className="flex-row gap-2">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex flex-1 items-center justify-center gap-2 border border-white/20 bg-white/[0.06] px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white/80 transition-colors hover:bg-white/10"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-300" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
            {copied ? "Copiado" : "Copiar"}
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="inline-flex flex-1 items-center justify-center gap-2 border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-200 transition-colors hover:bg-emerald-500/25"
          >
            <Share2 className="size-3.5" aria-hidden />
            Compartir
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
