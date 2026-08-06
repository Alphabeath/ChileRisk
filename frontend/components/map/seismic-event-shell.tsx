"use client"

import { useEffect, useState } from "react"

import { SeismicEventDetailContent } from "@/components/map/seismic-event-detail"
import { MapPopup } from "@/components/ui/map"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SURFACE_PANEL_SHELL_CLASS } from "@/lib/surface"
import type { SeismicEvent } from "@/lib/types"
import { cn } from "@/lib/utils"

const MD_QUERY = "(min-width: 768px)"

export type SeismicEventSelection = {
  event: SeismicEvent
  lng: number
  lat: number
}

function useIsDesktopMd() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia(MD_QUERY)
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  return isDesktop
}

export function SeismicEventShell({
  selection,
  popupKey,
  onClose,
}: {
  selection: SeismicEventSelection
  popupKey: number
  onClose: () => void
}) {
  const isDesktop = useIsDesktopMd()
  const { event, lng, lat } = selection
  const title =
    (typeof event.raw_data?.location === "string" && event.raw_data.location) ||
    "Sismo registrado"

  if (isDesktop === null) return null

  const content = (
    <SeismicEventDetailContent
      event={event}
      onClose={onClose}
      className="max-w-none min-w-0 w-full"
    />
  )

  if (isDesktop) {
    return (
      <MapPopup
        key={popupKey}
        longitude={lng}
        latitude={lat}
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
          <SheetDescription>Detalle del sismo seleccionado</SheetDescription>
        </SheetHeader>
        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
          {content}
        </div>
      </SheetContent>
    </Sheet>
  )
}
