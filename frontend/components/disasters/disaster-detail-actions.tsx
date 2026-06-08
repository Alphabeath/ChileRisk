import Link from "next/link"
import { GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { ExternalLink, Map, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

interface DisasterDetailActionsProps {
  title: string
}

export function DisasterDetailActions({ title }: DisasterDetailActionsProps) {
  return (
    <div
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
      )}
    >
      <p className="text-[12px] text-white/60">
        <span className="font-medium text-white/85">Actúa ahora</span> — consulta el
        monitor de riesgo, el mapa de evacuación por tsunami o el material oficial para{" "}
        {title.toLowerCase()}.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/evacuation"
          className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.08] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
        >
          <Map className="size-3.5" aria-hidden />
          Mapa de evacuación
        </Link>
        <Link
          href="/monitor"
          className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.08] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
        >
          <Monitor className="size-3.5" aria-hidden />
          Ver en el monitor
        </Link>
        <Link
          href="https://www.senapred.cl/recomendaciones/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
        >
          SENAPRED
          <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  )
}