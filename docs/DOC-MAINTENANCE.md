# Documentación — mantenimiento obligatorio

Reglas para **cualquier agente o desarrollador** que modifique ChileRisk.

---

## Cuándo actualizar docs

Actualiza documentación en el **mismo task** (mismo PR / misma sesión) si el cambio es **importante**:

| Tipo de cambio | Qué actualizar |
|----------------|----------------|
| Nuevo endpoint, query param, o forma de respuesta | `backend/docs/BACKEND.md`, `backend/app/schemas/`, `make sync-contract`, `frontend/lib/types.ts`, `frontend/lib/api.ts` |
| Nuevo modelo/tabla o job del scheduler | `backend/docs/BACKEND.md`, `backend/AGENTS.md` (índice si cambia ruta de archivo) |
| Nuevo componente/hook/página visible al usuario | `frontend/docs/FRONTEND.md`, `frontend/docs/DESIGN.md` si afecta UI |
| Flujo cross-stack (ej. `?date=`) | `docs/QUERY-DATE.md` + ambos lados del contrato |
| Arquitectura, puertos, compose, monorepo | `docs/ARCHITECTURE.md`, root `AGENTS.md` si cambia routing |
| Nueva carpeta o área de código | Índice en el `AGENTS.md` del área + README en `backend/docs/` o `frontend/docs/` |
| Solo fix interno sin cambio de contrato ni UX | Docs opcionales |

**Importante** no significa cada línea: un typo o rename local sin API no requiere doc.

---

## Jerarquía (no duplicar todo en AGENTS.md)

1. **`AGENTS.md`** (raíz, `frontend/`, `backend/`) — **índice + reglas de scope/prohibiciones + tabla “dónde poner X”**. Enlaza a docs específicas; no reemplaza la referencia larga.
2. **`backend/docs/`** y **`frontend/docs/`** — referencia estable por stack (API, UI).
3. **`docs/`** (raíz) — solo cross-cutting: arquitectura, query-date, mantenimiento.
4. **`frontend/docs/DESIGN.md`** — sistema visual (glass, tokens, patrones citizen).

Si un párrafo largo vive en dos sitios, **una sola fuente de verdad** y el otro solo enlaza.

---

## Checklist antes de cerrar un task

- [ ] ¿Cambió contrato HTTP? → `backend/docs/BACKEND.md` + `make sync-contract` + `frontend/lib/types.ts` + `frontend/lib/api.ts`
- [ ] ¿Cambió UI pública? → `frontend/docs/FRONTEND.md` (+ `DESIGN.md` si tokens/superficies)
- [ ] ¿Nuevo archivo “hot path” que otros agentes buscarán? → fila en índice del `AGENTS.md` correspondiente
- [ ] ¿Feature cross-cutting? → doc dedicada en `docs/` o sección en `ARCHITECTURE.md`
- [ ] Fecha `Last updated` en el doc tocado (formato `YYYY-MM-DD`)
- [ ] `make verify` en la raíz (o al menos el target del área: `verify-frontend` / `verify-backend`)

---

## Aprobación del usuario

Ediciones en `docs/` (raíz), `backend/docs/` y `frontend/docs/` están **permitidas** cuando forman parte del task. Cambios en `docker-compose.yml`, root `.env`, `.gitignore` siguen requiriendo aprobación explícita (root `AGENTS.md`).

---

*Last updated: 2026-07-31*