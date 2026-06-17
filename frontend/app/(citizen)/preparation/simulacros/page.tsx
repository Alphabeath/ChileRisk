"use client"

import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowLeft, RefreshCw } from "lucide-react"

import {
  type SimulacrosRange,
  type SimulacrosView,
  SimulacrosCalendarSection,
  SimulacrosEducation,
  SimulacrosFooter,
  SimulacrosPageHero,
} from "@/components/preparation/simulacros"
import { queryKeys } from "@/lib/queries"
import {
  useNextSimulacro,
  useSimulacros,
} from "@/hooks/use-simulacros"
import { cn } from "@/lib/utils"
import type { SimulacrosParams } from "@/lib/types"

interface FilterState {
  view: SimulacrosView
  range: SimulacrosRange
  params: SimulacrosParams
}

const PAGE_SIZE = 50

export default function SimulacrosPage() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<FilterState>({
    view: "upcoming",
    range: "all",
    params: {
      upcoming_only: true,
      limit: PAGE_SIZE,
    },
  })
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const { data: next } = useNextSimulacro()
  const { data: upcomingData } = useSimulacros({
    upcoming_only: true,
    limit: 1,
  })

  const nextDrill = next ?? upcomingData?.items?.[0] ?? null

  const { data, isLoading, isFetching, error, refetch } = useSimulacros(state.params)

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const lastSync = data?.next_synced_at
  const upcomingTotal = upcomingData?.total ?? 0

  function handleRetry() {
    refetch()
    queryClient.invalidateQueries({ queryKey: queryKeys.nextSimulacro() })
    queryClient.invalidateQueries({
      queryKey: queryKeys.simulacros({ upcoming_only: true } as Record<string, unknown>),
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/preparation"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[1.2px] text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Preparación
          </Link>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isFetching}
            aria-label="Actualizar calendario"
            className="inline-flex items-center gap-1.5 border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30 disabled:opacity-50"
          >
            <RefreshCw
              className={cn("size-3.5", isFetching && "animate-spin")}
              aria-hidden
            />
            Actualizar
          </button>
        </div>

        <SimulacrosPageHero next={nextDrill} upcomingTotal={upcomingTotal} />

        <SimulacrosEducation />

        <SimulacrosCalendarSection
          view={state.view}
          range={state.range}
          params={state.params}
          total={total}
          items={items}
          now={now}
          isLoading={isLoading}
          error={error}
          isFetching={isFetching}
          onParamsChange={(nextParams) =>
            setState((s) => ({ ...s, params: nextParams }))
          }
          onRangeChange={(range) =>
            setState((s) => ({ ...s, range }))
          }
          onViewChange={(view) =>
            setState((s) => ({
              ...s,
              view,
              range: "all",
              params: {
                ...s.params,
                upcoming_only: view === "upcoming" ? true : undefined,
                past_only: view === "past" ? true : undefined,
                from: undefined,
                to: undefined,
              },
            }))
          }
          onRetry={handleRetry}
        />

        <SimulacrosFooter lastSync={lastSync} />
      </div>
    </div>
  )
}