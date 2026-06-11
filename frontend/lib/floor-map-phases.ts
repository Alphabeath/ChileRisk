export type FloorMapPhase = "template" | "layout" | "zones"

export const FLOOR_MAP_PHASE_ORDER: FloorMapPhase[] = [
  "template",
  "layout",
  "zones",
]

export function floorMapPhaseIndex(phase: FloorMapPhase): number {
  return FLOOR_MAP_PHASE_ORDER.indexOf(phase)
}

export const FLOOR_MAP_PHASES: {
  id: FloorMapPhase
  step: number
  label: string
  description: string
}[] = [
  {
    id: "template",
    step: 1,
    label: "Plantilla",
    description: "Elige el tipo de vivienda para empezar.",
  },
  {
    id: "layout",
    step: 2,
    label: "Distribución",
    description: "Ajusta habitaciones y puntos de emergencia.",
  },
  {
    id: "zones",
    step: 3,
    label: "Zonas",
    description: "Marca lugares seguros, riesgo y rutas.",
  },
]

export function inferFloorMapPhase(
  hasRooms: boolean,
  savedPhase?: FloorMapPhase,
): FloorMapPhase {
  if (savedPhase) return savedPhase
  return hasRooms ? "layout" : "template"
}