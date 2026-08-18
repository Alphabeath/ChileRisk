import { ChevronRight } from "lucide-react"
import Link from "next/link"

import {
  INICIO_DIRECTORY_HEADING,
  listInicioDestinations,
  type InicioDestination,
} from "@/lib/inicio-content"
import { cn } from "@/lib/utils"

const INNER_WRAPPER_CLASS = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"

const FOCUS_RING_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"

export function InicioDirectory() {
  const destinations = listInicioDestinations()
  const primary = destinations.find((item) => item.href === "/monitor")
  const rest = destinations.filter((item) => item.href !== "/monitor")

  return (
    <section
      aria-labelledby="inicio-directory-title"
      className="border-b border-border bg-background"
    >
      <div className={cn(INNER_WRAPPER_CLASS, "pt-12 pb-16 sm:pt-16 sm:pb-20")}>
        <div className="flex items-baseline justify-between gap-4 pb-6">
          <h2
            id="inicio-directory-title"
            className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
          >
            {INICIO_DIRECTORY_HEADING}
          </h2>
          <p className="font-mono text-[10px] tracking-[1.2px] text-muted-foreground uppercase">
            {destinations.length} destinos
          </p>
        </div>

        <ul className="grid gap-2 md:grid-cols-6">
          {primary ? (
            <li className="md:col-span-6">
              <DestinationDoor destination={primary} featured />
            </li>
          ) : null}
          {rest.map((destination, index) => (
            <li
              key={destination.href}
              className={index < 3 ? "md:col-span-2" : "md:col-span-3"}
            >
              <DestinationDoor destination={destination} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function DestinationDoor({
  destination,
  featured = false,
}: {
  destination: InicioDestination
  featured?: boolean
}) {
  const Icon = destination.icon

  return (
    <Link
      href={destination.href}
      className={cn(
        "group relative flex h-full min-h-44 flex-col justify-between gap-8 p-6 transition-colors duration-150 sm:min-h-52 sm:p-7",
        FOCUS_RING_CLASS,
        featured
          ? "bg-[var(--primary-chile)] text-white hover:bg-[color-mix(in_oklch,var(--primary-chile),black_8%)]"
          : "border border-foreground/12 bg-muted text-card-foreground hover:bg-muted/80 dark:border-border dark:bg-card dark:hover:bg-muted",
      )}
    >
      {featured ? null : (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-[var(--primary-chile)]"
        />
      )}
      <span className="flex items-center justify-between gap-4">
        <Icon
          className={cn(
            "size-5 shrink-0",
            featured ? "text-white/80" : "text-muted-foreground",
          )}
          aria-hidden
        />
        <ChevronRight
          className={cn(
            "size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5",
            featured ? "text-white/80" : "text-muted-foreground",
          )}
          aria-hidden
        />
      </span>
      <span className="flex flex-col gap-2">
        <span
          className={cn(
            "text-3xl font-extrabold tracking-tight text-balance sm:text-4xl",
            featured ? "text-white" : "text-foreground",
          )}
        >
          {destination.label}
        </span>
        <span
          className={cn(
            "max-w-[62ch] text-sm leading-relaxed",
            featured ? "text-white/80" : "text-muted-foreground",
          )}
        >
          {destination.description}
        </span>
      </span>
    </Link>
  )
}
