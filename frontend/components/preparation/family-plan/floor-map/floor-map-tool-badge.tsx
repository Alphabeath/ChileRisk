"use client"

import { createElement } from "react"

import { toolHint, toolIcon, toolLabel, type FloorMapTool } from "@/lib/floor-map-tools"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

interface FloorMapToolBadgeProps {
  activeTool: FloorMapTool
  className?: string
}

export function FloorMapToolBadge({ activeTool, className }: FloorMapToolBadgeProps) {
  const isSelect = activeTool.mode === "select"
  const label = isSelect ? "Seleccionar" : toolLabel(activeTool)

  return (
    <div
      className={cn(
        GLASS_PANEL_CLASS,
        "pointer-events-none flex max-w-[min(100%,28rem)] items-center gap-2 px-3 py-1.5",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center border",
          isSelect
            ? "border-white/20 bg-white/10 text-white"
            : "border-white/15 bg-white/[0.06] text-white/85",
        )}
      >
        {createElement(toolIcon(activeTool), {
          className: "size-3.5",
          "aria-hidden": true,
        })}
      </span>
      <p className="min-w-0 truncate text-[10px] leading-snug text-white/45">
        <span className="font-medium text-white/75">{label}</span>
        {" · "}
        {toolHint(activeTool)}
      </p>
    </div>
  )
}