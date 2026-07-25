"use client"

import { useEffect, useState } from "react"
import type maplibregl from "maplibre-gl"
import { Compass, Minus, Plus } from "lucide-react"
import {
  CITIZEN_NAVBAR_CLEARANCE_PX,
  MAP_PANEL_RIGHT_INSET_PX,
} from "@/lib/citizen-layout"
import {
  MAP_NAV_BUTTON_CLASS,
  MAP_NAV_CONTROL_CLASS,
} from "@/lib/map-panel-styles"
import { cn } from "@/lib/utils"

interface MapNavigationControlProps {
  map: maplibregl.Map | null
}

/**
 * Glass zoom/compass control for MapLibre maps.
 * Replaces native NavigationControl so chrome matches map overlays.
 */
export function MapNavigationControl({ map }: MapNavigationControlProps) {
  const [bearing, setBearing] = useState(0)
  const [canZoomIn, setCanZoomIn] = useState(true)
  const [canZoomOut, setCanZoomOut] = useState(true)

  useEffect(() => {
    if (!map) return

    const sync = () => {
      setBearing(map.getBearing())
      const zoom = map.getZoom()
      setCanZoomIn(zoom < map.getMaxZoom())
      setCanZoomOut(zoom > map.getMinZoom())
    }

    sync()
    map.on("zoom", sync)
    map.on("zoomend", sync)
    map.on("rotate", sync)
    map.on("rotateend", sync)
    map.on("pitch", sync)

    return () => {
      map.off("zoom", sync)
      map.off("zoomend", sync)
      map.off("rotate", sync)
      map.off("rotateend", sync)
      map.off("pitch", sync)
    }
  }, [map])

  if (!map) return null

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        top: CITIZEN_NAVBAR_CLEARANCE_PX,
        right: MAP_PANEL_RIGHT_INSET_PX,
      }}
    >
      <div
        className={MAP_NAV_CONTROL_CLASS}
        role="toolbar"
        aria-label="Navegación del mapa"
      >
        <button
          type="button"
          className={MAP_NAV_BUTTON_CLASS}
          aria-label="Acercar"
          title="Acercar"
          disabled={!canZoomIn}
          onClick={() => map.zoomIn({ duration: 280 })}
        >
          <Plus className="size-3.5 shrink-0" aria-hidden />
        </button>
        <button
          type="button"
          className={MAP_NAV_BUTTON_CLASS}
          aria-label="Alejar"
          title="Alejar"
          disabled={!canZoomOut}
          onClick={() => map.zoomOut({ duration: 280 })}
        >
          <Minus className="size-3.5 shrink-0" aria-hidden />
        </button>
        <button
          type="button"
          className={cn(MAP_NAV_BUTTON_CLASS, "cursor-pointer")}
          aria-label="Restablecer norte"
          title="Restablecer norte"
          onClick={() => map.resetNorth({ duration: 280 })}
        >
          <Compass
            className="size-3.5 shrink-0 transition-transform duration-150"
            style={{ transform: `rotate(${-bearing}deg)` }}
            aria-hidden
          />
        </button>
      </div>
    </div>
  )
}
