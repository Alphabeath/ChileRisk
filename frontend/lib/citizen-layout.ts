/** Fixed top bar height (brand row + padding). */
export const CITIZEN_NAVBAR_HEIGHT_PX = 48

/** Offset below fixed navbar for page content and map panels. */
export const CITIZEN_NAVBAR_CLEARANCE_PX = CITIZEN_NAVBAR_HEIGHT_PX

/** Tailwind class for padding-top under the fixed citizen navbar. */
export const CITIZEN_NAVBAR_PAD_TOP_CLASS = "pt-12" as const

/** Left inset for alerts column (`lg+`). Medium desktop is flush (`left-0`). */
export const MAP_PANEL_LEFT_INSET_PX = 16

/** Right inset for future controls/info column and MapLibre controls. */
export const MAP_PANEL_RIGHT_INSET_PX = 16

/**
 * Expanded floating panel width (Alertas, Fecha).
 * Also the always-on width from `lg` up when a panel is collapsed.
 */
export const MAP_PANEL_WIDTH_CLASS =
  "w-[320px] max-w-[calc(100vw-2rem)]" as const

/** Mono ops title for Alertas / Fecha map chrome. */
export const MAP_PANEL_TITLE_CLASS =
  "font-mono text-[11px] font-bold uppercase tracking-[1.1px] text-muted-foreground" as const

/**
 * Fixed left position: flush on medium (`md`–`lg`), padded from `lg`.
 * Pair with `MAP_PANEL_LEFT_INSET_PX` for top/maxHeight math on `lg+`.
 */
export const MAP_PANEL_LEFT_POSITION_CLASS = "left-0 lg:left-4" as const

/** Media query for the Tailwind `lg` breakpoint used by map chrome. */
export const MAP_WIDE_MIN_QUERY = "(min-width: 1024px)" as const

/** Floating map panel columns — visible from `lg` up. */
export const MAP_WIDE_ONLY_CLASS = "hidden lg:flex" as const

/** matchMedia for Tailwind `md` and up — close mobile sheets/menus when true. */
export const MAP_DESKTOP_MIN_QUERY = "(min-width: 768px)" as const
