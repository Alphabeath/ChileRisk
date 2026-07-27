import { driver, type DriveStep, type Driver, type PopoverDOM } from "driver.js"

import {
  TOUR_COMPLETED_EVENT,
  buildTourSteps,
  dispatchTourMonitor,
  tourRouteLabel,
  type TourStepDef,
} from "@/lib/tour/tour-steps"
import { markTourSeen } from "@/lib/tour/tour-storage"

export type TourNavigate = (path: string) => void

export type StartCitizenTourOptions = {
  navigate: TourNavigate
  getPathname: () => string
}

let activeDriver: Driver | null = null
/** When true, destroy() is an internal restart — do not mark tour completed. */
let restartingTour = false

export function isCitizenTourActive(): boolean {
  return Boolean(activeDriver?.isActive())
}

function notifyTourCompleted(): void {
  if (restartingTour) return
  markTourSeen()
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(TOUR_COMPLETED_EVENT))
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function waitForPathname(
  getPathname: () => string,
  route: string,
  timeoutMs = 8000,
): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const loc =
      typeof window !== "undefined" ? window.location.pathname : getPathname()
    if (loc === route || getPathname() === route) {
      // Let the destination page mount before highlighting.
      await delay(120)
      return true
    }
    await delay(50)
  }
  const loc =
    typeof window !== "undefined" ? window.location.pathname : getPathname()
  return loc === route || getPathname() === route
}

async function ensureRoute(
  navigate: TourNavigate,
  getPathname: () => string,
  route: string,
): Promise<void> {
  const loc =
    typeof window !== "undefined" ? window.location.pathname : getPathname()
  if (loc === route || getPathname() === route) return
  navigate(route)
  await waitForPathname(getPathname, route)
}

async function prepareStep(def: TourStepDef): Promise<void> {
  if (def.monitorMobile) {
    dispatchTourMonitor(def.monitorMobile)
    await delay(prefersReducedMotion() ? 50 : 380)
  }
  // Navbar is horizontally scrollable — bring the target link into view.
  if (def.element?.includes("data-tour=\"nav-")) {
    const el = document.querySelector(def.element)
    el?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: prefersReducedMotion() ? "instant" : "smooth",
    })
    await delay(prefersReducedMotion() ? 40 : 220)
  }
}

/** Next-button label: page hop → "Ir a X"; last step → "Listo"; else "Siguiente". */
function nextButtonLabel(
  defs: TourStepDef[],
  index: number,
): string {
  const current = defs[index]
  const next = defs[index + 1]
  if (!next) return "Listo"
  if (current && next.route !== current.route) {
    const label = tourRouteLabel(next.route)
    return label ? `Ir a ${label}` : "Siguiente"
  }
  return "Siguiente"
}

function syncNextButton(
  popover: PopoverDOM,
  defs: TourStepDef[],
  index: number,
): void {
  popover.nextButton.textContent = nextButtonLabel(defs, index)
}

function toDriveSteps(defs: TourStepDef[]): DriveStep[] {
  return defs.map((def) => ({
    ...(def.element ? { element: def.element } : {}),
    waitForElement: def.element ? 8000 : undefined,
    skipMissingElement: Boolean(def.element),
    popover: {
      title: def.title,
      description: def.description,
      side: def.side,
      align: def.align,
      popoverClass: "chilerisk-tour-popover",
    },
    onHighlightStarted: () => {
      void prepareStep(def)
    },
    data: { route: def.route },
  }))
}

/**
 * Starts the multi-route citizen tour. Destroys any previous instance.
 * Marks the tour as seen when the user finishes or closes it.
 */
export async function startCitizenTour({
  navigate,
  getPathname,
}: StartCitizenTourOptions): Promise<void> {
  if (typeof window === "undefined") return

  if (activeDriver?.isActive()) {
    restartingTour = true
    activeDriver.destroy()
    activeDriver = null
    restartingTour = false
  }

  const defs = buildTourSteps()
  if (defs.length === 0) return

  await ensureRoute(navigate, getPathname, defs[0].route)
  await prepareStep(defs[0])

  const driveSteps = toDriveSteps(defs)

  const d = driver({
    steps: driveSteps,
    animate: !prefersReducedMotion(),
    overlayColor: "#000000",
    overlayOpacity: 0.86,
    stagePadding: 8,
    stageRadius: 0,
    smoothScroll: !prefersReducedMotion(),
    allowClose: true,
    showProgress: true,
    progressText: "{{current}} de {{total}}",
    nextBtnText: "Siguiente",
    prevBtnText: "Anterior",
    doneBtnText: "Listo",
    popoverClass: "chilerisk-tour-popover glass-mica interactive-mica",
    onPopoverRender: (popover, { state }) => {
      popover.closeButton.setAttribute("aria-label", "Saltar tour")
      popover.closeButton.title = "Saltar"
      popover.wrapper.classList.add("glass-mica", "interactive-mica")
      syncNextButton(popover, defs, state.activeIndex ?? 0)
    },
    onHighlighted: (_el, _step, { state, driver: drv }) => {
      const popover = drv.getState("popover") as PopoverDOM | undefined
      if (popover) syncNextButton(popover, defs, state.activeIndex ?? 0)
    },
    onNextClick: (_el, _step, { driver: drv, state }) => {
      void (async () => {
        const idx = state.activeIndex ?? 0
        const next = defs[idx + 1]
        if (next) {
          await ensureRoute(navigate, getPathname, next.route)
          await prepareStep(next)
        }
        drv.moveNext()
      })()
    },
    onPrevClick: (_el, _step, { driver: drv, state }) => {
      void (async () => {
        const idx = state.activeIndex ?? 0
        const prev = defs[idx - 1]
        if (prev) {
          await ensureRoute(navigate, getPathname, prev.route)
          await prepareStep(prev)
        }
        drv.movePrevious()
      })()
    },
    onCloseClick: (_el, _step, { driver: drv }) => {
      drv.destroy()
    },
    onDestroyed: () => {
      activeDriver = null
      notifyTourCompleted()
    },
  })

  activeDriver = d
  d.drive(0)
}

export function stopCitizenTour(): void {
  if (activeDriver?.isActive()) {
    activeDriver.destroy()
  } else {
    activeDriver = null
  }
}
