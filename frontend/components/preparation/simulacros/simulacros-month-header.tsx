import { cn } from "@/lib/utils"

interface SimulacrosMonthHeaderProps {
  monthLabel: string
  year: number
  count: number
  accent?: string
  chipBorder?: string
  showRail?: boolean
}

export function SimulacrosMonthHeader({
  monthLabel,
  year,
  count,
  accent,
  chipBorder,
  showRail = false,
}: SimulacrosMonthHeaderProps) {
  return (
    <header className="relative flex items-center gap-3">
      {showRail ? (
        <span
          className={cn(
            "absolute -left-[1.625rem] top-1/2 z-10 size-3 -translate-y-1/2 border-2 bg-[var(--background)] sm:-left-[2.125rem] sm:size-3.5",
            accent ? cn(chipBorder, accent) : "border-white/30",
          )}
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          "flex flex-1 items-end justify-between gap-3 border border-white/10 bg-white/[0.03] px-3 py-2 sm:px-4",
          chipBorder && "border-l-[3px]",
          chipBorder,
        )}
      >
        <div className="flex items-baseline gap-2">
          <h3
            className={cn(
              "text-[12px] font-semibold uppercase tracking-[1.3px] text-white",
              accent,
            )}
          >
            {monthLabel}
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/45">
            {year}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/55">
          <span className="text-white/85">{count}</span>{" "}
          {count === 1 ? "ejercicio" : "ejercicios"}
        </span>
      </div>
    </header>
  )
}