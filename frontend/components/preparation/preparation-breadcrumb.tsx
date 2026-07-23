import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

export interface PreparationBreadcrumbItem {
  label: string
  href?: string
}

interface PreparationBreadcrumbProps {
  items: PreparationBreadcrumbItem[]
  className?: string
}

export function PreparationBreadcrumb({
  items,
  className,
}: PreparationBreadcrumbProps) {
  return (
    <nav
      aria-label="Miga de pan"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 ? (
              <ChevronRight className="size-3 text-white/35" aria-hidden />
            ) : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className={cn(
                  PREPARATION_EYEBROW_CLASS,
                  "text-white/50 transition-colors hover:text-white/80",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  PREPARATION_EYEBROW_CLASS,
                  isLast ? "text-white/80" : "text-white/50",
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
