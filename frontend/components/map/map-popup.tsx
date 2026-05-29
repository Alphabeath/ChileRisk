"use client"

import { createRoot, type Root } from "react-dom/client"
import type { ReactNode } from "react"
import type { RegionProperties, ComunaProperties } from "./map-config"
import { Button } from "@/components/ui/button"

interface RegionPopupContentProps {
  properties: RegionProperties
  onViewDetail: () => void
}

export function RegionPopupContent({ properties, onViewDetail }: RegionPopupContentProps) {
  return (
    <div className="py-3">
      <div className="px-4 pb-2">
        <h3 className="text-sm font-bold text-foreground">{properties.Region}</h3>
      </div>
      <div className="border-t border-border px-4 py-2 space-y-1.5">
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-muted-foreground">Código</span>
          <span className="font-medium text-foreground">{properties.codregion}</span>
        </div>
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-muted-foreground">Superficie</span>
          <span className="font-medium text-foreground">
            {Number(properties.area_km).toLocaleString("es-CL")} km²
          </span>
        </div>
      </div>

      {properties.composite_score != null && (
        <div className="border-t border-border px-4 py-2 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Riesgo</span>
            <span className="font-medium">{properties.composite_score.toFixed(1)}</span>
          </div>
          {properties.dominant_hazard && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dominante</span>
              <span className="font-medium">{properties.dominant_hazard}</span>
            </div>
          )}
          {properties.severity && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Severidad</span>
              <span className="font-semibold">{properties.severity}</span>
            </div>
          )}
          {(properties.sismo_score != null ||
            properties.ola_calor_score != null ||
            properties.ola_frio_score != null ||
            properties.viento_score != null) && (
            <div className="pt-1 text-[10px] text-muted-foreground grid grid-cols-2 gap-x-3">
              {properties.sismo_score != null && <span>sismo: {properties.sismo_score.toFixed(0)}</span>}
              {properties.ola_calor_score != null && <span>calor: {properties.ola_calor_score.toFixed(0)}</span>}
              {properties.ola_frio_score != null && <span>frío: {properties.ola_frio_score.toFixed(0)}</span>}
              {properties.viento_score != null && <span>viento: {properties.viento_score.toFixed(0)}</span>}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border px-4 pt-2 pb-1">
        <Button variant="default" size="xs" onClick={onViewDetail} className="w-full">
          Ver detalle
        </Button>
      </div>
    </div>
  )
}

interface ComunaPopupContentProps {
  properties: ComunaProperties
  onViewDetail: () => void
}

export function ComunaPopupContent({ properties, onViewDetail }: ComunaPopupContentProps) {
  return (
    <div className="py-3">
      <div className="px-4 pb-2">
        <h3 className="text-sm font-bold text-foreground">{properties.Comuna}</h3>
      </div>
      <div className="border-t border-border px-4 py-2 space-y-1.5">
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-muted-foreground">Código</span>
          <span className="font-medium text-foreground">{properties.cod_comuna}</span>
        </div>
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-muted-foreground">Provincia</span>
          <span className="font-medium text-foreground">{properties.Provincia}</span>
        </div>
      </div>

      {properties.composite_score != null && (
        <div className="border-t border-border px-4 py-2 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Riesgo</span>
            <span className="font-medium">{properties.composite_score.toFixed(1)}</span>
          </div>
          {properties.dominant_hazard && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dominante</span>
              <span className="font-medium">{properties.dominant_hazard}</span>
            </div>
          )}
          {properties.severity && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Severidad</span>
              <span className="font-semibold">{properties.severity}</span>
            </div>
          )}
          {(properties.sismo_score != null ||
            properties.ola_calor_score != null ||
            properties.ola_frio_score != null ||
            properties.viento_score != null) && (
            <div className="pt-1 text-[10px] text-muted-foreground grid grid-cols-2 gap-x-3">
              {properties.sismo_score != null && <span>sismo: {properties.sismo_score.toFixed(0)}</span>}
              {properties.ola_calor_score != null && <span>calor: {properties.ola_calor_score.toFixed(0)}</span>}
              {properties.ola_frio_score != null && <span>frío: {properties.ola_frio_score.toFixed(0)}</span>}
              {properties.viento_score != null && <span>viento: {properties.viento_score.toFixed(0)}</span>}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border px-4 pt-2 pb-1">
        <Button variant="default" size="xs" onClick={onViewDetail} className="w-full">
          Ver detalle
        </Button>
      </div>
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
