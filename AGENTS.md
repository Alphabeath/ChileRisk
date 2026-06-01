# AGENTS.md — ChileRisk (root)

Routing document for any coding agent. Cross-cutting rules only; stack-specific rules live in the per-area files.

---

## What is ChileRisk

Multi-hazard risk monitoring platform for Chile (16 regions, 346 comunas). Two hazards from real sources (CSN earthquakes, Open-Meteo climate), 4 scored hazards (`sismo`, `ola_calor`, `ola_frio`, `viento`). Hybrid mode: live data + mock fallback.

```
frontend/ (Next.js 16, MapLibre map)  ──HTTP──▶  backend/ (FastAPI, APScheduler)  ──▶  PostgreSQL 16
                                                          │
                                                          ├─▶ sismologia.cl (CSN scraper)
                                                          └─▶ api.open-meteo.com
```

---

## Where work happens — routing

| Touching this... | Read this first | Edits allowed |
|------------------|-----------------|---------------|
| `frontend/**` | `frontend/AGENTS.md` | Yes |
| `backend/**` | `backend/AGENTS.md` | Yes |
| `docs/**` | this file + relevant area file | **Only if user approves** |
| `docker-compose.yml`, root `.env`, `.gitignore` | this file | **Only if user approves** |
| `misc/`, `TrueRisk/`, `.agents/`, `.claude/` | — | **Never** unless user names the file |

Rule of thumb: if the task is "build a feature in the citizen app" → go to `frontend/AGENTS.md`. If it's "expose a new endpoint" → go to `backend/AGENTS.md`. Anything else, ask.

---

## Cross-cutting decisions

### Run / build the whole stack

```bash
docker compose up --build           # all three services
docker compose down -v              # wipe DB volume too
docker compose logs -f backend      # follow backend logs
docker compose logs -f frontend
```

Ports (from `docker-compose.yml` + root `.env`):
- Frontend → `http://localhost:3000` (health: `/api/health`)
- Backend  → `http://localhost:8000` (health: `/health`)
- Postgres → `127.0.0.1:5434` (host) / `db:5432` (container network)
- Adminer  → `http://localhost:8080`

### Hybrid data mode

Controlled by the root `.env`:

```env
USE_REAL_CSN=true       # earthquakes from sismologia.cl
USE_REAL_METEO=true     # climate from Open-Meteo
ENABLE_SCHEDULER=true
RISK_REFRESH_MINUTES=15
```

Behavior matrix lives in `backend/AGENTS.md` ("Hybrid Data Mode"). Frontend reads this transparently via `/api/v1/...`.

### Frontend ↔ backend contract

- Frontend never talks to PostgreSQL directly. All data flows through `frontend/lib/api.ts` → `NEXT_PUBLIC_API_BASE` → `backend/app/api/*`.
- Schemas live in two places that must stay aligned:
  - Backend: `backend/app/schemas/{risk,event,alert}.py` (Pydantic)
  - Frontend: `frontend/lib/types.ts` (TypeScript)
- If you change a response shape, update **both sides in the same task**. CI does not catch contract drift.

---

## Prohibited at root level

- Do not run `git commit`, `git push`, `git tag`, or open PRs.
- Do not modify `docker-compose.yml`, root `.env`, `.env.example`, `package.json`, `package-lock.json`, `skills-lock.json`, or `.gitignore` without explicit user approval.
- Do not create new top-level folders (e.g., `infra/`, `scripts/`, `tools/`). Propose first.
- Never touch `TrueRisk/` (gitignored, third-party material).
- Never commit `.env` (only `.env.example`).

---

## When the user asks for "a feature"

Always do this discovery first, in this order:

1. Confirm the area: frontend, backend, or both.
2. Read the relevant `AGENTS.md` (frontend or backend) end-to-end.
3. Search for existing patterns (`Grep`/`Glob`) before writing new code — components, hooks, services, and endpoints usually already have a sibling to mimic.
4. If the feature spans both areas, plan the API contract first (`backend/app/schemas/` + `frontend/lib/types.ts`) and then implement in parallel.
5. After coding, verify locally (`docker compose up --build`) and confirm both health endpoints respond.

---

## Documentation expectations

- `docs/ARCHITECTURE.md` — system overview (read once when onboarding).
- `docs/BACKEND.md` — short API reference + run commands.
- `docs/FRONTEND.md` — component API reference (must reflect what's actually shipped).
- `docs/FRONTEND-PLAN.md` — original implementation plan (historical; treat as **aspirational**, not current truth).
- `docs/README.md` — currently empty.

Keep `docs/FRONTEND.md` and `docs/BACKEND.md` in sync when you change public surfaces. `FRONTEND-PLAN.md` is frozen — do not rewrite.

---

**Last updated**: 2026-06-01
