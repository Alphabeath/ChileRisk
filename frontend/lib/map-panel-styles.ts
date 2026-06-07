import { MAP_PANEL_WIDTH_CLASS } from "@/lib/citizen-layout"
import { GLASS_MICA_INTERACTIVE_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

/** Shared glass shell for draggable map overlays. */
export const MAP_PANEL_SHELL_CLASS = cn(
  "z-20 border border-white/10 bg-black/60 shadow-2xl shadow-black/40 backdrop-blur-xl",
  GLASS_MICA_INTERACTIVE_CLASS,
  MAP_PANEL_WIDTH_CLASS,
)

export const MAP_PANEL_HEADER_LABEL_CLASS =
  "text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75"

export const MAP_PANEL_DRAG_HANDLE_CLASS = cn(
  "flex min-w-0 flex-1 select-none items-center gap-2 px-3 py-2",
  "cursor-grab data-[dragging=true]:cursor-grabbing",
)

export const MAP_PANEL_ACTION_BUTTON_CLASS = cn(
  "flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/85 transition-colors",
  "hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
  "disabled:cursor-not-allowed disabled:opacity-45",
)