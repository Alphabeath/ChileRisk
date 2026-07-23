import Link from "next/link"
import { ArrowUpRight, BookOpen } from "lucide-react"

import { PreparationContextBanner } from "@/components/preparation/preparation-context-banner"
import { cn } from "@/lib/utils"

interface EmergencyKitGuideLinkProps {
  className?: string
  variant?: "inline" | "banner"
}

export function EmergencyKitGuideLink({
  className,
  variant = "inline",
}: EmergencyKitGuideLinkProps) {
  if (variant === "banner") {
    return (
      <PreparationContextBanner
        className={className}
        eyebrow="Guía educativa"
        body="¿Necesitas orientación? Lee la guía de Kit de emergencia."
        href="/preparation/emergency-kit"
        cta="Abrir guía"
        icon={BookOpen}
        accent="blue"
      />
    )
  }

  return (
    <Link
      href="/preparation/emergency-kit"
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] text-blue-200/90 transition-colors hover:text-blue-100",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
        className,
      )}
    >
      <BookOpen className="size-3.5" aria-hidden />
      Ver guía de Kit de emergencia
      <ArrowUpRight className="size-3" aria-hidden />
    </Link>
  )
}
