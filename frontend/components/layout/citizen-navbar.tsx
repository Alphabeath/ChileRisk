"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Map, ShieldAlert, UserCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/map", label: "Mapa", icon: Map },
  { href: "/disasters", label: "Desastres", icon: ShieldAlert },
  { href: "/account", label: "Cuenta", icon: UserCircle },
] as const

export function CitizenNavbar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed top-3 left-1/2 z-50 w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2"
      aria-label="Navegación principal"
    >
      <div
        className={cn(
          "flex items-center gap-0.5 overflow-x-auto border border-border/70 bg-background/85 px-1.5 py-1 shadow-md backdrop-blur-xl",
          "supports-[backdrop-filter]:bg-background/65",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/disasters"
              ? pathname.startsWith(href)
              : pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={isActive ? 2.25 : 2} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}