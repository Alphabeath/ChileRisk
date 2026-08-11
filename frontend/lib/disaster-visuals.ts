/**
 * Paleta editorial por amenaza SENAPRED.
 *
 * Cada acento se elige por asociación semántica con el fenómeno (agua → azul,
 * fuego → rojo-naranja, tierra → terracota, frío → azul hielo, etc.), no por
 * muestreo automático del asset. Todos cumplen ≥4.5:1 con texto blanco (WCAG AA)
 * para campos de color y CTAs en `GuideCard` / `GuideContent`.
 *
 * Son campos editoriales: no sustituyen la semántica de alerta/riesgo del mapa.
 */
export const DISASTER_ACCENT_HEX: Readonly<Record<string, string>> = {
  // Tierra / movimiento del suelo
  sismos: "#7A4A2E", // terracota — suelo y grietas
  aluviones: "#6B4A2E", // barro — flujo de detritos
  deslizamientos: "#6A4F2E", // ladera — tierra y roca
  "excursion-en-montana-o-zonas-cordilleranas": "#4A6B28", // cordillera — verde oliva

  // Agua / costa / inundación
  tsunami: "#0A6B99", // océano — ola marina
  inundaciones: "#1A6F8A", // crecida — agua dulce
  marejadas: "#0E6E7A", // oleaje — verde-azulado costero
  "tornado-trombas-marinas": "#1A6B5C", // tromba — tormenta marina

  // Fuego / humo / calor
  "incendios-forestales": "#B8331A", // llama — rojo-naranja
  "incendios-estructurales": "#B03A28", // incendio urbano — rojo ladrillo
  "humo-de-incendio-forestal": "#5F5348", // humo — gris-café
  "calor-extremo": "#B35A12", // sol extremo — ámbar cálido

  // Volcán
  "erupciones-volcanicas": "#8B3A2E", // lava / escoria — rojo volcánico

  // Frío / nieve / invierno
  heladas: "#3A5F8A", // hielo — azul frío
  nevadas: "#3D5A7A", // nieve — azul-gris
  invierno: "#2F6A7A", // invierno — azul-verde húmedo
  "invierno-zona-austral": "#2A5578", // austral — azul profundo

  // Clima / atmósfera
  enos: "#1A7A8A", // océano-atmósfera — teal climático
  "precipitaciones-estivales-altiplanicas": "#3A6A8A", // lluvia altiplánica — azul precipitación
  "tormentas-electricas": "#4A3A8A", // rayo — índigo de tormenta
  "tormenta-de-polvo-2": "#8A6A2A", // polvo — ocre árido

  // Riesgo antrópico
  "materiales-peligrosos": "#A35A10", // advertencia — ámbar de peligro

  // Preparación inclusiva
  "dimension-animal": "#2B6B5A", // fauna — verde-azulado natural
  "enfoque-de-genero": "#8B3A5C", // inclusión — rosa institucional
  "lactancia-en-emergencia": "#9A4A55", // cuidado — coral cálido
}

/** Fallback para un slug futuro sin entrada en la paleta: azul institucional. */
const DISASTER_ACCENT_FALLBACK = "#0032A0" // --primary-chile

/** Acento visual de una guía; siempre devuelve un color (fallback institucional). */
export function getDisasterAccent(slug: string): string {
  return DISASTER_ACCENT_HEX[slug] ?? DISASTER_ACCENT_FALLBACK
}
