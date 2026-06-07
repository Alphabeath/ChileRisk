"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Map, ShieldAlert, UserCircle } from "lucide-react"
import { CITIZEN_NAVBAR_LINK_CLASS, CITIZEN_NAVBAR_SHELL_CLASS } from "@/lib/glass-panel"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: Home, section: false },
  { href: "/map", label: "Mapa", icon: Map, section: false },
  { href: "/disasters", label: "Desastres", icon: ShieldAlert, section: true },
  { href: "/account", label: "Cuenta", icon: UserCircle, section: false },
] as const

function isNavActive(pathname: string, href: string, section?: boolean) {
  if (section) return pathname.startsWith(href)
  return pathname === href
}

export function CitizenNavbar() {
  const pathname = usePathname()
  const disasterPhaseNavPinned = useUIStore((s) => s.disasterPhaseNavPinned)

  return (
    <nav
      className={cn(
        "fixed top-4 left-1/2 z-50 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 transition-[transform,opacity] duration-200 ease-out",
        disasterPhaseNavPinned &&
          "pointer-events-none -translate-y-[calc(100%+1.25rem)] opacity-0",
      )}
      aria-hidden={disasterPhaseNavPinned}
      aria-label="Navegación principal"
    >
      <div className={CITIZEN_NAVBAR_SHELL_CLASS}>
        {navItems.map(({ href, label, icon: Icon, section }) => {
          const isActive = isNavActive(pathname, href, section)
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                CITIZEN_NAVBAR_LINK_CLASS,
                "group",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-white/55 hover:bg-white/[0.06] hover:text-white/90",
              )}
            >
              <Icon
                className={cn(
                  "size-3.5 shrink-0 transition-transform duration-150",
                  !isActive && "group-hover:scale-[1.15]",
                )}
                strokeWidth={isActive ? 2.25 : 2}
                aria-hidden
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}