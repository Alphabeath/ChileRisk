"use client"

import { Trash2 } from "lucide-react"

import { CANVAS_H, CANVAS_W } from "@/lib/floor-map-constants"
import type { FloorMapPoint, FloorMapRoute } from "@/lib/types"

interface FloorMapRoutesLayerProps {
  routes: FloorMapRoute[]
  routeDraft?: FloorMapPoint[]
  mode: "edit" | "readonly"
  onRemoveRoute?: (id: string) => void
}

function segmentLength(a: FloorMapPoint, b: FloorMapPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function routeMidpoint(points: FloorMapPoint[]): FloorMapPoint {
  if (points.length === 0) return { x: 0, y: 0 }
  if (points.length === 1) return points[0]

  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += segmentLength(points[i - 1], points[i])
  }
  if (total === 0) return points[0]

  let remaining = total / 2
  for (let i = 1; i < points.length; i++) {
    const seg = segmentLength(points[i - 1], points[i])
    if (remaining <= seg) {
      const t = seg === 0 ? 0 : remaining / seg
      return {
        x: points[i - 1].x + t * (points[i].x - points[i - 1].x),
        y: points[i - 1].y + t * (points[i].y - points[i - 1].y),
      }
    }
    remaining -= seg
  }

  return points[points.length - 1]
}

function RouteArrowDefs() {
  return (
    <defs>
      <marker
        id="floor-map-route-arrow"
        viewBox="0 0 10 10"
        refX="8.5"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path d="M0,1.5 L8.5,5 L0,8.5 Z" fill="#3b82f6" />
      </marker>
      <marker
        id="floor-map-route-arrow-draft"
        viewBox="0 0 10 10"
        refX="8.5"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path d="M0,1.5 L8.5,5 L0,8.5 Z" fill="#60a5fa" />
      </marker>
    </defs>
  )
}

export function FloorMapRoutesLayer({
  routes,
  routeDraft = [],
  mode,
  onRemoveRoute,
}: FloorMapRoutesLayerProps) {
  return (
    <div className="absolute inset-0 z-[12]">
      <svg
        className="pointer-events-none absolute inset-0 size-full"
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <RouteArrowDefs />
        {routes.map((route) =>
          route.points.length >= 2 ? (
            <polyline
              key={route.id}
              points={route.points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="4 3"
              markerEnd="url(#floor-map-route-arrow)"
            />
          ) : null,
        )}
        {routeDraft.length > 0 ? (
          <>
            {routeDraft.length >= 2 ? (
              <polyline
                points={routeDraft.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#60a5fa"
                strokeWidth={2}
                markerEnd="url(#floor-map-route-arrow-draft)"
              />
            ) : null}
            {routeDraft.map((p, i) => {
              const isLast = i === routeDraft.length - 1
              if (isLast && routeDraft.length >= 2) return null
              return (
                <circle
                  key={`draft-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill="#60a5fa"
                  stroke="#1d4ed8"
                  strokeWidth={1}
                />
              )
            })}
          </>
        ) : null}
      </svg>

      {mode === "edit" && onRemoveRoute
        ? routes.map((route, index) => {
            if (route.points.length < 2) return null
            const mid = routeMidpoint(route.points)
            return (
              <button
                key={`${route.id}-delete`}
                type="button"
                data-floor-map-item
                data-delete-btn
                className="absolute z-[16] flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-blue-400/55 bg-blue-950/95 text-white/75 shadow-sm transition-colors hover:border-red-400/70 hover:bg-red-950/95 hover:text-red-300"
                style={{ left: mid.x, top: mid.y }}
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveRoute(route.id)
                }}
                aria-label={`Eliminar ruta ${index + 1}`}
              >
                <Trash2 className="size-2.5" />
              </button>
            )
          })
        : null}
    </div>
  )
}