import type maplibregl from "maplibre-gl"

/** Matches Tailwind `md` / `MAP_MOBILE_BREAKPOINT` (panels → bottom sheet below this). */
const MAP_MOBILE_MAX_WIDTH_PX = 767

export const MAP_POPUP_PADDING = {
  top: 88,
  bottom: 48,
  left: 296,
  right: 296,
} as const

/** Compact padding when floating side panels are hidden. */
export const MAP_POPUP_PADDING_MOBILE = {
  top: 72,
  bottom: 160,
  left: 16,
  right: 16,
} as const

export const MAP_POPUP_OPTIONS: maplibregl.PopupOptions = {
  closeButton: false,
  closeOnClick: false,
  className: "cr-popup",
  maxWidth: "320px",
  padding: MAP_POPUP_PADDING,
  offset: 12,
}

/** Padding for initial fitBounds — reserves panel + navbar; looser than pre-popup focus zoom */
export const MAP_FIT_BOUNDS_PADDING = {
  top: 88,
  bottom: 56,
  left: 296,
  right: 296,
} as const

/**
 * Mobile fitBounds padding — equal L/R so Chile stays centered.
 * Extra bottom clears the collapsed map bottom sheet.
 */
export const MAP_FIT_BOUNDS_PADDING_MOBILE = {
  top: 72,
  bottom: 140,
  left: 20,
  right: 20,
} as const

function isMapMobileViewport(width?: number): boolean {
  const w =
    width ?? (typeof window !== "undefined" ? window.innerWidth : 1024)
  return w <= MAP_MOBILE_MAX_WIDTH_PX
}

export function getMapFitBoundsPadding(width?: number) {
  return isMapMobileViewport(width)
    ? MAP_FIT_BOUNDS_PADDING_MOBILE
    : MAP_FIT_BOUNDS_PADDING
}

export function getMapPopupPadding(width?: number) {
  return isMapMobileViewport(width)
    ? MAP_POPUP_PADDING_MOBILE
    : MAP_POPUP_PADDING
}

export function getMapPopupOptions(width?: number): maplibregl.PopupOptions {
  return {
    ...MAP_POPUP_OPTIONS,
    padding: getMapPopupPadding(width),
  }
}
