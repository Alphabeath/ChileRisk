"use client"

import Link from "next/link"
import { Backpack, MessageCircle, Monitor } from "lucide-react"

import {
  HeroFooterCell,
  HeroFooterIcon,
} from "@/components/layout/citizen-page-hero"
import { GLASS_DIVIDER } from "@/lib/glass-panel"
import { PREPARATION_HERO_SHELL_CLASS } from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

const homeShortcuts = [
  {
    href: "/monitor",
    label: "Monitor",
    subtitle: "Mapa en vivo",
    icon: Monitor,
    accent: "text-cyan-300",
  },
  {
    href: "/preparation",
    label: "Preparación",
    subtitle: "Plan y kit",
    icon: Backpack,
    accent: "text-emerald-300",
  },
  {
    href: "/assistant",
    label: "Asistente",
    subtitle: "Preguntas",
    icon: MessageCircle,
    accent: "text-sky-300",
  },
] as const

/** Compact home identity strip — no IA summary (lives in DashboardSummaryPanel). */
export function DashboardPageHero() {
  return (
    <header className={PREPARATION_HERO_SHELL_CLASS}>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--primary-chile)]/55 via-slate-950/70 to-cyan-950/50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
        aria-hidden
      />

      <div className="relative flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:p-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            ChileRisk hoy
          </h1>
        </div>
        <p className="max-w-md text-xs leading-snug text-white/55 sm:text-right sm:text-[13px]">
          Riesgo local, alertas y tu plan — en un vistazo.
        </p>
      </div>

      <div className={cn("relative border-t", GLASS_DIVIDER)}>
        <div className="grid grid-cols-3 divide-x divide-white/10">
          {homeShortcuts.map(({ href, label, subtitle, icon: Icon, accent }) => (
            <Link key={href} href={href} className="block">
              <HeroFooterCell className="px-2 py-3 sm:px-4 sm:py-3.5">
                <HeroFooterIcon className="size-8 sm:size-9">
                  <Icon
                    className={cn("size-3.5 sm:size-4", accent)}
                    aria-hidden
                  />
                </HeroFooterIcon>
                <div className="min-w-0 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white sm:text-[11px]">
                    {label}
                  </p>
                  <p className="hidden text-[10px] text-white/55 sm:block">
                    {subtitle}
                  </p>
                </div>
              </HeroFooterCell>
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
