import { ExternalLink } from "lucide-react"

import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

interface SimulacrosFooterProps {
  lastSync: string | null | undefined
}

export function SimulacrosFooter({ lastSync }: SimulacrosFooterProps) {
  return (
    <aside
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75">
          Referencia oficial
        </p>
        <p className="mt-1 text-[12px] text-white/45">
          Calendario público de simulacros de evacuación.
          {lastSync ? (
            <>
              {" "}
              Última sincronización:{" "}
              <time dateTime={lastSync} className="font-mono text-white/65">
                {new Date(lastSync).toLocaleString("es-CL", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </time>
            </>
          ) : null}
        </p>
      </div>
      <a
        href="https://senapred.cl/simulacros/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-2 border border-white/10 bg-white/[0.06] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/75 transition-colors hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
      >
        Ver en SENAPRED
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </aside>
  )
}