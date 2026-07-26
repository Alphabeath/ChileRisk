"use client"

import Link from "next/link"
import { MessageCircle, Route, Share2, ShieldQuestion } from "lucide-react"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ALERT_LEVEL_META } from "@/lib/alerts-display"
import type { AlertLevel } from "@/lib/types"

export type EmergencyActionSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  severity: AlertLevel
  hazardLabel: string
  comunaName: string | null
  onWhatToDo: () => void
  onEvacuate: () => void
  onShare: () => void
}

export function EmergencyActionSheet({
  open,
  onOpenChange,
  severity,
  hazardLabel,
  comunaName,
  onWhatToDo,
  onEvacuate,
  onShare,
}: EmergencyActionSheetProps) {
  const levelMeta = ALERT_LEVEL_META[severity]
  const place = comunaName ?? "tu comuna"

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            Emergencia — Alerta {levelMeta.label}
          </DrawerTitle>
          <DrawerDescription>
            {hazardLabel} en {place}. Elige una acción inmediata.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-2 overflow-y-auto px-4 py-3">
          <button
            type="button"
            onClick={() => {
              onWhatToDo()
              onOpenChange(false)
            }}
            className="flex items-center gap-3 border border-white/15 bg-white/[0.04] px-3 py-3 text-left transition-colors hover:bg-white/[0.08]"
          >
            <ShieldQuestion className="size-5 text-cyan-300" aria-hidden />
            <span>
              <span className="block text-sm font-medium text-white/90">
                ¿Qué hago?
              </span>
              <span className="block text-[11px] text-white/50">
                Instrucciones de seguridad en 3 pasos
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              onEvacuate()
              onOpenChange(false)
            }}
            className="flex items-center gap-3 border border-white/15 bg-white/[0.04] px-3 py-3 text-left transition-colors hover:bg-white/[0.08]"
          >
            <Route className="size-5 text-orange-300" aria-hidden />
            <span>
              <span className="block text-sm font-medium text-white/90">
                Punto de encuentro
              </span>
              <span className="block text-[11px] text-white/50">
                Ir al mapa de evacuación más cercano
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              onShare()
              onOpenChange(false)
            }}
            className="flex items-center gap-3 border border-white/15 bg-white/[0.04] px-3 py-3 text-left transition-colors hover:bg-white/[0.08]"
          >
            <Share2 className="size-5 text-emerald-300" aria-hidden />
            <span>
              <span className="block text-sm font-medium text-white/90">
                Compartir estado
              </span>
              <span className="block text-[11px] text-white/50">
                Avisa que estás a salvo
              </span>
            </span>
          </button>
        </div>
        <DrawerFooter>
          <Link
            href="/assistant"
            className="inline-flex items-center justify-center gap-2 border border-white/20 bg-white/[0.06] px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white/80 transition-colors hover:bg-white/10"
          >
            <MessageCircle className="size-3.5" aria-hidden />
            Abrir asistente
          </Link>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
