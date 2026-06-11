# AGENTS.md — ChileRisk (root)

Bootstrap mínimo. **No expandir contexto aquí** → área → [docs/HARNESS-QUICK.md](docs/HARNESS-QUICK.md) (flujo compacto) · detalle: [docs/HARNESS.md](docs/HARNESS.md) · `make verify`

---

## Elige área

| Tarea | Abre primero |
|-------|----------------|
| UI, mapa, hooks, Next.js | [frontend/AGENTS.md](frontend/AGENTS.md) |
| API, DB, scheduler, integraciones | [backend/AGENTS.md](backend/AGENTS.md) |
| Contrato FE↔BE o `?date=` | [docs/HARNESS-QUICK.md](docs/HARNESS-QUICK.md) contract/cross + área |

| Tocas… | Editar |
|--------|--------|
| `frontend/**` | Sí (+ `frontend/docs/`) |
| `backend/**` | Sí (+ `backend/docs/`) |
| `docs/**` | Sí si cross-cutting |
| `docker-compose.yml`, root `.env`, `.gitignore` | **Solo con aprobación** |
| `misc/`, `TrueRisk/`, `.agents/` | **Nunca** salvo que el usuario nombre el archivo |

---

## Qué es (1 línea)

Monitoreo multi-amenaza Chile (16 regiones, 346 comunas): CSN + Open-Meteo + SERNAPRED → FastAPI → Next.js/MapLibre. Modo híbrido mock/real.

---

## Contrato FE ↔ BE

- HTTP: `frontend/lib/api.ts` → `backend/app/api/*` (nunca Postgres desde FE).
- Tipos: `backend/app/schemas/` ↔ `frontend/lib/types.ts` (mismo task si cambia JSON).
- **OpenAPI (runtime):** `http://localhost:8000/openapi.json` — resumen en [backend/docs/BACKEND.md](backend/docs/BACKEND.md).

---

## Comandos

```bash
make up              # stack Docker
make verify          # harness: links + contract + lint/tsc + compileall
```

Puertos y stack: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Skills (`.agents/skills/`)

| Uso | Skill |
|-----|--------|
| Modo breve | `caveman` |
| Review diff | `caveman-review` o `/review` |
| Implement loop | Grok `/implement` |
| UI pulida | `frontend-design` |
| Next perf | `vercel-react-best-practices` |
| Memoria persistente | `engram_mem_*` (ver docs/ENGRAM-PROTOCOL.md) |

Skills detalle: [docs/HARNESS.md](docs/HARNESS.md) §8.

---

## Memoria (engram)

**Antes de tocar archivos:**

```
engram_mem_context
engram_mem_search "<área o keywords>"
```

Guarda solo ARCH/PATTERN/BUG no triviales (máx 2-3/sesión). Si guardaste memorias → `engram_mem_session_summary` al cerrar.

Full protocol + formato: [docs/ENGRAM-PROTOCOL.md](docs/ENGRAM-PROTOCOL.md)

---

## Prohibido (raíz)

No `git commit`/`push`/PRs. No tocar compose/root `.env`/.gitignore sin OK. No carpetas top-level nuevas sin proponer. No `TrueRisk/`. No commitear `.env`.

Al cerrar task: [docs/DOC-MAINTENANCE.md](docs/DOC-MAINTENANCE.md) + `make verify`. Si usaste `engram_mem_save` → `engram_mem_session_summary`.

---

*Last updated: 2026-06-10*