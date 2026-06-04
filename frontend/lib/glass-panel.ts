import { cn } from "@/lib/utils"

/** Glass surface — map popups, floating panels, disasters. See docs/DESIGN.md */
export const GLASS_PANEL_CLASS =
  "border border-white/10 bg-black/60 shadow-2xl shadow-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-black/50"

export const GLASS_DIVIDER = "border-white/10"

/** Back / catalog links on `bg-background` disaster pages (readable on light page bg). */
export const DISASTERS_NAV_LINK_CLASS = cn(
  GLASS_PANEL_CLASS,
  "inline-flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[1.2px] text-white/90",
  "transition-colors hover:bg-black/55 hover:text-white",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/35",
)