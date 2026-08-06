/**
 * Temporary mock risk payloads for territory detail UI preview.
 * Turn off when `/api/v1/.../risk` is wired — see FRONTEND.md.
 *
 * Click different regions to cycle ChileRisk alerts:
 *   preventiva → amarilla → roja (by codregion % 3)
 * Comunas vary further by cod_comuna so neighbors differ.
 */
/** Keep false — monitor uses live `/api/v1/.../risk`. */
export const USE_TERRITORY_RISK_MOCK = false

/** Normalized risk fields shared by region/comuna detail UI. */
export interface TerritoryRiskFields {
  composite_score: number
  /** Alert level: preventiva | amarilla | roja */
  severity: string
  dominant_hazard: string
  sismo_score: number
  ola_calor_score: number
  ola_frio_score: number
  viento_score: number
  inundacion_score: number
  temperature_c: number | null
  wind_speed_kmh: number | null
}

type HazardKey =
  | "sismo"
  | "ola_calor"
  | "ola_frio"
  | "viento"
  | "inundacion"

type MockPreset = {
  composite_score: number
  severity: "preventiva" | "amarilla" | "roja"
  dominant_hazard: HazardKey
  /** Base hazard scores; dominant is boosted in buildMock */
  scores: Omit<
    TerritoryRiskFields,
    | "composite_score"
    | "severity"
    | "dominant_hazard"
    | "temperature_c"
    | "wind_speed_kmh"
  >
  temperature_c: number
  wind_speed_kmh: number
}

/** One preset per ChileRisk alert bucket — used as region templates. */
const PRESETS: readonly MockPreset[] = [
  {
    composite_score: 22.4,
    severity: "preventiva",
    dominant_hazard: "viento",
    scores: {
      sismo_score: 18,
      ola_calor_score: 12,
      ola_frio_score: 20,
      viento_score: 28,
      inundacion_score: 14,
    },
    temperature_c: 16.2,
    wind_speed_kmh: 22,
  },
  {
    composite_score: 46.8,
    severity: "amarilla",
    dominant_hazard: "sismo",
    scores: {
      sismo_score: 52,
      ola_calor_score: 28,
      ola_frio_score: 18,
      viento_score: 35,
      inundacion_score: 22,
    },
    temperature_c: 14.5,
    wind_speed_kmh: 18,
  },
  {
    composite_score: 72.5,
    severity: "roja",
    dominant_hazard: "inundacion",
    scores: {
      sismo_score: 55,
      ola_calor_score: 48,
      ola_frio_score: 20,
      viento_score: 48,
      inundacion_score: 78,
    },
    temperature_c: 11.0,
    wind_speed_kmh: 36,
  },
]

/** Extra region-flavored overrides (codregion → tweaks). */
const REGION_OVERRIDES: Partial<
  Record<
    number,
    Partial<MockPreset> & { dominant_hazard?: HazardKey }
  >
> = {
  1: { dominant_hazard: "ola_calor", temperature_c: 24.8, wind_speed_kmh: 14 },
  2: { dominant_hazard: "ola_calor", temperature_c: 27.1, wind_speed_kmh: 16 },
  5: { dominant_hazard: "sismo", temperature_c: 15.4, wind_speed_kmh: 28 },
  8: { dominant_hazard: "inundacion", temperature_c: 12.3, wind_speed_kmh: 20 },
  10: { dominant_hazard: "viento", temperature_c: 9.8, wind_speed_kmh: 42 },
  12: {
    // Magallanes — mock Alerta Preventiva
    severity: "preventiva",
    composite_score: 18.6,
    dominant_hazard: "ola_frio",
    scores: {
      sismo_score: 12,
      ola_calor_score: 5,
      ola_frio_score: 26,
      viento_score: 32,
      inundacion_score: 10,
    },
    temperature_c: 2.4,
    wind_speed_kmh: 48,
  },
  13: { dominant_hazard: "sismo", temperature_c: 18.6, wind_speed_kmh: 10 },
  15: { dominant_hazard: "ola_calor", temperature_c: 22.0, wind_speed_kmh: 19 },
  16: { dominant_hazard: "inundacion", temperature_c: 13.5, wind_speed_kmh: 15 },
}

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10))
}

function buildFromPreset(
  preset: MockPreset,
  tweak?: Partial<MockPreset>,
): TerritoryRiskFields {
  const dominant = tweak?.dominant_hazard ?? preset.dominant_hazard
  const scores = { ...preset.scores, ...tweak?.scores }
  const composite = clampScore(
    tweak?.composite_score ?? preset.composite_score,
  )
  const severity = tweak?.severity ?? preset.severity

  return {
    composite_score: composite,
    severity,
    dominant_hazard: dominant,
    sismo_score: scores.sismo_score,
    ola_calor_score: scores.ola_calor_score,
    ola_frio_score: scores.ola_frio_score,
    viento_score: scores.viento_score,
    inundacion_score: scores.inundacion_score,
    temperature_c: tweak?.temperature_c ?? preset.temperature_c,
    wind_speed_kmh: tweak?.wind_speed_kmh ?? preset.wind_speed_kmh,
  }
}

/** Stable alert index from region code (1–16 → 0–2). */
function alertIndex(codregion: number): number {
  const n = Math.max(1, codregion)
  return (n - 1) % PRESETS.length
}

/**
 * Mock risk for a territory. Regions cycle 3 ChileRisk alerts by `codregion`.
 * Comunas offset alert by `cod_comuna` so nearby comunas differ.
 * REGION_OVERRIDES may force alert (e.g. Magallanes → Preventiva).
 */
export function mockRiskForTerritory(opts: {
  kind: "region" | "comuna"
  codregion: number
  cod_comuna?: number
}): TerritoryRiskFields {
  const { kind, codregion, cod_comuna } = opts
  const override = REGION_OVERRIDES[codregion]

  let idx = alertIndex(codregion)
  if (override?.severity) {
    idx = PRESETS.findIndex((p) => p.severity === override.severity)
    if (idx < 0) idx = 0
  } else if (kind === "comuna" && cod_comuna != null) {
    idx = (idx + (cod_comuna % PRESETS.length)) % PRESETS.length
  }

  const preset = PRESETS[idx]!
  let risk = buildFromPreset(preset, override)

  // Comuna: nudge scores so each CUT looks distinct within the same bucket.
  if (kind === "comuna" && cod_comuna != null) {
    const nudge = ((cod_comuna % 17) - 8) * 0.7
    risk = {
      ...risk,
      composite_score: clampScore(risk.composite_score + nudge),
      sismo_score: clampScore(risk.sismo_score + nudge * 0.5),
      ola_calor_score: clampScore(risk.ola_calor_score - nudge * 0.3),
      viento_score: clampScore(risk.viento_score + (cod_comuna % 5)),
      temperature_c:
        risk.temperature_c != null
          ? Math.round((risk.temperature_c + (cod_comuna % 7) * 0.4) * 10) / 10
          : null,
      wind_speed_kmh:
        risk.wind_speed_kmh != null
          ? Math.round(risk.wind_speed_kmh + (cod_comuna % 9))
          : null,
    }
  }

  return risk
}

/**
 * Stamp `composite_score` + `severity` onto GeoJSON features for territory
 * popup mocks. Map fills use `alert_level`, not scores.
 */
export function enrichTerritoryFeaturesWithMockRisk(
  kind: "region" | "comuna",
  features: ReadonlyArray<{ properties?: Record<string, unknown> | null }>,
): void {
  if (!USE_TERRITORY_RISK_MOCK) return

  for (const f of features) {
    const p = f.properties
    if (!p) continue
    const codregion = Number(p.codregion)
    if (!Number.isFinite(codregion) || codregion === 0) continue

    if (kind === "comuna") {
      const cod_comuna = Number(p.cod_comuna)
      if (!Number.isFinite(cod_comuna) || cod_comuna === 0) continue
      const risk = mockRiskForTerritory({ kind, codregion, cod_comuna })
      p.composite_score = risk.composite_score
      p.severity = risk.severity
      continue
    }

    const risk = mockRiskForTerritory({ kind, codregion })
    p.composite_score = risk.composite_score
    p.severity = risk.severity
  }
}

/** @deprecated Prefer mockRiskForTerritory — kept for call-site migration. */
export function mockRiskForKind(
  kind: "region" | "comuna",
): TerritoryRiskFields {
  return mockRiskForTerritory({
    kind,
    codregion: kind === "region" ? 2 : 13,
    cod_comuna: kind === "comuna" ? 13101 : undefined,
  })
}

/** Convenience exports for docs / Storybook-style peeks. */
export const MOCK_REGION_RISK = mockRiskForTerritory({
  kind: "region",
  codregion: 2,
})
export const MOCK_COMUNA_RISK = mockRiskForTerritory({
  kind: "comuna",
  codregion: 13,
  cod_comuna: 13101,
})
