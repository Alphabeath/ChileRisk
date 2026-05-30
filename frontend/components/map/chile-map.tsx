"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import {
  MAP_STYLE,
  CHILE_BOUNDS,
  COMUNAS_MIN_ZOOM,
  REGION_LINE_COLOR,
  REGION_LINE_HOVER,
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
import { getNationalRisk, getComunaRisk, getRegionRisk } from "@/lib/api"
import type { NationalRisk, RegionRisk } from "@/lib/types"

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
  const preloadedComunaDataRef = useRef<Record<string, unknown> | null>(null)
  const preloadedRawComunaGeojsonRef = useRef<Record<string, unknown> | null>(null)
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
          temperature_c: risk.temperature_c,
          wind_speed_kmh: risk.wind_speed_kmh,
          seismic_impact: risk.seismic_impact,
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
              if (r.avg_temperature_c != null) f.properties.avg_temperature_c = r.avg_temperature_c
              if (r.avg_wind_speed_kmh != null) f.properties.avg_wind_speed_kmh = r.avg_wind_speed_kmh
            }
          }
        }
      } catch {}

      map.addSource("regions", { type: "geojson", data: regionsGeojson, generateId: true })

      map.addLayer({
        id: "region-fill",
        type: "fill",
        source: "regions",
        maxzoom: COMUNAS_MIN_ZOOM,
        paint: {
          "fill-color": [
            "step",
            ["coalesce", ["get", "composite_score"], 35],
            "#085e08",
            35,
            "#cc9e23",
            55,
            "#e07020",
            75,
            "#c23d3c",
          ],
          "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.98, 0.65],
        },
        filter: ["!=", ["get", "codregion"], 0],
      })

      map.addLayer({
        id: "region-line",
        type: "line",
        source: "regions",
        paint: {
          "line-color": ["case", ["boolean", ["feature-state", "hover"], false], REGION_LINE_HOVER, REGION_LINE_COLOR],
          "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2.5, 1.5],
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
        maxzoom: COMUNAS_MIN_ZOOM,
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

      const prefetchRegionCodes = Array.from(new Set(
        (regionsGeojson.features || []).map((f: { properties?: { codregion?: number } }) => f.properties?.codregion).filter(Boolean)
      )) as number[]
      prefetchRegionCodes.forEach((cod) => {
        getRegionRisk(cod).catch(() => null)
      })

      const comunaGeojsonPromise = fetch(COMUNAS_DATA_URL)
        .then((r) => r.json())
        .then((d) => {
          preloadedRawComunaGeojsonRef.current = d
          return d
        })
        .catch(() => null)

      // Background full preparation: as soon as risks + geojson are ready, enrich and store
      Promise.all([
        comunaGeojsonPromise,
        ...prefetchRegionCodes.map((cod) => getRegionRisk(cod).catch(() => null)),
      ]).then(([rawData]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = (rawData || {}) as { features?: any[] }
        if (!d.features) return
        try {
          const regionCodes = Array.from(new Set(
            (d.features || []).map((f: { properties?: { codregion?: number } }) => f.properties?.codregion).filter(Boolean)
          )) as number[]
          const promises = regionCodes.map((cod) => getRegionRisk(cod).catch(() => null))
          return Promise.all(promises).then((results) => {
            type ComunaRiskItem = RegionRisk["comunas"][number]
            const riskByComuna = new Map<number, ComunaRiskItem>()
            results.forEach((region) => {
              if (region?.comunas) {
                region.comunas.forEach((c: ComunaRiskItem) => riskByComuna.set(c.cod_comuna, c))
              }
            })
            ;(d.features || []).forEach((f: { properties?: Record<string, unknown> }) => {
              const props = f.properties as Record<string, number | string> | undefined
              const cod = props?.cod_comuna as number | undefined
              const r = cod != null ? riskByComuna.get(cod) : undefined
              if (r && props) {
                props.composite_score = r.composite_score
                props.severity = r.severity
                props.dominant_hazard = r.dominant_hazard
                props.sismo_score = r.sismo_score
                props.ola_calor_score = r.ola_calor_score
                props.ola_frio_score = r.ola_frio_score
                props.viento_score = r.viento_score
                if (r.temperature_c != null) props.temperature_c = r.temperature_c
                if (r.wind_speed_kmh != null) props.wind_speed_kmh = r.wind_speed_kmh
              }
            })
            preloadedComunaDataRef.current = d

            // Aggressive preload: add source + layers now (minzoom keeps them hidden until user reaches zoom 7)
            if (!map.getSource("comunas")) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              map.addSource("comunas", { type: "geojson", data: d as any, generateId: true })
              map.addLayer({ id: "comuna-fill", type: "fill", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, paint: { "fill-color": ["step", ["coalesce", ["get", "composite_score"], 35], "#085e08", 35, "#cc9e23", 55, "#e07020", 75, "#c23d3c"], "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.95, 0.55] } })
              map.addLayer({ id: "comuna-line", type: "line", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, paint: { "line-color": ["case", ["boolean", ["feature-state", "hover"], false], COMUNA_LINE_HOVER, COMUNA_LINE_COLOR], "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2, 0.7], "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.9, 0.6] } })
              map.addLayer({ id: "comuna-label", type: "symbol", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, layout: { "text-field": ["get", "Comuna"], "text-size": 11, "text-anchor": "center", "text-allow-overlap": false, "text-font": ["Open Sans Regular"] }, paint: { "text-color": "#e2e8f0", "text-halo-color": "#1e293b", "text-halo-width": 1.5 } })
              if (map.getLayer("region-line")) {
                map.moveLayer("region-line")
              }
              attachComunaListeners(map)
            }
          })
        } catch {}
      }).catch(() => null)

      map.on("mousemove", "region-fill", (e) => {
        if (map.getZoom() >= COMUNAS_MIN_ZOOM) {
          if (hoveredRegionRef.current !== null) {
            map.setFeatureState({ source: "regions", id: hoveredRegionRef.current }, { hover: false })
            hoveredRegionRef.current = null
          }
          return
        }
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

        let data: Record<string, unknown> | null = null

        if (preloadedComunaDataRef.current) {
          data = preloadedComunaDataRef.current
          preloadedComunaDataRef.current = null
        } else if (preloadedRawComunaGeojsonRef.current) {
          data = preloadedRawComunaGeojsonRef.current
          preloadedRawComunaGeojsonRef.current = null
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = data as { features?: any[] }
          // enrich on the fly (risks are cached)
          try {
            const regionCodes = Array.from(new Set(
              (d.features || []).map((f: { properties?: { codregion?: number } }) => f.properties?.codregion).filter(Boolean)
            )) as number[]
            const results = await Promise.all(regionCodes.map((cod) => getRegionRisk(cod).catch(() => null)))
            type ComunaRiskItem = RegionRisk["comunas"][number]
            const riskByComuna = new Map<number, ComunaRiskItem>()
            results.forEach((region) => {
              if (region?.comunas) region.comunas.forEach((c: ComunaRiskItem) => riskByComuna.set(c.cod_comuna, c))
            })
            ;(d.features || []).forEach((f: { properties?: Record<string, unknown> }) => {
              const props = f.properties as Record<string, number | string> | undefined
              const cod = props?.cod_comuna as number | undefined
              const r = cod != null ? riskByComuna.get(cod) : undefined
              if (r && props) {
                props.composite_score = r.composite_score
                props.severity = r.severity
                props.dominant_hazard = r.dominant_hazard
                props.sismo_score = r.sismo_score
                props.ola_calor_score = r.ola_calor_score
                props.ola_frio_score = r.ola_frio_score
                props.viento_score = r.viento_score
                if (r.temperature_c != null) props.temperature_c = r.temperature_c
                if (r.wind_speed_kmh != null) props.wind_speed_kmh = r.wind_speed_kmh
              }
            })
          } catch {}
        } else {
          const res = await fetch(COMUNAS_DATA_URL)
          data = await res.json()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = data as { features?: any[] }
          // full slow path enrichment (should be rare)
          try {
            const regionCodes = Array.from(new Set(
              (d.features || []).map((f: { properties?: { codregion?: number } }) => f.properties?.codregion).filter(Boolean)
            )) as number[]
            const results = await Promise.all(regionCodes.map((cod) => getRegionRisk(cod).catch(() => null)))
            type ComunaRiskItem = RegionRisk["comunas"][number]
            const riskByComuna = new Map<number, ComunaRiskItem>()
            results.forEach((region) => {
              if (region?.comunas) region.comunas.forEach((c: ComunaRiskItem) => riskByComuna.set(c.cod_comuna, c))
            })
            ;(d.features || []).forEach((f: { properties?: Record<string, unknown> }) => {
              const props = f.properties as Record<string, number | string> | undefined
              const cod = props?.cod_comuna as number | undefined
              const r = cod != null ? riskByComuna.get(cod) : undefined
              if (r && props) {
                props.composite_score = r.composite_score
                props.severity = r.severity
                props.dominant_hazard = r.dominant_hazard
                props.sismo_score = r.sismo_score
                props.ola_calor_score = r.ola_calor_score
                props.ola_frio_score = r.ola_frio_score
                props.viento_score = r.viento_score
                if (r.temperature_c != null) props.temperature_c = r.temperature_c
                if (r.wind_speed_kmh != null) props.wind_speed_kmh = r.wind_speed_kmh
              }
            })
          } catch {}
        }

        if (!data) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.addSource("comunas", { type: "geojson", data: data as any, generateId: true })

        map.addLayer({ id: "comuna-fill", type: "fill", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, paint: { "fill-color": ["step", ["coalesce", ["get", "composite_score"], 35], "#085e08", 35, "#cc9e23", 55, "#e07020", 75, "#c23d3c"], "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.95, 0.55] } })
        map.addLayer({ id: "comuna-line", type: "line", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, paint: { "line-color": ["case", ["boolean", ["feature-state", "hover"], false], COMUNA_LINE_HOVER, COMUNA_LINE_COLOR], "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2, 0.7], "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.9, 0.6] } })
        map.addLayer({ id: "comuna-label", type: "symbol", source: "comunas", minzoom: COMUNAS_MIN_ZOOM, layout: { "text-field": ["get", "Comuna"], "text-size": 11, "text-anchor": "center", "text-allow-overlap": false, "text-font": ["Open Sans Regular"] }, paint: { "text-color": "#e2e8f0", "text-halo-color": "#1e293b", "text-halo-width": 1.5 } })
        if (map.getLayer("region-line")) {
          map.moveLayer("region-line")
        }

        attachComunaListeners(map)
      }

      map.on("moveend", () => {
        const z = map.getZoom()
        if (z >= COMUNAS_MIN_ZOOM) {
          loadComunas()
          if (hoveredRegionRef.current !== null) {
            map.setFeatureState({ source: "regions", id: hoveredRegionRef.current }, { hover: false })
            hoveredRegionRef.current = null
          }
        }
      })

      if (map.getZoom() >= COMUNAS_MIN_ZOOM) {
        loadComunas()
        if (hoveredRegionRef.current !== null) {
          map.setFeatureState({ source: "regions", id: hoveredRegionRef.current }, { hover: false })
          hoveredRegionRef.current = null
        }
      }
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
