"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react"
import { Menu, X } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CITIZEN_NAV_ITEMS,
  isNavActive,
  type CitizenNavItem,
} from "@/lib/citizen-nav"
import { SURFACE_PANEL_SHELL_CLASS } from "@/lib/surface"
import { useCloseOnDesktopMd } from "@/lib/use-close-on-desktop-md"
import { cn } from "@/lib/utils"

const NAV_LINK_CLASS =
  "relative z-10 flex h-full shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.2px] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"

const SHEET_LINK_CLASS =
  "relative z-10 flex min-h-11 w-full items-center gap-3 px-4 py-3 text-sm font-semibold uppercase tracking-[1.2px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"

type PillBox = { x: number; y: number; width: number; height: number }

const SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.8 }

function useActivePill(
  containerRef: RefObject<HTMLElement | null>,
  pathname: string,
) {
  const [pill, setPill] = useState<PillBox | null>(null)

  const measure = useCallback(() => {
    const root = containerRef.current
    if (!root) return
    const active = root.querySelector<HTMLElement>("[aria-current='page']")
    if (!active) {
      setPill(null)
      return
    }
    const rootRect = root.getBoundingClientRect()
    const elRect = active.getBoundingClientRect()
    setPill({
      x: elRect.left - rootRect.left + root.scrollLeft,
      y: elRect.top - rootRect.top + root.scrollTop,
      width: elRect.width,
      height: elRect.height,
    })
  }, [containerRef])

  useLayoutEffect(() => {
    measure()
    // Labels expand/collapse after paint on md–xl; remeasure next frame.
    const raf = requestAnimationFrame(measure)
    const root = containerRef.current
    if (!root) return () => cancelAnimationFrame(raf)

    const ro = new ResizeObserver(measure)
    ro.observe(root)
    for (const child of root.querySelectorAll("[data-nav-item]")) {
      ro.observe(child)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [containerRef, measure, pathname])

  return pill
}

function DesktopNavLink({
  item,
  active,
}: {
  item: CitizenNavItem
  active: boolean
}) {
  const Icon = item.icon
  const className = cn(
    NAV_LINK_CLASS,
    active ? "px-3 text-primary-foreground" : "px-2.5 xl:px-3",
    !active && "text-muted-foreground hover:bg-muted hover:text-foreground",
  )
  const body = (
    <span className="relative z-10 flex items-center gap-2">
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className={cn(active ? "inline" : "hidden xl:inline")}>
        {item.label}
      </span>
    </span>
  )

  if (active) {
    return (
      <Link
        href={item.href}
        data-nav-item=""
        className={className}
        aria-current="page"
        aria-label={item.label}
      >
        {body}
      </Link>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        delay={200}
        render={
          <Link
            href={item.href}
            data-nav-item=""
            className={className}
            aria-label={item.label}
          />
        }
      >
        {body}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="uppercase tracking-[1.2px]">
        {item.label}
      </TooltipContent>
    </Tooltip>
  )
}

function SlidingPill({
  pill,
  reduceMotion,
  instant = false,
  style,
}: {
  pill: PillBox | null
  reduceMotion: boolean | null
  /** Skip spring (sheet highlight: no cross-item motion while open). */
  instant?: boolean
  style?: CSSProperties
}) {
  if (!pill) return null
  return (
    <motion.span
      className="pointer-events-none absolute z-0 bg-primary"
      initial={false}
      animate={{
        left: pill.x,
        top: pill.y,
        width: pill.width,
        height: pill.height,
      }}
      transition={
        reduceMotion || instant ? { duration: 0 } : SPRING
      }
      style={style}
      aria-hidden
    />
  )
}

export function CitizenNavbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const closeMenu = useCallback(() => setOpen(false), [])
  useCloseOnDesktopMd(closeMenu)
  const reduceMotion = useReducedMotion()
  const desktopNavRef = useRef<HTMLElement>(null)
  const sheetNavRef = useRef<HTMLElement>(null)
  const desktopPill = useActivePill(desktopNavRef, pathname)
  const sheetPillMeasured = useActivePill(sheetNavRef, open ? pathname : "")
  // Avoid spring/jump from display:none (0×0) → visible on first open.
  const sheetPill = open ? sheetPillMeasured : null

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[60] border-x-0 border-t-0 border-b",
        SURFACE_PANEL_SHELL_CLASS,
        "bg-background/55 supports-[backdrop-filter]:bg-background/40",
      )}
      data-tour="citizen-navbar"
    >
      <div className="relative z-10 flex h-12 items-stretch justify-center px-3 sm:px-4">
        <TooltipProvider delay={200}>
          <nav
            ref={desktopNavRef}
            className="relative hidden h-full min-w-0 items-stretch justify-center gap-0 md:flex"
            aria-label="Navegación principal"
          >
            <SlidingPill pill={desktopPill} reduceMotion={reduceMotion} />
            <Link
              href="/inicio"
              className={cn(
                NAV_LINK_CLASS,
                "px-3 text-foreground hover:bg-muted",
              )}
            >
              ChileRisk
            </Link>
            <Separator orientation="vertical" className="mx-1" />
            {CITIZEN_NAV_ITEMS.map((item) => (
              <DesktopNavLink
                key={item.href}
                item={item}
                active={isNavActive(pathname, item.href, item.section)}
              />
            ))}
          </nav>
        </TooltipProvider>

        <Link
          href="/inicio"
          className={cn(
            NAV_LINK_CLASS,
            // Match sheet link size on mobile (text-sm), not desktop ops 10px.
            "px-3 text-sm text-foreground hover:bg-muted md:hidden",
          )}
        >
          ChileRisk
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-2 size-11 -translate-y-1/2 md:hidden sm:right-3"
            aria-expanded={open}
            aria-controls="citizen-nav-sheet"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </Button>

          <SheetContent
            id="citizen-nav-sheet"
            side="right"
            showCloseButton={false}
            className="z-[55] w-full max-w-none border-border bg-background p-0 pt-12 sm:max-w-sm"
          >
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle className="text-left text-base">Menú</SheetTitle>
              <SheetDescription className="sr-only">
                Navegación principal de ChileRisk
              </SheetDescription>
            </SheetHeader>
            <nav
              ref={sheetNavRef}
              className="relative flex flex-col py-2"
              aria-label="Navegación principal"
            >
              <SlidingPill
                pill={sheetPill}
                reduceMotion={reduceMotion}
                instant
              />
              {CITIZEN_NAV_ITEMS.map((item) => {
                const active = isNavActive(pathname, item.href, item.section)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-nav-item=""
                    className={cn(
                      SHEET_LINK_CLASS,
                      active
                        ? "text-primary-foreground"
                        : "text-foreground hover:bg-muted",
                    )}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
