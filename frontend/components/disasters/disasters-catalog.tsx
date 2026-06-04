"use client"

import { useMemo, useState } from "react"
import { desastres } from "@/data/disasters"
import {
  categoryLabels,
  getDesastreCategory,
  type DesastreCategory,
} from "@/lib/disasters-visual"
import { DesastreCard } from "@/components/disasters/desastre-card"
import { GLASS_DIVIDER, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

const categories = Object.entries(categoryLabels) as [DesastreCategory, string][]

export function DisastersCatalog() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<DesastreCategory | "all">("all")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return desastres.filter((d) => {
      if (category !== "all" && getDesastreCategory(d.slug) !== category) {
        return false
      }
      if (!q) return true
      return (
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.slug.replace(/-/g, " ").includes(q)
      )
    })
  }, [query, category])

  return (
    <div className="space-y-4">
      <div className={cn(GLASS_PANEL_CLASS, "p-4 space-y-4")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar emergencia..."
              className="h-9 w-full border border-white/10 bg-white/[0.04] pl-10 pr-10 text-sm text-white/90 outline-none transition-colors placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
              aria-label="Buscar desastres"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
                aria-label="Limpiar búsqueda"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          <p className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-white/45">
            <span className="text-white/75">{filtered.length}</span> / {desastres.length}
          </p>
        </div>

        <div
          className={cn("flex flex-wrap gap-1 border-t pt-4", GLASS_DIVIDER)}
          role="tablist"
          aria-label="Filtrar por categoría"
        >
          <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
            Todas
          </FilterChip>
          {categories.map(([key, label]) => (
            <FilterChip
              key={key}
              active={category === key}
              onClick={() => setCategory(key)}
            >
              {label}
            </FilterChip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className={cn(
            GLASS_PANEL_CLASS,
            "border-dashed px-6 py-14 text-center",
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/80">
            Sin resultados
          </p>
          <p className="mt-2 text-[12px] text-white/45">
            Prueba otro término o quita el filtro.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("")
              setCategory("all")
            }}
            className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-white/55 underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
          >
            Ver todas
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((desastre) => (
            <DesastreCard key={desastre.slug} desastre={desastre} />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[1.2px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
        active
          ? "border-white/20 bg-white/15 text-white"
          : "border-transparent text-white/50 hover:bg-white/[0.06] hover:text-white/75",
      )}
    >
      {children}
    </button>
  )
}