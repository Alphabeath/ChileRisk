import { describe, expect, test } from "bun:test"

import {
  filterComunas,
  findComunaByCode,
  normalizeSearchText,
  parseComunaCatalog,
  type ComunaCatalogEntry,
} from "./comuna-catalog"

const sample: ComunaCatalogEntry[] = [
  {
    code: 13101,
    name: "Santiago",
    region: "Región Metropolitana de Santiago",
    regionCode: 13,
  },
  {
    code: 5109,
    name: "Viña del Mar",
    region: "Región de Valparaíso",
    regionCode: 5,
  },
  {
    code: 4102,
    name: "Coquimbo",
    region: "Región de Coquimbo",
    regionCode: 4,
  },
]

describe("comuna-catalog", () => {
  test("normalizeSearchText strips accents", () => {
    expect(normalizeSearchText("Viña")).toBe("vina")
    expect(normalizeSearchText("  Región  ")).toBe("region")
  })

  test("parseComunaCatalog dedupes and sorts", () => {
    const list = parseComunaCatalog({
      type: "FeatureCollection",
      features: [
        {
          properties: {
            cod_comuna: 5109,
            Comuna: "Viña del Mar",
            Region: "Región de Valparaíso",
            codregion: 5,
          },
        },
        {
          properties: {
            cod_comuna: 13101,
            Comuna: "Santiago",
            Region: "Región Metropolitana de Santiago",
            codregion: 13,
          },
        },
        { properties: { cod_comuna: 13101, Comuna: "Santiago dup" } },
      ],
    })
    expect(list).toHaveLength(2)
    expect(list[0]?.name).toBe("Santiago")
    expect(list[1]?.name).toBe("Viña del Mar")
  })

  test("filterComunas matches name and region without accents", () => {
    expect(filterComunas("vina", sample).map((c) => c.code)).toEqual([5109])
    expect(filterComunas("metropolitana", sample).map((c) => c.code)).toEqual([
      13101,
    ])
    expect(filterComunas("", sample)).toHaveLength(3)
  })

  test("findComunaByCode", () => {
    expect(findComunaByCode(sample, 13101)?.name).toBe("Santiago")
    expect(findComunaByCode(sample, null)).toBeNull()
  })
})
