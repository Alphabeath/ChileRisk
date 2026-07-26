"use client"

import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ClipboardList } from "lucide-react"

import {
  type SimulacrosRange,
  type SimulacrosView,
  SimulacrosCalendarSection,
  SimulacrosFooter,
  SimulacrosImportanceAccordion,
  SimulacrosNextDrillPanel,
  SimulacrosPageHero,
  SimulacrosTypesSection,
} from "@/components/preparation/simulacros"
import { PreparationContextBanner } from "@/components/preparation/preparation-context-banner"
import { queryKeys } from "@/lib/queries"
import {
  PREPARATION_PAGE_INNER_CLASS,
  PREPARATION_PAGE_SHELL_CLASS,
} from "@/lib/preparation-ui"
import {
  useNextSimulacro,
  useSimulacros,
} from "@/hooks/use-simulacros"
import type { DrillType, SimulacrosParams } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FilterState {
  view: SimulacrosView
  range: SimulacrosRange
  params: SimulacrosParams
}

const PAGE_SIZE = 50

export default function DrillsPage() {
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
    <div className={PREPARATION_PAGE_SHELL_CLASS}>
      <div className={cn(PREPARATION_PAGE_INNER_CLASS, "pb-8")}>
        <SimulacrosPageHero upcomingTotal={upcomingTotal} />

        <SimulacrosNextDrillPanel next={nextDrill} />

        <PreparationContextBanner
          eyebrow="Registra en tu plan"
          body="Anota la fecha del próximo simulacro en el paso 8 del Plan Familia Preparada."
          href="/preparation/family-plan/step/8?from=drills"
          cta="Ir a mi plan"
          icon={ClipboardList}
          accent="rose"
        />

        <SimulacrosImportanceAccordion />

        <SimulacrosTypesSection />

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
