"use client"

import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import {
  type SimulacrosRange,
  type SimulacrosView,
  SimulacrosCalendarSection,
  SimulacrosFooter,
  SimulacrosImportanceAccordion,
  SimulacrosPageHero,
} from "@/components/preparation/simulacros"
import { queryKeys } from "@/lib/queries"
import {
  useNextSimulacro,
  useSimulacros,
} from "@/hooks/use-simulacros"
import type { DrillType, SimulacrosParams } from "@/lib/types"

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
  const upcomingTotal = upcomingData?.total ?? 0

  const { data, isLoading, isFetching, error, refetch } = useSimulacros(state.params)

  const items = data?.items ?? []
  const lastSync = data?.next_synced_at

  function handleRetry() {
    refetch()
    queryClient.invalidateQueries({ queryKey: queryKeys.nextSimulacro() })
    queryClient.invalidateQueries({
      queryKey: queryKeys.simulacros({ upcoming_only: true } as Record<string, unknown>),
    })
  }

  function handleTypeToggle(type: DrillType) {
    setState((s) => {
      const nextType = s.params.type === type ? undefined : type
      return {
        ...s,
        params: { ...s.params, type: nextType },
      }
    })
  }

  function handleTypeClear() {
    setState((s) => ({ ...s, params: { ...s.params, type: undefined } }))
  }

  const selectedType = state.params.type

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-16 sm:px-6 lg:px-8">
        <SimulacrosPageHero next={nextDrill} upcomingTotal={upcomingTotal} />

        <SimulacrosImportanceAccordion />

        <SimulacrosCalendarSection
          view={state.view}
          range={state.range}
          params={state.params}
          items={items}
          now={now}
          isLoading={isLoading}
          error={error}
          isFetching={isFetching}
          selectedType={selectedType}
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
                type: undefined,
                upcoming_only: view === "upcoming" ? true : undefined,
                past_only: view === "past" ? true : undefined,
                from: undefined,
                to: undefined,
              },
            }))
          }
          onTypeToggle={handleTypeToggle}
          onTypeClear={handleTypeClear}
          onRetry={handleRetry}
        />

        <SimulacrosFooter
          lastSync={lastSync}
          isFetching={isFetching}
          onRefresh={handleRetry}
        />
      </div>
    </div>
  )
}
