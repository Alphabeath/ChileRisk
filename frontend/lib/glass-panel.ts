import { cn } from "@/lib/utils"

/** Glass surface — map popups, floating panels, disasters. See docs/DESIGN.md */
export const GLASS_PANEL_CLASS =
  "border border-white/10 bg-black/60 shadow-2xl shadow-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-black/50"

export const GLASS_DIVIDER = "border-white/10"

/** Mica cursor-light base class. Requires MicaLightProvider in citizen layout. */
export const GLASS_MICA_CLASS = "glass-mica"

/** Interactive glass with cursor-following specular highlight. */
export const GLASS_MICA_INTERACTIVE_CLASS = "glass-mica interactive-mica"

/** Floating citizen navbar shell — see docs/DESIGN.md §7.7 */
export const CITIZEN_NAVBAR_SHELL_CLASS = cn(
  GLASS_PANEL_CLASS,
  GLASS_MICA_INTERACTIVE_CLASS,
  "flex items-center gap-0.5 overflow-x-auto px-1.5 py-1",
  "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
)

/** Base classes for navbar route links (add active/inactive state in component). */
export const CITIZEN_NAVBAR_LINK_CLASS = cn(
  "flex shrink-0 items-center gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[1.2px] whitespace-nowrap transition-all duration-150",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
)

/** Back / catalog links on `bg-background` disaster pages (readable on light page bg). */
export const DISASTERS_NAV_LINK_CLASS = cn(
  GLASS_PANEL_CLASS,
  GLASS_MICA_INTERACTIVE_CLASS,
  "inline-flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[1.2px] text-white/90",
  "transition-colors hover:bg-black/55 hover:text-white",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/35",
)