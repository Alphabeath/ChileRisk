import type { LucideIcon } from "lucide-react"
import { Plus } from "lucide-react"

import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

/** Canonical vertical rhythm for every wizard step body. */
export function FamilyPlanStepRoot({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>{children}</div>
  )
}

/** Top summary / progress banner shared across steps. */
export function FamilyPlanStatusBanner({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Accent category card: header strip + body for lists of items. */
export function FamilyPlanCategoryShell({
  accentClassName,
  header,
  children,
  className,
}: {
  accentClassName?: string
  header: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "border-l-[3px] transition-colors hover:bg-black/55",
        accentClassName,
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        {header}
      </header>
      <div className="flex flex-col gap-2 p-3">{children}</div>
    </section>
  )
}

/** Editable item card inside a category or flat section. */
export function FamilyPlanItemCard({
  accentClassName,
  className,
  children,
}: {
  accentClassName?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <article
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col gap-4 p-4 transition-colors hover:bg-black/55",
        accentClassName && "border-l-[3px]",
        accentClassName,
        className,
      )}
    >
      {children}
    </article>
  )
}

/** Default form grid: 1 col mobile → 2 cols from `sm`. Full-width children use `sm:col-span-2`. */
export function FamilyPlanFormGrid({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>{children}</div>
  )
}

export const FAMILY_PLAN_FORM_FULL_CLASS = "sm:col-span-2"

/** Dashed empty state inside a step/section. */
export function FamilyPlanEmptyState({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col items-center gap-2 border-dashed px-4 py-8 text-center",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Dashed add-item panel with consistent CTA sizing. */
export function FamilyPlanAddPanel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col gap-3 border-dashed p-4 transition-colors hover:bg-black/55",
        className,
      )}
    >
      {children}
    </div>
  )
}

export const FAMILY_PLAN_ADD_CTA_CLASS =
  "inline-flex w-full items-center justify-center gap-2 border border-white/20 bg-white/10 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[1.2px] text-white transition-colors hover:bg-white/[0.14] sm:w-fit sm:self-start sm:py-2"

export function FamilyPlanAddCta({
  onClick,
  label,
  icon: Icon = Plus,
  className,
  disabled,
}: {
  onClick: () => void
  label: string
  icon?: LucideIcon
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(FAMILY_PLAN_ADD_CTA_CLASS, className)}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </button>
  )
}

const STATUS_CHIP_TONES = {
  complete: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  started: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  empty: "border-white/15 bg-white/[0.04] text-white/55",
  danger: "border-rose-500/40 bg-rose-500/10 text-rose-200",
} as const

export type FamilyPlanStatusChipTone = keyof typeof STATUS_CHIP_TONES

export function FamilyPlanStatusChip({
  tone,
  children,
  className,
  title,
}: {
  tone: FamilyPlanStatusChipTone
  children: React.ReactNode
  className?: string
  title?: string
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-7 items-center gap-1 border px-2 text-[9px] font-semibold uppercase tracking-[1.2px]",
        STATUS_CHIP_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
