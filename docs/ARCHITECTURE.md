# ChileRisk — Architecture

High-level view of the system. For implementation details see `backend/AGENTS.md` and `frontend/AGENTS.md`.

---

## System

```
┌─────────────┐          ┌──────────────────────┐          ┌─────────────────┐
│  Frontend   │  HTTP    │   Backend (FastAPI)  │  Async   │   PostgreSQL    │
│  (Next.js)  │─────────▶│   + Scheduler        │─────────▶│   (risk data)   │
└─────────────┘          └──────────┬───────────┘          └─────────────────┘
                                    │
                                    │ External APIs (hybrid mode)
                                    ▼
                          ┌─────────────────────┐
                          │ CSN / sismologia.cl │
                          │ Open-Meteo          │
                          └─────────────────────┘
```

---

## Components

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | Next.js 16, React 19, MapLibre GL | Interactive map + risk visualization |
| Backend | FastAPI, SQLAlchemy 2.0 async | API + risk computation + data integration |
| Database | PostgreSQL 16 | Regions, comunas, risk scores, seismic events |
| Scheduler | APScheduler | Background jobs (risk refresh, real data sync) |
| External | CSN, Open-Meteo | Real seismic + climate data (when enabled) |

---

## Data Flow

1. **Geography** (seeded once): 16 regions + 346 comunas with centroids
2. **Seismic events**: mock generators OR real CSN scraper → `seismic_events` table
3. **Climate data**: mock generators OR Open-Meteo API → `risk_scores` table
4. **Risk engine**: recomputes all comuna scores every 15 min using Haversine + attenuation model
5. **API**: serves aggregated risk data to frontend

---

## Hybrid Mode

| `USE_REAL_CSN` | `USE_REAL_METEO` | Seismic source | Climate source |
|----------------|------------------|----------------|----------------|
| false | false | Mock | Mock |
| true | false | CSN/sismologia.cl | Mock |
| false | true | Mock | Open-Meteo |
| true | true | CSN/sismologia.cl | Open-Meteo |

Configure via root `.env` file. Fallback to mocks if external APIs fail.

---

## Deployment

Single `docker-compose.yml` at project root:
- `frontend` (Next.js standalone) → port 3000
- `backend` (FastAPI + uvicorn) → port 8000
- `db` (PostgreSQL 16) → port 5434 (host)
- `adminer` (DB visual tool) → port 8080

---

## Monorepo Structure & Boundaries

ChileRisk is a **polyglot monorepo** (`frontend/` Next.js + `backend/` FastAPI + shared orchestration) without heavy monorepo tooling (no pnpm workspaces or Turborepo yet). Structure is enforced by a combination of:

- **Directory ownership + AGENTS.md routing** (root + `frontend/AGENTS.md` + `backend/AGENTS.md`): "all work happens exclusively inside your area". Cross-area or root-file changes require explicit approval.
- **Isolated Docker build contexts** (`build: ./frontend` and `build: ./backend` in compose). The root tree is *not* sent to the images.
- **Ignore hygiene** (as of 2026-06):
  - `backend/.gitignore` — complete Python ignores (`__pycache__/`, `*.py[cod]`, envs, build artifacts, local sqlite, caches...).
  - `backend/.dockerignore` — prevents the above (and .git, .env*, logs, tests, etc.) from entering the image build context.
  - `frontend/.gitignore` + `frontend/.dockerignore` — enforce **bun** as the single package manager (package-lock.json / pnpm / yarn locks are ignored).
  - Root `.gitignore` — cross-cutting (OS, .env, TrueRisk, Docker override, top-level logs, defense-in-depth Python caches + alt package manager locks).
- **Root `Makefile`** — convenient monorepo entrypoint (`make up`, `make clean`, `make dev-frontend`, `make check-ignores`, `make help`, etc.). Delegates to docker compose or `cd <area> && ...`. Does not replace the per-area commands.
- **Explicit contract sync**: Backend Pydantic schemas (`backend/app/schemas/`) and frontend TypeScript types (`frontend/lib/types.ts`) must be kept in lockstep manually (documented in root AGENTS.md). No automatic codegen today.

### Why this shape?

- Docker isolation + per-area manifests already gave good boundaries.
- The original pain point (persistent `__pycache__` / `.pyc` appearing in `git status` and Docker contexts) was caused by non-recursive patterns in the old root-only Python ignore section + missing `backend/.dockerignore`.
- Adding the per-area ignore files + cleaning the root `.gitignore` + adding `Makefile` + `ENV PYTHONDONTWRITEBYTECODE=1` (and later standardizing the frontend on bun) makes the structure self-documenting and resilient.

### Adding something new

- A new HTTP resource or Python service → `backend/` only (see `backend/AGENTS.md`).
- A new UI component/hook/page → `frontend/` only (see `frontend/AGENTS.md`).
- A cross-cutting change (new env var, API shape, root tooling, docs) → plan it and obtain approval.
- Future extra area (e.g. a worker) → follow the same pattern (own Dockerfile, own .gitignore/.dockerignore, entry in compose, update ARCHITECTURE + AGENTS).

See also:
- `Makefile` (root targets)
- `backend/.gitignore`, `backend/.dockerignore`
- `frontend/.gitignore`, `frontend/.dockerignore`
- `root AGENTS.md` (prohibitions and routing table)
- `backend/AGENTS.md` / `frontend/AGENTS.md` (detailed decision rules)

---

*Last updated: 2026-06 (monorepo hygiene + structure section added)*
