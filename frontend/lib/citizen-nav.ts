import type { LucideIcon } from "lucide-react"
import {
  Backpack,
  CalendarCheck2,
  Home,
  MessageCircle,
  Monitor,
  Package,
  Route,
  ShieldAlert,
  UserCircle,
} from "lucide-react"

export type CitizenNavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Match pathname prefix (e.g. /desastres/[tipo]). */
  section?: boolean
}

export const CITIZEN_NAV_ITEMS: readonly CitizenNavItem[] = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/monitor", label: "Monitor", icon: Monitor },
  { href: "/preparacion", label: "Preparación", icon: Backpack },
  { href: "/preparacion/kit-emergencia", label: "Kit", icon: Package },
  { href: "/asistente", label: "Asistente", icon: MessageCircle },
  { href: "/simulacros", label: "Simulacros", icon: CalendarCheck2 },
  { href: "/evacuacion", label: "Evacuación", icon: Route },
  { href: "/desastres", label: "Desastres", icon: ShieldAlert, section: true },
  { href: "/cuenta", label: "Cuenta", icon: UserCircle },
] as const

export function isNavActive(
  pathname: string,
  href: string,
  section?: boolean,
): boolean {
  if (section) return pathname === href || pathname.startsWith(`${href}/`)
  return pathname === href
}
