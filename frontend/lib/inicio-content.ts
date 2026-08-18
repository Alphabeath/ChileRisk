import {
  Backpack,
  CalendarCheck2,
  Monitor,
  Package,
  Route,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react"

export type InicioDestination = {
  href: string
  label: string
  description: string
  icon: LucideIcon
}

export const INICIO_HEADER = {
  title: "ChileRisk",
  lede: "Monitoreo multi-amenaza para las 16 regiones y 346 comunas de Chile.",
  body: "Alertas oficiales, sismos, calidad del aire, avisos meteorológicos, capas de evacuación y guías de preparación. Consulta sin cuenta. Si una fuente no responde, no se inventan datos.",
  primary: "Crear cuenta",
  secondary: "Entrar al monitor",
} as const

export const INICIO_HERO_ART = {
  light: "/data/senapred/img/hero.png",
  dark: "/data/senapred/img/hero noche.png",
} as const

export const INICIO_TERRITORY = [
  { value: "16", label: "regiones" },
  { value: "346", label: "comunas" },
] as const

export const INICIO_DIRECTORY_HEADING = "Qué hay dentro"

export function listInicioDestinations(): InicioDestination[] {
  return [
    {
      href: "/monitor",
      label: "Monitor",
      description:
        "Mapa de alertas, sismos, aire y avisos DMC para las 16 regiones y 346 comunas.",
      icon: Monitor,
    },
    {
      href: "/preparacion",
      label: "Preparación",
      description:
        "Guía para prepararte como familia frente a una emergencia.",
      icon: Backpack,
    },
    {
      href: "/preparacion/kit-emergencia",
      label: "Kit",
      description:
        "Guía sobre cómo preparar un kit de emergencia.",
      icon: Package,
    },
    {
      href: "/evacuacion",
      label: "Evacuación",
      description:
        "Mapa de evacuación para distintos desastres.",
      icon: Route,
    },
    {
      href: "/simulacros",
      label: "Simulacros",
      description:
        "Calendario de ejercicios de simulacros próximos y guías.",
      icon: CalendarCheck2,
    },
    {
      href: "/desastres",
      label: "Desastres",
      description:
        "Guías para hacer frente a los desastres que más afectan a Chile.",
      icon: ShieldAlert,
    },
  ]
}

export const INICIO_PULSE_HEADING = "Hoy en el país"

export const INICIO_ACCOUNT_GUEST = {
  title: "Crea tu cuenta",
  body: "Guarda tu comuna de hogar y tus preferencias de aviso. El monitor, las guías y los simulacros siguen abiertos sin registrarte.",
  register: "Crear cuenta",
  login: "Ya tengo cuenta",
} as const

export const INICIO_ACCOUNT_BENEFITS = [
  {
    title: "Comuna de hogar",
    detail: "La guardas en tu perfil para volver a tu territorio.",
  },
  {
    title: "Preferencias de aviso",
    detail:
      "Eliges alertas oficiales y simulacros. ChileRisk todavía no envía estos avisos.",
  },
  {
    title: "Sigue siendo público",
    detail: "El monitor, las guías y el calendario no exigen cuenta.",
  },
] as const

export const INICIO_ACCOUNT_SIGNED_IN = {
  title: "Comuna de hogar",
  body: "Tu comuna de hogar se configura en Cuenta.",
  action: "Ir a cuenta",
} as const
