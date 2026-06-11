import {
  Bath,
  Bed,
  Car,
  CookingPot,
  Droplets,
  Flame,
  Flashlight,
  HeartPulse,
  Package,
  Radio,
  Sofa,
  Layers,
  TreePine,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react"

export const CANVAS_W = 640
export const CANVAS_H = 420
export const GRID_SIZE = 20
export const MIN_ROOM_W = 60
export const MIN_ROOM_H = 60
export const DEFAULT_ROOM_W = 100
export const DEFAULT_ROOM_H = 80
export const DEFAULT_ZONE_SIZE = 80
export const MARKER_SIZE = 28

export interface RoomStyle {
  bg: string
  border: string
  text: string
  icon: LucideIcon
}

export const ROOM_STYLES: Record<string, RoomStyle> = {
  bedroom: {
    bg: "bg-violet-950/92",
    border: "border-violet-400/55",
    text: "text-violet-100",
    icon: Bed,
  },
  kitchen: {
    bg: "bg-amber-950/92",
    border: "border-amber-400/55",
    text: "text-amber-100",
    icon: CookingPot,
  },
  bathroom: {
    bg: "bg-sky-950/92",
    border: "border-sky-400/55",
    text: "text-sky-100",
    icon: Bath,
  },
  dining: {
    bg: "bg-orange-950/92",
    border: "border-orange-400/55",
    text: "text-orange-100",
    icon: UtensilsCrossed,
  },
  living: {
    bg: "bg-zinc-900/92",
    border: "border-white/35",
    text: "text-white/90",
    icon: Sofa,
  },
  patio: {
    bg: "bg-emerald-950/92",
    border: "border-emerald-400/55",
    text: "text-emerald-100",
    icon: TreePine,
  },
  stairs: {
    bg: "bg-slate-900/92",
    border: "border-slate-400/55",
    text: "text-slate-100",
    icon: Layers,
  },
  parking: {
    bg: "bg-zinc-900/92",
    border: "border-zinc-400/55",
    text: "text-zinc-100",
    icon: Car,
  },
}

export const DEFAULT_ROOM_STYLE: RoomStyle = {
  bg: "bg-zinc-900/92",
  border: "border-white/30",
  text: "text-white/80",
  icon: Sofa,
}

export interface MarkerStyle {
  bg: string
  border: string
  text: string
  icon: LucideIcon
}

export const MARKER_STYLES: Record<string, MarkerStyle> = {
  electrical_panel: {
    bg: "bg-yellow-950/92",
    border: "border-yellow-400/55",
    text: "text-yellow-100",
    icon: Zap,
  },
  water_valve: {
    bg: "bg-blue-950/92",
    border: "border-blue-400/55",
    text: "text-blue-100",
    icon: Droplets,
  },
  gas_valve: {
    bg: "bg-orange-950/92",
    border: "border-orange-400/55",
    text: "text-orange-100",
    icon: Flame,
  },
  extinguisher: {
    bg: "bg-red-950/92",
    border: "border-red-400/55",
    text: "text-red-100",
    icon: Flame,
  },
  first_aid: {
    bg: "bg-rose-950/92",
    border: "border-rose-400/55",
    text: "text-rose-100",
    icon: HeartPulse,
  },
  emergency_kit: {
    bg: "bg-emerald-950/92",
    border: "border-emerald-400/55",
    text: "text-emerald-100",
    icon: Package,
  },
  radio: {
    bg: "bg-indigo-950/92",
    border: "border-indigo-400/55",
    text: "text-indigo-100",
    icon: Radio,
  },
  flashlight: {
    bg: "bg-cyan-950/92",
    border: "border-cyan-400/55",
    text: "text-cyan-100",
    icon: Flashlight,
  },
}

export const DEFAULT_MARKER_STYLE: MarkerStyle = {
  bg: "bg-amber-950/92",
  border: "border-amber-500/55",
  text: "text-amber-100",
  icon: Package,
}

export function snap(value: number, max?: number, min = 0): number {
  const snapped = Math.round(value / GRID_SIZE) * GRID_SIZE
  if (max !== undefined) return Math.max(min, Math.min(max, snapped))
  return Math.max(min, snapped)
}

export const CANVAS_GRID_CLASS =
  "bg-[repeating-linear-gradient(0deg,transparent,transparent_99px,rgba(255,255,255,0.22)_100px),repeating-linear-gradient(90deg,transparent,transparent_99px,rgba(255,255,255,0.22)_100px),repeating-linear-gradient(0deg,transparent,transparent_19px,rgba(255,255,255,0.1)_20px),repeating-linear-gradient(90deg,transparent,transparent_19px,rgba(255,255,255,0.1)_20px)] bg-black/55"