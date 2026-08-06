export const MICA_DEFAULT_X = "35%"
export const MICA_DEFAULT_Y = "25%"

const MICA_SELECTOR = ".surface-mica.interactive-mica"

/**
 * Cursor-light position lives on <html> (--mica-cursor-x/y), never on the
 * React-managed surface nodes: imperative inline styles on React elements
 * collide with hydration/remount diffs ("A tree hydrated but some attributes…").
 * Surfaces resolve them via `.surface-mica.interactive-mica { --mx: … }`.
 */
const MICA_ROOT = () =>
  typeof document !== "undefined" ? document.documentElement : null

export function resetMicaCoords() {
  MICA_ROOT()?.style.setProperty("--mica-cursor-x", MICA_DEFAULT_X)
  MICA_ROOT()?.style.setProperty("--mica-cursor-y", MICA_DEFAULT_Y)
}

export function setMicaCoords(el: HTMLElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return
  const x = ((clientX - rect.left) / rect.width) * 100
  const y = ((clientY - rect.top) / rect.height) * 100
  MICA_ROOT()?.style.setProperty("--mica-cursor-x", `${x}%`)
  MICA_ROOT()?.style.setProperty("--mica-cursor-y", `${y}%`)
}

export function findMicaElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  return target.closest(MICA_SELECTOR) as HTMLElement | null
}
