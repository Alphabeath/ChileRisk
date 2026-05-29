"use client"

import { createRoot, type Root } from "react-dom/client"
import type { ReactNode } from "react"
import type { RegionProperties, ComunaProperties } from "./map-config"

interface RegionPopupContentProps {
  properties: RegionProperties
  onViewDetail: () => void
}

export function RegionPopupContent({ properties, onViewDetail }: RegionPopupContentProps) {
  return (
    <div className="py-1">
      <h3 className="mb-1.5 text-sm font-semibold text-black">{properties.Region}</h3>
      <p className="mb-1 text-xs text-muted-foreground">Código: {properties.codregion}</p>
      <p className="mb-2 text-xs text-muted-foreground">
        Superficie: {Number(properties.area_km).toLocaleString("es-CL")} km²
      </p>
      <button
        type="button"
        onClick={onViewDetail}
        className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:bg-blue-800"
      >
        Ver detalle
      </button>
    </div>
  )
}

interface ComunaPopupContentProps {
  properties: ComunaProperties
  onViewDetail: () => void
}

export function ComunaPopupContent({ properties, onViewDetail }: ComunaPopupContentProps) {
  return (
    <div className="py-1">
      <h3 className="mb-1.5 text-sm font-semibold">{properties.Comuna}</h3>
      <p className="mb-1 text-xs text-muted-foreground">{properties.Provincia}</p>
      <p className="mb-2 text-xs text-muted-foreground">{properties.Region}</p>
      <button
        type="button"
        onClick={onViewDetail}
        className="w-full rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:bg-violet-800"
      >
        Ver detalle
      </button>
    </div>
  )
}

export function createPopupContent(node: ReactNode): { element: HTMLDivElement; destroy: () => void } {
  const element = document.createElement("div")
  const root: Root = createRoot(element)
  root.render(node)
  let unmounted = false
  return {
    element,
    destroy: () => {
      if (!unmounted) {
        unmounted = true
        queueMicrotask(() => root.unmount())
      }
    },
  }
}
