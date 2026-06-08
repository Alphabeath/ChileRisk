import type { Feature, FeatureCollection } from "geojson"
import type maplibregl from "maplibre-gl"
import { EVACUATION_MEETING_POINT_ICON_SIZE } from "@/components/map/map-config"
import { KMZParser, type KMZParseResult, type KMLStyle } from "maplibre-gl-kmz-layer"

type KmzZip = {
  file: (name: string) => { async: (type: "blob") => Promise<Blob> } | null
}

export interface FlatKmzLayerHandle {
  sourceId: string
  layerIds: string[]
  iconImageId: string | null
  parseResult: KMZParseResult
}

function layerVisibility(visible: boolean): "visible" | "none" {
  return visible ? "visible" : "none"
}

function flattenFeatureProperties(
  feature: Feature,
  defaults: {
    lineColor?: string
    lineWidth?: number
    iconId?: string
    iconScale?: number
  },
): Feature {
  const props: Record<string, unknown> = { ...(feature.properties ?? {}) }
  const style = props._style as KMLStyle | undefined
  delete props._style

  if (style?.color) props.lineColor = style.color
  if (style?.width != null) props.lineWidth = style.width
  if (style?.scale != null) props.iconScale = style.scale

  if (!props.lineColor && defaults.lineColor) props.lineColor = defaults.lineColor
  if (props.lineWidth == null && defaults.lineWidth != null) props.lineWidth = defaults.lineWidth
  if (defaults.iconId) props.iconId = defaults.iconId
  if (props.iconScale == null && defaults.iconScale != null) props.iconScale = defaults.iconScale

  return { ...feature, properties: props }
}

function flattenFeatureCollection(
  collection: FeatureCollection,
  defaults: {
    lineColor?: string
    lineWidth?: number
    iconId?: string
    iconScale?: number
  },
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: collection.features.map((feature) => flattenFeatureProperties(feature, defaults)),
  }
}

async function loadKmz(url: string): Promise<KMZParseResult & { _zip?: KmzZip }> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load KMZ (${response.status})`)
  }

  const parser = new KMZParser()
  return (await parser.parseKMZ(await response.arrayBuffer())) as KMZParseResult & {
    _zip?: KmzZip
  }
}

async function addPointIconFromKmz(
  map: maplibregl.Map,
  parseResult: KMZParseResult & { _zip?: KmzZip },
  layerId: string,
): Promise<string | null> {
  const imageId = `${layerId}-icon`
  if (map.hasImage(imageId)) return imageId

  const iconHref = Object.values(parseResult.styles).find((style) => style.icon)?.icon
  const zip = parseResult._zip
  if (!iconHref || !zip) return null

  const file =
    zip.file(iconHref) ??
    zip.file(iconHref.replace(/^\//, "")) ??
    null

  if (!file) return null

  const blob = await file.async("blob")
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  ctx.drawImage(bitmap, 0, 0)
  map.addImage(imageId, ctx.getImageData(0, 0, canvas.width, canvas.height), {
    pixelRatio: 2,
  })
  bitmap.close()

  return imageId
}

export async function addFlatKmzLayer(
  map: maplibregl.Map,
  options: {
    id: string
    url: string
    visible: boolean
    minzoom?: number
    mode: "lines" | "points"
    defaultLineColor?: string
    defaultLineWidth?: number
  },
): Promise<FlatKmzLayerHandle> {
  const parseResult = await loadKmz(options.url)
  const sourceId = `${options.id}-source`
  const layerIds: string[] = []
  let iconImageId: string | null = null

  if (options.mode === "points") {
    iconImageId = await addPointIconFromKmz(map, parseResult, options.id)
  }

  const data = flattenFeatureCollection(parseResult.features, {
    lineColor: options.defaultLineColor,
    lineWidth: options.defaultLineWidth,
    iconId: iconImageId ?? undefined,
    iconScale: 1,
  })

  if (map.getSource(sourceId)) {
    for (const layerId of [`${options.id}-lines`, `${options.id}-icon-points`]) {
      if (map.getLayer(layerId)) map.removeLayer(layerId)
    }
    map.removeSource(sourceId)
  }

  map.addSource(sourceId, { type: "geojson", data })

  if (options.mode === "lines") {
    const lineLayerId = `${options.id}-lines`
    map.addLayer({
      id: lineLayerId,
      type: "line",
      source: sourceId,
      filter: ["==", ["geometry-type"], "LineString"],
      minzoom: options.minzoom,
      layout: { visibility: layerVisibility(options.visible) },
      paint: {
        "line-color": ["coalesce", ["get", "lineColor"], options.defaultLineColor ?? "#005ce6"],
        "line-width": ["coalesce", ["get", "lineWidth"], options.defaultLineWidth ?? 2],
      },
    })
    layerIds.push(lineLayerId)
  }

  if (options.mode === "points" && iconImageId) {
    const pointLayerId = `${options.id}-icon-points`
    map.addLayer({
      id: pointLayerId,
      type: "symbol",
      source: sourceId,
      filter: ["==", ["geometry-type"], "Point"],
      minzoom: options.minzoom,
      layout: {
        visibility: layerVisibility(options.visible),
        "icon-image": iconImageId,
        "icon-size": [
          "*",
          EVACUATION_MEETING_POINT_ICON_SIZE,
          ["coalesce", ["get", "iconScale"], 1],
        ],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-anchor": "center",
      },
    })
    layerIds.push(pointLayerId)
  }

  return { sourceId, layerIds, iconImageId, parseResult }
}

export function setFlatKmzLayerVisibility(
  map: maplibregl.Map,
  handle: FlatKmzLayerHandle,
  visible: boolean,
): void {
  const visibility = layerVisibility(visible)
  for (const layerId of handle.layerIds) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visibility)
    }
  }
}

export function removeFlatKmzLayer(map: maplibregl.Map, handle: FlatKmzLayerHandle): void {
  for (const layerId of handle.layerIds) {
    if (map.getLayer(layerId)) map.removeLayer(layerId)
  }

  if (map.getSource(handle.sourceId)) {
    map.removeSource(handle.sourceId)
  }

  if (handle.iconImageId && map.hasImage(handle.iconImageId)) {
    map.removeImage(handle.iconImageId)
  }
}