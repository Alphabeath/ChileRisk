import { ExternalLink, RefreshCw } from "lucide-react"

import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

interface SimulacrosFooterProps {
  lastSync: string | null | undefined
  isFetching?: boolean
  onRefresh?: () => void
}

export function SimulacrosFooter({ lastSync, isFetching, onRefresh }: SimulacrosFooterProps) {
  return (
    <aside
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center border border-white/15 bg-white/[0.04] text-white/65"
          aria-hidden
        >
          <RefreshCw className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75">
            Referencia oficial
          </p>
          <p className="mt-0.5 truncate text-[12px] text-white/55">
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
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isFetching}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 border border-white/10 bg-white/[0.04] px-3 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/70 transition-colors",
              "hover:border-white/25 hover:bg-white/[0.10] hover:text-white",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
              "disabled:opacity-50",
            )}
          >
            <RefreshCw
              className={cn("size-3", isFetching && "animate-spin")}
              aria-hidden
            />
            Actualizar
          </button>
        ) : null}
        <a
          href="https://senapred.cl/simulacros/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 border border-white/15 bg-white/[0.06] px-3 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/80 transition-colors",
            "hover:border-white/30 hover:bg-white/[0.12] hover:text-white",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
          )}
        >
          Ver en SENAPRED
          <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
    </aside>
  )
}
