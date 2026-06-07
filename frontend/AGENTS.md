<!-- BEGIN:nextjs-agent-rules -->
# Next.js 16 — read this before writing code

App Router difiere de 14/15. Antes de `app/` o `next.config.ts`, lee `node_modules/next/dist/docs/`.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — ChileRisk Frontend

**Índice y reglas de scope** en `frontend/`. Componentes: [docs/FRONTEND.md](docs/FRONTEND.md). UI: [docs/DESIGN.md](docs/DESIGN.md). Mantenimiento: [../docs/DOC-MAINTENANCE.md](../docs/DOC-MAINTENANCE.md).

**Quick:** [../docs/HARNESS-QUICK.md](../docs/HARNESS-QUICK.md) · UI §3 · map §4 · contract §2 · `make verify`

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
| `/` | Landing + globo |
| `/monitor` | Monitor + `MapOverlays` |
| `/dashboard` | Debug API |
| `/disasters`, `/disasters/[tipo]` | Guías |
| `/account` | Placeholder |
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

`lib/mocks.ts` vacío a propósito.

---

## Pitfalls

- `from "motion"` no `framer-motion`.
- Popups: `createPopupContent()`.
- GeoJSON: `data/` → `/data/*.geojson`.
- `useDraggablePanel` + `MapOverlays` `DndContext`.
- `citizen-layout.ts` para top/width paneles.
- `ActiveAlertsPanel` (no `SenapredAlertsPanel`); `external_url`.

---

## Entregables

1. Carpeta correcta
2. Contrato → `types.ts` + backend schemas
3. [docs/FRONTEND.md](docs/FRONTEND.md) / DESIGN
4. `bun run lint` + `npx tsc --noEmit`

```bash
cd frontend && bun run dev
make dev-frontend
```

---

*Last updated: 2026-06-05*