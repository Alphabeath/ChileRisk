<!-- BEGIN:nextjs-agent-rules -->
# Next.js 16 — read this before writing code

This is **not** the Next.js you know. App Router, params, routing, and several APIs differ from 14/15. Before touching any `app/`, `next.config.ts`, or build-related code, read the relevant guide under `node_modules/next/dist/docs/`. Heed deprecation notices — old patterns may silently no-op or throw.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — ChileRisk Frontend (Next.js 16 + React 19)

Single source of truth for any coding agent working inside `frontend/`.

---

## Scope

- All work happens **exclusively inside `frontend/`**.
- Never touch `backend/`, `TrueRisk/`, `misc/`, or root-level files. Cross-area changes require explicit user approval.
- The root `AGENTS.md` and `docs/FRONTEND.md` are sister docs — when a question is about routing/scope, read the root; when it's about a public component, read `docs/FRONTEND.md`.
- **UX/UI (layouts, pages, components):** read **`docs/DESIGN.md`** in this folder before writing or restyling UI. It defines glass surfaces, typography, colors, and citizen-page patterns.

---

## What this app is

A citizen-facing risk monitor. The home page is a hero with a rotating globe (`(root) /`), then authenticated citizen users land in the `(citizen)` route group with three pages:

| Route        | Page                     | Purpose |
|--------------|--------------------------|---------|
| `/`          | `app/page.tsx`           | Landing with rotating earth + CTA |
| `/dashboard` | `app/(citizen)/dashboard`| National risk summary + recent seismic events (verification view) |
| `/map`       | `app/(citizen)/map`      | Full-screen interactive MapLibre map of Chile |
| `/account`   | `app/(citizen)/account`  | Placeholder (account page — not built yet) |
| `/disasters` | `app/(citizen)/disasters` | Disaster guides catalog + `/disasters/[tipo]` detail |
| `/api/health`| `app/api/health/route.ts`| Docker healthcheck endpoint |

**Important**: the dashboard is a **debug/verification view** showing the raw backend response. It is *not* the production citizen UI. Real citizens should land on `/` or `/map`. The `(citizen)` group will grow.

---

## Tech stack (pinned, real)

From `package.json` — these are what's actually installed, not aspirational.

| Layer            | Library                              | Why |
|------------------|--------------------------------------|-----|
| Framework        | `next@16.2.6` (App Router only)      | Server Components default; `output: "standalone"` |
| UI runtime       | `react@19.2.4` + `react-dom@19.2.4`  | — |
| Language         | `typescript@5`                       | strict mode (`tsconfig.json`) |
| Styling          | `tailwindcss@4` + `@tailwindcss/postcss` + `tw-animate-css` | CSS-first config, no `tailwind.config.js` |
| Components       | `radix-ui@1.4.3` (Slot primitives) + shadcn-style files in `components/ui/` | Uses `radix-sera` style (per `components.json`) |
| Icons            | `lucide-react@1.16.0`                | tree-shakeable, the only icon lib |
| State (local)    | `zustand@5.0.14`                     | single store at `stores/ui-store.ts` |
| Data fetching    | `@tanstack/react-query@5`            | one `QueryClient` in `app/providers.tsx` |
| Animations       | `motion@12.40.0` (framer-motion)     | used in `app/page.tsx` for the hero |
| Map              | `maplibre-gl@5.24.0`                 | single source of truth for the Chile map |
| 3D / globe       | `three`, `@react-three/fiber`, `@react-three/drei` | powers `components/globe/rotating-earth.tsx` |
| Topology         | `d3`, `topojson-client`              | reserved for choropleth math; current map uses raw GeoJSON |
| Classnames       | `clsx`, `tailwind-merge`, `class-variance-authority` | `cn()` helper in `lib/utils.ts` |
| Themes           | `next-themes`                        | wraps `<html>` in `app/layout.tsx` |

### Not installed (despite what older docs say)

- `sonner` — **not installed**. If a feature needs toasts, ask first; don't add it.
- `date-fns` — **not installed**. The dashboard uses `Date.toLocaleTimeString()`. If date math gets non-trivial, ask first.
- `framer-motion` as a separate package — **not installed**. The import path in `app/page.tsx` (`from 'framer-motion'`) actually resolves to the `motion` package. **Always import as `from "motion"`**, not `from "framer-motion"`.

---

## Project structure (actual)

```
frontend/
├── app/
│   ├── (citizen)/
│   │   ├── layout.tsx            # Citizen layout — wraps children in <CitizenNavbar/>
│   │   ├── dashboard/page.tsx    # Verification view (national risk + recent events)
│   │   ├── map/page.tsx          # Just renders <ChileMap/> full-screen
│   │   ├── disasters/            # Catalog + [tipo] detail (see docs/DESIGN.md)
│   │   └── account/page.tsx      # Placeholder
│   ├── api/health/route.ts       # GET /api/health → { status: "ok" }
│   ├── page.tsx                  # Landing with <RotatingEarth/> + hero
│   ├── layout.tsx                # Root layout: fonts, ThemeProvider, TooltipProvider, Providers
│   ├── providers.tsx             # QueryClientProvider (client component)
│   └── globals.css               # Tailwind v4 entry, CSS variables, design tokens
│
├── components/
│   ├── ui/                       # shadcn primitives — add new ones here
│   │   ├── button.tsx            # cva-based, 6 variants × 6 sizes
│   │   └── tooltip.tsx
│   ├── layout/
│   │   └── citizen-navbar.tsx    # Floating top nav for (citizen) routes
│   ├── disasters/                # Disasters catalog UI (glass — docs/DESIGN.md)
│   ├── map/
│   │   ├── chile-map.tsx         # MapLibre map (region + comuna polygons, popups, hover)
│   │   ├── map-config.ts         # Bounds, colors, layer names, GeoJSON URLs, hideForeignLabels()
│   │   └── map-popup.tsx         # React-rendered popups mounted via createRoot
│   └── globe/
│       └── rotating-earth.tsx    # r3f + drei globe, used on landing
│
├── hooks/                        # React Query wrappers, one per API resource
│   ├── index.ts                  # barrel export
│   ├── use-national-risk.ts
│   ├── use-region-risk.ts
│   ├── use-comuna-risk.ts
│   ├── use-recent-events.ts
│   ├── use-event-impact.ts
│   ├── use-active-alerts.ts
│   └── use-map-data.ts           # special: orchestrates GeoJSON + risk enrichment
│
├── lib/
│   ├── api.ts                    # typed fetch wrappers (the ONLY place that talks to backend)
│   ├── types.ts                  # TypeScript mirror of backend Pydantic schemas
│   ├── queries.ts                # React Query keys (use these; do not inline strings)
│   ├── format.ts                 # severityColor, formatMagnitude, formatDepth
│   ├── mocks.ts                  # EMPTY — see "Mock mode" below
│   ├── glass-panel.ts            # GLASS_PANEL_CLASS + GLASS_DIVIDER
│   └── utils.ts                  # cn() — clsx + tailwind-merge
│
├── stores/
│   └── ui-store.ts               # zustand: selected region/comuna/event, sidebar, mapStyle
│
├── data/                         # Local GeoJSON (mirrored from backend/app/data)
│   ├── regional.geojson
│   └── comunas.geojson
│
├── public/                       # Served as /public/* — but GeoJSON ships from /data/!
│   ├── data/                     # ← actual served path for GeoJSON
│   └── geo/
│
├── components.json               # shadcn config (style: "radix-sera", iconLibrary: "lucide")
├── next.config.ts                # `output: "standalone"` for Docker
├── tsconfig.json                 # paths: { "@/*": ["./*"] }
├── eslint.config.mjs             # eslint-config-next/core-web-vitals + /typescript
├── Dockerfile                    # multi-stage node:22-alpine, standalone runner
├── opencode.json                 # shadcn MCP server for adding components
├── CLAUDE.md                     # just "@AGENTS.md" — keep it that way
└── package.json
```

---

## Decision rules

### "Where do I put a new X?"

| You want to add...                       | Put it in...                                | Notes |
|------------------------------------------|---------------------------------------------|-------|
| A page route                             | `app/(citizen)/<name>/page.tsx`             | Use the citizen route group unless root-level |
| A new shadcn primitive                   | `components/ui/<name>.tsx`                  | Use `npx shadcn@latest add <name>` (MCP server is configured) |
| A feature component                      | `components/<area>/<name>.tsx`              | Existing areas: `ui`, `layout`, `map`, `globe`, `disasters` — ask before creating a new top-level area |
| Styling a new citizen page or overlay    | Read `docs/DESIGN.md` first                 | Glass vs shadcn surfaces, tokens, spacing — don't improvise rounded cards on dark UI |
| A data-fetching hook                     | `hooks/use-<resource>.ts` + export in `hooks/index.ts` | Wrap a `useQuery` from React Query; use keys from `lib/queries.ts` |
| A typed API call                         | `lib/api.ts`                                | One function per endpoint; types from `lib/types.ts` |
| A type that mirrors a backend schema     | `lib/types.ts`                              | Keep in lockstep with `backend/app/schemas/` |
| A new React Query key                    | `lib/queries.ts`                            | Never inline query keys in components |
| A floating map overlay (alerts panel, legend, etc.) | `components/map/<name>.tsx` + render in `app/(citizen)/map/page.tsx` | `absolute` positioning; mind z-index vs `CitizenNavbar` (z-50) and MapLibre popups. **Draggable overlays must use `useDraggablePanel` from `hooks/`** — see "Drag, mouse, focus" below. |
| A new zustand slice                      | extend `stores/ui-store.ts`                 | Single store for now; split only if it grows past ~200 lines |
| A pure formatter / helper                | `lib/format.ts`                             | No React, no fetching |
| GeoJSON or static data                   | `data/` (source) → `public/data/` (served)  | The map fetches `/data/*.geojson` |

### "I'm building a new page. What's the skeleton?"

```tsx
// app/(citizen)/<name>/page.tsx
"use client"  // only if you need hooks, state, or browser APIs

import { useWhatever } from "@/hooks"

export default function WhateverPage() {
  const { data, isLoading, error } = useWhatever()
  // ... render with proper loading/empty/error states (WCAG)
}
```

If a page is purely a wrapper around a single component, prefer a server component that just renders the client component (see `app/(citizen)/map/page.tsx` for the pattern).

### "I'm adding a new backend resource. What do I touch?"

1. **Backend** (separate task): add the Pydantic schema in `backend/app/schemas/`, the endpoint, and (if needed) the service. Update `backend/AGENTS.md` if public.
2. **Frontend type**: mirror it in `frontend/lib/types.ts` — exact field names.
3. **API wrapper**: add `getXxx()` in `frontend/lib/api.ts`.
4. **Query key**: add it to `lib/queries.ts`.
5. **Hook**: create `hooks/use-<resource>.ts` and export it from `hooks/index.ts`.
6. **Consumer**: page or component calls `useXxx()`.
7. **`docs/FRONTEND.md`**: update the component/hook reference if it's user-facing.

### Mock mode

`lib/mocks.ts` is **intentionally empty** and contains a `// TODO` comment. Do not implement mock data unless the user asks. The backend is the source of truth — even in development, the frontend hits `http://localhost:8000` via `NEXT_PUBLIC_API_BASE`. If you need offline work, ask the user how to proceed.

---

## Code style

- **No comments** unless the user explicitly asks. (One-line JSDoc for public exports is acceptable when genuinely useful.)
- **No new folders** at the root of `frontend/` without asking. Inside `components/`, ask before adding a top-level area.
- **Use existing shadcn primitives first** (`Button`, `Tooltip` — others via `npx shadcn@latest add`).
- **Keep components under 150 lines** when feasible. The map component violates this on purpose; do not split it into a god hook.
- **Server components by default**. Add `"use client"` only when you need hooks, state, browser APIs, or event handlers.
- **Tailwind v4 syntax** — utility classes only, no `tailwind.config.js` (config is in CSS).
- **Accessibility**: WCAG 2.2 AA. Map already has `role="application"` with `aria-label`. New interactive elements need focus states (`focus-visible:ring-2 focus-visible:ring-ring` on shadcn surfaces; `focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30` on glass — see `docs/DESIGN.md`).
- **Import paths**: use the `@/` alias, not relative `../../..` chains.

---

## Environment & build

- `NEXT_PUBLIC_API_BASE` — backend URL (default `http://localhost:8000`). Defined in `docker-compose.yml` for the container; override in `.env.local` for local dev.
- `NEXT_PUBLIC_USE_MOCK` — **referenced in old docs but not actually used in code**. Don't add code that reads it.
- `next.config.ts`: `output: "standalone"` — required for the multi-stage Docker build.
- Health endpoint: `GET /api/health` must return `200`. Used by `docker-compose.yml` healthcheck.

---

## Pitfalls (learned the hard way — don't repeat them)

- **`motion` vs `framer-motion`**: import animations from `motion` (not `framer-motion`). The package was renamed; old import paths may still resolve via aliases but are wrong.
- **MapLibre `Popup` + React content**: use `createPopupContent()` from `components/map/map-popup.tsx`. It mounts a React tree with `createRoot` and exposes a `destroy()` for clean unmount. Re-inventing this leaks roots.
- **GeoJSON in `data/` vs `public/data/`**: the source files live in `data/`, but the served path is `/data/*.geojson` (because of `public/data/`). Don't break this; the map hardcodes these URLs in `components/map/map-config.ts`.
- **GeoJSON enrichment happens client-side**: `hooks/use-map-data.ts` mutates `feature.properties` to attach risk scores before handing the GeoJSON to MapLibre. The map source `regions` is `generateId: true` — don't toggle that off or feature-state hover breaks.
- **React Query defaults** are set in `app/providers.tsx` (`staleTime: 60s`, `retry: 2`, `refetchOnWindowFocus: false`). Per-hook overrides exist; if you add a new hook, pick a `staleTime` that makes sense for that data's refresh cadence.
- **`comunas` layer is lazy**: it's only added when `map.getZoom() >= COMUNAS_MIN_ZOOM (7)`. Adding a listener on `comuna-fill` before that won't fire.
- **`output: "standalone"`** is what the Dockerfile depends on for the slim runner stage. Removing it breaks Docker builds.
- **Map floating overlays** (e.g. `SenapredAlertsPanel`) must use `position: fixed` so they can be dragged over the entire viewport. Position at `top-20 left-4` to clear the floating `CitizenNavbar`. Use `z-20` (above MapLibre popups) but below the navbar (`z-50`). Sharp corners (`rounded-none`); match the `bg-black/60` + `backdrop-blur-xl` glass used by the map popups. If the overlay is draggable, the drag-handle must be a non-button element so the toggle button can sit beside it without nesting.
- **Drag for floating overlays goes through `useDraggablePanel` (`hooks/use-draggable-panel.ts`)**. Never re-implement drag with raw pointer events. The hook expects to be rendered inside a `<DndContext>` that has `PointerSensor` (with `activationConstraint: { distance: 4 }`), `KeyboardSensor`, and the `restrictToWindowEdges` modifier. The `DndContext` in `app/(citizen)/map/page.tsx` is set up that way — new overlay consumers just need to be rendered as children of it. Buttons inside the drag handle (e.g. a reset-position button) must `e.stopPropagation()` on `onPointerDown` so the click does not also start a drag.
- **The dashboard is debug UI**: don't polish it as a production citizen surface — the real one is the map and the home page.

---

## Required deliverables when implementing a feature

1. Code lives in the right place per the decision rules above.
2. If the API contract changed, **both `backend/app/schemas/` and `frontend/lib/types.ts` are updated in the same task**.
3. If a public component/hook was added, `docs/FRONTEND.md` is updated.
4. `npm run lint` and `npx tsc --noEmit` pass.
5. After changes that affect Docker: `docker compose up --build` and confirm both `/api/health` endpoints respond.

---

## Quick reference

From repo root you can also use `make dev-frontend`, `make` (see root `Makefile`).

```bash
# Local dev
cd frontend && bun run dev

# Lint
cd frontend && bun run lint

# Type-check
cd frontend && npx tsc --noEmit

# Add a shadcn primitive (uses MCP server in opencode.json)
npx shadcn@latest add card

# Build for Docker
cd frontend && bun run build
```

---

**Last updated**: 2026-06-03 — added `docs/DESIGN.md` (UX/UI system: glass panels, Chile tokens, disasters layout). Routes: `/disasters`. Previous: 2026-06-02 draggable map panels via `useDraggablePanel` + `@dnd-kit`.
