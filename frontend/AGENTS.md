<!-- BEGIN:nextjs-agent-rules -->
# Next.js 16 — leer antes de escribir código

App Router difiere de versiones anteriores. Antes de tocar `app/` o `next.config.ts`, lee `node_modules/next/dist/docs/`.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — ChileRisk Frontend

**Índice y reglas de scope** en `frontend/`. Referencia de estado, componentes y datos: [docs/FRONTEND.md](docs/FRONTEND.md). Guía visual canónica: [docs/UI-GUIDELINES.md](docs/UI-GUIDELINES.md). Contexto portable para Impeccable: [DESIGN.md](DESIGN.md). Mantenimiento: [../docs/DOC-MAINTENANCE.md](../docs/DOC-MAINTENANCE.md).

---

## Scope

- Solo `frontend/` (incluye `frontend/docs/`).
- La aplicación activa vive en `frontend/`; no se mantiene una segunda implementación.
- No tocar `backend/`, `TrueRisk/` ni `misc/`; la raíz solo se toca para `docs/` cross-cutting en el mismo task.
- Monorepo: [../AGENTS.md](../AGENTS.md).

## Estado y documentación

La matriz canónica de rutas y sus etiquetas `disponible` / `stub` / `ausente` está en [docs/FRONTEND.md#estado-de-rutas](docs/FRONTEND.md#estado-de-rutas). No copies otra tabla de rutas aquí.

| Tema | Documento |
|------|-----------|
| Estado, componentes, mapa, datos y rendimiento | [docs/FRONTEND.md](docs/FRONTEND.md) |
| Implementación visual detallada y canónica | [docs/UI-GUIDELINES.md](docs/UI-GUIDELINES.md) |
| Contexto visual portable de Impeccable | [DESIGN.md](DESIGN.md) |
| Propósito, posicionamiento, marca y accesibilidad | [PRODUCT.md](PRODUCT.md) |
| `?date=` cross-stack | [../docs/QUERY-DATE.md](../docs/QUERY-DATE.md) |
| Arquitectura | [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) |
| API backend | [../backend/docs/BACKEND.md](../backend/docs/BACKEND.md) |

`UI-GUIDELINES.md` se lee primero para UI/mapa. `DESIGN.md` solo aporta contexto portable para Impeccable; no reemplaza tokens, cookbooks ni reglas operativas.

## Naming y stack

- URLs en español; nombres de código, exports y tipos en inglés; copy visible en español.
- next@16 · react@19 · Tailwind v4 · Bun · `maplibre-gl@6` + mapcn · `@base-ui/react` · shadcn · Motion · next-themes · Auth.js (`next-auth@5` Credentials) · Zustand · `@tanstack/react-query` · d3 para landing.
- Usa `motion`, no `framer-motion`.
- No añadas dependencias o patrones de UI no documentados sin aprobación del área.

## Árbol relevante

```text
frontend/
├── app/                    # rutas ES y route groups
├── components/
│   ├── ui/                 # shadcn + mapcn (map.tsx)
│   ├── layout/             # citizen-navbar, page-stub
│   ├── map/                # chile-map, overlays, monitor context
│   ├── evacuacion/         # leyenda, puntos y popups de evacuación
│   ├── preparacion/        # Plan Familia Preparada
│   ├── inicio/             # hub ciudadano invitado
│   ├── auth/               # formularios de cuenta
│   ├── cuenta/             # perfil y preferencias
│   ├── globe/              # landing
│   ├── mica-light-provider.tsx
│   └── theme-provider.tsx
├── hooks/                  # fecha, mapa, riesgo, alertas, aire y eventos
├── stores/                 # ui-store (fecha y preferencias)
├── lib/                    # api.ts, types.ts, queries.ts, query-cache.ts
├── data/evacuacion-source/ # fuente SHP externa, gitignored
├── data/senapred/          # guías vendoreadas
├── public/data/            # GeoJSON, PMTiles, snapshots e imágenes runtime
├── DESIGN.md               # contexto portable para Impeccable
└── docs/                   # FRONTEND.md y UI-GUIDELINES.md
```

## Dónde poner código

| Añades… | Ubicación |
|---------|-----------|
| Página | `app/<ruta-es>/page.tsx` o `app/(citizen)/…` si usa navbar |
| Primitiva UI | `components/ui/` |
| Feature | `components/<area>/` (nombre EN) |
| Layout chrome | `components/layout/` |
| Superficie/Mica | `lib/surface.ts` + clases CSS |
| Hook API/fecha | `hooks/` + `lib/queries.ts` + `lib/query-cache.ts` |
| Preferencias UI | `stores/ui-store.ts` |
| HTTP | `lib/api.ts` → `/api/backend` |
| Tipo de contrato | `lib/types.ts` + `make sync-contract` |
| Capa u overlay de mapa | `components/map/` |
| Evacuación | `components/evacuacion/` |
| Preparación | `components/preparacion/` |
| Hub `/inicio` | `components/inicio/` |
| Auth / cuenta | `app/(auth)/`, `components/auth/`, `components/cuenta/`, `auth.ts` |
| Documento frontend | `docs/FRONTEND.md` / `docs/UI-GUIDELINES.md` |

Hot paths del monitor: `components/map/map-alerts-overlay.tsx`, `components/map/monitor-live-data.tsx`, `components/map/chile-map.tsx`, `lib/query-cache.ts` y hooks TQ. Reutiliza esos puntos antes de crear otra capa de estado.

## Contrato FE↔BE

Los cambios de endpoint, parámetro o JSON compartidos siguen el [flujo canónico](../docs/CONTRACT.md#flujo-obligatorio). En este área:

- Ejecuta `make sync-contract` y revisa `lib/api-schema.d.ts`, `lib/types.ts` y `lib/api.ts` en el mismo task.
- Añade o ajusta el hook TanStack Query y su consumidor; no uses GET con `fetch` suelto en la UI.

Datos operacionales solo vía HTTP; nunca PostgreSQL desde el frontend. La política de hoy/histórico está en `lib/query-cache.ts` y [docs/FRONTEND.md](docs/FRONTEND.md#reglas-tanstack-query-e-integración).

## Pitfalls y invariantes

- Worker MapLibre: `public/vendor/maplibre/` debe contener los módulos configurados por `components/ui/map.tsx`.
- El basemap sigue el tema de la app; no hardcodear una capa dark-only.
- Colores de riesgo, alerta y aire salen de `lib/risk-scale.ts` y la guía canónica.
- Mica solo vía `lib/surface.ts`; no inventar otra implementación de glass.
- No crear monolitos de mapa; reutilizar `components/map/` y `components/evacuacion/`.
- GeoJSON/PMTiles runtime salen de `public/data/`; el origen SHP no se sirve.
- Todo GET de backend pasa por hooks TanStack Query con `queryKeys` y TTL documentados.

## Comandos y entregables

```bash
# Frontend nativo
cd frontend && bun run dev

# Desde la raíz
make verify-frontend

# Artefacto Next (make verify no lo ejecuta)
cd frontend && bun run build
```

`make verify-frontend` no sustituye `bun run build`. Un cambio de contrato además requiere `make sync-contract`; un cambio de UI pública requiere actualizar la referencia correspondiente.

---

*Last updated: 2026-08-12*
