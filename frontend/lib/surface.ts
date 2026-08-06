import { cn } from "@/lib/utils"

/** Theme-aware map/citizen overlay shell — see docs/DESIGN.md */
export const SURFACE_PANEL_CLASS =
  "rounded-none border border-border bg-background/80 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"

/** Base Mica host (static specular; pair with interactive for cursor follow). */
export const SURFACE_MICA_CLASS = "surface-mica"

/** Interactive surface with cursor-following specular highlight. */
export const SURFACE_MICA_INTERACTIVE_CLASS = "surface-mica interactive-mica"

/** Default floating panel: surface + interactive Mica. */
export const SURFACE_PANEL_SHELL_CLASS = cn(
  SURFACE_PANEL_CLASS,
  SURFACE_MICA_INTERACTIVE_CLASS,
)
