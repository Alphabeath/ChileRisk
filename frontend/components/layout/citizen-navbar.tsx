"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import {
  Backpack,
  CalendarCheck2,
  Home,
  MessageCircle,
  Monitor,
  Route,
  ShieldAlert,
  UserCircle,
} from "lucide-react"
import { CITIZEN_NAVBAR_LINK_CLASS, CITIZEN_NAVBAR_SHELL_CLASS } from "@/lib/glass-panel"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: Home, section: false },
  { href: "/monitor", label: "Monitor", icon: Monitor, section: false },
  { href: "/preparation", label: "Preparación", icon: Backpack, section: false },
  { href: "/assistant", label: "Asistente", icon: MessageCircle, section: false },
  { href: "/drills", label: "Simulacros", icon: CalendarCheck2, section: false },
  { href: "/evacuation", label: "Evacuación", icon: Route, section: false },
  { href: "/disasters", label: "Desastres", icon: ShieldAlert, section: true },
  { href: "/account", label: "Cuenta", icon: UserCircle, section: false },
] as const

const DRAG_THRESHOLD_PX = 6

function isNavActive(pathname: string, href: string, section?: boolean) {
  if (section) return pathname.startsWith(href)
  return pathname === href
}

function useHorizontalNavScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({
    tracking: false,
    dragging: false,
    moved: false,
    startX: 0,
    startScroll: 0,
    pointerId: -1,
  })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const maxScroll = scrollWidth - clientWidth
    setCanScrollLeft(scrollLeft > 1)
    setCanScrollRight(maxScroll > 1 && scrollLeft < maxScroll - 1)
  }, [])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [update])

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    // Primary button / touch / pen only — ignore right-click, etc.
    if (e.pointerType === "mouse" && e.button !== 0) return
    const el = ref.current
    if (!el) return
    if (el.scrollWidth <= el.clientWidth + 1) return

    // Only arm tracking — do not steal the gesture until the pointer moves.
    // That keeps a plain click/tap able to activate links.
    dragRef.current = {
      tracking: true,
      dragging: false,
      moved: false,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      pointerId: e.pointerId,
    }
  }, [])

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag.tracking || drag.pointerId !== e.pointerId) return
      const el = ref.current
      if (!el) return

      const dx = e.clientX - drag.startX

      if (!drag.dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX) return
        drag.dragging = true
        drag.moved = true
        el.setPointerCapture(e.pointerId)
        setDragging(true)
      }

      e.preventDefault()
      el.scrollLeft = drag.startScroll - dx
      update()
    },
    [update],
  )

  const endDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag.tracking || drag.pointerId !== e.pointerId) return
    const wasDragging = drag.dragging
    drag.tracking = false
    drag.dragging = false
    setDragging(false)
    const el = ref.current
    if (wasDragging && el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }
  }, [])

  /** Block link navigation when the gesture was a drag, not a tap/click. */
  const onClickCapture = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.moved) return
    e.preventDefault()
    e.stopPropagation()
    dragRef.current.moved = false
  }, [])

  return {
    ref,
    canScrollLeft,
    canScrollRight,
    dragging,
    update,
    onScroll: update,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onClickCapture,
  }
}

export function CitizenNavbar() {
  const pathname = usePathname()
  const disasterPhaseNavPinned = useUIStore((s) => s.disasterPhaseNavPinned)
  const {
    ref: scrollRef,
    canScrollLeft,
    canScrollRight,
    dragging,
    update,
    onScroll,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClickCapture,
  } = useHorizontalNavScroll()
  const activeLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const link = activeLinkRef.current
    const scroller = scrollRef.current
    if (!link || !scroller) return
    const linkLeft = link.offsetLeft
    const linkRight = linkLeft + link.offsetWidth
    const viewLeft = scroller.scrollLeft
    const viewRight = viewLeft + scroller.clientWidth
    if (linkLeft < viewLeft + 8 || linkRight > viewRight - 8) {
      link.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" })
    }
    const id = window.setTimeout(update, 320)
    return () => window.clearTimeout(id)
  }, [pathname, scrollRef, update])

  return (
    <nav
      className={cn(
        "fixed top-4 left-1/2 z-50 w-fit max-w-[calc(100vw-2rem)] -translate-x-1/2 transition-[transform,opacity] duration-200 ease-out",
        disasterPhaseNavPinned &&
          "pointer-events-none -translate-y-[calc(100%+1.25rem)] opacity-0",
      )}
      aria-hidden={disasterPhaseNavPinned}
      aria-label="Navegación principal"
    >
      <div className="relative max-w-full min-w-0">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onClickCapture={onClickCapture}
          className={cn(
            CITIZEN_NAVBAR_SHELL_CLASS,
            // touch-none: horizontal scroll via pointer drag after threshold (mouse + touch).
            "max-w-full min-w-0 touch-none overscroll-x-contain select-none",
            canScrollLeft || canScrollRight ? "cursor-grab" : null,
            dragging && "cursor-grabbing",
          )}
        >
          {navItems.map(({ href, label, icon: Icon, section }) => {
            const isActive = isNavActive(pathname, href, section)
            return (
              <Link
                key={href}
                ref={isActive ? activeLinkRef : undefined}
                href={href}
                draggable={false}
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

        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/75 to-transparent transition-opacity duration-200",
            canScrollLeft ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/75 to-transparent transition-opacity duration-200",
            canScrollRight ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </nav>
  )
}
