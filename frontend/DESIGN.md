---
name: ChileRisk
description: Monitoreo ciudadano multi-amenaza para Chile, serio, claro y orientado a datos.
colors:
  chile-blue: "#0032A0"
  chile-red: "#DA291C"
  senapred-blue: "#0167b7"
  senapred-cyan: "#00a6d0"
  senapred-teal: "#0fb1af"
  senapred-volcanic: "#b33a4a"
  senapred-landslide: "#6b4a2e"
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
  display:
    fontFamily: "Inter, sans-serif"
    fontWeight: 800
  body:
    fontFamily: "Inter, sans-serif"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    letterSpacing: "1.2px"
  data:
    fontFamily: "Geist Mono, monospace"
rounded:
  none: "0px"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  full: "9999px"
---

# Design System: ChileRisk

## Overview

ChileRisk is a citizen risk monitor for Chile: serious, clear, data-forward, and optimized for fast operational scanning. Official SENAPRED pages are close translations of institutional material, not marketing.

Four visual families share tokens but not composition. The landing is full-bleed and expressive. Monitor and evacuation are sharp ops chrome with theme-aware Mica. Editorial SENAPRED pages use catalog heroes, official color fields, and institutional blue closes. Hub and form routes stay semantic: `/inicio` uses a day/night hero with a centered wordmark, brand-color doors, a full-color live pulse, and an account section with benefits; auth and `/cuenta` stay in `max-w-md`/`max-w-lg` columns.

This is the portable Impeccable/agent view. The detailed implementation contract is [docs/UI-GUIDELINES.md](docs/UI-GUIDELINES.md); do not invent or override rules absent there.

## Colors

Semantic CSS variables own application chrome. Domain palettes own risk, unified alerts, air quality, seismic accents, and MapLibre. Editorial SENAPRED hexes own official fields. Chile blue (`#0032A0`) and red (`#DA291C`) are institutional accents, not decorative defaults.

**The Separate Palettes Rule.** Alert greens/ambers/reds never paint a SENAPRED tile, step, or scenario band. `#0167b7` is SENAPRED editorial blue (eyebrows, rails, tabs); it is not `--primary-chile`. Informativa purple is a severity color, not a theme.

## Typography

Inter is the canonical UI, display, and body face. Geist Mono is reserved for stats, codes, tabular values, compact metadata, map-panel titles, editorial eyebrows, and hero meta.

Operational labels are short, uppercase, and tracked (`10px` / `1.2px`). Editorial display is extra-bold and tight (`4xl`–`8xl`). Section titles on hub pages are extra-bold `xl`/`2xl`. Form titles are `2xl` semibold. Reading measure is `max-w-4xl` or about `62ch`.

**The Two Voices Rule.** Ops chrome whispers in uppercase mono. Editorial pages speak in large Inter headlines over official color or photography. Do not put catalog display type on a login form, or 10px ops labels on a 32rem hero title.

## Layout

Choose a family first. Landing is a full viewport over the globe. Map routes fill `h-dvh` under a 48px navbar. Editorial and `/inicio` scroll in `ScrollRoot` with `pt-12` and an inner `max-w-6xl` measure. Auth is a centered `max-w-md` column without navbar; `/cuenta` and stubs use `max-w-lg`.

Catalog heroes are `min-h-[32rem]` / `lg:max-h-[56rem]` with local artwork and a scrim, except the kit hero (same height, no scrim, light ice-blue / dark navy fallback). `/inicio` uses that height over `hero.png` / `hero noche.png` with a soft theme wash and a centered ChileRisk title — lockup and account CTAs live in the close, not on the art. Reuse existing layout constants; do not invent offsets.

## Elevation & Depth

Ops overlays use a theme-aware blurred semantic shell plus Mica specular. Mica is decoration, never severity, and is omitted on landing, editorial SENAPRED, auth, `/inicio`, and `/cuenta`. Do not restore dark-only glass or hard-coded translucent black shells.

Institutional closes and `/inicio` headers sit on flat `--primary-chile`. Color-field tiles carry a soft accent-tinted shadow; they stay sharp-cornered.

## Shapes

Operational chrome, map overlays, buttons, popups, navbar, and editorial tiles are sharp (`0px`). Pills are limited to counts and compact dates (`9999px`). MapLibre attribution may use the medium radius. shadcn still exposes `sm`/`md`/`lg` for primitives that need them; do not promote `2xl`+ cards as the product look.

## Components

Reuse shadcn/Base UI primitives, `frontend/lib/surface.ts`, `frontend/lib/citizen-layout.ts`, and existing map and editorial components. Apply variants for behavior and tokens; use `className` only for layout-specific adjustments.

- **Button:** sharp, uppercase, wide tracking. Landing and institutional-close CTAs may invert to white on Chile blue and drop uppercase.
- **Navbar:** fixed 48px Mica bar; brand to `/inicio`; Kit is its own item; only Desastres is a section match. No navbar on landing or auth.
- **Catalog hero / kit hero / poster brand header:** three header species — do not swap them across families.
- **Color-field tile:** full official hex + documented ink on SENAPRED pages. Hub doors use only Chile blue and card.
- **Hub doors / pulse instrument:** 1px grid of brand fields; live pulse is a two-cell instrument with a huge observed count, not a divided list.
- **Institutional close:** Chile-blue band and invert-on-hover white CTA. Omit on `/preparacion`; kit uses transparent footer art plus a card CTA.
- **Auth field:** 10px ops label and 44px input. Map panels use Mica shells and 3px alert rails, not editorial color fields.
- **Map bottom drawer:** portable Ops/mapa primitive below `lg`: a full-width safe-area rail opens a touch-first tabbed drawer for secondary controls; `lg+` keeps the 320px operational columns. Reuse `MapBottomDrawer` rather than cloning route-specific FABs or Sheets.

## Do's and Don'ts

- Do preserve semantic tokens, dual-theme behavior, real data, reduced-motion handling, and the documented alert/risk meanings.
- Do read [docs/UI-GUIDELINES.md](docs/UI-GUIDELINES.md) before building or restyling UI.
- Do pick a visual family and reuse its primitives instead of cloning another page.
- Don't invent palettes, severity semantics, rounded card systems, or a second Mica/glass implementation.
- Don't paint editorial SENAPRED fields with alert tokens, or clone the SENAPRED catalog hero onto `/inicio`, `/cuenta`, or auth.
- Don't replace Inter merely because Impeccable's generic anti-pattern guidance disfavors overused fonts; ChileRisk explicitly commits to it.

*Last updated: 2026-08-17*
