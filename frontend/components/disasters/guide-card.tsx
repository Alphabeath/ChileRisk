import { ArrowUpRight, ShieldAlert } from "lucide-react"
import Link from "next/link"

import { GUIDE_ICONS, type GuideSummary } from "@/lib/senapred-guides"
import { cn } from "@/lib/utils"

const FOCUS_RING_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

/**
 * Catálogo card para una guía SENAPRED. Server Component: la animación de
 * entrada la pone el padre con `Reveal` (scroll-reveal.tsx).
 */
export function GuideCard({
  guide,
  variant,
  priority = false,
}: {
  guide: GuideSummary
  variant: "featured" | "standard" | "inclusive"
  /** Solo la primera featured (sismos): span 2 cols en md+ */
  priority?: boolean
}) {
  // Lookup directo en el record module-level: referencia estable (el rule
  // react-hooks/static-components marca cualquier call que devuelva un
  // componente, aunque la fuente sea estática).
  const Icon = GUIDE_ICONS[guide.slug] ?? ShieldAlert

  if (variant === "featured") {
    return (
      <Link
        href={`/desastres/${guide.slug}`}
        className={cn(
          "group relative block h-full min-h-[16rem] overflow-hidden border border-border bg-card sm:min-h-[18rem]",
          FOCUS_RING_CLASS,
          priority && "md:col-span-2 md:min-h-[22rem]",
        )}
      >
        {guide.cardImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={guide.cardImage}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
            <Icon className="size-10" aria-hidden />
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 sm:p-6">
          <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {guide.title}
          </h3>
          <p className="line-clamp-2 text-sm text-white/80">{guide.blurb}</p>
          <p className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[1.2px] text-white/70 transition-colors group-hover:text-white">
            Abrir guía
          </p>
        </div>
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--secondary-chile)] opacity-80"
        />
      </Link>
    )
  }

  return (
    <Link
      href={`/desastres/${guide.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden border border-border bg-card transition-colors duration-150 hover:border-primary",
        variant === "inclusive" &&
          "border-l-2 border-l-[var(--primary-chile)]",
        FOCUS_RING_CLASS,
      )}
    >
      {guide.cardImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={guide.cardImage}
          alt=""
          className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <span className="flex aspect-[16/10] w-full items-center justify-center bg-muted text-muted-foreground group-hover:text-foreground">
          <Icon className="size-6" aria-hidden />
        </span>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-semibold text-foreground">{guide.title}</h3>
        <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {guide.blurb}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {variant === "inclusive" ? (
            <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[var(--primary-chile)]">
              Inclusiva
            </span>
          ) : (
            <Icon className="size-4 text-muted-foreground" aria-hidden />
          )}
          <ArrowUpRight
            className="size-4 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  )
}
