import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

export interface DashboardSectionProps {
  eyebrow: string
  title: string
  icon: LucideIcon
  iconClassName?: string
  href: string
  moreLabel?: string
  className?: string
  children: ReactNode
}

export function DashboardSection({
  eyebrow,
  title,
  icon: Icon,
  iconClassName,
  href,
  moreLabel = "Ver más →",
  className,
  children,
}: DashboardSectionProps) {
  return (
    <section
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col p-5 sm:p-6",
        className,
      )}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn(PREPARATION_EYEBROW_CLASS, "text-white/45")}>{eyebrow}</p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight text-white/90 sm:text-xl">
            <Icon
              className={cn("size-5 shrink-0", iconClassName)}
              strokeWidth={1.75}
              aria-hidden
            />
            <span className="truncate">{title}</span>
          </h2>
        </div>
        <Link
          href={href}
          className={cn(
            PREPARATION_EYEBROW_CLASS,
            "shrink-0 border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-white/70 transition-colors hover:border-white/25 hover:bg-white/[0.1] hover:text-white",
          )}
        >
          {moreLabel}
        </Link>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  )
}
