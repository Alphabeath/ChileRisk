"use client"

import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

export function SimulacrosSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden>
      {[0, 1].map((g) => (
        <section key={g} className="flex flex-col gap-3">
          <div className="h-3 w-32 animate-pulse rounded-sm bg-white/[0.08]" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={cn(GLASS_PANEL_CLASS, GLASS_MICA_INTERACTIVE_CLASS, "flex gap-3 px-3 py-3 sm:gap-4 sm:px-4")}
              >
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-40">
                  <div className="h-14 w-20 animate-pulse bg-white/[0.06] sm:h-16 sm:w-full" />
                  <div className="h-3 w-24 animate-pulse rounded-sm bg-white/[0.06] sm:mt-1" />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-3 w-3/4 animate-pulse rounded-sm bg-white/[0.08]" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded-sm bg-white/[0.06]" />
                  <div className="h-2.5 w-2/3 animate-pulse rounded-sm bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
