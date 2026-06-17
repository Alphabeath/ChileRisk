"use client"

import { useEffect, useState } from "react"

import { simulacroCountdown } from "@/lib/simulacros-format"
import { cn } from "@/lib/utils"

interface SimulacrosCountdownProps {
  drillDate: string | null | undefined
  className?: string
}

export function SimulacrosCountdown({ drillDate, className }: SimulacrosCountdownProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!drillDate) return
    const tick = () => setNow(Date.now())
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [drillDate])

  if (!drillDate) {
    return (
      <p className={cn("font-mono text-2xl font-semibold tabular-nums text-white/40", className)}>
        —
      </p>
    )
  }

  const c = simulacroCountdown(drillDate, now)

  if (c.past) {
    return (
      <p className={cn("text-[11px] font-semibold uppercase tracking-wider text-white/55", className)}>
        Simulacro en curso o finalizado
      </p>
    )
  }

  const showSeconds = c.days === 0

  return (
    <div
      className={cn("flex items-baseline gap-3 sm:gap-4", className)}
      role="timer"
      aria-live="polite"
      aria-label={
        showSeconds
          ? `Cuenta regresiva: ${c.hours} horas, ${c.minutes} minutos, ${c.seconds} segundos`
          : `Cuenta regresiva: ${c.days} días, ${c.hours} horas, ${c.minutes} minutos`
      }
    >
      {c.days > 0 ? <CountdownUnit value={c.days} label="días" accent /> : null}
      <CountdownUnit value={c.hours} label="hrs" accent={c.days === 0} />
      <CountdownUnit value={c.minutes} label="min" />
      {showSeconds ? <CountdownUnit value={c.seconds} label="seg" /> : null}
    </div>
  )
}

function CountdownUnit({
  value,
  label,
  accent,
}: {
  value: number
  label: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={cn(
          "font-mono text-2xl font-bold tabular-nums leading-none sm:text-3xl",
          accent ? "text-amber-200" : "text-white",
        )}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[1.1px] text-white/45">
        {label}
      </span>
    </div>
  )
}