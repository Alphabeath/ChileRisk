import type { ComponentType, SVGAttributes } from "react"

import { EducationIcon } from "@/components/icons/education"
import { LandslideIcon } from "@/components/icons/landslide"
import { TsunamiIcon } from "@/components/icons/tsunami"
import { VolcanoIcon } from "@/components/icons/volcano"
import type { DrillType } from "@/lib/types"

/** Static institutional copy — senapred.cl/simulacros (SENAPRED). */
export type SimulacroIcon = ComponentType<SVGAttributes<SVGSVGElement>>

export interface SimulacroTipo {
  drillType: DrillType
  title: string
  shortLabel: string
  description: string
  icon: SimulacroIcon
  color: string
  accent: string
  iconChip: string
  chipActive: string
  chipBorder: string
  tileColor: string
  monthAccent: string
}

export const simulacrosIntro = {
  title: "Simulacros de evacuación masiva",
  subtitle: "Actuar hoy para cuidarnos siempre",
  lead:
    "SENAPRED desarrolla simulacros de evacuación masiva: ejercicios prácticos en terreno que movilizan a la comunidad y a las instituciones del Sistema Nacional de Prevención y Respuesta ante Desastres (SINAPRED).",
  body:
    "Estos simulacros recrean escenarios ficticios —como sismos, tsunamis, erupciones volcánicas, aluviones o incendios forestales— para entrenar a la población en el proceso de evacuación y poner a prueba la capacidad de respuesta de las organizaciones que participan en la gestión del riesgo de desastres.",
} as const

export const simulacrosImportance = [
  {
    n: 1,
    title: "Preparación comunitaria",
    body: "Fortalecen la preparación comunitaria, permitiendo que cada persona conozca cómo actuar frente a una amenaza real.",
  },
  {
    n: 2,
    title: "Coordinación SINAPRED",
    body: "Movilizan recursos humanos, materiales y operativos, evaluando la coordinación entre los distintos organismos del SINAPRED.",
  },
  {
    n: 3,
    title: "Sistemas de alerta",
    body: "Ponen a prueba los sistemas de alerta, incluyendo la activación del Mensaje SAE para celulares y la difusión de alarmas por parte de los equipos de primera respuesta.",
  },
  {
    n: 4,
    title: "Zonificación del riesgo",
    body: "Validan la zonificación del riesgo, revisando planos de evacuación, rutas, Puntos de Encuentro Transitorios (PeT) y Puntos de Encuentro (PE).",
  },
  {
    n: 5,
    title: "Mejora continua",
    body: "Permiten identificar brechas y oportunidades de mejora, contribuyendo al fortalecimiento continuo de los planes de emergencia y de la capacidad de respuesta del país.",
  },
] as const

export const simulacroTipos: SimulacroTipo[] = [
  {
    drillType: "sismo_tsunami_borde_costero",
    title: "SIMULACRO DE BORDE COSTERO",
    shortLabel: "Borde Costero",
    description:
      "Ejercicio en terreno que entrena la evacuación frente a un sismo de mayor intensidad con posterior tsunami. Pone a prueba planes de emergencia, procedimientos operativos y la coordinación interinstitucional del SINAPRED a nivel local.",
    icon: TsunamiIcon,
    color: "from-blue-700/80 via-blue-800/60 to-cyan-900/60",
    accent: "text-blue-200",
    iconChip: "bg-blue-500/20 border-blue-400/40",
    chipActive: "bg-blue-500/20 border-blue-400/50 text-blue-100",
    chipBorder: "border-blue-400/40",
    tileColor: "from-blue-700/40 via-blue-800/30 to-cyan-900/40",
    monthAccent: "text-blue-200",
  },
  {
    drillType: "sismo_tsunami_educacion",
    title: "SIMULACRO SECTOR EDUCACIÓN",
    shortLabel: "Sector Educación",
    description:
      "Ejercicio a gran escala que entrena la evacuación de la comunidad educativa. Los establecimientos activan protocolos conforme a sus Planes Integrales de Seguridad Escolar (PISE) y/o Planes de Emergencia.",
    icon: EducationIcon,
    color: "from-emerald-700/80 via-emerald-800/60 to-teal-900/60",
    accent: "text-emerald-200",
    iconChip: "bg-emerald-500/20 border-emerald-400/40",
    chipActive: "bg-emerald-500/20 border-emerald-400/50 text-emerald-100",
    chipBorder: "border-emerald-400/40",
    tileColor: "from-emerald-700/40 via-emerald-800/30 to-teal-900/40",
    monthAccent: "text-emerald-200",
  },
  {
    drillType: "erupcion_volcanica",
    title: "SIMULACRO POR ERUPCIÓN VOLCÁNICA",
    shortLabel: "Erupción Volcánica",
    description:
      "Prepara a la población frente a erupción volcánica y caída de cenizas, incluyendo evacuación y coordinación interinstitucional en comunidades cercanas a volcanes activos.",
    icon: VolcanoIcon,
    color: "from-amber-700/80 via-orange-800/60 to-yellow-900/50",
    accent: "text-amber-200",
    iconChip: "bg-amber-500/20 border-amber-400/40",
    chipActive: "bg-amber-500/20 border-amber-400/50 text-amber-100",
    chipBorder: "border-amber-400/40",
    tileColor: "from-amber-700/40 via-orange-800/30 to-yellow-900/40",
    monthAccent: "text-amber-200",
  },
  {
    drillType: "remocion_en_masa",
    title: "SIMULACRO POR REMOCIÓN EN MASA",
    shortLabel: "Remoción en Masa",
    description:
      "Orientado a deslizamientos, aluviones o derrumbes asociados a lluvias intensas. Considera evacuaciones preventivas, identificación de zonas de riesgo y activación de protocolos comunales.",
    icon: LandslideIcon,
    color: "from-slate-700/80 via-stone-800/60 to-zinc-900/50",
    accent: "text-slate-200",
    iconChip: "bg-slate-500/20 border-slate-400/40",
    chipActive: "bg-slate-500/25 border-slate-400/50 text-slate-100",
    chipBorder: "border-slate-400/40",
    tileColor: "from-slate-700/40 via-stone-800/30 to-zinc-900/40",
    monthAccent: "text-slate-200",
  },
]

export const simulacrosClosing =
  "Cada simulacro es una instancia clave para fortalecer la resiliencia de las comunidades y mejorar el funcionamiento del SINAPRED. Participar representa un compromiso con el entorno, la seguridad familiar y colectiva."

const _OTRO_VISUAL: Omit<SimulacroTipo, "drillType" | "title" | "description"> = {
  shortLabel: "Otro",
  icon: TsunamiIcon,
  color: "from-rose-700/80 via-red-800/60 to-pink-900/50",
  accent: "text-rose-200",
  iconChip: "bg-rose-500/20 border-rose-400/40",
  chipActive: "bg-rose-500/20 border-rose-400/50 text-rose-100",
  chipBorder: "border-rose-400/40",
  tileColor: "from-rose-700/40 via-red-800/30 to-pink-900/40",
  monthAccent: "text-rose-200",
}

export type DrillTypeVisual = SimulacroTipo

const _TIPOS_BY_DRILL = Object.fromEntries(
  simulacroTipos.map((t) => [t.drillType, t]),
) as Record<Exclude<DrillType, "otro">, DrillTypeVisual>

export const DRILL_TYPE_VISUALS: Record<DrillType, DrillTypeVisual> = {
  ..._TIPOS_BY_DRILL,
  otro: {
    drillType: "otro",
    title: "OTRO SIMULACRO",
    description: "Ejercicio de evacuación masiva.",
    ..._OTRO_VISUAL,
  },
}

export const DRILL_TYPE_HIGHLIGHTS = simulacroTipos

export function getDrillTypeVisual(type: DrillType): DrillTypeVisual {
  return DRILL_TYPE_VISUALS[type] ?? DRILL_TYPE_VISUALS.otro
}