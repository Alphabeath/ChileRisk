import type { LucideIcon } from "lucide-react"
import { Map, ScanSearch, ShieldCheck, UsersRound } from "lucide-react"

export const SENAPRED_FAMILIA_PREPARADA_URL =
  "https://senapred.cl/familia-preparada/"

export const FAMILIA_PREPARADA_HERO_ART = {
  src: "/data/senapred/img/familia-preparada/personajes_fp.png",
  alt: "Personajes oficiales del Plan Familia Preparada de SENAPRED",
} as const

export const FAMILIA_PREPARADA_TOWN_PLAZA = {
  src: "/data/senapred/img/familia-preparada/Pueblo_001_M.png",
  alt: "Plaza e ilustración de una escuela en un pueblo chileno, arte SENAPRED",
} as const

export const FAMILIA_PREPARADA_TOWN_STREET = {
  src: "/data/senapred/img/familia-preparada/Pueblo_002_M.png",
  alt: "Calle de pueblo con comisaría, taller y carro de emergencia, arte SENAPRED",
} as const

/** Campos editoriales SENAPRED; no son semántica de alerta ni de riesgo. */
export type FamiliaPreparadaField = {
  background: string
  ink: string
}

export const FAMILIA_PREPARADA_INTRODUCTION = [
  "Chile, por su ubicación y diversidad geográfica, está expuesto a múltiples amenazas: desde sismos, inundaciones o incendios forestales. Frente a este escenario, la prevención se vuelve una tarea fundamental.",
  "El Plan Familia Preparada es una guía práctica elaborada por SENAPRED que entrega orientaciones y recomendaciones para que cada familia pueda organizarse, identificar riesgos en su hogar y entorno, y definir cómo actuar ante una emergencia.",
] as const

export const FAMILIA_PREPARADA_INVITATIONS: readonly (FamiliaPreparadaField & {
  text: string
  icon: LucideIcon
})[] = [
  {
    text: "Reconocer las amenazas a las que está expuesta tu familia.",
    icon: ScanSearch,
    background: "#00a6d0",
    ink: "#062b38",
  },
  {
    text: "Diseñar un plan para actuar antes, durante y después de una emergencia.",
    icon: Map,
    background: "#0167b7",
    ink: "#ffffff",
  },
  {
    text: "Identificar y fortalecer tus capacidades individuales y colectivas.",
    icon: UsersRound,
    background: "#0fb1af",
    ink: "#062f2e",
  },
  {
    text: "Reducir los riesgos y aumentar la seguridad de todos en el hogar.",
    icon: ShieldCheck,
    background: "#c44536",
    ink: "#fff8f4",
  },
]

export type FamiliaPreparadaStep = FamiliaPreparadaField & {
  title: string
  detail: string
  href?: string
  hrefLabel?: string
  external?: boolean
}

export const FAMILIA_PREPARADA_STEPS: readonly FamiliaPreparadaStep[] = [
  {
    title: "Información del grupo familiar",
    detail:
      "Registra los datos de cada integrante: nombre, edad, contacto y necesidades especiales.",
    background: "#0167b7",
    ink: "#ffffff",
  },
  {
    title: "Identificar amenazas",
    detail:
      "Reconoce los riesgos dentro y fuera de tu hogar, desde accidentes cotidianos hasta desastres naturales.",
    background: "#c44536",
    ink: "#fff8f4",
  },
  {
    title: "Definir zonas de seguridad",
    detail:
      "Establece los lugares más seguros dentro y fuera de la casa para cada tipo de emergencia.",
    background: "#1a7a4c",
    ink: "#f4fff8",
  },
  {
    title: "Elaborar un mapa de la vivienda",
    detail:
      "Dibuja tu hogar, indicando rutas de evacuación, salidas y zonas seguras.",
    background: "#d97706",
    ink: "#1f1300",
  },
  {
    title: "Definir roles en la emergencia",
    detail:
      "Asigna responsabilidades a cada miembro de la familia para actuar con rapidez y orden.",
    background: "#00a6d0",
    ink: "#062b38",
  },
  {
    title: "Elaborar un directorio de contactos",
    detail:
      "Incluye familiares, vecinos, servicios de emergencia y profesionales de salud.",
    background: "#0b5f8a",
    ink: "#f3fbff",
  },
  {
    title: "Armar un kit de emergencia",
    detail:
      "Prepara agua, alimentos no perecibles, botiquín, linternas y otros elementos esenciales.",
    href: "/preparacion/kit-emergencia",
    hrefLabel: "Kit de emergencia",
    external: false,
    background: "#0fb1af",
    ink: "#062f2e",
  },
  {
    title: "Practicar el plan de emergencia",
    detail:
      "Realiza simulacros periódicos para que todos sepan cómo actuar ante una situación real.",
    href: "/simulacros",
    hrefLabel: "Calendario de simulacros",
    external: false,
    background: "#0032A0",
    ink: "#ffffff",
  },
]

export const FAMILIA_PREPARADA_DOCUMENTS = [
  {
    title: "Manual Familia Preparada",
    href: "https://bibliogrd.senapred.gob.cl/handle/1671/6482",
    kind: "Biblioteca",
  },
  {
    title: "Familia Preparada Multicultural",
    href: "https://bibliogrd.senapred.gob.cl/bitstream/handle/1671/6453/FAMILIA-PREPARADA-MULTICULTURAL.pdf?sequence=1&isAllowed=y",
    kind: "PDF",
  },
  {
    title: "Familia Preparada Multicultural — Creole",
    href: "https://bibliogrd.senapred.gob.cl/bitstream/handle/1671/6454/FAMILIA-PREPARADA-DIGITAL-CREOLE%202.0.pdf?sequence=1&isAllowed=y",
    kind: "PDF",
  },
  {
    title: "Ficha Familia Preparada",
    href: "https://bibliogrd.senapred.gob.cl/handle/1671/6482",
    kind: "Biblioteca",
  },
] as const
