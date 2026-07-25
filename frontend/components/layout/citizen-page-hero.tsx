import type { ReactNode } from "react"

import { GLASS_DIVIDER } from "@/lib/glass-panel"
import { PREPARATION_EYEBROW_CLASS, PREPARATION_HERO_SHELL_CLASS } from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

const DEFAULT_GRADIENT =
  "bg-gradient-to-br from-[var(--primary-chile)]/55 via-slate-950/70 to-[var(--secondary-chile)]/45"

const DEFAULT_FADE =
  "bg-gradient-to-t from-black/80 via-black/35 to-transparent"

/** Shared title-row height so catalog heroes align across navbar pages. */
const TITLE_ROW_MIN_H = "min-h-[11.5rem] sm:min-h-[13rem]"

export interface CitizenPageHeroProps {
  /** Brand / category gradient over the shell (Tailwind `bg-gradient-*` classes). */
  gradientClass?: string
  /** Extra absolute layers after the base gradient (e.g. disaster color wash). */
  overlays?: ReactNode
  /** Bottom readability fade. */
  fadeClass?: string
  watermark?: ReactNode
  eyebrow?: ReactNode
  title?: ReactNode
  description?: ReactNode
  meta?: ReactNode
  /** Replaces eyebrow/title/description/meta when the leading column is custom. */
  leading?: ReactNode
  stats?: ReactNode
  /** Content between the title row and the footer strip. */
  afterTitle?: ReactNode
  footer?: ReactNode
  className?: string
}

export function CitizenPageHero({
  gradientClass = DEFAULT_GRADIENT,
  overlays,
  fadeClass = DEFAULT_FADE,
  watermark,
  eyebrow,
  title,
  description,
  meta,
  leading,
  stats,
  afterTitle,
  footer,
  className,
}: CitizenPageHeroProps) {
  const leadingContent =
    leading ??
    (title != null ? (
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <div className="mb-3">{eyebrow}</div>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description ? (
          <div className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base">
            {description}
          </div>
        ) : null}
        {meta ? <div className="mt-4">{meta}</div> : null}
      </div>
    ) : null)

  return (
    <header className={cn(PREPARATION_HERO_SHELL_CLASS, className)}>
      <div
        className={cn("pointer-events-none absolute inset-0", gradientClass)}
        aria-hidden
      />
      {overlays}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className={cn("pointer-events-none absolute inset-0", fadeClass)}
        aria-hidden
      />
      {watermark}

      <div
        className={cn(
          "relative flex flex-col gap-6 p-5 sm:p-8",
          stats || leadingContent
            ? "lg:flex-row lg:items-end lg:justify-between lg:gap-10"
            : null,
          TITLE_ROW_MIN_H,
        )}
      >
        {leadingContent}
        {stats ? <div className="shrink-0">{stats}</div> : null}
      </div>

      {afterTitle}

      {footer ? (
        <div className={cn("relative border-t", GLASS_DIVIDER)}>{footer}</div>
      ) : null}
    </header>
  )
}

export function HeroEyebrow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2 border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[1.2px]",
        className,
      )}
    >
      {children}
    </span>
  )
}

export function HeroStatBox({
  label,
  value,
  text,
  suffix,
  accent,
  className,
}: {
  label: string
  value?: number | string | null
  text?: string
  suffix?: string
  accent?: boolean
  className?: string
}) {
  const display = text ?? value
  const isEmpty = display === null || display === undefined

  return (
    <div
      className={cn(
        "border border-white/20 bg-black/35 px-3 py-3 text-center backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-black/50 sm:px-4 sm:py-4",
        accent && "border-blue-500/30 bg-blue-950/30",
        className,
      )}
    >
      <dt className={cn(PREPARATION_EYEBROW_CLASS, "text-white/55")}>{label}</dt>
      <dd
        aria-label={
          !isEmpty && suffix ? `${display} ${suffix}` : undefined
        }
        className={cn(
          "mt-1 font-semibold tabular-nums text-white",
          text
            ? "text-base tracking-wide sm:text-lg"
            : "font-mono text-2xl sm:text-3xl",
          accent && "text-blue-200",
        )}
      >
        {isEmpty ? (
          "—"
        ) : suffix ? (
          <span>
            {display}
            <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-white/55 sm:text-[11px]">
              {suffix}
            </span>
          </span>
        ) : (
          display
        )}
      </dd>
    </div>
  )
}

export function HeroFooterCell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2.5 px-3 py-4 transition-colors hover:bg-white/[0.03] sm:gap-3 sm:px-5 sm:py-5",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function HeroFooterIcon({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center border border-white/20 bg-white/10 sm:size-10",
        className,
      )}
    >
      {children}
    </div>
  )
}
