import type { DrillType } from "@/lib/types"

export const SENAPRED_SIMULACROS_URL = "https://senapred.cl/simulacros/"

export const SIMULACRO_HERO_INTRODUCTION =
  "SENAPRED, en coordinación con los organismos que integran el Sistema Nacional de Prevención y Respuesta ante Desastres (SINAPRED), ejecuta año a año una serie de simulacros de evacuación en distintos territorios del país. Estos ejercicios forman parte fundamental del trabajo preventivo que busca fortalecer las capacidades de preparación tanto de las comunidades como de las instituciones responsables de la gestión del riesgo de desastres."

export const SIMULACRO_IMPORTANCE_INTRODUCTION = [
  "En SENAPRED, entendemos que contar con preparación adecuada es fundamental para responder de manera efectiva frente a emergencias. Por eso, desarrollamos simulacros de evacuación masiva, ejercicios prácticos en terreno que movilizan a la comunidad y a las instituciones del Sistema Nacional de Prevención y Respuesta ante Desastres (SINAPRED).",
  "Estos simulacros recrean escenarios ficticios —como sismos, tsunamis, erupciones volcánicas, aluviones o incendios forestales— para entrenar a la población en el proceso de evacuación y poner a prueba la capacidad de respuesta de las organizaciones que participan en la gestión del riesgo de desastres.",
] as const

export const SIMULACRO_IMPORTANCE_ITEMS: readonly string[] = [
  "Fortalecen la preparación comunitaria, permitiendo que cada persona conozca cómo actuar frente a una amenaza real.",
  "Movilizan recursos humanos, materiales y operativos, evaluando la coordinación entre los distintos organismos del SINAPRED.",
  "Ponen a prueba los sistemas de alerta, incluyendo la activación del Mensaje SAE para celulares y la difusión de alarmas por parte de los equipos de primera respuesta.",
  "Validan la zonificación del riesgo, revisando planos de evacuación, rutas y vías de evacuación , Puntos de Encuentro Transitorios (PeT) y Puntos de Encuentro (PE), definidos y verificados por los municipios y organismos técnicos competentes.",
  "Permiten identificar brechas y oportunidades de mejora, contribuyendo al fortalecimiento continuo de los planes de emergencia y de la capacidad de respuesta del país.",
]

export const SIMULACRO_TYPE_CONTENT = {
  sismo_tsunami_borde_costero: {
    title: "Simulacro de Borde Costero",
    paragraphs: [
      "Un simulacro coordinado por SENAPRED es un ejercicio práctico en terreno que permite entrenar la evacuación de la comunidad frente a un escenario simulado de un sismo de mayor intensidad con posterior Tsunami.",
      "Asimismo, permite poner a prueba planes de emergencia, procedimientos operativos y la coordinación interinstitucional de los organismos del Sistema Nacional de Prevención y Respuesta ante Desastres (SINAPRED), especialmente a nivel local.",
      "Durante el ejercicio, la comunidad ejecuta su evacuación mientras los organismos de respuesta activan sus roles y funciones conforme a la planificación vigente.",
      "De esta forma, los simulacros fortalecen las capacidades de respuesta tanto de la población como del sistema, permitiendo identificar fortalezas, brechas y oportunidades de mejora en los procesos de evacuación y gestión de emergencias.",
    ],
  },
  sismo_tsunami_educacion: {
    title: "Simulacro Sector Educación",
    paragraphs: [
      "Un simulacro del Sector Educación, coordinado por SENAPRED, es un ejercicio práctico en terreno y a gran escala que permite entrenar la evacuación de la comunidad educativa frente a un escenario simulado de emergencia, desastre o catástrofe que podría afectar a un territorio.",
      "Asimismo, permite poner en práctica planes de emergencia, procedimientos operativos y la coordinación entre instituciones para una adecuada preparación y respuesta. En este contexto, los establecimientos educacionales activan sus protocolos de evacuación conforme a sus Planes Integrales de Seguridad Escolar (PISE) y/o Planes de Emergencia.",
      "Este tipo de ejercicios contribuye a reforzar la cultura preventiva, promoviendo que estudiantes, docentes y comunidades educativas sepan cómo actuar de manera oportuna, organizada y segura frente a una emergencia real.",
    ],
  },
  erupcion_volcanica: {
    title: "Simulacro por Erupción Volcánica",
    paragraphs: [
      "Simulacro diseñado para preparar a la población frente a escenarios de erupción volcánica y caída de cenizas, incluyendo procesos de evacuación y coordinación interinstitucional.",
      "Se enfoca en comunidades cercanas a volcanes activos, donde se simulan condiciones como aumento de actividad volcánica, emisión de material piroclástico o lahares. Estos ejercicios permiten entrenar decisiones anticipadas y proteger a miles de personas expuestas a amenazas de evolución variable y alta incertidumbre, poniendo a prueba las Vías de Evacuación, Puntos de Encuentro y Puntos de Encuentro Transitorio (PET).",
    ],
  },
  remocion_en_masa: {
    title: "Simulacro por Remoción en Masa",
    paragraphs: [
      "Simulacro orientado a preparar la respuesta frente a eventos como deslizamientos de tierra, aluviones o derrumbes, generalmente asociados a lluvias intensas o condiciones climáticas adversas.",
      "El ejercicio considera evacuaciones preventivas, identificación de zonas de riesgo y activación de protocolos comunales. Su implementación se focaliza en sectores específicos con alta exposición, permitiendo entrenar a comunidades y equipos de emergencia en escenarios de rápida ocurrencia y alto impacto local.",
    ],
  },
} satisfies Record<
  Exclude<DrillType, "otro">,
  { title: string; paragraphs: readonly string[] }
>

export const SIMULACRO_CLOSING_PARAGRAPHS = [
  "Cada simulacro es una instancia clave para fortalecer la resiliencia de las comunidades y mejorar el funcionamiento del Sistema Nacional de Prevención y Respuesta ante Desastres. Participar representa un compromiso con el entorno, la seguridad familiar y colectiva.",
  "La prevención es la base de la seguridad. Comparte la información y mantente atento(a) a los próximos simulacros que se realizarán en tu territorio.",
] as const

export const SIMULACRO_PARTICIPATION_TITLE =
  "¡Participa, infórmate y sé parte de una comunidad más preparada!"
