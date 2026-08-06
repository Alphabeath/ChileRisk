import type { ComunaProperties } from "@/components/map/map-config"

type PolygonCoords = [number, number][][]
type MultiPolygonCoords = PolygonCoords[]

type RawFeature = {
  type?: string
  properties?: Record<string, unknown> | null
  geometry?: {
    type: string
    coordinates: PolygonCoords | MultiPolygonCoords
  } | null
}

export type ComunaGeoFeature = {
  type: "Feature"
  properties: ComunaProperties
  geometry: {
    type: "Polygon" | "MultiPolygon"
    coordinates: PolygonCoords | MultiPolygonCoords
  }
}

export type ComunaFeatureCollection = {
  type: "FeatureCollection"
  features: ComunaGeoFeature[]
}

/** Normalize comunas GeoJSON for MapLibre (`promoteId: cod_comuna`). */
export function prepareComunasGeojson(raw: {
  type?: string
  features: RawFeature[]
}): ComunaFeatureCollection {
  return {
    type: "FeatureCollection",
    features: raw.features.map((f) => {
      const p = f.properties ?? {}
      return {
        type: "Feature" as const,
        properties: {
          cod_comuna: Number(p.cod_comuna),
          Comuna: String(p.Comuna ?? ""),
          Provincia: String(p.Provincia ?? ""),
          Region: String(p.Region ?? ""),
          codregion: Number(p.codregion),
        },
        geometry: f.geometry as ComunaGeoFeature["geometry"],
      }
    }),
  }
}
