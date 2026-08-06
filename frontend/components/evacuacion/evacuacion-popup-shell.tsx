"use client"

import { useEffect, useState } from "react"

import { EvacuationPopupContent } from "@/components/evacuacion/evacuacion-popup-content"
import { MapPopup } from "@/components/ui/map"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { MAP_DESKTOP_MIN_QUERY } from "@/lib/citizen-layout"
import { getEvacuationPopupMeta, getEvacuationPopupTitle } from "@/lib/evacuacion-popup"
import { SURFACE_PANEL_SHELL_CLASS } from "@/lib/surface"
import { cn } from "@/lib/utils"

function useIsDesktopMd() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia(MAP_DESKTOP_MIN_QUERY)
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  return isDesktop
}

export type EvacuationPopupSelection = {
  lng: number
  lat: number
  layerId: string
  properties: Record<string, unknown>
}

export function EvacuationPopupShell({
  selection,
  popupKey,
  onClose,
}: {
  selection: EvacuationPopupSelection
  popupKey: number
  onClose: () => void
}) {
  const isDesktop = useIsDesktopMd()
  const meta = getEvacuationPopupMeta(selection.layerId)
  const title = getEvacuationPopupTitle(selection.layerId, meta.title)

  if (isDesktop === null) return null

  const content = (
    <EvacuationPopupContent
      layerId={selection.layerId}
      properties={selection.properties}
      lng={selection.lng}
      lat={selection.lat}
      onClose={onClose}
      className="max-w-none min-w-0 w-full"
    />
  )

  if (isDesktop) {
    return (
      <MapPopup
        key={popupKey}
        longitude={selection.lng}
        latitude={selection.lat}
        onClose={onClose}
        className="max-w-[310px] overflow-hidden !p-0"
      >
        {content}
      </MapPopup>
    )
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          SURFACE_PANEL_SHELL_CLASS,
          "max-h-[min(55dvh,420px)] gap-0 overflow-hidden rounded-none p-0 sm:max-w-none",
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Detalle de la capa de evacuación</SheetDescription>
        </SheetHeader>
        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
          {content}
        </div>
      </SheetContent>
    </Sheet>
  )
}
