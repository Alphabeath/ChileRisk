# ChileRisk Frontend — Implementation Plan (v0.1)

> **ARCHIVO (2026-05-27)** — No usar como spec. Verdad actual: [../FRONTEND.md](../FRONTEND.md), [../DESIGN.md](../DESIGN.md), [../../AGENTS.md](../../AGENTS.md).

**Date**: 2026-05-27
**Status**: Histórico — superseded
**Scope**: MVP with 3 hazards (Terremotos, Olas de calor, Olas de frío)

---

## 1. Tech Stack (latest stable)

- **Next.js 16.2.6** (App Router) + **React 19.2.4** + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (`radix-sera` style, lucide-react icons)
- **MapLibre GL** for interactive Chile map
- **date-fns**, **zustand** (state), **sonner** (toasts)
- **Docker** (multi-stage, Node 22 alpine) for self-hosted deployment

**Constraints**:
- No real-time (SSE/WebSocket) in MVP — polling or static data only
- Spanish-only (no i18n)
- 3 hazards only

---

## 2. Architecture

```
frontend/
├── app/
│   ├── (citizen)/
│   │   ├── page.tsx                 # Landing + national overview
│   │   ├── mapa/page.tsx            # Interactive map
│   │   ├── riesgo/[region]/page.tsx # Region risk detail
│   │   └── alertas/page.tsx         # Active alerts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/           # shadcn primitives
│   ├── map/          # MapLibre wrapper + GeoJSON layers
│   ├── risk/         # RiskScore, HazardCard, TrendSpark
│   ├── alerts/       # AlertList, AlertBadge
│   └── layout/       # Navbar, Footer, RegionSelector
├── lib/
│   ├── api.ts        # Typed fetch + mock toggle
│   ├── utils.ts
│   └── types.ts      # ChileRegion, HazardScore, Alert
├── public/geo/       # Chile GeoJSON (regiones + comunas)
├── Dockerfile
├── docker-compose.yml
└── next.config.ts
```

---

## 3. Core Pages & Components

### Pages

| Route                    | Purpose                              |
|--------------------------|--------------------------------------|
| `/`                      | Landing + national risk summary      |
| `/mapa`                  | Interactive Chile map (16 regions)   |
| `/riesgo/[region]`       | 3 hazard cards + trend + last update |
| `/alertas`               | Current active alerts                |

### Key Components

- `RiskScore` — 0-100 visual (circle or bar)
- `HazardCard` — per-hazard score + trend sparkline
- `RegionSelector` — combobox of 16 Chilean regions
- `AlertBadge` — color-coded (amarillo/naranja/rojo) + icon
- `ChileMap` — MapLibre wrapper with region polygons

---

## 4. Data Models

```ts
export type ChileRegion =
  | 'Arica y Parinacota' | 'Tarapacá' | 'Antofagasta' | 'Atacama'
  | 'Coquimbo' | 'Valparaíso' | 'Metropolitana' | 'O\'Higgins'
  | 'Maule' | 'Ñuble' | 'Biobío' | 'La Araucanía'
  | 'Los Ríos' | 'Los Lagos' | 'Aysén' | 'Magallanes'

export type Hazard = 'terremoto' | 'ola_calor' | 'ola_frio'

export interface HazardScore {
  hazard: Hazard
  score: number          // 0-100
  trend: 'up' | 'down' | 'stable'
  updated: string        // ISO
}

export interface Alert {
  id: string
  region: ChileRegion
  hazard: Hazard
  level: 'amarillo' | 'naranja' | 'rojo'
  issued: string         // ISO
  message: string
}
```

---

## 5. API Contract (for future backend)

Document in `docs/API.md`. All endpoints return JSON.

```ts
GET /api/risk/national          → { regions: { region: ChileRegion, maxScore: number }[] }
GET /api/risk/:region           → { scores: HazardScore[], updated: ISO }
GET /api/alerts/active          → Alert[]
GET /api/alerts/history?region= → Alert[]
```

**Mock mode**: `lib/api.ts` supports `NEXT_PUBLIC_USE_MOCK=true` (default in dev).

---

## 6. Styling & UX

- Use shadcn/ui `radix-sera` + Tailwind 4
- Mobile-first, responsive (≤640px, ≥1024px)
- Dark mode optional (`dark:` classes)
- WCAG 2.2 AA — proper labels, focus states, contrast
- Loading + empty states on every data fetch

---

## 7. Deployment

- `Dockerfile`: multi-stage (install → build → runner)
- `docker-compose.yml` for local + prod
- Health endpoint: `GET /api/health`
- Env vars: `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_USE_MOCK`

---

## 8. Deliverables for Coding Agent

The agent **must** produce:

1. `docs/FRONTEND.md` — component API, file conventions, patterns
2. `docs/API.md` — full contract + mock examples
3. `docs/DEPLOY.md` — Docker build/run + env setup
4. Update `CLAUDE.md` / `AGENTS.md` with Next.js 16 rules (no edits outside `frontend/`)

---

## 9. Agent Rules (add to CLAUDE.md)

- Never run commands that modify files outside `frontend/`
- Always use latest shadcn/ui + Tailwind 4 patterns
- Prefer `fetch` + typed responses over external HTTP libs
- Mock data lives in `lib/mocks.ts`
- All new components must be accessible (aria, keyboard)

---

**Ready for implementation.**
