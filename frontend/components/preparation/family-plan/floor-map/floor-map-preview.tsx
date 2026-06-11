"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { FloorMapRenderer } from "@/components/preparation/family-plan/floor-map/floor-map-renderer"
import { CANVAS_H, CANVAS_W } from "@/lib/floor-map-constants"
import type { FloorMap } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FloorMapPreviewProps {
  floorMap: FloorMap
  className?: string
  /** @deprecated Use `variant` instead. */
  maxWidth?: number
  /** compact = 320px embed; document = full width up to canvas size (PDF/resumen). */
  variant?: "compact" | "document"
}

export function FloorMapPreview({
  floorMap,
  className,
  maxWidth,
  variant = "compact",
}: FloorMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [renderWidth, setRenderWidth] = useState(
    variant === "document" ? CANVAS_W : (maxWidth ?? 320),
  )

  const measure = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (variant === "document") {
      const available = el.clientWidth || CANVAS_W
      setRenderWidth(Math.max(available, 320))
      return
    }
    setRenderWidth(maxWidth ?? 320)
  }, [maxWidth, variant])

  useEffect(() => {
    measure()
    const el = containerRef.current
    if (!el || variant !== "document") return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure, variant])

  useEffect(() => {
    if (variant !== "document") return
    window.addEventListener("beforeprint", measure)
    window.addEventListener("afterprint", measure)
    return () => {
      window.removeEventListener("beforeprint", measure)
      window.removeEventListener("afterprint", measure)
    }
  }, [measure, variant])

  const isEmpty =
    floorMap.rooms.length === 0 &&
    floorMap.markers.length === 0 &&
    floorMap.zones.length === 0 &&
    floorMap.routes.length === 0

  if (isEmpty) {
    return (
      <p className="text-[11px] text-white/45 italic">
        Sin plano configurado.
      </p>
    )
  }

  const scale = renderWidth / CANVAS_W

  return (
    <div
      ref={containerRef}
      className={cn(
        "floor-map-preview relative overflow-hidden border border-white/15 bg-black/40",
        variant === "document" && "floor-map-preview--document w-full max-w-[640px]",
        className,
      )}
      style={{ width: variant === "document" ? "100%" : renderWidth, height: CANVAS_H * scale }}
    >
      <FloorMapRenderer
        floorMap={floorMap}
        mode="readonly"
        scale={scale}
        canvasId="floor-canvas-preview"
      />
    </div>
  )
}