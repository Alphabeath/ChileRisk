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

*Last updated: 2026-05-29*
