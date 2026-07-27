"use client"

import {
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { Check, ChevronsUpDown, MapPin, Search } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useComunaCatalog } from "@/hooks"
import {
  filterComunas,
  findComunaByCode,
} from "@/lib/comuna-catalog"
import { cn } from "@/lib/utils"

const TRIGGER_CLASS =
  "flex h-10 w-full items-center gap-2 border border-white/10 bg-white/[0.04] px-3 text-left text-sm text-white/90 outline-none transition-colors hover:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50"

export type ComunaComboboxProps = {
  value: number | null
  onChange: (code: number | null) => void
  disabled?: boolean
  id?: string
  className?: string
  placeholder?: string
}

export function ComunaCombobox({
  value,
  onChange,
  disabled = false,
  id,
  className,
  placeholder = "Buscar comuna…",
}: ComunaComboboxProps) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)

  const { data: catalog = [], isLoading, isError } = useComunaCatalog()

  const selected = useMemo(
    () => findComunaByCode(catalog, value),
    [catalog, value],
  )

  const options = useMemo(
    () => filterComunas(query, catalog),
    [query, catalog],
  )

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setQuery("")
      setActiveIndex(0)
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  function selectCode(code: number) {
    onChange(code)
    setOpen(false)
  }

  function onListKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, Math.max(options.length - 1, 0)))
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
      return
    }
    if (e.key === "Enter") {
      e.preventDefault()
      const hit = options[activeIndex]
      if (hit) selectCode(hit.code)
      return
    }
    if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
    }
  }

  const triggerLabel = selected
    ? selected.name
    : isLoading
      ? "Cargando comunas…"
      : placeholder

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled || isLoading}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          className={cn(TRIGGER_CLASS, className)}
        >
          <MapPin className="size-3.5 shrink-0 text-cyan-300/80" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            {triggerLabel}
            {selected ? (
              <span className="text-white/45"> · {selected.region}</span>
            ) : null}
          </span>
          <ChevronsUpDown
            className="size-3.5 shrink-0 text-white/45"
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn(
          "w-[var(--radix-popover-trigger-width)] gap-0 border border-white/10 bg-black/90 p-0 text-white shadow-2xl shadow-black/50 backdrop-blur-xl",
          "rounded-none ring-0",
        )}
        onKeyDown={onListKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <Search className="size-3.5 shrink-0 text-white/45" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            placeholder="Nombre o región…"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-activedescendant={
              options[activeIndex]
                ? `${listId}-opt-${options[activeIndex].code}`
                : undefined
            }
            className="h-8 w-full bg-transparent text-sm text-white/90 outline-none placeholder:text-white/40"
          />
        </div>

        {isError ? (
          <p className="px-3 py-4 text-xs text-red-300/90">
            No se pudo cargar el listado de comunas.
          </p>
        ) : (
          <ul
            id={listId}
            role="listbox"
            aria-label="Comunas de Chile"
            className="max-h-64 overflow-y-auto overscroll-contain py-1"
          >
            {options.length === 0 ? (
              <li className="px-3 py-4 text-xs text-white/45">
                Sin resultados para “{query}”.
              </li>
            ) : (
              options.map((entry, index) => {
                const active = index === activeIndex
                const isSelected = entry.code === value
                return (
                  <li key={entry.code} role="presentation">
                    <button
                      type="button"
                      id={`${listId}-opt-${entry.code}`}
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "flex w-full items-start gap-2 px-3 py-2 text-left transition-colors",
                        active
                          ? "bg-white/[0.1] text-white"
                          : "text-white/80 hover:bg-white/[0.06]",
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectCode(entry.code)}
                    >
                      <Check
                        className={cn(
                          "mt-0.5 size-3.5 shrink-0",
                          isSelected ? "opacity-100 text-cyan-300" : "opacity-0",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {entry.name}
                        </span>
                        <span className="block truncate text-[11px] text-white/45">
                          {entry.region}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
