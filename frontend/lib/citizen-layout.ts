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

/**
 * Collapsed rail on medium desktop (`md`–`lg`): hug title + value chrome.
 * From `lg` (1024px) the collapsed chrome still uses full panel width.
 */
export const MAP_PANEL_RAIL_WIDTH_CLASS =
  "w-max max-w-[calc(100vw-2rem)] lg:w-[320px]" as const

/** Mono ops title for Alertas / Fecha chrome (rail + expanded). */
export const MAP_PANEL_TITLE_CLASS =
  "font-mono text-[11px] font-bold uppercase tracking-[1.1px] text-muted-foreground" as const

/** Width class for a desktop map panel given expand state. */
export function mapPanelWidthClass(expanded: boolean): string {
  return expanded ? MAP_PANEL_WIDTH_CLASS : MAP_PANEL_RAIL_WIDTH_CLASS
}

/**
 * Fixed left position: flush on medium (`md`–`lg`), padded from `lg`.
 * Pair with `MAP_PANEL_LEFT_INSET_PX` for top/maxHeight math on `lg+`.
 */
export const MAP_PANEL_LEFT_POSITION_CLASS = "left-0 lg:left-4" as const

/**
 * matchMedia for medium desktop rail behavior.
 * True when viewport is below Tailwind `lg` (1024px).
 * Desktop column is already `hidden` below `md`, so this covers `md`–`lg`.
 */
export const MAP_DESKTOP_COMPACT_QUERY = "(max-width: 1023px)" as const

/**
 * Tailwind breakpoint for map mobile chrome.
 * Below `md` (768px): hide floating columns, show mobile sheet entry.
 * `md+`: desktop floating panels.
 */
export const MAP_MOBILE_BREAKPOINT = "md" as const

/** matchMedia for Tailwind `md` and up — close mobile sheets/menus when true. */
export const MAP_DESKTOP_MIN_QUERY = "(min-width: 768px)" as const

/** Floating map panel columns — visible from `md` up. Use on flex column hosts. */
export const MAP_DESKTOP_ONLY_CLASS = "hidden md:flex" as const

/** Parent that only mounts layout on `md+` without becoming a box (`display: contents`). */
export const MAP_DESKTOP_ONLY_CONTENTS_CLASS = "hidden md:contents" as const

/** Map mobile chrome — hidden from `md` up. */
export const MAP_MOBILE_ONLY_CLASS = "md:hidden" as const
