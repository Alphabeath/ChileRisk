import Link from "next/link"
import { ArrowUpRight, BookOpen } from "lucide-react"
import { GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
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
      <Link
        href="/preparation/emergency-kit"
        className={cn(
          GLASS_PANEL_CLASS,
          GLASS_MICA_INTERACTIVE_CLASS,
          "group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/55",
          className,
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center border border-blue-400/30 bg-blue-500/10">
          <BookOpen className="size-4 text-blue-200" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-blue-200/90">
            Guía educativa
          </p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-white/85">
            ¿Necesitas orientación? Lee la guía de Kit de emergencia →
          </p>
        </div>
        <ArrowUpRight
          className="size-4 shrink-0 text-white/45 transition-all duration-200 group-hover:-translate-y-[2px] group-hover:translate-x-[2px] group-hover:text-white"
          aria-hidden
        />
      </Link>
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
