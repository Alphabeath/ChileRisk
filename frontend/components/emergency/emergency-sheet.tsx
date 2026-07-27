"use client"

import {
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

export type EmergencySheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

/**
 * Bottom sheet for Modo Emergencia — fixed portal, no vaul.
 * Guarantees visible opaque panel above navbar / emergency frame.
 */
export function EmergencySheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: EmergencySheetProps) {
  const isClient = useIsClient()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onOpenChange])

  if (!isClient || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[90]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-sheet-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        aria-label="Cerrar panel"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 flex max-h-[88vh] min-h-[42vh] flex-col border-t border-white/15 bg-neutral-950 shadow-2xl shadow-black/60",
          className,
        )}
      >
        <div
          className="mx-auto mt-3 h-1 w-12 shrink-0 bg-white/30"
          aria-hidden
        />
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 pb-3 pt-1">
          <div className="min-w-0 flex-1">
            <h2
              id="emergency-sheet-title"
              className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/85"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-[11px] leading-snug text-white/50">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="shrink-0 border border-white/15 p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {children}
        </div>
        {footer ? (
          <div className="mt-auto flex shrink-0 flex-col gap-2 border-t border-white/10 p-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
