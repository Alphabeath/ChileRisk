# ChileRisk — documentación (monorepo)

Docs **cross-cutting** (ambas áreas). Referencia por stack:

| Área | Carpeta |
|------|---------|
| Backend | [backend/docs/README.md](../backend/docs/README.md) |
| Frontend | [frontend/docs/README.md](../frontend/docs/README.md) |

**Agentes:** [../AGENTS.md](../AGENTS.md) (bootstrap corto) → `frontend/AGENTS.md` / `backend/AGENTS.md`.

---

## En esta carpeta (`docs/`)

| Documento | Contenido |
|-----------|-----------|
| [HARNESS-QUICK.md](./HARNESS-QUICK.md) | **Flujo compacto** (pocos tokens — leer primero) |
| [HARNESS.md](./HARNESS.md) | Playbooks detallados + `make verify` |
| [DOC-MAINTENANCE.md](./DOC-MAINTENANCE.md) | Cuándo actualizar docs (obligatorio en cambios importantes) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Sistema, flujo de datos, Docker, monorepo |
| [QUERY-DATE.md](./QUERY-DATE.md) | Parámetro `?date=` (backend + frontend) |
| [scripts/](./scripts/) | `verify-doc-links.sh`, `check-contract.py`, `export-openapi.py` |

---

## Mapa rápido

| Tarea | Empieza en |
|-------|------------|
| Nuevo endpoint | `backend/AGENTS.md` → `backend/docs/BACKEND.md` |
| Nuevo panel mapa | `frontend/AGENTS.md` → `frontend/docs/DESIGN.md` → `FRONTEND.md` |
| Cambio contrato alertas | `backend/docs/BACKEND.md` + `frontend/docs/FRONTEND.md` + `lib/types.ts` |
| Modo híbrido | `backend/docs/BACKEND.md` + `ARCHITECTURE.md` |
| Levantar stack | root `AGENTS.md` + `ARCHITECTURE.md` |
| Cerrar task agente | `make verify` + [HARNESS.md](./HARNESS.md) |

---

*Last updated: 2026-06-05*