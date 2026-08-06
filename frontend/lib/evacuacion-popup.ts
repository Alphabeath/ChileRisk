import { fixMojibake } from "@/lib/fix-mojibake"
import {
  EVACUATION_LAYER_IDS,
  EVACUATION_ROUTE_COLOR,
  isVolcanicHazardLayer,
  isVolcanoLayer,
  isWildfireLayer,
  VOLCANIC_HAZARD_COLOR_ALTO,
  VOLCANIC_HAZARD_COLOR_BAJO,
  VOLCANIC_HAZARD_COLOR_MEDIO,
  VOLCANIC_HAZARD_FILL_LAYER_IDS,
  VOLCANIC_HAZARD_LINE_LAYER_IDS,
  WILDFIRE_FILL_LAYER_IDS,
  WILDFIRE_LINE_LAYER_IDS,
} from "@/components/map/evacuacion-config"

const TSUNAMI_GUIDE_HREF = "/desastres/tsunami"
const VOLCANIC_GUIDE_HREF = "/desastres/erupciones-volcanicas"
const WILDFIRE_GUIDE_HREF = "/desastres/incendios-forestales"

function isVolcanicLayer(layerId: string): boolean {
  return (
    layerId.startsWith("volcanic-") ||
    layerId === EVACUATION_LAYER_IDS.volcanoes ||
    layerId === EVACUATION_LAYER_IDS.volcanoesLabels ||
    layerId === EVACUATION_LAYER_IDS.volcanicRadii ||
    isVolcanicHazardLayer(layerId)
  )
}

export function getDisasterGuideHref(layerId: string): string {
  if (isWildfireLayer(layerId)) return WILDFIRE_GUIDE_HREF
  return isVolcanicLayer(layerId) ? VOLCANIC_GUIDE_HREF : TSUNAMI_GUIDE_HREF
}

export function getDisasterGuideLabel(layerId: string): string {
  if (isWildfireLayer(layerId)) return "Guía de preparación · incendios"
  return isVolcanicLayer(layerId)
    ? "Guía de preparación · volcán"
    : "Guía de preparación · tsunami"
}

export function fieldOrDash(value: unknown): string {
  if (value == null || value === "") return "—"
  return fixMojibake(value)
}

export function evacuationFeatureFields(properties: Record<string, unknown>) {
  return {
    comuna: fieldOrDash(
      properties.nom_com ?? properties.comuna ?? properties.Comuna,
    ),
    region: fieldOrDash(
      properties.nom_reg ?? properties.region ?? properties.Region,
    ),
    provincia: fieldOrDash(
      properties.nom_prov ?? properties.provincia ?? properties.Provincia,
    ),
    sector: fieldOrDash(
      properties.sector ?? properties.nombre ?? properties.name,
    ),
    volcan: fieldOrDash(properties.volcan),
    peligro: fieldOrDash(properties.peligro),
    categoria: fieldOrDash(properties.categoria),
    gridcode: fieldOrDash(properties.gridcode),
    distance: fieldOrDash(properties.distance),
    tipo: fieldOrDash(properties.tipo),
  }
}

export function getEvacuationClickLayerIds(): string[] {
  return [
    EVACUATION_LAYER_IDS.areasFill,
    EVACUATION_LAYER_IDS.routes,
    EVACUATION_LAYER_IDS.meetingPoints,
    EVACUATION_LAYER_IDS.volcanicRoutes,
    EVACUATION_LAYER_IDS.volcanicMeetingPointsPe,
    EVACUATION_LAYER_IDS.volcanicMeetingPointsPet,
    EVACUATION_LAYER_IDS.volcanoes,
    EVACUATION_LAYER_IDS.volcanoesLabels,
    EVACUATION_LAYER_IDS.volcanicRadii,
    ...VOLCANIC_HAZARD_FILL_LAYER_IDS,
    ...VOLCANIC_HAZARD_LINE_LAYER_IDS,
    ...WILDFIRE_FILL_LAYER_IDS,
    ...WILDFIRE_LINE_LAYER_IDS,
  ]
}

export function getEvacuationPopupMeta(layerId: string): {
  title: string
  badge: string
  accentColor: string
} {
  if (layerId === EVACUATION_LAYER_IDS.areasFill) {
    return {
      title: "Área de evacuación",
      badge: "Tsunami · SENAPRED",
      accentColor: "#ef4444",
    }
  }
  if (layerId === EVACUATION_LAYER_IDS.routes) {
    return {
      title: "Vía de evacuación",
      badge: "Ruta · SENAPRED",
      accentColor: EVACUATION_ROUTE_COLOR,
    }
  }
  if (layerId === EVACUATION_LAYER_IDS.volcanicRoutes) {
    return {
      title: "Vía de evacuación",
      badge: "Volcánico · SENAPRED",
      accentColor: "#ea580c",
    }
  }
  if (
    layerId === EVACUATION_LAYER_IDS.volcanicMeetingPointsPe ||
    layerId === EVACUATION_LAYER_IDS.volcanicMeetingPointsPet
  ) {
    return {
      title:
        layerId === EVACUATION_LAYER_IDS.volcanicMeetingPointsPet
          ? "Punto de encuentro transitorio (PET)"
          : "Punto de encuentro (PE)",
      badge: "Volcánico · SENAPRED",
      accentColor:
        layerId === EVACUATION_LAYER_IDS.volcanicMeetingPointsPet
          ? "#f59e0b"
          : "#16a34a",
    }
  }
  if (isVolcanoLayer(layerId)) {
    return {
      title: "Volcán activo",
      badge: "Riesgo volcánico",
      accentColor: "#f97316",
    }
  }
  if (layerId === EVACUATION_LAYER_IDS.volcanicRadii) {
    return {
      title: "Radio de amenaza volcánica",
      badge: "Distancia · SERNAGEOMIN",
      accentColor: "#f97316",
    }
  }
  if (isVolcanicHazardLayer(layerId)) {
    return {
      title: "Zona de peligro volcánico",
      badge: "Peligro · SERNAGEOMIN",
      accentColor: "#b45309",
    }
  }
  if (isWildfireLayer(layerId)) {
    return {
      title: "Ocurrencia de incendio",
      badge: "Incendios forestales",
      accentColor: "#d07020",
    }
  }
  return {
    title: "Punto de encuentro",
    badge: "Encuentro · SENAPRED",
    accentColor: "#f59e0b",
  }
}

export function isWithinChileMapBounds(lng: number, lat: number): boolean {
  return lng >= -76 && lng <= -66 && lat >= -56 && lat <= -17
}

export function buildGoogleMapsPlaceUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

export function isEvacuationMeetingPointLayer(layerId: string): boolean {
  return (
    layerId === EVACUATION_LAYER_IDS.meetingPoints ||
    layerId === EVACUATION_LAYER_IDS.volcanicMeetingPointsPe ||
    layerId === EVACUATION_LAYER_IDS.volcanicMeetingPointsPet
  )
}

/** Light accents (amber, etc.) need dark ink on the hero fill. */
export function evacuationAccentUsesDarkInk(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return false
  const n = Number.parseInt(m[1]!, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminance > 0.55
}

/** Hero fill: zona de peligro uses Alto/Medio/Bajo palette. */
export function resolveEvacuationPopupAccent(
  layerId: string,
  properties: Record<string, unknown>,
  fallback: string,
): string {
  if (!isVolcanicHazardLayer(layerId)) return fallback
  return volcanicHazardColor(properties.peligro) ?? fallback
}

/** Map `peligro` prop → palette hex (Alto / Medio / Bajo). */
export function volcanicHazardColor(peligro: unknown): string | null {
  const key = String(peligro ?? "")
    .trim()
    .toLocaleLowerCase("es")
  if (key === "alto") return VOLCANIC_HAZARD_COLOR_ALTO
  if (key === "medio") return VOLCANIC_HAZARD_COLOR_MEDIO
  if (key === "bajo") return VOLCANIC_HAZARD_COLOR_BAJO
  return null
}

export function getEvacuationPopupHeroSideLabel(badge: string): string {
  return badge.split("·")[0]?.trim() ?? "Info"
}

/**
 * Short "what is it / what to do" copy for the popup Detalle section
 * (replaces the location row). Per layer type; volcanic hazard levels get
 * level-appropriate instructions.
 */
export function getEvacuationPopupDescription(
  layerId: string,
  properties: Record<string, unknown>,
): string {
  if (layerId === EVACUATION_LAYER_IDS.areasFill) {
    return "Zona segura frente a tsunami. Si escuchas la alarma, dirígete aquí o a terreno elevado, a pie y lejos de la costa."
  }
  if (layerId === EVACUATION_LAYER_IDS.routes) {
    return "Vía señalizada hacia zonas seguras. En una evacuación síguela a pie, sin correr ni usar el auto."
  }
  if (layerId === EVACUATION_LAYER_IDS.volcanicRoutes) {
    return "Vía señalizada para evacuar ante una emergencia volcánica. Síguela a pie hacia zonas seguras."
  }
  if (layerId === EVACUATION_LAYER_IDS.meetingPoints) {
    return "Lugar seguro de reunión tras la evacuación. Dirígete aquí si estás dentro de un área de evacuación."
  }
  if (layerId === EVACUATION_LAYER_IDS.volcanicMeetingPointsPe) {
    return "Lugar de reunión seguro ante una emergencia volcánica. Dirígete aquí siguiendo las rutas de evacuación."
  }
  if (layerId === EVACUATION_LAYER_IDS.volcanicMeetingPointsPet) {
    return "Refugio transitorio ante una emergencia volcánica. Úsalo solo mientras las autoridades organizan la evacuación definitiva."
  }
  if (isVolcanoLayer(layerId)) {
    return "Volcán monitoreado por Sernageomin. Conoce las rutas de evacuación de tu comuna y mantente atento a las alertas."
  }
  if (layerId === EVACUATION_LAYER_IDS.volcanicRadii) {
    return "Zona de influencia de un volcán activo. Mantente informado y ten preparado tu plan de evacuación."
  }
  if (isVolcanicHazardLayer(layerId)) {
    const nivel = String(properties.peligro ?? "")
      .trim()
      .toLocaleLowerCase("es")
    if (nivel === "alto") {
      return "Peligro alto: evita la zona y evacúa de inmediato siguiendo las indicaciones de las autoridades."
    }
    if (nivel === "medio") {
      return "Peligro medio: mantente alerta y preparado para evacuar ante nuevas alertas."
    }
    if (nivel === "bajo") {
      return "Peligro bajo: conoce las rutas de evacuación por si la actividad volcánica aumenta."
    }
    return "Zona de peligro volcánico definida por Sernageomin. Sigue las indicaciones de las autoridades."
  }
  if (isWildfireLayer(layerId)) {
    return "Zona con ocurrencia histórica de incendios forestales. No enciendas fuego y denuncia focos al 130."
  }
  return "Elemento de la red de evacuación. Sigue las indicaciones de SENAPRED y las autoridades locales."
}

export function getEvacuationPopupTitle(
  layerId: string,
  metaTitle: string,
): string {
  if (layerId === EVACUATION_LAYER_IDS.volcanicMeetingPointsPet) {
    return "Punto de encuentro transitorio (PET)"
  }
  if (layerId === EVACUATION_LAYER_IDS.volcanicMeetingPointsPe) {
    return "Punto de encuentro (PE)"
  }
  return metaTitle
}

/** Detail rows for the shared evacuación popup body. */
export function buildEvacuationPopupFields(
  layerId: string,
  properties: Record<string, unknown>,
): { label: string; value: string }[] {
  // Location (comuna) intentionally omitted — the Detalle section now shows
  // `getEvacuationPopupDescription` instead of where-you-clicked.
  const fields = evacuationFeatureFields(properties)
  const rows: { label: string; value: string }[] = []

  if (fields.tipo !== "—") rows.push({ label: "Tipo", value: fields.tipo })
  if (fields.volcan !== "—") {
    rows.push({ label: "Volcán", value: fields.volcan })
  }
  if (fields.peligro !== "—") {
    rows.push({ label: "Peligro", value: fields.peligro })
  }
  if (fields.categoria !== "—") {
    rows.push({ label: "Categoría", value: fields.categoria })
  }
  if (fields.distance !== "—") {
    rows.push({
      label: "Radio",
      value: `${fieldOrDash(fields.distance)} km`,
    })
  }
  if (fields.gridcode !== "—") {
    rows.push({ label: "Clase", value: fields.gridcode })
  }
  if (fields.region !== "—" && isVolcanoLayer(layerId)) {
    rows.push({ label: "Región", value: fields.region })
  }

  return rows
}
