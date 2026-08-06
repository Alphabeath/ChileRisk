<!-- BEGIN:nextjs-agent-rules -->
# Next.js 16 — read this before writing code

App Router difiere de 14/15. Antes de `app/` o `next.config.ts`, lee `node_modules/next/dist/docs/`.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — ChileRisk Frontend

**Índice y reglas de scope** en `frontend/`. Componentes: [docs/FRONTEND.md](docs/FRONTEND.md). UI: [docs/DESIGN.md](docs/DESIGN.md). Mantenimiento: [../docs/DOC-MAINTENANCE.md](../docs/DOC-MAINTENANCE.md).

**Quick:** [../docs/HARNESS.md](../docs/HARNESS.md) · UI §6 · map §7 · contract §5 · `make verify`

---

## Scope

- Solo `frontend/` (incluye `frontend/docs/`).
- `old_frontend/` es **referencia de migración** — no editar salvo pedido explícito.
- No `backend/`, `TrueRisk/`, `misc/`, raíz salvo `docs/` cross-cutting en el mismo task.
- Monorepo: [../AGENTS.md](../AGENTS.md).

---

## Índice documentación

| Tema | Documento |
|------|-----------|
| Componentes, mapa, surface/Mica | [docs/FRONTEND.md](docs/FRONTEND.md) |
| Identidad, tokens, paletas | [docs/DESIGN.md](docs/DESIGN.md) |
| `?date=` | [../docs/QUERY-DATE.md](../docs/QUERY-DATE.md) |
| Arquitectura | [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) |
| Catálogo frontend | [docs/README.md](docs/README.md) |
| API backend | [../backend/docs/BACKEND.md](../backend/docs/BACKEND.md) |

---

## Rutas

URLs en **español**. Código (`components/`, hooks, exports, tipos) en **inglés**. Copy UI en **español**.

| Ruta | Propósito | Estado |
|------|-----------|--------|
| `/` | Landing + globo | migrado |
| `/monitor` | Mapa multi-amenaza | migrado (API real + Alertas + Fecha) |
| `/iniciar-sesion` | Login | pendiente |
| `/registro` | Registro | pendiente |
| `/olvide-contrasena` | Forgot password | pendiente |
| `/restablecer-contrasena` | Reset password | pendiente |
| `/inicio` | Home ciudadano (Mi comuna hoy) | pendiente |
| `/preparacion` | Hub preparación + Plan Familia | pendiente |
| `/preparacion/kit-emergencia` | Guía kit de emergencia | pendiente |
| `/preparacion/plan-familia/paso/[n]` | Wizard Plan Familia (8 pasos) | pendiente |
| `/simulacros` | Calendario SERNAPRED | pendiente |
| `/evacuacion` | Mapa evacuación | migrado (GeoJSON/PMTiles + meeting-points) |
| `/desastres`, `/desastres/[tipo]` | Guías SENAPRED (25 temas) | migrado (vendored + SSG) |
| `/asistente` | Chat ciudadano | pendiente |
| `/cuenta` | Cuenta + comuna de hogar | pendiente |

No reintroducir redirects ES→EN del viejo (`/evacuacion` → `/evacuation`).

---

## Stack

next@16 · react@19 · Tailwind v4 · bun · maplibre-gl@6 + mapcn · `@base-ui/react` · shadcn (base-sera) · motion · next-themes · zustand · `@tanstack/react-query` · d3 (landing).

**Aún no:** auth (NextAuth), @dnd-kit, driver.js.

**No:** `sonner` (pedir antes). `framer-motion` → usar `motion`.

---

## Estructura

```
frontend/
├── app/                    # rutas ES: page.tsx, monitor/, …
├── components/
│   ├── ui/                 # shadcn + mapcn (map.tsx)
│   ├── layout/             # citizen-navbar, page-stub
│   ├── map/                # chile-map, map-config
│   ├── globe/              # landing earth
│   ├── mica-light-provider.tsx
│   └── theme-provider.tsx
├── hooks/                  # use-query-date, use-map-data, risk/alerts/air/events
├── stores/                 # ui-store (fecha + prefs paneles, persist)
├── lib/                    # api.ts, types.ts, queries.ts, surface, risk-scale, …
├── data/evacuacion-source/ # SHP fuente (gitignored; `make evacuacion-data`)
├── data/senapred/          # guías vendored (JSON; sync:senapred)
├── public/data/            # GeoJSON/PMTiles runtime + senapred/img/
└── docs/                   # FRONTEND.md, DESIGN.md
```

Detalle: [docs/FRONTEND.md](docs/FRONTEND.md).

---

## Dónde poner código

| Añades… | Ubicación |
|---------|-----------|
| Página | `app/<ruta-es>/page.tsx` o `app/(citizen)/…` si lleva navbar |
| shadcn | `components/ui/` |
| Feature | `components/<area>/` (nombre EN) |
| Layout chrome | `components/layout/` |
| Superficie / Mica | `lib/surface.ts` + clases CSS |
| Hook API / fecha | `hooks/` + `lib/queries.ts` + `lib/query-cache.ts` (`staleTimeForLive`) |
| Preferencias UI | `stores/ui-store.ts` |
| HTTP | `lib/api.ts` → `/api/backend` (JWT guest) |
| Tipo contrato | `lib/types.ts` + `make sync-contract` |
| Capa / overlay mapa | `components/map/` |
| Doc UI | [docs/FRONTEND.md](docs/FRONTEND.md) / [DESIGN.md](docs/DESIGN.md) |

UI mapa/citizen: [docs/DESIGN.md](docs/DESIGN.md) primero.

---

## Recurso backend (checklist)

1. [../backend/docs/BACKEND.md](../backend/docs/BACKEND.md)
2. `make sync-contract` → `lib/api-schema.d.ts` (+ futuro `lib/types.ts` + `lib/api.ts`)
3. Hook + consumidor
4. [docs/FRONTEND.md](docs/FRONTEND.md) si es superficie pública
5. [QUERY-DATE](../docs/QUERY-DATE.md) si usa `date`

Datos operacionales solo del backend real vía HTTP — nunca Postgres desde el FE. **Datos BE →** hook en `hooks/` con TanStack Query + `queryKeys` + `staleTimeForLive`; no `fetch` suelto en UI ([FRONTEND.md § TanStack Query](docs/FRONTEND.md#datos-del-backend-tanstack-query)).

---

## Pitfalls

- **Naming:** rutas ES · código EN · UI ES.
- `from "motion"` no `framer-motion`.
- Worker MapLibre: `public/vendor/maplibre/` (sin esto el mapa no carga).
- Basemap sigue el tema de la app — no hardcodear dark-matter.
- Colores de riesgo/alerta/aire: canónicos en DESIGN + `lib/risk-scale.ts` — no inventar.
- Mica solo vía `lib/surface.ts` (`.surface-mica`) — no portar `glass-mica` del viejo.
- No copiar monolitos de `old_frontend/components/map/chile-map.tsx`.
- GeoJSON runtime: `public/data/*.geojson`.
- **Datos BE:** solo vía hooks TQ (`useQuery` / `fetchQuery`); ver [FRONTEND.md § TanStack Query](docs/FRONTEND.md#datos-del-backend-tanstack-query).

---

## Entregables

1. Carpeta correcta
2. Contrato → `make sync-contract` + tipos/cliente cuando aplique
3. [docs/FRONTEND.md](docs/FRONTEND.md) / DESIGN si cambia UI pública
4. **Siempre rebuild:** `bun run lint` + `bun run typecheck` + `bun run build` + `bun test` (no cerrar task sin build).

```bash
cd frontend && bun run dev
make verify-frontend
```

---

*Last updated: 2026-08-04*
