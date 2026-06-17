import type { DrillType } from "@/lib/types"

export const SIMULACRO_TYPE_LABELS: Record<DrillType, string> = {
  sismo_tsunami_borde_costero: "Borde Costero",
  sismo_tsunami_educacion: "Sector Educación",
  erupcion_volcanica: "Erupción Volcánica",
  remocion_en_masa: "Remoción en Masa",
  otro: "Otro",
}

export const SIMULACRO_TYPE_LABELS_LONG: Record<DrillType, string> = {
  sismo_tsunami_borde_costero: "Sismo y Tsunami — Borde Costero",
  sismo_tsunami_educacion: "Sismo y Tsunami — Sector Educación",
  erupcion_volcanica: "Erupción Volcánica",
  remocion_en_masa: "Remoción en Masa",
  otro: "Simulacro SERNAPRED",
}

export function simulacroDrillTypeLabel(type: DrillType): string {
  return SIMULACRO_TYPE_LABELS_LONG[type] ?? SIMULACRO_TYPE_LABELS.otro
}

export const REGION_LABELS: Record<number, string> = {
  15: "Arica y Parinacota",
  1: "Tarapacá",
  2: "Antofagasta",
  3: "Atacama",
  4: "Coquimbo",
  5: "Valparaíso",
  13: "Metropolitana",
  6: "O'Higgins",
  7: "Maule",
  16: "Ñuble",
  8: "Biobío",
  9: "Araucanía",
  14: "Los Ríos",
  10: "Los Lagos",
  11: "Aysén",
  12: "Magallanes",
}
