"use client"

import { motion, useReducedMotion } from "motion/react"
import {
  createContext,
  useContext,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react"

/**
 * Motion root for scroll reveals on citizen pages.
 *
 * The citizen shell (`app/(citizen)/layout.tsx`) is `h-dvh overflow-hidden`;
 * the page `<main>` is the scroller, not the window. IntersectionObserver
 * needs that scroller as its root or reveals never fire / fire against the
 * wrong element.
 */
const ScrollRootContext = createContext<RefObject<HTMLElement | null> | null>(null)

/** Renders the scrollable `<main>` and provides it as the reveal root. */
export function ScrollRoot({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  return (
    <ScrollRootContext.Provider value={ref}>
      <main ref={ref} className={className}>
        {children}
      </main>
    </ScrollRootContext.Provider>
  )
}

const REVEAL_TAGS = ["div", "section", "article", "li"] as const
type RevealTag = (typeof REVEAL_TAGS)[number]

/**
 * One-shot fade + rise when the block enters the page scroller viewport.
 * Renders statically (no motion) when `prefers-reduced-motion` is set.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  as = "div",
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  as?: RevealTag
}) {
  const rootRef = useContext(ScrollRootContext)
  const reduceMotion = useReducedMotion()
  // SSR renderiza el path motion (opacity 0 inicial). Si el primer render del
  // cliente ramificara directo a estático, hidrataría con atributos distintos
  // (style) → React conserva el HTML del servidor y el contenido queda
  // invisible para siempre. El flip a estático lo hace useSyncExternalStore:
  // la hidratación usa el server snapshot (motion, idéntico al SSR) y antes
  // del paint pasa al snapshot cliente (estático, contenido visible).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (reduceMotion === true && mounted) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  const MotionTag = motion[as]
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{
        root: rootRef ?? undefined,
        once: true,
        amount: 0.25,
        // Sin rootMargin negativo: un margen inferior (p. ej. -10%) crea una
        // banda muerta en el fondo del scroll donde el último elemento nunca
        // intersecta y queda en opacity 0 para siempre.
      }}
      transition={{ duration: 0.55, ease: "easeOut", delay }}
    >
      {children}
    </MotionTag>
  )
}
