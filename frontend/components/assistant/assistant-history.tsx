"use client"

import { Plus as PlusIcon, X as XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import type { ChatThreadSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

type AssistantHistoryProps = {
  threads: ChatThreadSummary[]
  activeThreadId: string | null
  onSelect: (threadId: string) => void
  onNew: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

function ThreadList({
  threads,
  activeThreadId,
  onSelect,
  onNew,
}: Pick<AssistantHistoryProps, "threads" | "activeThreadId" | "onSelect" | "onNew">) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <p className={cn(PREPARATION_EYEBROW_CLASS, "text-white/45")}>Historial</p>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onNew}
          className="text-white/60 hover:text-white"
        >
          <PlusIcon data-icon="inline-start" />
          Nueva
        </Button>
      </div>
      <div className="mt-2.5 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {threads.length === 0 ? (
          <p className="px-1 py-2 text-xs text-white/40">Sin conversaciones aún.</p>
        ) : (
          threads.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={cn(
                "w-full border-l-2 px-2.5 py-2 text-left text-xs leading-snug transition-colors",
                activeThreadId === t.id
                  ? "border-l-[var(--primary-chile)] bg-[var(--primary-chile)]/20 text-white"
                  : "border-l-transparent text-white/55 hover:bg-white/[0.06] hover:text-white/90",
              )}
            >
              <span className="line-clamp-2">{t.title}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export function AssistantHistorySidebar({
  className,
  ...listProps
}: AssistantHistoryProps) {
  return (
    <aside
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "hidden min-h-0 flex-col overflow-hidden p-3 lg:flex",
        "bg-black/35 supports-[backdrop-filter]:bg-black/25",
        className,
      )}
    >
      <ThreadList {...listProps} />
    </aside>
  )
}

/** In-container history drawer (mobile). Must sit inside a `relative` chat shell. */
export function AssistantHistoryDrawer({
  open,
  onOpenChange,
  ...listProps
}: AssistantHistoryProps) {
  if (!open) return null

  return (
    <div className="absolute inset-0 z-30 lg:hidden" role="dialog" aria-modal aria-label="Historial">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Cerrar historial"
        onClick={() => onOpenChange?.(false)}
      />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 flex w-[min(100%,16.5rem)] flex-col border-r border-white/10",
          "bg-neutral-950/90 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl",
          "animate-in fade-in-0 slide-in-from-left-4 duration-200",
        )}
      >
        <div className="mb-2 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange?.(false)}
            className="text-white/55 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <XIcon />
          </Button>
        </div>
        <ThreadList {...listProps} />
      </aside>
    </div>
  )
}
