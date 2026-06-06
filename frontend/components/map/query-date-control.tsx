"use client"

import { useState } from "react"
import { es } from "react-day-picker/locale"
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useDraggablePanel, useQueryDate } from "@/hooks"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MAP_PANEL_DRAG_HANDLE_CLASS, MAP_PANEL_HEADER_LABEL_CLASS, MAP_PANEL_SHELL_CLASS } from "@/lib/map-panel-styles"
import {
  addDaysIso,
  formatQueryDateLabel,
  minQueryDateIso,
  parseIsoDate,
  todayIsoDate,
  formatIsoDate,
} from "@/lib/query-date"
import { cn } from "@/lib/utils"

export function QueryDateControl({ flow = false }: { flow?: boolean }) {
  const { selectedDate, setSelectedDate } = useQueryDate()
  const [expanded, setExpanded] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const today = todayIsoDate()
  const minDate = minQueryDateIso(today)
  const minDay = parseIsoDate(minDate)
  const maxDay = parseIsoDate(today)
  const selectedDay = parseIsoDate(selectedDate)

  const { ref, handleProps, style, isDragging } = useDraggablePanel({
    id: "query-date-panel",
    corner: flow ? undefined : "top-left",
    cornerInset: 16,
    flow,
  })

  const canAdvance = selectedDate < today
  const canRetreat = selectedDate > minDate
  const dateLabel = formatQueryDateLabel(selectedDate, today)

  const handleToggleExpanded = () => {
    setExpanded((v) => {
      if (v) setCalendarOpen(false)
      return !v
    })
  }

  return (
    <div
      ref={ref}
      className={MAP_PANEL_SHELL_CLASS}
      style={style}
      role="group"
      aria-label="Fecha de consulta"
    >
      <div
        className={cn(
          "flex items-stretch",
          expanded && "border-b border-white/10"
        )}
      >
        <div
          {...handleProps}
          className={MAP_PANEL_DRAG_HANDLE_CLASS}
          style={{ touchAction: "none" }}
          data-dragging={isDragging || undefined}
          aria-label="Arrastrar control de fecha"
        >
          <CalendarIcon className="size-3.5 shrink-0 text-white/55" aria-hidden />
          <span className={MAP_PANEL_HEADER_LABEL_CLASS}>Fecha</span>
          <span className="ml-auto font-mono text-[10px] tabular-nums text-white/50">
            {dateLabel}
          </span>
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            handleToggleExpanded()
          }}
          aria-expanded={expanded}
          aria-controls="query-date-panel-body"
          aria-label={expanded ? "Colapsar selector de fecha" : "Expandir selector de fecha"}
          className="flex shrink-0 items-center border-l border-white/10 px-2.5 text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              !expanded && "-rotate-90"
            )}
            aria-hidden
          />
        </button>
      </div>

      <div
        id="query-date-panel-body"
        className={cn(
          "flex flex-col gap-2 px-3 py-2.5",
          !expanded && "hidden"
        )}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full justify-start gap-2 border-white/15 bg-white/5 font-mono text-[11px] font-normal tracking-normal text-white/90 hover:bg-white/10 hover:text-white"
            >
              <CalendarIcon data-icon="inline-start" className="text-white/55" />
              {selectedDate.split("-").reverse().join("/")}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="z-[60] w-auto border-white/10 bg-popover p-0"
            onPointerDown={(e) => e.stopPropagation()}
          >
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

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => setSelectedDate(addDaysIso(selectedDate, 1))}
            className="flex size-7 shrink-0 items-center justify-center rounded-none text-white/55 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label="Avanzar un día"
          >
            <ChevronLeft className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(today)}
            className={cn(
              "flex-1 rounded-none px-2 py-1 text-[10px] font-medium transition-colors hover:bg-white/10",
              selectedDate === today && "bg-white/10 text-white"
            )}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(addDaysIso(today, -1))}
            className={cn(
              "flex-1 rounded-none px-2 py-1 text-[10px] font-medium transition-colors hover:bg-white/10",
              selectedDate === addDaysIso(today, -1) && "bg-white/10 text-white"
            )}
          >
            Ayer
          </button>
          <button
            type="button"
            disabled={!canRetreat}
            onClick={() => setSelectedDate(addDaysIso(selectedDate, -1))}
            className="flex size-7 shrink-0 items-center justify-center rounded-none text-white/55 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label="Retroceder un día"
          >
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}