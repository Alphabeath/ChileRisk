"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import {
  MAP_STYLE,
  CHILE_BOUNDS,
  COMUNAS_MIN_ZOOM,
  REGION_FILL_HOVER,
  REGION_LINE_COLOR,
  REGION_LINE_HOVER,
  COMUNA_FILL_COLOR,
  COMUNA_FILL_HOVER,
  COMUNA_LINE_COLOR,
  COMUNA_LINE_HOVER,
  REGIONS_DATA_URL,
  COMUNAS_DATA_URL,
  hideForeignLabels,
  type RegionProperties,
  type ComunaProperties,
} from "./map-config"
import {
  createPopupContent,
  ComunaPopupContent,
  RegionPopupContent,
} from "./map-popup"
import { getNationalRisk, getComunaRisk } from "@/lib/api"
import type { NationalRisk } from "@/lib/types"

type Position = [number, number]
type LinearRing = Position[]
type Polygon = LinearRing[]
type MultiPolygon = Polygon[]

interface RegionGeometry {
  type: string
  coordinates: Polygon | MultiPolygon
}

interface RegionFeature {
  properties: { codregion: number; Region: string }
  geometry: RegionGeometry
}

function getRegionLabelPoint(geometry: RegionGeometry): [number, number] {
  const parts: LinearRing[] = geometry.type === "Polygon"
    ? [(geometry.coordinates as Polygon)[0]]
    : (geometry.coordinates as MultiPolygon).map((p) => p[0])

  let best: [number, number] = [-71, -36]
  let bestArea = -1

  for (const ring of parts) {
    if (!ring || ring.length < 3) continue

    let area = 0, cx = 0, cy = 0
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1]
      const xj = ring[j][0], yj = ring[j][1]
      const f = xi * yj - xj * yi
      area += f
      cx += (xi + xj) * f
      cy += (yi + yj) * f
    }
    area = Math.abs(area) / 2
    if (area > bestArea) {
      bestArea = area
      const f = 1 / (6 * area)
      best = [cx * f, cy * f]
    }
  }
  return best
}

export function ChileMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const hoveredRegionRef = useRef<number | null>(null)
  const hoveredComunaRef = useRef<number | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const popupDestroyRef = useRef<(() => void) | null>(null)
  const sizeObserverRef = useRef<ResizeObserver | null>(null)
  const router = useRouter()

  const attachComunaListeners = useCallback((map: maplibregl.Map) => {
    const fillLayer = "comuna-fill"
    const sourceId = "comunas"

    map.on("mousemove", fillLayer, (e) => {
      if (!e.features?.length) return
      map.getCanvas().style.cursor = "pointer"
      const id = e.features[0].id as number
      if (hoveredComunaRef.current !== null && hoveredComunaRef.current !== id) {
        map.setFeatureState({ source: sourceId, id: hoveredComunaRef.current }, { hover: false })
      }
      map.setFeatureState({ source: sourceId, id }, { hover: true })
      hoveredComunaRef.current = id
    })

    map.on("mouseleave", fillLayer, () => {
      map.getCanvas().style.cursor = ""
      if (hoveredComunaRef.current !== null) {
        map.setFeatureState({ source: sourceId, id: hoveredComunaRef.current }, { hover: false })
      }
      hoveredComunaRef.current = null
    })

    map.on("click", fillLayer, async (e) => {
      const props = e.features?.[0]?.properties as ComunaProperties | undefined
      if (!props) return
      if (popupRef.current) popupRef.current.remove()
      if (popupDestroyRef.current) {
        popupDestroyRef.current()
        popupDestroyRef.current = null
      }

      let comunaWithRisk: ComunaProperties = props
      try {
        const risk = await getComunaRisk(props.cod_comuna)
        comunaWithRisk = {
          ...props,
          composite_score: risk.composite_score,
          severity: risk.severity,
          dominant_hazard: risk.dominant_hazard,
          sismo_score: risk.sismo_score,
          ola_calor_score: risk.ola_calor_score,
          ola_frio_score: risk.ola_frio_score,
          viento_score: risk.viento_score,
        }
      } catch {}

      const { element, destroy } = createPopupContent(
        <ComunaPopupContent
          properties={comunaWithRisk}
          onViewDetail={() => {
            if (popupRef.current) popupRef.current.remove()
            destroy()
            popupDestroyRef.current = null
            router.push(`/map/${props.codregion}/${props.cod_comuna}`)
          }}
        />
      )
      popupDestroyRef.current = destroy
      popupRef.current = new maplibregl.Popup({ closeButton: true, closeOnClick: false, className: "cr-popup" })
        .setLngLat(e.lngLat)
        .setDOMContent(element)
        .addTo(map)
      popupRef.current.on("close", () => {
        destroy()
        popupDestroyRef.current = null
        popupRef.current = null
      })
    })
  }, [router])

  const handleRegionClick = useCallback(
    (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      const props = e.features?.[0]?.properties as RegionProperties | undefined
      if (!props || !mapRef.current) return

      if (popupRef.current) popupRef.current.remove()
      if (popupDestroyRef.current) {
        popupDestroyRef.current()
        popupDestroyRef.current = null
      }
      const { element, destroy } = createPopupContent(
        <RegionPopupContent
          properties={props}
          onViewDetail={() => {
            if (popupRef.current) popupRef.current.remove()
            destroy()
            popupDestroyRef.current = null
            router.push(`/map/${props.codregion}`)
          }}
        />
      )
      popupDestroyRef.current = destroy
      popupRef.current = new maplibregl.Popup({ closeButton: true, closeOnClick: false, className: "cr-popup" })
        .setLngLat(e.lngLat)
        .setDOMContent(element)
        .addTo(mapRef.current)
      popupRef.current.on("close", () => {
        destroy()
        popupDestroyRef.current = null
        popupRef.current = null
      })
    },
    [router]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return

    container.innerHTML = ''

    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE,
      bounds: CHILE_BOUNDS,
      fitBoundsOptions: { padding: 20 },
      maxBounds: [-120, -60, -30, -10],
      minZoom: 3,
      maxZoom: 12,
    })

    map.addControl(new maplibregl.NavigationControl(), "top-right")
    mapRef.current = map

    const ro = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize()
    })
    ro.observe(container)
    sizeObserverRef.current = ro

    requestAnimationFrame(() => {
      if (mapRef.current) mapRef.current.resize()
    })

    map.on("load", async () => {
      if (mapRef.current) mapRef.current.resize()
      hideForeignLabels(map)

      const regionsRes = await fetch(REGIONS_DATA_URL)
      const regionsGeojson = await regionsRes.json()

      try {
        const riskData = await getNationalRisk()
        const riskMap = new Map(riskData.map((r: NationalRisk) => [r.codregion, r]))
        if (regionsGeojson.features) {
          for (const f of regionsGeojson.features) {
            const r = riskMap.get(f.properties.codregion)
            if (r) {
              f.properties.composite_score = r.composite_score
              f.properties.severity = r.severity
              f.properties.dominant_hazard = r.dominant_hazard
              f.properties.sismo_score = r.sismo_score
              f.properties.ola_calor_score = r.ola_calor_score
              f.properties.ola_frio_score = r.ola_frio_score
              f.properties.viento_score = r.viento_score
            }
          }
        }
      } catch {}

      map.addSource("regions", { type: "geojson", data: regionsGeojson, generateId: true })

      map.addLayer({
        id: "region-fill",
        type: "fill",
        source: "regions",
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            REGION_FILL_HOVER,
            [
              "step",
              ["coalesce", ["get", "composite_score"], 45],
              "#085e08",
              45,
              "#cc9e23",
              60,
              "#c23d3c",
            ],
          ],
          "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.45, 0.2],
        },
        filter: ["!=", ["get", "codregion"], 0],
      })

      map.addLayer({
        id: "region-line",
        type: "line",
        source: "regions",
        paint: {
          "line-color": ["case", ["boolean", ["feature-state", "hover"], false], REGION_LINE_HOVER, REGION_LINE_COLOR],
          "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2.5, 1.2],
        },
        filter: ["!=", ["get", "codregion"], 0],
      })

      const labelFeatures = (regionsGeojson.features as RegionFeature[])
        .filter((f) => f.properties?.codregion && f.properties.codregion !== 0)
        .map((f) => ({
          type: "Feature" as const,
          properties: { codregion: f.properties.codregion, name: f.properties.Region },
          geometry: { type: "Point" as const, coordinates: getRegionLabelPoint(f.geometry) },
        }))

      map.addSource("region-labels", {
        type: "geojson",
        data: { type: "FeatureCollection", features: labelFeatures },
      })

      map.addLayer({
        id: "region-label-custom",
        type: "symbol",
        source: "region-labels",
        minzoom: 5,
        maxzoom: 9,
        layout: {
          "text-field": ["get", "name"],
          "text-size": [
            "step",
            ["zoom"],
            10,
            5, 10,
            6, 11,
            7, 12,
            8, 13
          ],
          "text-anchor": "center",
          "text-allow-overlap": false,
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular"
          ],
          "text-transform": "uppercase",
          "text-max-width": 12,
          "text-keep-upright": true,
          "text-offset": [0, 0.4]
        },
        paint: {
          "text-color": "rgba(168, 176, 180, 1)",
          "text-halo-color": "#222",
          "text-halo-width": 1
        }
      })

      map.on("mousemove", "region-fill", (e) => {
        if (!e.features?.length) return
        map.getCanvas().style.cursor = "pointer"
        const id = e.features[0].id as number
        if (hoveredRegionRef.current !== null && hoveredRegionRef.current !== id) {
          map.setFeatureState({ source: "regions", id: hoveredRegionRef.current }, { hover: false })
        }
        map.setFeatureState({ source: "regions", id }, { hover: true })
        hoveredRegionRef.current = id
      })

      map.on("mouseleave", "region-fill", () => {
        map.getCanvas().style.cursor = ""
        if (hoveredRegionRef.current !== null) {
          map.setFeatureState({ source: "regions", id: hoveredRegionRef.current }, { hover: false })
        }
        hoveredRegionRef.current = null
      })

      map.on("click", "region-fill", handleRegionClick)

      const loadComunas = async () => {
        if (map.getSource("comunas")) return
        const res = await fetch(COMUNAS_DATA_URL)
        const data = await res.json()

        map.addSource("comunas", { type: "geojson", data, generateId: true })

        map.addLayer({ id: "comuna-fill", type: "fill", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, paint: { "fill-color": ["case", ["boolean", ["feature-state", "hover"], false], COMUNA_FILL_HOVER, COMUNA_FILL_COLOR], "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.5, 0.25] } })
        map.addLayer({ id: "comuna-line", type: "line", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, paint: { "line-color": ["case", ["boolean", ["feature-state", "hover"], false], COMUNA_LINE_HOVER, COMUNA_LINE_COLOR], "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2, 0.8] } })
        map.addLayer({ id: "comuna-label", type: "symbol", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, layout: { "text-field": ["get", "Comuna"], "text-size": 11, "text-anchor": "center", "text-allow-overlap": false, "text-font": ["Open Sans Regular"] }, paint: { "text-color": "#e2e8f0", "text-halo-color": "#1e293b", "text-halo-width": 1.5 } })

        attachComunaListeners(map)
      }

      map.on("moveend", () => {
        if (map.getZoom() >= COMUNAS_MIN_ZOOM) loadComunas()
      })

      if (map.getZoom() >= COMUNAS_MIN_ZOOM) loadComunas()
    })

    return () => {
      if (sizeObserverRef.current) {
        sizeObserverRef.current.disconnect()
        sizeObserverRef.current = null
      }
      if (popupDestroyRef.current) {
        popupDestroyRef.current()
        popupDestroyRef.current = null
      }
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [handleRegionClick, attachComunaListeners])

  return (
    <div
      ref={containerRef}
      className="h-dvh w-full"
      role="application"
      aria-label="Mapa interactivo de regiones y comunas de Chile"
    />
  )
}
