/**
 * Vendored SENAPRED guide content (see `scripts/sync-senapred-guides.mjs`).
 * Server-side only: pages import the JSON directly, no network at runtime.
 */
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Anchor,
  Baby,
  Biohazard,
  Building2,
  CloudFog,
  CloudLightning,
  CloudSnow,
  Droplets,
  Flame,
  Footprints,
  HeartHandshake,
  LandPlot,
  Mountain,
  MountainSnow,
  PawPrint,
  ShieldAlert,
  Snowflake,
  ThermometerSnowflake,
  ThermometerSun,
  Tornado,
  Waves,
  Wind,
} from "lucide-react"

import indexJson from "@/data/senapred/index.json"

export type GuideGroup = "preparate" | "inclusiva"

export interface GuideBlockText {
  kind: "text"
  paragraphs: { text?: string; bullets?: string[] }[]
}
export interface GuideBlockLinks {
  kind: "links"
  items: { label: string; href: string }[]
}
export interface GuideBlockStep {
  kind: "step"
  icon: string
  text: string
}
export interface GuideBlockFigure {
  kind: "figure"
  src: string
  alt: string
}
export interface GuideBlockBackground {
  kind: "background"
  src: string
}
export interface GuideBlockSubheading {
  kind: "subheading"
  text: string
}
export type GuideBlock =
  | GuideBlockText
  | GuideBlockLinks
  | GuideBlockStep
  | GuideBlockFigure
  | GuideBlockBackground
  | GuideBlockSubheading

export interface GuideSummary {
  slug: string
  title: string
  blurb: string
  group: GuideGroup
  /** Imagen de tarjeta del catálogo (vendored de senapred.cl/recomendaciones). */
  cardImage?: string
}

export interface SenapredGuide extends GuideSummary {
  sourceUrl: string
  intro: GuideBlock[]
  sections: { heading: string; blocks: GuideBlock[] }[]
}

export function formatGuideTitle(title: string): string {
  const normalized = title.trim().toLocaleLowerCase("es-CL")
  if (normalized.length === 0) return ""
  return normalized[0].toLocaleUpperCase("es-CL") + normalized.slice(1)
}

export const GUIDE_GROUPS: { key: GuideGroup; label: string }[] = [
  { key: "preparate", label: "Prepárate con SENAPRED" },
  { key: "inclusiva", label: "Preparación inclusiva para emergencias" },
]

/**
 * Amenazas prioritarias del catálogo (orden de display del bloque featured).
 * Si un slug desaparece del index tras un `sync:senapred`, el bloque lo omite
 * y el grid refluye — no crashea.
 */
export const FEATURED_GUIDE_SLUGS = [
  "sismos",
  "tsunami",
  "incendios-forestales",
  "erupciones-volcanicas",
  "inundaciones",
  "aluviones",
] as const

export type FeaturedGuideSlug = (typeof FEATURED_GUIDE_SLUGS)[number]

export function isFeaturedGuideSlug(slug: string): boolean {
  return (FEATURED_GUIDE_SLUGS as readonly string[]).includes(slug)
}

export const SENAPRED_RECOMENDACIONES_URL = "https://senapred.cl/recomendaciones/"

export function listGuideSummaries(): GuideSummary[] {
  return indexJson as GuideSummary[]
}

export function getGuideSummary(slug: string): GuideSummary | undefined {
  return listGuideSummaries().find((g) => g.slug === slug)
}



const KNOWN_SLUGS = listGuideSummaries().map((g) => g.slug)

/** Slug → vendored JSON guide; `undefined` for unknown slugs. */
export function getGuide(slug: string): SenapredGuide | undefined {
  if (!KNOWN_SLUGS.includes(slug)) return undefined
  // Webpack/Turbopack require.context over the vendored JSON set.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(`@/data/senapred/${slug}.json`) as SenapredGuide
}

/**
 * Slug → icono lucide. Record module-level: referencia estable, segura para
 * render (ver `components/disasters/guide-card.tsx`).
 */
export const GUIDE_ICONS: Record<string, LucideIcon> = {
  aluviones: MountainSnow,
  "calor-extremo": ThermometerSun,
  deslizamientos: LandPlot,
  enos: Waves,
  "erupciones-volcanicas": Mountain,
  "excursion-en-montana-o-zonas-cordilleranas": Footprints,
  heladas: Snowflake,
  "humo-de-incendio-forestal": CloudFog,
  "incendios-estructurales": Building2,
  "incendios-forestales": Flame,
  inundaciones: Droplets,
  invierno: ThermometerSnowflake,
  "invierno-zona-austral": Snowflake,
  marejadas: Anchor,
  "materiales-peligrosos": Biohazard,
  nevadas: CloudSnow,
  "precipitaciones-estivales-altiplanicas": CloudSnow,
  sismos: Activity,
  "tormenta-de-polvo-2": Wind,
  "tormentas-electricas": CloudLightning,
  "tornado-trombas-marinas": Tornado,
  tsunami: Waves,
  "dimension-animal": PawPrint,
  "enfoque-de-genero": HeartHandshake,
  "lactancia-en-emergencia": Baby,
}

export function getGuideIcon(slug: string): LucideIcon {
  return GUIDE_ICONS[slug] ?? ShieldAlert
}
