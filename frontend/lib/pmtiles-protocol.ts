import { Protocol } from "pmtiles"
import * as MapLibreGL from "maplibre-gl"

let registered = false

/** Register `pmtiles://` once for MapLibre vector sources. */
export function ensurePmtilesProtocol(): void {
  if (registered || typeof window === "undefined") return
  const protocol = new Protocol()
  MapLibreGL.addProtocol("pmtiles", protocol.tile)
  registered = true
}

/** HEAD-check whether a static asset exists (for pmtiles vs geojson fallback). */
export async function assetExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" })
    return res.ok
  } catch {
    return false
  }
}
