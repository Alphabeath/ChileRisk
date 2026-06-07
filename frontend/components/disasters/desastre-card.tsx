"use client"

import Link from "next/link"
import type { Desastre } from "@/data/disasters"
import { categoryLabels, getDesastreCategory } from "@/lib/disasters-visual"
import { GLASS_DIVIDER, GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DesastreCardProps {
  desastre: Desastre
}

export function DesastreCard({ desastre }: DesastreCardProps) {
  const Icon = desastre.icon
  const category = getDesastreCategory(desastre.slug)
  const stepCount =
    desastre.antes.length + desastre.durante.length + desastre.despues.length

  return (
    <Link
      href={`/disasters/${desastre.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
    >
      <article
        className={cn(
          GLASS_PANEL_CLASS,
          GLASS_MICA_INTERACTIVE_CLASS,
          "flex h-full flex-col transition-all duration-200 hover:bg-black/60 hover:-translate-y-[2px]",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between border-b px-4 py-3",
            GLASS_DIVIDER,
            "bg-gradient-to-br",
            desastre.color,
          )}
        >
          <div className="flex size-10 items-center justify-center border border-white/15 bg-black/40 backdrop-blur-sm transition-colors group-hover:border-white/25 group-hover:bg-black/50">
            <Icon className="size-5 text-white/85 transition-transform group-hover:scale-[1.2]" aria-hidden />
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-[1.1px] text-white/50">
            {categoryLabels[category]}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/90 transition-colors duration-200 group-hover:text-white">
              {desastre.title}
            </h3>
            <ArrowUpRight
              className="size-4 shrink-0 text-white/45 transition-all duration-200 group-hover:-translate-y-[2px] group-hover:translate-x-[2px] group-hover:text-white group-hover:scale-[1.25]"
              aria-hidden
            />
          </div>
          <p className="line-clamp-3 flex-1 text-[12px] leading-snug text-white/55">
            {desastre.description}
          </p>
          <div className="mt-auto flex items-center justify-between pt-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
              Antes · Durante · Después
            </p>
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">
              {stepCount} pasos
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}