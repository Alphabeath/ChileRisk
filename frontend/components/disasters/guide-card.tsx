import type { CSSProperties } from "react"
import { ArrowUpRight, ShieldAlert } from "lucide-react"
import Link from "next/link"

import { getDisasterAccent } from "@/lib/disaster-visuals"
import {
  formatGuideTitle,
  GUIDE_ICONS,
  type GuideSummary,
} from "@/lib/senapred-guides"
import { cn } from "@/lib/utils"

const FOCUS_RING_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

type GuideCardStyle = CSSProperties & {
  "--card-accent": string
  "--card-ink": string
}

/**
 * Catálogo card para una guía SENAPRED. Server Component: la animación de
 * entrada la pone el padre con `Reveal`. Campo de color por amenaza (como las
 * entradas de agenda de simulacros), sin rail border-left.
 */
export function GuideCard({
  guide,
  featured = false,
}: {
  guide: GuideSummary
  featured?: boolean
}) {
  const Icon = GUIDE_ICONS[guide.slug] ?? ShieldAlert
  const accent = getDisasterAccent(guide.slug)
  const style = {
    "--card-accent": accent,
    "--card-ink": "#ffffff",
  } as GuideCardStyle

  if (featured) {
    return (
      <Link
        href={`/desastres/${guide.slug}`}
        style={style}
        className={cn(
          "group flex h-full w-full flex-col overflow-hidden border border-black/10 bg-[var(--card-accent)] text-[var(--card-ink)] shadow-[0_14px_32px_color-mix(in_oklch,var(--card-accent)_35%,transparent)] transition-[transform,box-shadow] duration-150",
          "hover:shadow-[0_18px_40px_color-mix(in_oklch,var(--card-accent)_45%,transparent)]",
          FOCUS_RING_CLASS,
        )}
      >
        <span className="relative aspect-[16/9] overflow-hidden bg-black/10">
          {guide.cardImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={guide.cardImage}
              alt=""
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex size-full items-center justify-center opacity-90">
              <Icon className="size-10" aria-hidden />
            </span>
          )}
        </span>

        <span className="flex flex-1 flex-col items-center gap-3 px-4 py-5 text-center sm:px-5">
          <h3 className="text-xl font-extrabold tracking-tight text-balance sm:text-2xl">
            {formatGuideTitle(guide.title)}
          </h3>
          {guide.blurb ? (
            <p className="line-clamp-3 flex-1 text-sm leading-6 opacity-90">
              {guide.blurb}
            </p>
          ) : null}
        </span>

        <span className="mt-auto flex items-center justify-center px-4 pb-5 sm:px-5">
          <span className="inline-flex min-h-11 items-center gap-2 border border-[var(--card-ink)] bg-[var(--card-ink)] px-4 py-2 text-xs font-semibold tracking-widest text-[var(--card-accent)] uppercase transition-colors group-hover:bg-transparent group-hover:text-[var(--card-ink)]">
            Ver guía
            <ArrowUpRight className="size-3.5" aria-hidden />
          </span>
        </span>
      </Link>
    )
  }

  return (
    <Link
      href={`/desastres/${guide.slug}`}
      style={style}
      className={cn(
        "group grid h-full w-full overflow-hidden border border-border bg-card text-card-foreground shadow-[0_10px_28px_color-mix(in_oklch,var(--foreground)_10%,transparent)] transition-[border-color,box-shadow] duration-150",
        "hover:border-[color-mix(in_oklch,var(--card-accent)_55%,var(--border))] hover:shadow-[0_14px_32px_color-mix(in_oklch,var(--card-accent)_22%,transparent)]",
        "sm:grid-cols-[7.5rem_minmax(0,1fr)_7.5rem]",
        FOCUS_RING_CLASS,
      )}
    >
      <span className="relative flex aspect-[5/3] items-center justify-center overflow-hidden bg-[var(--card-accent)] sm:aspect-auto">
        {guide.cardImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={guide.cardImage}
            alt=""
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] sm:absolute sm:inset-2 sm:size-[calc(100%-1rem)]"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[var(--card-ink)]">
            <Icon className="size-8" aria-hidden />
          </span>
        )}
      </span>

      <span className="flex min-w-0 flex-col justify-center border-t border-border px-4 py-4 sm:border-t-0 sm:border-l sm:px-5 sm:py-4">
        <h3 className="text-lg font-bold tracking-tight text-balance text-foreground sm:text-xl">
          {formatGuideTitle(guide.title)}
        </h3>
      </span>

      <span className="flex items-center justify-center border-t border-border bg-[color-mix(in_oklch,var(--card-accent)_10%,var(--card))] px-4 py-3 sm:border-t-0 sm:border-l">
        <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[var(--card-accent)] px-3 py-2 text-xs font-semibold tracking-widest text-[var(--card-ink)] uppercase transition-opacity group-hover:opacity-95">
          Guía
          <ArrowUpRight className="size-3.5" aria-hidden />
        </span>
      </span>
    </Link>
  )
}
