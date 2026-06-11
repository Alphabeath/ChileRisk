import {
  AlertTriangle,
  LayoutGrid,
  MousePointer2,
  Route,
  ShieldCheck,
  Siren,
  type LucideIcon,
} from "lucide-react"

import { EMERGENCY_MARKER_TYPES, ROOM_TYPES } from "@/lib/family-plan-defaults"
import { MARKER_STYLES, ROOM_STYLES } from "@/lib/floor-map-constants"

export type FloorMapTool =
  | { mode: "select" }
  | { mode: "room"; type: string }
  | { mode: "marker"; type: string }
  | { mode: "safe" }
  | { mode: "risk" }
  | { mode: "route" }

export const FLOOR_MAP_SELECT_TOOL: FloorMapTool = { mode: "select" }

export function toolIcon(tool: FloorMapTool): LucideIcon {
  switch (tool.mode) {
    case "select":
      return MousePointer2
    case "room":
      return ROOM_STYLES[tool.type]?.icon ?? LayoutGrid
    case "marker":
      return MARKER_STYLES[tool.type]?.icon ?? Siren
    case "safe":
      return ShieldCheck
    case "risk":
      return AlertTriangle
    case "route":
      return Route
    default:
      return MousePointer2
  }
}

export function toolLabel(tool: FloorMapTool): string {
  switch (tool.mode) {
    case "select":
      return "Seleccionar"
    case "room":
      return ROOM_TYPES.find((r) => r.id === tool.type)?.label ?? "Habitación"
    case "marker":
      return (
        EMERGENCY_MARKER_TYPES.find((m) => m.id === tool.type)?.label ??
        "Emergencia"
      )
    case "safe":
      return "Lugar seguro"
    case "risk":
      return "Zona de riesgo"
    case "route":
      return "Ruta de evacuación"
    default:
      return "Herramienta"
  }
}

export function isPlacementTool(tool: FloorMapTool): boolean {
  return tool.mode !== "select"
}

export function toolHint(tool: FloorMapTool): string {
  switch (tool.mode) {
    case "select":
      return "Arrastra los bloques para moverlos. Usa las esquinas para redimensionar."
    case "room":
      return "Haz clic en el plano para colocar la habitación."
    case "marker":
      return "Haz clic en el plano para colocar el punto de emergencia."
    case "safe":
      return "Haz clic en el plano para marcar un lugar seguro."
    case "risk":
      return "Haz clic en el plano para marcar una zona de riesgo."
    case "route":
      return "Haz clic en el plano para trazar puntos de la ruta."
    default:
      return ""
  }
}

export function isSameTool(a: FloorMapTool, b: FloorMapTool): boolean {
  if (a.mode !== b.mode) return false
  if (a.mode === "room" && b.mode === "room") return a.type === b.type
  if (a.mode === "marker" && b.mode === "marker") return a.type === b.type
  return true
}