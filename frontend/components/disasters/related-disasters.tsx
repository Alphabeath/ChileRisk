"use client"

import Link from "next/link"
import { desastres, type Desastre } from "@/data/disasters"
import { DISASTERS_NAV_LINK_CLASS, GLASS_DIVIDER, GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { ArrowUpRight, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

interface RelatedDisastersProps {
  currentSlug: string
}

function seededShuffle(slug: string): Desastre[] {
  const filtered = desastres.filter((d) => d.slug !== slug)
  // Simple hash from slug for deterministic order
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0
  }
  // Fisher-Yates with seeded PRNG
  for (let i = filtered.length - 1; i > 0; i--) {
    hash = (hash * 16807 + 1) % 2147483647
    const j = Math.abs(hash) % (i + 1)
    ;[filtered[i], filtered[j]] = [filtered[j], filtered[i]]
  }
  return filtered.slice(0, 4)
}

export function RelatedDisasters({ currentSlug }: RelatedDisastersProps) {
  const others = seededShuffle(currentSlug)

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/90">
            Otras emergencias
          </p>
          <p className="mt-0.5 text-[12px] text-white/55">
            Continúa informándote sobre otros riesgos.
          </p>
        </div>
        <Link href="/disasters" className={cn(DISASTERS_NAV_LINK_CLASS)}>
          <LayoutGrid className="size-4 shrink-0" aria-hidden />
          Ver todas
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {others.map((d) => (
          <RelatedDisasterLink key={d.slug} desastre={d} />
        ))}
      </ul>
    </section>
  )
}

function RelatedDisasterLink({ desastre }: { desastre: Desastre }) {
  const Icon = desastre.icon
  const stepCount =
    desastre.antes.length + desastre.durante.length + desastre.despues.length

  return (
    <li>
      <Link
        href={`/disasters/${desastre.slug}`}
        className={cn(
          GLASS_PANEL_CLASS,
          GLASS_MICA_INTERACTIVE_CLASS,
          "group flex flex-col overflow-hidden transition-all duration-200 hover:bg-black/60 hover:-translate-y-[2px]",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 border-b px-3 py-2.5",
            GLASS_DIVIDER,
            "bg-gradient-to-br",
            desastre.color,
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center border border-white/15 bg-black/40 backdrop-blur-sm transition-colors group-hover:border-white/25 group-hover:bg-black/50">
            <Icon className="size-4 text-white/90 transition-transform group-hover:scale-[1.2]" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-white/90 transition-colors duration-200 group-hover:text-white">
              {desastre.title}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">
              {stepCount} pasos
            </p>
          </div>
          <ArrowUpRight
            className="size-3.5 shrink-0 text-white/40 transition-all duration-200 group-hover:-translate-y-[2px] group-hover:translate-x-[2px] group-hover:text-white group-hover:scale-[1.25]"
            aria-hidden
          />
        </div>
      </Link>
    </li>
  )
}