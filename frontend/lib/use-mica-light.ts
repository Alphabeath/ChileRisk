export const MICA_DEFAULT_X = "35%"
export const MICA_DEFAULT_Y = "25%"

const MICA_SELECTOR = ".glass-mica.interactive-mica"

export function resetMicaCoords(el: HTMLElement) {
  el.style.setProperty("--mx", MICA_DEFAULT_X)
  el.style.setProperty("--my", MICA_DEFAULT_Y)
}

export function setMicaCoords(el: HTMLElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * 100
  const y = ((clientY - rect.top) / rect.height) * 100
  el.style.setProperty("--mx", `${x}%`)
  el.style.setProperty("--my", `${y}%`)
}

export function findMicaElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  return target.closest(MICA_SELECTOR) as HTMLElement | null
}