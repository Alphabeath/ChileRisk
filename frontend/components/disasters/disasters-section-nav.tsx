"use client"

import { useEffect, useState } from "react"

import { useScrollRootRef } from "@/components/disasters/scroll-reveal"
import { cn } from "@/lib/utils"

const CATALOG_SECTIONS = [
  { id: "desastres-prioritarias", label: "Amenazas prioritarias" },
  { id: "desastres-preparacion", label: "Todas las guías" },
  { id: "desastres-inclusivo", label: "Enfoque inclusivo" },
] as const

export function DisastersSectionNav() {
  const rootRef = useScrollRootRef()
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const root = rootRef?.current
    if (!root) return

    const targets = CATALOG_SECTIONS.map(({ id }) => document.getElementById(id))
    if (targets.some((target) => target === null)) return

    const intersecting = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            intersecting.add(entry.target.id)
          } else {
            intersecting.delete(entry.target.id)
          }
        }

        let nextActiveId: string | null = null
        CATALOG_SECTIONS.forEach(({ id }) => {
          if (intersecting.has(id)) nextActiveId = id
        })
        setActiveId(nextActiveId)
      },
      { root, rootMargin: "-25% 0px -65% 0px", threshold: 0 },
    )

    targets.forEach((target) => observer.observe(target as HTMLElement))
    return () => observer.disconnect()
  }, [rootRef])

  return (
    <nav
      aria-label="Navegación de secciones"
      className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end lg:flex"
    >
      {CATALOG_SECTIONS.map(({ id, label }) => {
        const active = activeId === id
        return (
          <a
            key={id}
            href={`#${id}`}
            aria-label={label}
            aria-current={active ? "location" : undefined}
            className="group relative flex size-11 items-center justify-end pr-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <span
              aria-hidden
              className={cn(
                "h-2 transition-[width,background-color] duration-150",
                active
                  ? "w-6 bg-[var(--primary-chile)]"
                  : "w-2 bg-muted-foreground/50 group-hover:w-5 group-hover:bg-[var(--primary-chile)] group-focus:w-5 group-focus:bg-[var(--primary-chile)] group-focus-visible:w-5 group-focus-visible:bg-[var(--primary-chile)]",
              )}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute right-10 whitespace-nowrap border border-border bg-popover px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-popover-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100 group-focus-visible:opacity-100"
            >
              {label}
            </span>
          </a>
        )
      })}
    </nav>
  )
}
