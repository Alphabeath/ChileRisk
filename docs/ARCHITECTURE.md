# ChileRisk — Architecture

Vista de sistema. Detalle: [backend/docs/BACKEND.md](../backend/docs/BACKEND.md), [frontend/docs/FRONTEND.md](../frontend/docs/FRONTEND.md), [QUERY-DATE.md](./QUERY-DATE.md). Agentes: [../AGENTS.md](../AGENTS.md).

---

## System

```
┌─────────────┐          ┌──────────────────────┐          ┌─────────────────┐
│  Frontend   │  HTTP    │   Backend (FastAPI)  │  Async   │   PostgreSQL    │
│  Next.js 16 │─────────▶│   + APScheduler      │─────────▶│   16            │
└─────────────┘          └──────────┬───────────┘          └─────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              sismologia.cl   Open-Meteo      SERNAPRED AppSync   Aire Chile (HTML)   SERNAGEOMIN (HTML)
              (CSN scrape)    (batch REST)    (Cognito Identity + SigV4)               alertas-volcanicas
```

---

## Components

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | Next.js 16, React 19, MapLibre, @dnd-kit | Mapa, overlays, consulta por día |
| Backend | FastAPI, SQLAlchemy 2.0 async | API, riesgo, integraciones, alertas unificadas |
| Database | PostgreSQL 16 | Geo, scores live, snapshots diarios, eventos, SERNAPRED |
| Scheduler | APScheduler | Risk refresh, CSN, meteo, SERNAPRED, Aire Chile GEC, SERNAGEOMIN |

---

## Data flow

1. **Geografía** — seed idempotente: 16 regiones + 346 comunas (`regional.geojson`, `comunas.geojson`).
2. **Sismos** — CSN (sismologia.cl) → `seismic_events`; impacto → `seismic_impacts` al insertar.
3. **Clima** — Open-Meteo (lotes) → `climate_readings` + actualización `risk_scores`.
4. **Riesgo live** — `risk_service.recompute_all_scores` cada N min (scheduler).
5. **Riesgo histórico** — `daily_risk_service` materializa `daily_risk_scores` por `score_date` bajo demanda.
6. **Alertas** — SERNAPRED sync → `senapred_alerts`; SERNAGEOMIN scrape → `sernageomin_volcanic_alerts`; evaluador → alertas ChileRisk; API unifica `/alerts/active`.
7. **Aire Chile GEC** — scrape HTML → `airechile_daily`; API `/air-quality` (cobertura parcial PPDA).
7. **Frontend** — `lib/api.ts` + React Query; fecha global en `ui-store` para mapa y listados.

Consulta por día: [QUERY-DATE.md](./QUERY-DATE.md).

---

## Data sources

All data comes from real providers (CSN, Open-Meteo, SERNAPRED, Aire Chile, SERNAGEOMIN) when the corresponding `USE_REAL_*` flags are enabled. When disabled, the source contributes no data (no synthetic/mock fallbacks).

Variables documented in [backend/docs/BACKEND.md](../backend/docs/BACKEND.md).

---

## Deployment

`docker-compose.yml` en raíz:

| Service | Port | Notas |
|---------|------|-------|
| frontend | 3000 | Healthcheck `127.0.0.1` (Alpine/IPv4) |
| backend | 8000 (host `127.0.0.1`) | Healthcheck `127.0.0.1`; no público |
| db | 5434 (host `127.0.0.1`) | `POSTGRES_*` vía env; no Internet |
| adminer | 8080 (host `127.0.0.1`) | Solo profile `tools`; **no** en Dokploy |

`make up` = `docker compose --profile tools up --build` (incluye Adminer). Frontend imagen: Next **standalone** + **bun**. Dockerfiles incluyen `HEALTHCHECK`. Plantilla env: [`.env.example`](../.env.example).

### Dokploy (VPS) — `chilerisk.cl`

App tipo **Docker Compose** → este repo / `docker-compose.yml`:

1. **DNS:** `A`/`AAAA` de `chilerisk.cl` (+ `www` si aplica) → IP del VPS.
2. **Domains (Dokploy):** servicio **`frontend`**, puerto **3000**, HTTPS/Let’s Encrypt. El FE proxya la API (`/api/backend` → `backend:8000` en red Docker); no hace falta dominio público al backend.
3. **No** actives profile `tools` (sin Adminer).
4. **Environment** (pegar desde `.env.example` sección prod; mismo `AUTH_SECRET` FE+BE):
   - `AUTH_SECRET` ≥32 bytes (`openssl rand -base64 48`)
   - `AUTH_URL=https://chilerisk.cl`
   - `BACKEND_CORS_ORIGINS=["https://chilerisk.cl","https://www.chilerisk.cl"]`
   - `POSTGRES_PASSWORD` fuerte (y `POSTGRES_USER` / `POSTGRES_DB` si los cambias)
   - Opcional: `GOOGLE_*`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM=noreply@chilerisk.cl`, `DEEPSEEK_API_KEY`
5. **OAuth Google:** redirect `https://chilerisk.cl/api/auth/callback/google`.
6. **Health:** IPv4 `127.0.0.1`; backend `start_period: 180s` (cold start con syncs).
7. **Volumen** `pgdata` persistente; no publiques Postgres fuera del host.

---

## Monorepo structure

Polyglot monorepo sin Turborepo:

- **Ownership:** `AGENTS.md` por área; docs de stack en `backend/docs/` y `frontend/docs/`; cross-cutting en `docs/`.
- **Docker:** contextos `./frontend` y `./backend` separados.
- **Ignores:** `.gitignore` / `.dockerignore` por área; bun lock en frontend.
- **Contrato:** Pydantic ↔ TypeScript manual ([DOC-MAINTENANCE.md](./DOC-MAINTENANCE.md)).
- **Makefile:** atajos (`up`, `clean`, `dev-frontend`, `check-ignores`).

Nueva área (worker, etc.): mismo patrón + entrada en [README.md](./README.md) y ARCHITECTURE.

---

## Documentation map

| Ubicación | Role |
|-----------|------|
| [docs/README.md](./README.md) | Índice monorepo (cross-cutting) |
| [backend/docs/README.md](../backend/docs/README.md) | Índice backend |
| [frontend/docs/README.md](../frontend/docs/README.md) | Índice frontend |
| [HARNESS.md](./HARNESS.md) | Playbooks + `make verify` |
| [DOC-MAINTENANCE.md](./DOC-MAINTENANCE.md) | Política de actualización |
| [backend/docs/BACKEND.md](../backend/docs/BACKEND.md) | API, modelos, servicios |
| [frontend/docs/FRONTEND.md](../frontend/docs/FRONTEND.md) | Componentes y hooks |
| [backend/docs/ML-INTEGRATION.md](../backend/docs/ML-INTEGRATION.md) | ML futuro |

---

*Last updated: 2026-07-25*