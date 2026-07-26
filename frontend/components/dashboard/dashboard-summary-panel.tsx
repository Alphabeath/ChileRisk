"use client"

import { Sparkles } from "lucide-react"

import { DashboardSection } from "@/components/dashboard/dashboard-section"
import { useDashboardSummary } from "@/hooks"

export function DashboardSummaryPanel({ className }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useDashboardSummary()

  return (
    <DashboardSection
      eyebrow="Briefing"
      title="Resumen del día"
      icon={Sparkles}
      iconClassName="text-violet-300/80"
      href="/assistant"
      moreLabel="Asistente →"
      className={className}
    >
      {isLoading ? (
        <div className="flex flex-col gap-2" aria-label="Cargando resumen">
          <div className="h-3.5 w-full animate-pulse bg-white/[0.06]" />
          <div className="h-3.5 w-5/6 animate-pulse bg-white/[0.06]" />
          <div className="h-3.5 w-2/3 animate-pulse bg-white/[0.06]" />
        </div>
      ) : isError || !data ? (
        <p className="text-sm text-white/70">
          Resumen IA no disponible
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-3 border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white/80 transition-colors hover:bg-white/20"
          >
            Reintentar
          </button>
        </p>
      ) : (
        <div>
          <p className="text-[12.5px] leading-snug text-white/80">{data.summary}</p>
          <p className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/45">
            <Sparkles className="size-3 shrink-0" aria-hidden />
            {new Date(data.generated_at).toLocaleTimeString()} · IA
            {data.comuna_name ? ` · ${data.comuna_name}` : ""}
          </p>
        </div>
      )}
    </DashboardSection>
  )
}
