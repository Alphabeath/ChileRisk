"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const COLLAPSE_CHAR_THRESHOLD = 200

interface DisasterDescriptionBlockProps {
  text: string
}

export function DisasterDescriptionBlock({ text }: DisasterDescriptionBlockProps) {
  const [expanded, setExpanded] = useState(false)
  const canExpand = text.length > COLLAPSE_CHAR_THRESHOLD

  return (
    <div className="border border-white/15 bg-black/35 px-4 py-3.5 backdrop-blur-sm sm:px-5 sm:py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/55">
        Acerca de este riesgo
      </p>
      <p
        className={cn(
          "mt-2 text-sm leading-relaxed text-white/85 sm:text-[15px] sm:leading-relaxed",
          canExpand && !expanded && "line-clamp-4",
        )}
      >
        {text}
      </p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
          aria-expanded={expanded}
        >
          {expanded ? "Ver menos" : "Leer más"}
          <ChevronDown
            className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
        </button>
      )}
    </div>
  )
}