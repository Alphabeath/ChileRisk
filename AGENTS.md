# AGENTS.md — ChileRisk (root)

Bootstrap mínimo. **No expandir contexto aquí** → área · `make verify`

---

## Elige área

| Tarea | Abre primero |
|-------|----------------|
| UI, mapa, hooks, Next.js | [frontend/AGENTS.md](frontend/AGENTS.md) |
| API, DB, scheduler, integraciones | [backend/AGENTS.md](backend/AGENTS.md) |
| Contrato FE↔BE o `?date=` | [docs/CONTRACT.md](docs/CONTRACT.md) + área |
| Documentación, README o estado del producto | [docs/README.md](docs/README.md) + [docs/DOC-MAINTENANCE.md](docs/DOC-MAINTENANCE.md) |
| Tocas… | Editar |
|--------|--------|
| `frontend/**` | Sí (+ `frontend/docs/`) |
| `backend/**` | Sí (+ `backend/docs/`) |
| `docs/**` | Sí si cross-cutting |
| `docker-compose.yml`, root `.env`, `.gitignore` | **Solo con aprobación** |
| `misc/`, `TrueRisk/`, `.agents/` | **Nunca** salvo que el usuario nombre el archivo |

---

## Qué es (1 línea)

Monitoreo multi-amenaza Chile (16 regiones, 346 comunas): CSN + Open-Meteo + SERNAPRED + SERNAGEOMIN + Aire Chile → FastAPI → Next.js/MapLibre. Datos reales solamente.

---

## Comandos

```bash
make up              # stack Docker
make verify          # enlaces + contrato + lint/tsc + compileall
```

Puertos y stack: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Skills (`.agents/skills/`)

| Uso | Skill |
|-----|--------|
| Modo breve | `caveman` |
| Review diff | `caveman-review` o `/review` |
| Implement loop | Grok `/implement` |
| UI pulida / auditoría | `impeccable` |
| Next perf | `vercel-react-best-practices` |


---

## Prohibido (raíz)

No `git commit`/`push`/PRs. No tocar compose/root `.env`/.gitignore sin OK. No carpetas top-level nuevas sin proponer. No `TrueRisk/`. No commitear `.env`.

Al cerrar task: [docs/DOC-MAINTENANCE.md](docs/DOC-MAINTENANCE.md) + `make verify`.

---

*Last updated: 2026-08-12*