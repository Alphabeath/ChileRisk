import type maplibregl from "maplibre-gl"

export const MAP_POPUP_PADDING = {
  top: 88,
  bottom: 48,
  left: 336,
  right: 32,
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
  left: 360,
  right: 40,
} as const