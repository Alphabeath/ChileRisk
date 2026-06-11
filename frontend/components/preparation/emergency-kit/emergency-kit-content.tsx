import {
  Backpack,
  Briefcase,
  Cloud,
  Droplet,
  FileText,
  HeartPulse,
  type LucideIcon,
} from "lucide-react"

export interface KitCategoryMeta {
  id: "water" | "food" | "gear" | "hygiene" | "documents" | "health"
  title: string
  summary: string
  icon: LucideIcon
  accent: string
}

export const KIT_CATEGORIES: KitCategoryMeta[] = [
  {
    id: "water",
    title: "Agua",
    summary: "2 litros por persona por día, para 3 días.",
    icon: Droplet,
    accent: "text-blue-300",
  },
  {
    id: "food",
    title: "Alimentos",
    summary: "No perecederos y de fácil preparación.",
    icon: Cloud,
    accent: "text-emerald-300",
  },
  {
    id: "gear",
    title: "Equipamiento",
    summary: "Luz, comunicación y herramientas básicas.",
    icon: Briefcase,
    accent: "text-amber-300",
  },
  {
    id: "hygiene",
    title: "Higiene",
    summary: "Reducir riesgo sanitario en condiciones mínimas.",
    icon: HeartPulse,
    accent: "text-rose-300",
  },
  {
    id: "documents",
    title: "Documentos",
    summary: "Copias y resguardos en formato físico y digital.",
    icon: FileText,
    accent: "text-indigo-300",
  },
  {
    id: "health",
    title: "Salud",
    summary: "Botiquín, medicamentos y recetas vigentes.",
    icon: HeartPulse,
    accent: "text-pink-300",
  },
]

export interface SpecialKitMeta {
  id: "infant" | "pregnant" | "tea" | "pets"
  title: string
  description: string
  flagHint: "lactation" | "pregnancy" | "tea" | "pets"
  icon: LucideIcon
  accent: string
  examples: string[]
}

export const SPECIAL_KITS: SpecialKitMeta[] = [
  {
    id: "infant",
    title: "Lactantes",
    description: "Pañales, fórmula, mamaderas y ropa adicional.",
    flagHint: "lactation",
    icon: Backpack,
    accent: "text-pink-300",
    examples: ["Pañales", "Fórmula", "Mamaderas", "Toallas húmedas", "Ropa adicional"],
  },
  {
    id: "pregnant",
    title: "Embarazadas",
    description: "Controles prenatales, exámenes y contactos médicos.",
    flagHint: "pregnancy",
    icon: HeartPulse,
    accent: "text-rose-300",
    examples: ["Controles médicos", "Exámenes", "Vitaminas", "Contactos médicos"],
  },
  {
    id: "tea",
    title: "Personas TEA",
    description: "Credencial, objetos reguladores y elementos de calma.",
    flagHint: "tea",
    icon: HeartPulse,
    accent: "text-violet-300",
    examples: ["Credencial", "Información de contacto", "Objetos reguladores", "Elementos de calma"],
  },
  {
    id: "pets",
    title: "Mascotas",
    description: "Agua, alimento, documentos veterinarios y transporte.",
    flagHint: "pets",
    icon: Backpack,
    accent: "text-amber-300",
    examples: ["Agua", "Alimento", "Carnet veterinario", "Correa / arnés / jaula"],
  },
]
