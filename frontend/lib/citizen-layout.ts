/** Floating citizen navbar: `top-4` + bar with icon + label (~40px) + gap below. */
export const CITIZEN_NAVBAR_TOP_PX = 16
export const CITIZEN_NAVBAR_HEIGHT_PX = 40
export const CITIZEN_NAVBAR_CLEARANCE_PX =
  CITIZEN_NAVBAR_TOP_PX + CITIZEN_NAVBAR_HEIGHT_PX + 8

/** Sticky offset for disaster detail phase nav (below floating citizen navbar). */
export const DISASTER_PHASE_NAV_STICKY_TOP_PX = 80

/** Default `top` for map panels under the navbar (matches `useDraggablePanel` fixed default). */
export const MAP_PANEL_DEFAULT_TOP_PX = CITIZEN_NAVBAR_CLEARANCE_PX

/** Left inset for alerts column. */
export const MAP_PANEL_LEFT_INSET_PX = 16

/** Right inset for controls/info column and MapLibre controls. */
export const MAP_PANEL_RIGHT_INSET_PX = 16

/** Shared width for draggable map overlays (alerts, date, risk legend). */
export const MAP_PANEL_WIDTH_CLASS =
  "w-[260px] max-w-[calc(100vw-2rem)]" as const

/** @deprecated Use MAP_PANEL_WIDTH_CLASS */
export const MAP_RISK_LEGEND_WIDTH_CLASS = MAP_PANEL_WIDTH_CLASS