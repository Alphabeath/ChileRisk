/** Custom event to expand/switch Monitor mobile bottom sheet during the tour. */
export const TOUR_MONITOR_EVENT = "chilerisk:tour-monitor" as const

/** Custom event to start (or restart) the citizen guided tour. */
export const TOUR_START_EVENT = "chilerisk:start-tour" as const

/** Fired when the tour finishes, is skipped, or is destroyed. */
export const TOUR_COMPLETED_EVENT = "chilerisk:tour-completed" as const

export type TourMonitorDetail = {
  tab?: "alertas" | "fecha" | "vistas"
  expand?: boolean
}

export type TourStepDef = {
  /** Route that must be active before highlighting. */
  route: string
  /**
   * CSS selector — prefer `[data-tour="…"]`.
   * Omit / empty for a centered page intro (no spotlight).
   */
  element?: string
  title: string
  description: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  /** Prep Monitor mobile sheet (expand + tab) before highlight. */
  monitorMobile?: TourMonitorDetail
}

/** Citizen label for a tour route (button copy when crossing pages). */
export function tourRouteLabel(route: string): string | null {
  if (route === "/monitor") return "Monitor"
  if (route === "/preparation") return "Preparación"
  if (route === "/dashboard") return "Inicio"
  return null
}

export function isMonitorMobileViewport(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(max-width: 767px)").matches
}

export function buildTourSteps(): TourStepDef[] {
  const mobile = isMonitorMobileViewport()

  const dashboard: TourStepDef[] = [
    {
      route: "/dashboard",
      element: '[data-tour="dashboard-hero"]',
      title: "ChileRisk hoy",
      description:
        "Tu inicio: riesgo local, alertas y acceso rápido a lo esencial.",
      side: "bottom",
    },
    {
      route: "/dashboard",
      element: '[data-tour="dashboard-comuna"]',
      title: "Mi comuna",
      description:
        "Resumen del día en tu comuna: riesgo, aire, sismos y alertas cercanas.",
      side: "bottom",
    },
    {
      route: "/dashboard",
      element: '[data-tour="dashboard-summary"]',
      title: "Resumen del día",
      description:
        "Briefing breve con el contexto nacional y local. También puedes abrir el Asistente.",
      side: "top",
    },
    {
      route: "/dashboard",
      element: '[data-tour="dashboard-shortcuts"]',
      title: "Atajos",
      description:
        "Salta al Monitor, Preparación o Asistente cuando lo necesites.",
      side: "top",
    },
  ]

  const navbar: TourStepDef[] = [
    {
      route: "/dashboard",
      element: '[data-tour="citizen-navbar"]',
      title: "Navegación",
      description:
        "Barra fija arriba: cada ícono te lleva a una sección. Desliza si no caben todos.",
      side: "bottom",
      align: "center",
    },
    {
      route: "/dashboard",
      element: '[data-tour="nav-inicio"]',
      title: "Inicio",
      description:
        "Tu home: resumen del día, riesgo en tu comuna, plan familiar y alertas nacionales.",
      side: "bottom",
    },
    {
      route: "/dashboard",
      element: '[data-tour="nav-monitor"]',
      title: "Monitor",
      description:
        "Mapa en vivo de Chile con riesgo, alertas SERNAPRED y calidad del aire.",
      side: "bottom",
    },
    {
      route: "/dashboard",
      element: '[data-tour="nav-preparacion"]',
      title: "Preparación",
      description:
        "Plan Familia Preparada, kit de 72 horas y recursos para anticiparte.",
      side: "bottom",
    },
    {
      route: "/dashboard",
      element: '[data-tour="nav-asistente"]',
      title: "Asistente",
      description:
        "Chat con IA para dudas de riesgo, qué hacer ante una alerta o cómo prepararte.",
      side: "bottom",
    },
    {
      route: "/dashboard",
      element: '[data-tour="nav-simulacros"]',
      title: "Simulacros",
      description:
        "Calendario oficial SERNAPRED: próximos ensayos y cómo participar.",
      side: "bottom",
    },
    {
      route: "/dashboard",
      element: '[data-tour="nav-evacuacion"]',
      title: "Evacuación",
      description:
        "Mapa de zonas seguras y rutas ante tsunami u otras amenazas costeras.",
      side: "bottom",
    },
    {
      route: "/dashboard",
      element: '[data-tour="nav-desastres"]',
      title: "Desastres",
      description:
        "Guías por tipo (sismo, tsunami, volcán, incendios…) en fases Antes, Durante y Después.",
      side: "bottom",
    },
    {
      route: "/dashboard",
      element: '[data-tour="nav-cuenta"]',
      title: "Cuenta",
      description:
        "Tu perfil y comuna de hogar (búscala por nombre). Así personalizamos riesgo y alertas.",
      side: "bottom",
    },
  ]

  const monitor: TourStepDef[] = mobile
    ? [
        {
          route: "/monitor",
          // Centered intro — full-map spotlight is hard to read on Carto Dark.
          title: "Monitor",
          description:
            "Mapa en vivo de Chile. Abajo tienes Alertas, Fecha y Vistas para controlar lo que ves.",
        },
        {
          route: "/monitor",
          element: '[data-tour="monitor-mobile-sheet"]',
          title: "Controles",
          description:
            "Desde aquí abres Alertas, Fecha y Vistas. Expande el panel con la pestaña o el asa.",
          side: "top",
          monitorMobile: { expand: true, tab: "alertas" },
        },
        {
          route: "/monitor",
          element: '[data-tour="monitor-alerts"]',
          title: "Alertas",
          description:
            "Lista de alertas SERNAPRED, ChileRisk y Aire Chile. Filtra por fuente con los chips.",
          side: "top",
          monitorMobile: { expand: true, tab: "alertas" },
        },
        {
          route: "/monitor",
          element: '[data-tour="monitor-date"]',
          title: "Fecha",
          description:
            "Consulta el mapa en otra fecha. Útil para revisar el histórico reciente.",
          side: "top",
          monitorMobile: { expand: true, tab: "fecha" },
        },
        {
          route: "/monitor",
          element: '[data-tour="monitor-vistas"]',
          title: "Vistas",
          description:
            "Cambia entre Riesgo, Alertas y Aire para colorear el mapa.",
          side: "top",
          monitorMobile: { expand: true, tab: "vistas" },
        },
      ]
    : [
        {
          route: "/monitor",
          title: "Monitor",
          description:
            "Mapa en vivo de riesgo, alertas y aire. Los paneles de vidrio a los lados controlan filtros, fecha y vistas.",
        },
        {
          route: "/monitor",
          element: '[data-tour="monitor-alerts"]',
          title: "Alertas activas",
          description:
            "Panel izquierdo: alertas en curso. Filtra por fuente y abre el detalle.",
          side: "right",
        },
        {
          route: "/monitor",
          element: '[data-tour="monitor-date"]',
          title: "Fecha de consulta",
          description:
            "Cambia el día para ver el estado del mapa en otra fecha.",
          side: "right",
        },
        {
          route: "/monitor",
          element: '[data-tour="monitor-vistas"]',
          title: "Vistas",
          description:
            "Alterna Riesgo, Alertas o Aire y consulta la leyenda del mapa.",
          side: "left",
        },
      ]

  const preparation: TourStepDef[] = [
    {
      route: "/preparation",
      element: '[data-tour="prep-hero"]',
      title: "Preparación",
      description:
        "Centro de preparación ciudadana: plan, kit y simulacros.",
      side: "bottom",
    },
    {
      route: "/preparation",
      element: '[data-tour="prep-family-plan"]',
      title: "Plan Familia",
      description:
        "Sigue los 8 pasos del Plan Familia Preparada y descarga el resumen cuando esté listo.",
      side: "top",
    },
    {
      route: "/preparation",
      element: '[data-tour="prep-topics"]',
      title: "Temas clave",
      description:
        "Guías de kit, evacuación, hogar y simulacros para complementar tu plan.",
      side: "top",
    },
  ]

  return [...dashboard, ...navbar, ...monitor, ...preparation]
}

export function dispatchTourMonitor(detail: TourMonitorDetail): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent(TOUR_MONITOR_EVENT, { detail }),
  )
}

export function dispatchTourStart(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(TOUR_START_EVENT))
}
