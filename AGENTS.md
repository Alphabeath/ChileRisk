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
make help
```

Puertos: FE `3000`, BE `8000`, Postgres host `5434`. Detalle: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Skills (`.agents/skills/`)

| Uso | Skill |
|-----|--------|
| Modo breve | `caveman` |
| Implement + review loop | Grok `/implement` |
| Review diff | `/review` o `caveman-review` |
| UI pulida | `frontend-design` |
| Next perf | `vercel-react-best-practices` |
| shadcn | `frontend/.agents/skills/shadcn` |

Skills detalle: [docs/HARNESS.md](docs/HARNESS.md) §8.

---

## Prohibido (raíz)

No `git commit`/`push`/PRs. No tocar compose/root `.env`/.gitignore sin OK. No carpetas top-level nuevas sin proponer. No `TrueRisk/`. No commitear `.env`.

Al cerrar task: [docs/DOC-MAINTENANCE.md](docs/DOC-MAINTENANCE.md) + `make verify`.

---

*Last updated: 2026-06-05*