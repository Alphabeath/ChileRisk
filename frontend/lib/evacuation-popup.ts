import { fixMojibake } from "@/lib/fix-mojibake"
import {
  EVACUATION_LAYER_IDS,
  EVACUATION_ROUTE_COLOR,
  isVolcanicHazardLayer,
  isVolcanoLayer,
  isWildfireLayer,
  VOLCANIC_HAZARD_FILL_LAYER_IDS,
  VOLCANIC_HAZARD_LINE_LAYER_IDS,
  WILDFIRE_FILL_LAYER_IDS,
  WILDFIRE_LINE_LAYER_IDS,
} from "@/components/map/map-config"

const TSUNAMI_GUIDE_HREF = "/disasters/tsunami"
const VOLCANIC_GUIDE_HREF = "/disasters/volcanes"
const WILDFIRE_GUIDE_HREF = "/disasters/incendios-forestales"

function isVolcanicLayer(layerId: string): boolean {
  return (
    layerId.startsWith(EVACUATION_LAYER_IDS.volcanicRoutes) ||
    layerId.startsWith(EVACUATION_LAYER_IDS.volcanicMeetingPoints) ||
    layerId === EVACUATION_LAYER_IDS.volcanoes ||
    layerId === EVACUATION_LAYER_IDS.volcanoesLabels ||
    layerId === EVACUATION_LAYER_IDS.volcanicRadii ||
    layerId.startsWith(EVACUATION_LAYER_IDS.volcanicHazardsSource) ||
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

export function parseKmzDescriptionFields(description: unknown): Record<string, string> {
  if (typeof description !== "string" || !description) return {}

  const fields: Record<string, string> = {}
  const rowPattern = /<td>([^<]+)<\/td>\s*<td>([^<]*)<\/td>/gi
  let match = rowPattern.exec(description)

  while (match) {
    fields[match[1].trim()] = fixMojibake(match[2].trim())
    match = rowPattern.exec(description)
  }

  return fields
}

export function evacuationAreaFields(properties: Record<string, unknown>) {
  return {
    comuna: fixMojibake(properties.comuna),
    provincia: fixMojibake(properties.provincia),
    sector: fixMojibake(properties.sector),
  }
}

export function fieldOrDash(value: unknown): string {
  if (value == null || value === "") return "—"
  return fixMojibake(value)
}

export function evacuationKmzFields(properties: Record<string, unknown>) {
  const table = parseKmzDescriptionFields(properties.description)
  return {
    comuna: fieldOrDash(table.nom_com ?? properties.nom_com ?? properties.comuna),
    region: fieldOrDash(table.nom_reg ?? properties.nom_reg ?? properties.region),
    provincia: fieldOrDash(table.nom_prov ?? properties.nom_prov ?? properties.provincia),
    sector: fieldOrDash(table.sector ?? properties.sector),
    volcan: fieldOrDash(
      table.volcan ?? properties.volcan ?? properties.nombre ?? table.nombre ?? "",
    ),
  }
}

export function getEvacuationClickLayerIds(): string[] {
  return [
    EVACUATION_LAYER_IDS.areasFill,
    `${EVACUATION_LAYER_IDS.routes}-lines`,
    `${EVACUATION_LAYER_IDS.meetingPoints}-icon-points`,
    `${EVACUATION_LAYER_IDS.volcanicRoutes}-lines`,
    `${EVACUATION_LAYER_IDS.volcanicMeetingPoints}-icon-points`,
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

  if (layerId.startsWith(EVACUATION_LAYER_IDS.routes)) {
    return {
      title: "Vía de evacuación",
      badge: "Ruta · SENAPRED",
      accentColor: EVACUATION_ROUTE_COLOR,
    }
  }

  if (layerId.startsWith(EVACUATION_LAYER_IDS.volcanicRoutes)) {
    return {
      title: "Vía de evacuación",
      badge: "Volcánico · SENAPRED",
      accentColor: "#ea580c",
    }
  }

  if (layerId === `${EVACUATION_LAYER_IDS.volcanicMeetingPoints}-icon-points`) {
    return {
      title: "Punto de encuentro",
      badge: "Volcánico · SENAPRED",
      accentColor: "#f59e0b",
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
    layerId === `${EVACUATION_LAYER_IDS.meetingPoints}-icon-points` ||
    layerId === `${EVACUATION_LAYER_IDS.volcanicMeetingPoints}-icon-points`
  )
}