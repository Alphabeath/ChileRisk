import Link from "next/link"
import { ArrowUpRight, type LucideIcon } from "lucide-react"

import {
  DISASTERS_NAV_LINK_CLASS,
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

export interface PreparationContextBannerProps {
  eyebrow: string
  body: string
  href: string
  cta: string
  icon: LucideIcon
  /** Accent for icon chip / eyebrow (Tailwind classes). */
  accent?: "blue" | "rose" | "emerald"
  className?: string
}

const ACCENT: Record<
  NonNullable<PreparationContextBannerProps["accent"]>,
  { chip: string; icon: string; eyebrow: string }
> = {
  blue: {
    chip: "border-blue-400/30 bg-blue-500/10",
    icon: "text-blue-200",
    eyebrow: "text-blue-200/90",
  },
  rose: {
    chip: "border-rose-400/30 bg-rose-500/10",
    icon: "text-rose-200",
    eyebrow: "text-rose-200/90",
  },
  emerald: {
    chip: "border-emerald-400/30 bg-emerald-500/10",
    icon: "text-emerald-200",
    eyebrow: "text-emerald-200/90",
  },
}

export function PreparationContextBanner({
  eyebrow,
  body,
  href,
  cta,
  icon: Icon,
  accent = "blue",
  className,
}: PreparationContextBannerProps) {
  const a = ACCENT[accent]

  return (
    <div
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center border",
            a.chip,
          )}
        >
          <Icon className={cn("size-4", a.icon)} aria-hidden />
        </div>
        <div>
          <p className={cn(PREPARATION_EYEBROW_CLASS, a.eyebrow)}>{eyebrow}</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-white/65">{body}</p>
        </div>
      </div>
      <Link
        href={href}
        className={cn(
          DISASTERS_NAV_LINK_CLASS,
          "inline-flex shrink-0 items-center gap-2",
        )}
      >
        {cta}
        <ArrowUpRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  )
}
