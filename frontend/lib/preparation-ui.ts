import { cn } from "@/lib/utils"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"

/** Page shell for preparation routes — clears floating CitizenNavbar (`py-24`). */
export const PREPARATION_PAGE_SHELL_CLASS =
  "min-h-screen bg-background"

export const PREPARATION_PAGE_INNER_CLASS =
  "mx-auto flex max-w-7xl flex-col gap-4 px-4 py-24 sm:gap-5 sm:px-6 lg:px-8"

/** Narrower inner for focused wizard content (still clears navbar). */
export const PREPARATION_WIZARD_INNER_CLASS =
  "mx-auto flex max-w-7xl flex-col gap-4 px-4 py-24 sm:gap-5 sm:px-6 lg:px-8"

/** Sticky chrome under navbar (step nav / filters). */
export const PREPARATION_STICKY_SUBNAV_CLASS = cn(
  "sticky top-20 z-10",
)

/** Meta eyebrow on heroes and step headers. */
export const PREPARATION_EYEBROW_CLASS =
  "text-[10px] font-semibold uppercase tracking-[1.2px]"

/** Primary CTA lift on glass surfaces. */
export const PREPARATION_CTA_LIFT_CLASS =
  "transition-all duration-200 hover:-translate-y-px"

export type PreparationSaveStatus = "idle" | "saving" | "saved" | "error"

export function preparationSavePillClass(status: PreparationSaveStatus): string {
  switch (status) {
    case "saving":
      return "border-amber-500/40 bg-amber-500/10 text-amber-200"
    case "saved":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
    case "error":
      return "border-red-500/40 bg-red-500/10 text-red-200"
    default:
      return "border-white/10 bg-black/30 text-white/45"
  }
}

export function preparationSaveLabel(status: PreparationSaveStatus): string {
  switch (status) {
    case "saving":
      return "Guardando..."
    case "saved":
      return "Guardado"
    case "error":
      return "Error al guardar"
    default:
      return "Sin cambios"
  }
}

/** Shared empty / error glass block. */
export const PREPARATION_EMPTY_STATE_CLASS = cn(
  GLASS_PANEL_CLASS,
  "flex flex-col items-center gap-3 p-8 text-center",
)

export const PREPARATION_LIST_ITEM_CLASS = cn(
  "border border-white/10 bg-white/[0.03] p-4",
  "transition-colors hover:border-white/15 hover:bg-white/[0.05]",
)

export const PREPARATION_SECTION_DIVIDER_CLASS =
  "border-b border-white/10 pb-3"

/** Hero shell used across preparation heroes. */
export const PREPARATION_HERO_SHELL_CLASS = cn(
  GLASS_PANEL_CLASS,
  GLASS_MICA_INTERACTIVE_CLASS,
  "relative w-full overflow-hidden",
)
