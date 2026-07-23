import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"

import {
  PREPARATION_CTA_LIFT_CLASS,
} from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

interface EmergencyKitCtaProps {
  href?: string
  className?: string
}

export function EmergencyKitCta({
  href = "/preparation/family-plan/step/7?from=emergency-kit",
  className,
}: EmergencyKitCtaProps) {
  return (
    <Link
      href={href}
      className={cn(
        PREPARATION_CTA_LIFT_CLASS,
        "inline-flex items-center justify-center gap-2 border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[1.2px] text-emerald-50 hover:bg-emerald-500/25",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
        className,
      )}
    >
      <BookOpen className="size-3.5" aria-hidden />
      Guardar en tu plan
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  )
}
