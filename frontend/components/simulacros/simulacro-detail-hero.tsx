import type { CSSProperties } from "react"

import {
  DRILL_TYPE_COLORS,
  DRILL_TYPE_LABELS,
  formatSimulacroDate,
} from "@/lib/simulacros"
import type { SimulacroDetail } from "@/lib/types"
import { cn } from "@/lib/utils"

export function SimulacroDetailHero({ item }: { item: SimulacroDetail }) {
  const date = formatSimulacroDate(item.drill_date)
  const colors = DRILL_TYPE_COLORS[item.drill_type]
  const typeLabel = DRILL_TYPE_LABELS[item.drill_type]
  const title = item.headline?.trim() || item.title
  const style = {
    "--drill-accent": colors.accent,
    "--drill-ink": colors.ink,
  } as CSSProperties

  return (
    <header
      style={style}
      className="relative flex min-h-[28rem] flex-col justify-between overflow-hidden border-b border-border lg:max-h-[48rem]"
    >
      {item.hero_image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.hero_image_url}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 size-full object-cover object-center"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/25 to-black/55"
          />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundColor: colors.accent }}
        />
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-4 pb-6 pt-20 sm:px-6 sm:pb-8 sm:pt-24 lg:px-8">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[10px] font-semibold tracking-[1.2px] text-white/80 uppercase">
            Simulacro · SENAPRED
          </p>
          <div className="h-1 w-16 bg-[var(--drill-accent)]" />
          <div className="flex flex-wrap items-end gap-4 sm:gap-6">
            <div
              className={cn(
                "flex min-w-[5.5rem] flex-col items-start justify-center px-3 py-3",
                item.hero_image_url
                  ? "bg-[var(--drill-accent)] text-[var(--drill-ink)]"
                  : "bg-black/25 text-white",
              )}
            >
              <span className="font-mono text-[10px] font-semibold tracking-[1.2px] uppercase opacity-90">
                {date.weekday}
              </span>
              <span className="font-mono text-4xl leading-none font-bold tabular-nums tracking-tight">
                {date.day}
              </span>
              <span className="font-mono text-[10px] font-semibold tracking-[1.2px] uppercase opacity-90">
                {date.month} {date.year}
              </span>
              {item.schedule_note?.trim() ? (
                <span className="mt-1 font-mono text-[10px] font-bold tracking-[1.2px] uppercase">
                  {item.schedule_note}
                </span>
              ) : null}
            </div>
            <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight text-balance text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.45)] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 border-t border-white/20 pt-4">
          <span
            className="px-2 py-1 font-mono text-[10px] font-semibold tracking-[1.2px] uppercase"
            style={{ backgroundColor: colors.accent, color: colors.ink }}
          >
            {typeLabel}
          </span>
          {item.region_name ? (
            <span className="bg-white/10 px-2 py-1 font-mono text-[10px] font-semibold tracking-[1.2px] text-white/85 uppercase">
              {item.region_name}
            </span>
          ) : null}
          {item.mensaje_sae ? (
            <span className="border border-white/40 bg-white/10 px-2 py-1 font-mono text-[10px] font-semibold tracking-[1.2px] text-white uppercase">
              SAE
            </span>
          ) : null}
        </div>
      </div>
    </header>
  )
}
