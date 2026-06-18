import {
  Baby,
  BriefcaseMedical,
  Droplet,
  FileText,
  HeartHandshake,
  Package,
  PawPrint,
  Sparkles,
  Utensils,
  type LucideIcon,
} from "lucide-react"

export interface KitCategoryMeta {
  id: "water" | "food" | "gear" | "hygiene" | "documents" | "health"
  title: string
  summary: string
  icon: LucideIcon
  accent: string
  topAccent: string
  iconChip: string
  headerTint: string
}

export const KIT_CATEGORIES: KitCategoryMeta[] = [
  {
    id: "water",
    title: "Agua",
    summary: "2 litros por persona por día, para 3 días.",
    icon: Droplet,
    accent: "text-blue-300",
    topAccent: "bg-blue-400/70",
    iconChip: "bg-blue-500/15 border-blue-400/40",
    headerTint: "from-blue-500/10 via-blue-500/[0.04] to-transparent",
  },
  {
    id: "food",
    title: "Alimentos",
    summary: "No perecederos y de fácil preparación.",
    icon: Utensils,
    accent: "text-emerald-300",
    topAccent: "bg-emerald-400/70",
    iconChip: "bg-emerald-500/15 border-emerald-400/40",
    headerTint: "from-emerald-500/10 via-emerald-500/[0.04] to-transparent",
  },
  {
    id: "gear",
    title: "Equipamiento",
    summary: "Luz, comunicación y herramientas básicas.",
    icon: Package,
    accent: "text-amber-300",
    topAccent: "bg-amber-400/70",
    iconChip: "bg-amber-500/15 border-amber-400/40",
    headerTint: "from-amber-500/10 via-amber-500/[0.04] to-transparent",
  },
  {
    id: "hygiene",
    title: "Higiene",
    summary: "Reducir riesgo sanitario en condiciones mínimas.",
    icon: Sparkles,
    accent: "text-rose-300",
    topAccent: "bg-rose-400/70",
    iconChip: "bg-rose-500/15 border-rose-400/40",
    headerTint: "from-rose-500/10 via-rose-500/[0.04] to-transparent",
  },
  {
    id: "documents",
    title: "Documentos",
    summary: "Copias y resguardos en formato físico y digital.",
    icon: FileText,
    accent: "text-indigo-300",
    topAccent: "bg-indigo-400/70",
    iconChip: "bg-indigo-500/15 border-indigo-400/40",
    headerTint: "from-indigo-500/10 via-indigo-500/[0.04] to-transparent",
  },
  {
    id: "health",
    title: "Salud",
    summary: "Botiquín, medicamentos y recetas vigentes.",
    icon: BriefcaseMedical,
    accent: "text-pink-300",
    topAccent: "bg-pink-400/70",
    iconChip: "bg-pink-500/15 border-pink-400/40",
    headerTint: "from-pink-500/10 via-pink-500/[0.04] to-transparent",
  },
]

export interface SpecialKitMeta {
  id: "infant" | "pregnant" | "tea" | "pets"
  title: string
  description: string
  flagHint: "lactation" | "pregnancy" | "tea" | "pets"
  icon: LucideIcon
  accent: string
  topAccent: string
  iconChip: string
  headerTint: string
  examples: string[]
}

export const SPECIAL_KITS: SpecialKitMeta[] = [
  {
    id: "infant",
    title: "Lactantes",
    description: "Pañales, fórmula, mamaderas y ropa adicional.",
    flagHint: "lactation",
    icon: Baby,
    accent: "text-pink-300",
    topAccent: "bg-pink-400/70",
    iconChip: "bg-pink-500/15 border-pink-400/40",
    headerTint: "from-pink-500/10 via-pink-500/[0.04] to-transparent",
    examples: ["Pañales", "Fórmula", "Mamaderas", "Toallas húmedas", "Ropa adicional"],
  },
  {
    id: "pregnant",
    title: "Embarazadas",
    description: "Controles prenatales, exámenes y contactos médicos.",
    flagHint: "pregnancy",
    icon: HeartHandshake,
    accent: "text-rose-300",
    topAccent: "bg-rose-400/70",
    iconChip: "bg-rose-500/15 border-rose-400/40",
    headerTint: "from-rose-500/10 via-rose-500/[0.04] to-transparent",
    examples: ["Controles médicos", "Exámenes", "Vitaminas", "Contactos médicos"],
  },
  {
    id: "tea",
    title: "Personas TEA",
    description: "Credencial, objetos reguladores y elementos de calma.",
    flagHint: "tea",
    icon: Sparkles,
    accent: "text-violet-300",
    topAccent: "bg-violet-400/70",
    iconChip: "bg-violet-500/15 border-violet-400/40",
    headerTint: "from-violet-500/10 via-violet-500/[0.04] to-transparent",
    examples: ["Credencial", "Información de contacto", "Objetos reguladores", "Elementos de calma"],
  },
  {
    id: "pets",
    title: "Mascotas",
    description: "Agua, alimento, documentos veterinarios y transporte.",
    flagHint: "pets",
    icon: PawPrint,
    accent: "text-amber-300",
    topAccent: "bg-amber-400/70",
    iconChip: "bg-amber-500/15 border-amber-400/40",
    headerTint: "from-amber-500/10 via-amber-500/[0.04] to-transparent",
    examples: ["Agua", "Alimento", "Carnet veterinario", "Correa / arnés / jaula"],
  },
]
