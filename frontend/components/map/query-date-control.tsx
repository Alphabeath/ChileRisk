"use client"

import { useState } from "react"
import { es } from "react-day-picker/locale"
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useQueryDate } from "@/hooks/use-query-date"
import {
  MAP_PANEL_TITLE_CLASS,
  MAP_PANEL_WIDTH_CLASS,
} from "@/lib/citizen-layout"
import {
  addDaysIso,
  formatIsoDate,
  formatQueryDateLabel,
  minQueryDateIso,
  parseIsoDate,
  todayIsoDate,
} from "@/lib/query-date"
import { SURFACE_PANEL_SHELL_CLASS } from "@/lib/surface"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

function QueryDateBody({
  selectedDate,
  setSelectedDate,
  today,
  minDate,
  canAdvance,
  canRetreat,
  calendarOpen,
  setCalendarOpen,
}: {
  selectedDate: string
  setSelectedDate: (iso: string) => void
  today: string
  minDate: string
  canAdvance: boolean
  canRetreat: boolean
  calendarOpen: boolean
  setCalendarOpen: (open: boolean) => void
}) {
  const minDay = parseIsoDate(minDate)
  const maxDay = parseIsoDate(today)
  const selectedDay = parseIsoDate(selectedDate)
  const display = selectedDate.split("-").reverse().join("/")

  return (
    <div id="query-date-panel-body" className="flex flex-col gap-2 px-2.5 py-2.5">
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-11 w-full justify-start gap-2 font-mono text-[11px] font-semibold tracking-normal normal-case tabular-nums lg:h-8"
            />
          }
        >
          <CalendarIcon className="size-3.5 text-muted-foreground" aria-hidden />
          {display}
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={6} className="p-0">
          <Calendar
            mode="single"
            locale={es}
            selected={selectedDay}
            onSelect={(day) => {
              if (!day) return
              setSelectedDate(formatIsoDate(day))
              setCalendarOpen(false)
            }}
            disabled={{ before: minDay, after: maxDay }}
            defaultMonth={selectedDay}
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={!canAdvance}
          onClick={() => setSelectedDate(addDaysIso(selectedDate, 1))}
          className="flex size-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30 lg:size-6"
          aria-label="Avanzar un día"
        >
          <ChevronLeft className="size-3" aria-hidden />
        </button>
        <Button
          type="button"
          variant={selectedDate === today ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setSelectedDate(today)}
          className="h-11 flex-1 px-2 text-[10px] tracking-[1px] lg:h-6"
        >
          Hoy
        </Button>
        <Button
          type="button"
          variant={
            selectedDate === addDaysIso(today, -1) ? "secondary" : "ghost"
          }
          size="xs"
          onClick={() => setSelectedDate(addDaysIso(today, -1))}
          className="h-11 flex-1 px-2 text-[10px] tracking-[1px] lg:h-6"
        >
          Ayer
        </Button>
        <button
          type="button"
          disabled={!canRetreat}
          onClick={() => setSelectedDate(addDaysIso(selectedDate, -1))}
          className="flex size-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30 lg:size-6"
          aria-label="Retroceder un día"
        >
          <ChevronRight className="size-3" aria-hidden />
        </button>
      </div>
    </div>
  )
}

function useQueryDateModel() {
  const { selectedDate, setSelectedDate } = useQueryDate()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const today = todayIsoDate()
  const minDate = minQueryDateIso(today)
  return {
    selectedDate,
    setSelectedDate,
    calendarOpen,
    setCalendarOpen,
    today,
    minDate,
    canAdvance: selectedDate < today,
    canRetreat: selectedDate > minDate,
  }
}

function QueryDateControlEmbedded() {
  const model = useQueryDateModel()

  return (
    <div
      className="flex w-full flex-col"
      role="group"
      aria-label="Fecha de consulta"
    >
      <QueryDateBody {...model} />
    </div>
  )
}

function QueryDateControlOverlay() {
  const model = useQueryDateModel()
  const expanded = useUIStore((s) => s.dateExpanded)
  const setExpanded = useUIStore((s) => s.setDateExpanded)
  const dateLabel = formatQueryDateLabel(model.selectedDate, model.today)

  return (
    <div
      className={cn(
        SURFACE_PANEL_SHELL_CLASS,
        "flex w-full flex-col",
        MAP_PANEL_WIDTH_CLASS,
      )}
      role="group"
      aria-label="Fecha de consulta"
    >
      <div className="relative z-10 flex w-full items-center justify-between gap-2 border-b border-border px-2.5 py-1">
        <p className={cn("min-w-0 truncate", MAP_PANEL_TITLE_CLASS)}>
          Fecha
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="inline-flex h-6 shrink-0 items-center justify-center rounded-full bg-primary px-2 font-mono text-[11px] font-bold tabular-nums text-primary-foreground">
            {dateLabel}
          </span>
          <button
            type="button"
            onClick={() => {
              setExpanded(!expanded)
              if (expanded) model.setCalendarOpen(false)
            }}
            aria-expanded={expanded}
            aria-controls="query-date-panel-body"
            aria-label={
              expanded
                ? "Colapsar selector de fecha"
                : "Expandir selector de fecha"
            }
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30 lg:size-7 lg:min-h-0 lg:min-w-0"
          >
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                !expanded && "-rotate-90",
              )}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="relative z-10">
          <QueryDateBody {...model} />
        </div>
      ) : null}
    </div>
  )
}

export function QueryDateControl({
  embedded = false,
}: {
  embedded?: boolean
}) {
  if (embedded) return <QueryDateControlEmbedded />
  return <QueryDateControlOverlay />
}
