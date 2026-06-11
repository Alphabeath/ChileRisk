import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"
import { DISASTERS_NAV_LINK_CLASS } from "@/lib/glass-panel"
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
        DISASTERS_NAV_LINK_CLASS,
        "inline-flex items-center gap-2",
        className,
      )}
    >
      <BookOpen className="size-4" aria-hidden />
      Guardar en tu plan
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  )
}
