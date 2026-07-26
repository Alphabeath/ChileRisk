<!-- BEGIN:nextjs-agent-rules -->
# Next.js 16 — read this before writing code

App Router difiere de 14/15. Antes de `app/` o `next.config.ts`, lee `node_modules/next/dist/docs/`.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — ChileRisk Frontend

**Índice y reglas de scope** en `frontend/`. Componentes: [docs/FRONTEND.md](docs/FRONTEND.md). UI: [docs/DESIGN.md](docs/DESIGN.md). Mantenimiento: [../docs/DOC-MAINTENANCE.md](../docs/DOC-MAINTENANCE.md).

**Quick:** [../docs/HARNESS-QUICK.md](../docs/HARNESS-QUICK.md) · UI §3 · map §4 · contract §2 · `make verify`

**Memoria:** `engram_mem_context` + `engram_mem_search "map|contrato|date"` antes de editar. Ver [../docs/ENGRAM-PROTOCOL.md](../docs/ENGRAM-PROTOCOL.md). Summary solo si `engram_mem_save`.

---

## Scope

- Solo `frontend/` (incluye `frontend/docs/`).
- No `backend/`, `TrueRisk/`, `misc/`, raíz salvo `docs/` cross-cutting en el mismo task.
- Monorepo: [../AGENTS.md](../AGENTS.md).

---

## Índice documentación

| Tema | Documento |
|------|-----------|
| Componentes, hooks, mapa | [docs/FRONTEND.md](docs/FRONTEND.md) |
| Glass, tokens, citizen | [docs/DESIGN.md](docs/DESIGN.md) |
| `?date=` | [../docs/QUERY-DATE.md](../docs/QUERY-DATE.md) |
| Arquitectura | [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) |
| Catálogo frontend | [docs/README.md](docs/README.md) |
| API backend | [../backend/docs/BACKEND.md](../backend/docs/BACKEND.md) |

Histórico: [docs/archive/FRONTEND-PLAN.md](docs/archive/FRONTEND-PLAN.md) — no usar.

---

## Rutas

| Ruta | Propósito |
|------|-----------|
| `/` | Landing + globo (pública) |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth (públicas) |
| `/monitor` | Monitor + `MapOverlays` (protegida) |
| `/dashboard` | Inicio / home ciudadano (resumen del día) |
| `/preparation` | Preparación + dashboard Plan Familia |
| `/preparation/emergency-kit` | Guía educativa del Kit (conectada bidireccionalmente al step 7) |
| `/preparation/family-plan/step/[n]` | Wizard Plan Familia (8 pasos) |
| `/drills` | Calendario SERNAPRED (redirect `/simulacros` → `/drills`) |
| `/evacuation` | Mapa evacuación tsunami |
| `/disasters`, `/disasters/[tipo]` | Guías |
| `/assistant` | Asistente ciudadano (chat DeepSeek) |
| `/account` | Cuenta + comuna de hogar |
| `/api/health` | Docker health |

---

## Stack

next@16.2.6 · react@19 · Tailwind v4 · maplibre-gl · @dnd-kit · react-day-picker · zustand · React Query · motion · three/r3f.

**No:** `sonner` (pedir antes).

---

## Estructura

```
frontend/
├── app/(citizen)/monitor/page.tsx
├── components/map/     # chile-map, map-overlays, panels
├── hooks/
├── lib/                # api, types, query-date, citizen-layout
├── stores/ui-store.ts
└── docs/               # FRONTEND.md, DESIGN.md
```

Detalle: [docs/FRONTEND.md](docs/FRONTEND.md).

---

## Dónde poner código

| Añades… | Ubicación |
|---------|-----------|
| Página citizen | `app/(citizen)/<name>/page.tsx` |
| shadcn | `components/ui/` |
| Feature | `components/<area>/` |
| Hook API | `hooks/` + `lib/queries.ts` |
| HTTP | `lib/api.ts` |
| Tipo | `lib/types.ts` |
| Overlay mapa | `components/map/` + `map-overlays.tsx` |
| Doc UI | [docs/FRONTEND.md](docs/FRONTEND.md) / [DESIGN.md](docs/DESIGN.md) |

UI mapa/citizen: [docs/DESIGN.md](docs/DESIGN.md) primero.

---

## Recurso backend (checklist)

1. [../backend/docs/BACKEND.md](../backend/docs/BACKEND.md)
2. `lib/types.ts` + `lib/api.ts`
3. Hook + consumidor
4. [docs/FRONTEND.md](docs/FRONTEND.md) si público
5. [QUERY-DATE](../docs/QUERY-DATE.md) si usa `date`

(legacy mocks.ts eliminado; siempre usa backend real vía lib/api.ts)

---

## Pitfalls

- **Naming:** rutas, carpetas, archivos, exports y tipos en **inglés** (`/evacuation`, `EvacuationMap`); texto visible al ciudadano en **español** (labels navbar, títulos).
- `from "motion"` no `framer-motion`.
- Popups: `createPopupContent()`.
- GeoJSON: `data/` → `/data/*.geojson`.
- `useDraggablePanel` + `MapOverlays` `DndContext`.
- `citizen-layout.ts` para top/width paneles.
- `ActiveAlertsPanel` (no `SenapredAlertsPanel`); `external_url`.

---

## Entregables

1. Carpeta correcta
2. Contrato → `make sync-contract` + `types.ts` + backend schemas
3. [docs/FRONTEND.md](docs/FRONTEND.md) / DESIGN
4. `bun run lint` + `bunx tsc --noEmit` + `bun test`

```bash
cd frontend && bun run dev
make dev-frontend
```

---

*Last updated: 2026-07-26*