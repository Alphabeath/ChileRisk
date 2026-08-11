---
name: ChileRisk
description: Monitoreo ciudadano multi-amenaza para Chile, serio, claro y orientado a datos.
colors:
  chile-blue: "#0032A0"
  chile-red: "#DA291C"
  alert-preventiva: "#4ade80"
  alert-amarilla: "#fbbf24"
  alert-roja: "#DA291C"
  alert-naranja: "#fb923c"
  alert-informativa: "#a78bfa"
  unavailable: "#3a3f4a"
  map-preventiva: "#16a34a"
  map-amarilla: "#ca8a04"
  map-naranja: "#ea580c"
  map-informativa: "#7c3aed"
  map-unavailable: "#64748b"
  air-bueno: "#2eae00"
  air-regular: "#f5d400"
  air-alerta: "#ff9800"
  air-preemergencia: "#e65100"
  air-emergencia: "#c62828"
  seismic-medium: "#cc9e23"
  seismic-high: "#e07020"
typography:
  body:
    fontFamily: "Inter, sans-serif"
  data:
    fontFamily: "Geist Mono, monospace"
rounded:
  none: "0px"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  "2xl": "1.125rem"
  "3xl": "1.375rem"
  "4xl": "1.625rem"
  full: "9999px"
---

# Design System: ChileRisk

## Overview

ChileRisk is a citizen risk monitor for Chile: serious, clear, data-forward, and optimized for fast operational scanning. The landing may be expressive; monitor and citizen workflows remain precise and predictable.

This is the portable Impeccable/agent view. The detailed implementation contract is [docs/UI-GUIDELINES.md](docs/UI-GUIDELINES.md); do not invent or override rules absent there.

## Colors

Use semantic CSS variables for application chrome and the documented domain palettes for risk, unified alerts, air quality, seismic accents, and MapLibre. Chile blue and red are institutional accents, not decorative defaults; arbitrary purple gradients are forbidden.

## Typography

Inter is the canonical UI/body face. Geist Mono is reserved for stats, codes, tabular values, compact metadata, and map-panel titles. Operational labels are short, compact, often uppercase, and intentionally tracked.

## Layout

The landing is full-bleed and expressive. Monitor surfaces use the full viewport with responsive map overlays; citizen content uses the fixed navbar clearance and documented page shells. Reuse existing layout constants instead of inventing offsets.

## Elevation & Depth

Elevated map/citizen surfaces use theme-aware semantic shells and the existing Mica specular treatment. Mica is decoration, never severity. Do not restore dark-only glass or hard-coded translucent black shells.

## Shapes

Operational chrome, map overlays, buttons, popups, and navbar surfaces are sharp by default. Pills are limited to counts and compact dates; MapLibre attribution may use the documented medium radius.

## Components

Reuse shadcn/Base UI primitives, `frontend/lib/surface.ts`, `frontend/lib/citizen-layout.ts`, and existing map components. Apply variants for behavior and tokens; use `className` only for layout-specific adjustments.

## Do's and Don'ts

- Do preserve semantic tokens, dual-theme behavior, real data, reduced-motion handling, and the documented alert/risk meanings.
- Do read [docs/UI-GUIDELINES.md](docs/UI-GUIDELINES.md) before building or restyling UI.
- Don't invent palettes, severity semantics, rounded card systems, or a second Mica/glass implementation.
- Don't replace Inter merely because Impeccable's generic anti-pattern guidance disfavors overused fonts; ChileRisk explicitly commits to it.
