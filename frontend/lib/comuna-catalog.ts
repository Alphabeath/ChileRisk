import { COMUNAS_DATA_URL } from "@/components/map/map-config"

export type ComunaCatalogEntry = {
  code: number
  name: string
  region: string
  regionCode: number
}

type ComunaFeatureProps = {
  cod_comuna?: number
  Comuna?: string
  Region?: string
  codregion?: number
}

type ComunaFeatureCollection = {
  type: string
  features: Array<{
    properties?: ComunaFeatureProps | null
  }>
}

/** Strip diacritics and lowercase for search matching. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
}

export function parseComunaCatalog(
  geojson: ComunaFeatureCollection,
): ComunaCatalogEntry[] {
  const byCode = new Map<number, ComunaCatalogEntry>()

  for (const feature of geojson.features) {
    const props = feature.properties
    if (!props) continue
    const code = props.cod_comuna
    const name = props.Comuna?.trim()
    if (code == null || !Number.isFinite(code) || !name) continue
    if (byCode.has(code)) continue
    byCode.set(code, {
      code,
      name,
      region: props.Region?.trim() || "Sin región",
      regionCode: props.codregion ?? 0,
    })
  }

  return [...byCode.values()].toSorted((a, b) =>
    a.name.localeCompare(b.name, "es"),
  )
}

const FILTER_LIMIT = 80

/**
 * Filter catalog by comuna or region name. Empty query returns the first
 * `limit` entries (alphabetical).
 */
export function filterComunas(
  query: string,
  list: ComunaCatalogEntry[],
  limit = FILTER_LIMIT,
): ComunaCatalogEntry[] {
  const q = normalizeSearchText(query)
  if (!q) return list.slice(0, limit)

  const matched: ComunaCatalogEntry[] = []
  for (const entry of list) {
    const haystack = normalizeSearchText(`${entry.name} ${entry.region}`)
    if (!haystack.includes(q)) continue
    matched.push(entry)
    if (matched.length >= limit) break
  }
  return matched
}

export function findComunaByCode(
  list: ComunaCatalogEntry[],
  code: number | null | undefined,
): ComunaCatalogEntry | null {
  if (code == null) return null
  return list.find((c) => c.code === code) ?? null
}

export async function fetchComunaCatalog(): Promise<ComunaCatalogEntry[]> {
  const res = await fetch(COMUNAS_DATA_URL)
  if (!res.ok) {
    throw new Error(`No se pudo cargar el catálogo de comunas (${res.status})`)
  }
  const geojson = (await res.json()) as ComunaFeatureCollection
  return parseComunaCatalog(geojson)
}
