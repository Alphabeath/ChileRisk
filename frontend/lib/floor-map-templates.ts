import type { FloorMapRoom } from "@/lib/types"

export interface FloorMapTemplate {
  id: string
  name: string
  description: string
  rooms: Omit<FloorMapRoom, "id">[]
}

const ROOM_DEFAULTS: Record<string, Omit<FloorMapRoom, "id">> = {
  living: { type: "living", x: 0, y: 0, w: 0, h: 0 },
  dining: { type: "dining", x: 0, y: 0, w: 0, h: 0 },
  kitchen: { type: "kitchen", x: 0, y: 0, w: 0, h: 0 },
  bathroom: { type: "bathroom", x: 0, y: 0, w: 0, h: 0 },
  bedroom: { type: "bedroom", x: 0, y: 0, w: 0, h: 0 },
  patio: { type: "patio", x: 0, y: 0, w: 0, h: 0 },
  stairs: { type: "stairs", x: 0, y: 0, w: 0, h: 0 },
  parking: { type: "parking", x: 0, y: 0, w: 0, h: 0 },
}

function r(key: keyof typeof ROOM_DEFAULTS, x: number, y: number, w: number, h: number): Omit<FloorMapRoom, "id"> {
  return { ...ROOM_DEFAULTS[key], x, y, w, h }
}

export const FLOOR_MAP_TEMPLATES: FloorMapTemplate[] = [
  {
    id: "blank",
    name: "En blanco",
    description: "Empieza desde cero, sin habitaciones predefinidas.",
    rooms: [],
  },
  {
    id: "apartment-1b",
    name: "Depto 1D / 1B",
    description: "Departamento compacto: living-comedor, cocina, baño, 1 dormitorio.",
    rooms: [
      r("living", 20, 20, 220, 140),
      r("kitchen", 240, 20, 140, 80),
      r("bathroom", 380, 20, 80, 100),
      r("bedroom", 240, 100, 220, 180),
      r("patio", 20, 160, 220, 120),
    ],
  },
  {
    id: "house-2b",
    name: "Casa 2D / 1B",
    description: "Casa de dos dormitorios, living, comedor, cocina, un baño.",
    rooms: [
      r("living", 20, 20, 160, 120),
      r("dining", 180, 20, 140, 120),
      r("kitchen", 320, 20, 140, 80),
      r("bathroom", 460, 20, 100, 80),
      r("bedroom", 20, 140, 200, 140),
      r("bedroom", 220, 140, 200, 140),
      r("patio", 420, 100, 200, 180),
    ],
  },
  {
    id: "house-3b",
    name: "Casa 3D / 2B",
    description: "Casa de tres dormitorios, dos baños, living, comedor, cocina y patio.",
    rooms: [
      r("living", 20, 20, 180, 120),
      r("dining", 200, 20, 140, 120),
      r("kitchen", 340, 20, 160, 120),
      r("bathroom", 500, 20, 100, 120),
      r("bedroom", 20, 140, 160, 120),
      r("bedroom", 180, 140, 160, 120),
      r("bedroom", 340, 140, 160, 120),
      r("bathroom", 500, 140, 100, 120),
      r("patio", 20, 260, 280, 100),
      r("patio", 300, 260, 300, 100),
    ],
  },
  {
    id: "house-4b",
    name: "Casa 4D / 2B",
    description: "Casa familiar completa con estacionamiento y patio amplio.",
    rooms: [
      r("living", 20, 20, 200, 120),
      r("dining", 220, 20, 160, 120),
      r("kitchen", 380, 20, 160, 120),
      r("bathroom", 540, 20, 80, 120),
      r("bedroom", 20, 140, 140, 120),
      r("bedroom", 160, 140, 140, 120),
      r("bedroom", 300, 140, 140, 120),
      r("bedroom", 440, 140, 180, 120),
      r("bathroom", 20, 260, 100, 100),
      r("parking", 120, 260, 200, 100),
      r("patio", 320, 260, 200, 100),
      r("stairs", 520, 260, 100, 100),
    ],
  },
]

export function getTemplateById(id: string): FloorMapTemplate | undefined {
  return FLOOR_MAP_TEMPLATES.find((t) => t.id === id)
}
