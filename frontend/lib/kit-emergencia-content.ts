export const SENAPRED_KIT_EMERGENCIA_URL =
  "https://senapred.cl/kit-de-emergencia/"

export const KIT_EMERGENCIA_HERO_ART = {
  light: "/data/senapred/img/kit-emergencia/hero.png",
  dark: "/data/senapred/img/kit-emergencia/hero noche.png",
} as const

export const KIT_EMERGENCIA_FOOTER_ART = {
  light: "/data/senapred/img/kit-emergencia/footer.png",
  dark: "/data/senapred/img/kit-emergencia/footer noche.png",
} as const

export const KIT_EMERGENCIA_INTRODUCTION = [
  "En caso de una emergencia, debes tener provisiones básicas para 48-72 horas.",
  "La buena noticia es que casi siempre se encuentran en tu hogar. Por eso, te recomendamos organizar tu kit de emergencia y mantenerlo en un lugar de fácil acceso, listo para usar en cualquier situación.",
] as const

export const KIT_EMERGENCIA_FAMILY_NOTE =
  "Este listado debe ser elaborado en razón de las características y necesidades del grupo familiar. Por ello, se debe considerar a la realidad de cada familia, tomando en cuenta la cantidad de personas que integran el grupo familiar, características del entorno, costumbres locales, pertinencia cultural de pueblos originarios, entre otros."

export type KitBasicItem = {
  text: string
  icon: string
  href?: string
  hrefLabel?: string
}

export const KIT_EMERGENCIA_BASIC_ITEMS: readonly KitBasicItem[] = [
  {
    text: "Agua: considera dos litros por persona al día (incluye botellas chicas que son más fáciles de trasladar).",
    icon: "/data/senapred/img/kit-emergencia/icon_agua.png",
  },
  {
    text: "Linternas o luz portátil con baterías o a dínamo.",
    icon: "/data/senapred/img/kit-emergencia/icon_linterna.png",
  },
  {
    text: "Papel higiénico y toalla de papel.",
    icon: "/data/senapred/img/kit-emergencia/icon_papel.png",
  },
  {
    text: "Alimentos no perecibles que se puedan consumir sin cocinar, como latas de conservas o barras energéticas.",
    icon: "/data/senapred/img/kit-emergencia/icon_comida.png",
  },
  {
    text: "Dinero en efectivo.",
    icon: "/data/senapred/img/kit-emergencia/icon_efectivo.png",
  },
  {
    text: "Botiquín de primeros auxilios, agrega medicamentos necesarios y recetas.",
    icon: "/data/senapred/img/kit-emergencia/icon_botiquin.png",
  },
  {
    text: "Copias de llaves de la casa.",
    icon: "/data/senapred/img/kit-emergencia/icon_llaves.png",
  },
  {
    text: "Radio a pilas y baterías adicionales.",
    icon: "/data/senapred/img/kit-emergencia/icon_radio.png",
  },
  {
    text: "Abridor de latas. En caso que se incluyan latas de alimento sin abre fácil.",
    icon: "/data/senapred/img/kit-emergencia/icon_abrelata.png",
  },
  {
    text: "Copia del Plan de Emergencia (que está en el Plan Familia Preparada).",
    icon: "/data/senapred/img/kit-emergencia/icon_plan.png",
    href: "/preparacion",
    hrefLabel: "Plan Familia Preparada",
  },
  {
    text: "Copia de documentos de identidad, pasaporte, nacimiento, escritura de propiedad y otros.",
    icon: "/data/senapred/img/kit-emergencia/icon_carnet.png",
  },
  {
    text: "Considera las necesidades especiales de tu grupo familiar, por ejemplo de lactantes, personas con TEA, embarazadas entre otros.",
    icon: "/data/senapred/img/kit-emergencia/icon_chupete.png",
  },
]

const EXTRA_IMG = "/data/senapred/img/kit-emergencia/provisiones-adicionales"
const CAR_IMG = "/data/senapred/img/kit-emergencia/vehiculo"

export const KIT_EMERGENCIA_EXTRA_ITEMS: readonly KitBasicItem[] = [
  {
    text: "Dos litros adicionales de agua por día.",
    icon: `${EXTRA_IMG}/agua.png`,
  },
  {
    text: "Una muda de ropa y zapatos (para cada miembro de la familia).",
    icon: `${EXTRA_IMG}/moda-ropa.png`,
  },
  {
    text: "Saco de dormir o una frazada (para cada miembro de la familia).",
    icon: `${EXTRA_IMG}/saco-dormir.png`,
  },
  {
    text: "Artículos de aseo.",
    icon: `${EXTRA_IMG}/articulos-asea.png`,
  },
  {
    text: "Jabón gel para manos.",
    icon: `${EXTRA_IMG}/jabon-gel.png`,
  },
  {
    text: "Papel higiénico.",
    icon: `${EXTRA_IMG}/papel-higienico.png`,
  },
  {
    text: "Utensilios de cocina (por lo menos dos ollas).",
    icon: `${EXTRA_IMG}/utensilios-cocina.png`,
  },
  {
    text: "Bolsas de basura.",
    icon: `${EXTRA_IMG}/bolsas-basura.png`,
  },
  {
    text: "Cloro o tabletas para purificar el agua.",
    icon: `${EXTRA_IMG}/medicina.png`,
  },
  {
    text: "Herramientas básicas: martillo, guantes, destornilladores, alicates, llave inglesa, cortapluma o cuchillo pequeño.",
    icon: `${EXTRA_IMG}/herramientas.png`,
  },
  {
    text: "Parrilla o asador.",
    icon: `${EXTRA_IMG}/parilla.png`,
  },
  {
    text: "Silbato.",
    icon: `${EXTRA_IMG}/silbato.png`,
  },
]

export const KIT_EMERGENCIA_CAR_ITEMS: readonly KitBasicItem[] = [
  {
    text: "Comida: que se mantenga y que se pueda consumir sin cocinar, como barras energéticas, alimentos deshidratados, enlatados y/o alimentos en caja tetrapack.",
    icon: `${CAR_IMG}/comida.png`,
  },
  {
    text: "Agua embotellada.",
    icon: `${CAR_IMG}/botella-agua.png`,
  },
  {
    text: "Frazadas.",
    icon: `${CAR_IMG}/frazadas.png`,
  },
  {
    text: "Una muda de ropa.",
    icon: `${CAR_IMG}/moda-ropa.png`,
  },
  {
    text: "Una pala.",
    icon: `${CAR_IMG}/pala.png`,
  },
  {
    text: "Extintor.",
    icon: `${CAR_IMG}/extintor.png`,
  },
  {
    text: "Bolsas plásticas.",
    icon: `${CAR_IMG}/bolsas-plasticas.png`,
  },
  {
    text: "Linternas con baterías.",
    icon: `${CAR_IMG}/linternas.png`,
  },
  {
    text: "Herramientas y manguera de hule.",
    icon: `${CAR_IMG}/herramientas.png`,
  },
  {
    text: "Medicamentos necesarios.",
    icon: `${CAR_IMG}/medicina.png`,
  },
  {
    text: "Toallas húmedas.",
    icon: `${CAR_IMG}/toallas-humedas.png`,
  },
  {
    text: "Mapas.",
    icon: `${CAR_IMG}/mapa.png`,
  },
  {
    text: "Copia del Plan de Emergencia y documentos.",
    icon: `${CAR_IMG}/documentos.png`,
    href: "/preparacion",
    hrefLabel: "Plan Familia Preparada",
  },
  {
    text: "Señales luminosas.",
    icon: `${CAR_IMG}/señales-luminosas.png`,
  },
  {
    text: "Botiquín de primeros auxilios.",
    icon: `${CAR_IMG}/botiquin.png`,
  },
]
