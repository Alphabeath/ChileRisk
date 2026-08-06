# Harness — playbooks para agentes

Índice: [README.md](./README.md) · Mantenimiento: [DOC-MAINTENANCE.md](./DOC-MAINTENANCE.md) · `make verify`

---

## 0. Antes de cualquier task

1. Identifica área: `frontend/`, `backend/`, o ambos.
2. Abre el `AGENTS.md` de esa área (no leas el índice completo de la raíz salvo duda de scope).
3. `Grep`/`Glob` un archivo vecino al cambio.
4. Al cerrar: `make verify` + checklist en [DOC-MAINTENANCE.md](./DOC-MAINTENANCE.md).

---

## 1. Pick area

| Touch | Open |
|-------|------|
| UI/map/hooks | `frontend/AGENTS.md` |
| API/DB/jobs | `backend/AGENTS.md` |
| `?date=` / FE↔BE | `QUERY-DATE.md` + both areas |

---

## 2. Flows compactos

**FE UI/component**
`frontend/AGENTS` → `docs/DESIGN` (map/citizen) → code `components/` `hooks/` → `docs/FRONTEND` if public → `make verify`

**FE map overlay**
+ `map-overlays.tsx` · `useDraggablePanel` · `citizen-layout.ts`

**BE endpoint**
`backend/AGENTS` → `schemas/` → `api/` + `main.py` → `services/` → `backend/docs/BACKEND` → FE? see contract → `make verify`

**Contract change**
`schemas/*` → `make sync-contract` (OpenAPI → `frontend/lib/api-schema.d.ts`) · update `lib/types.ts` / `lib/api.ts` · `BACKEND.md` + `FRONTEND.md` · OpenAPI wins · `make verify-contract`

**Cross-stack**
`QUERY-DATE.md` → BE `query_date_window` · FE `query-date.ts` `ui-store` hooks `api.ts` · data fetch: [FRONTEND.md § TanStack Query](../frontend/docs/FRONTEND.md#datos-del-backend-tanstack-query)

**Bugfix only**
code (+tests) · docs optional · `make verify` anyway

---

## 3. Docs map (no read all)

| Need | File |
|------|------|
| API tables | `backend/docs/BACKEND.md` |
| Components | `frontend/docs/FRONTEND.md` |
| Glass/UI | `frontend/docs/DESIGN.md` |
| Docker/monorepo | `docs/ARCHITECTURE.md` |

---

## 4. Nuevo endpoint HTTP (backend)

| Paso | Acción |
|------|--------|
| 1 | [backend/AGENTS.md](../backend/AGENTS.md) — scope |
| 2 | [backend/docs/BACKEND.md](../backend/docs/BACKEND.md) — patrón de rutas |
| 3 | `app/schemas/<recurso>.py` — modelo respuesta |
| 4 | `app/api/<recurso>.py` + `main.py` router |
| 5 | `app/services/` si hay lógica |
| 6 | Actualizar tabla endpoints en `BACKEND.md` |
| 7 | Si el frontend consume → playbook **contract** |
| 8 | `make verify` |

**Contrato canónico (runtime):** `GET http://localhost:8000/openapi.json` (FastAPI). Resumen humano en `BACKEND.md`.

---

## 5. Cambio de contrato (respuesta JSON existente)

| Paso | Acción |
|------|--------|
| 1 | `backend/app/schemas/` — campo Pydantic |
| 2 | `frontend/lib/types.ts` — mismo nombre semántico |
| 3 | `frontend/lib/api.ts` — query/body si aplica |
| 4 | `frontend/lib/alerts-display.ts` u otros normalizadores |
| 5 | `backend/docs/BACKEND.md` + `frontend/docs/FRONTEND.md` |
| 6 | `make verify` (incluye `verify-contract` / OpenAPI→TS) |

---

## 6. Nuevo componente / hook UI (frontend)

| Paso | Acción |
|------|--------|
| 1 | [frontend/AGENTS.md](../frontend/AGENTS.md) |
| 2 | [frontend/docs/DESIGN.md](../frontend/docs/DESIGN.md) si mapa/citizen/glass |
| 3 | Implementar en `components/` o `hooks/` |
| 4 | [frontend/docs/FRONTEND.md](../frontend/docs/FRONTEND.md) si es API pública del componente |
| 5 | `cd frontend && bun run lint` + `npx tsc --noEmit` (o `make verify`) |

---

## 7. Panel u overlay en el mapa

| Paso | Acción |
|------|--------|
| 1 | DESIGN.md + [FRONTEND.md](../frontend/docs/FRONTEND.md) § Map |
| 2 | Componente en `components/map/` |
| 3 | Montar en `map-overlays.tsx` (dentro de `DndContext`) |
| 4 | Drag → `useDraggablePanel`; layout → `lib/citizen-layout.ts` |
| 5 | FRONTEND.md + `make verify` |

---

## 8. Feature cross-stack (`?date=`, alertas unificadas, etc.)

| Paso | Acción |
|------|--------|
| 1 | [QUERY-DATE.md](./QUERY-DATE.md) o doc cross-cutting relevante |
| 2 | Backend: `query_date_window`, schemas, API |
| 3 | Frontend: `lib/query-date.ts`, store, hooks, `api.ts` |
| 4 | Ambos `BACKEND.md` y `FRONTEND.md` |
| 5 | `make verify` |

---

## 9. Solo bugfix interno

- Sin cambio de contrato ni UX documentada → código + tests si existen; docs opcionales.
- Igual recomendado: `make verify` (barra mínima de calidad).

---

## 10. Comandos de verificación

```bash
make verify          # docs links + OpenAPI contract + lint/tsc/tests FE + compileall BE
make verify-docs     # solo enlaces markdown
make verify-contract # OpenAPI → api-schema.d.ts drift check
make sync-contract   # regenera api-schema.d.ts tras cambiar schemas
make verify-frontend
make verify-backend
```

`make verify` = links + OpenAPI contract + `bun lint` + `tsc` + `bun test` + `compileall` (+ pytest si está en host). `verify-backend` ejecuta `pytest` solo si está instalado en el host; en Docker: `docker compose exec backend python -m pytest tests/ -q`.

---

## 11. Skills del repo (`.agents/skills/`)

| Invocación / necesidad | Skill |
|------------------------|--------|
| Respuestas ultra-cortas | `caveman` |
| Commit message | `caveman-commit` |
| Review diff | `caveman-review` o Grok `/review` |
| Implementar con loop review | Grok `/implement` |
| UI distintiva | `frontend-design` |
| React/Next perf | `vercel-react-best-practices` |
| shadcn en frontend | `frontend/.agents/skills/shadcn` |
| Delegar subagentes comprimidos | `cavecrew` |

No sustituyen leer `AGENTS.md` del área; complementan tareas largas o formato.

---

*Last updated: 2026-08-02*
