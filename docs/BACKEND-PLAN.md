# ChileRisk Backend — Implementation Plan (v0.1)

**Date**: 2026-05-28
**Status**: Implementation started
**Scope**: MVP with 4 hazards (Sismos, Olas de calor, Olas de frío, Vientos)

---

## 1. Tech Stack (aligned with TrueRisk reference)

- **Python 3.12** + **FastAPI** (latest) + **Pydantic v2**
- **SQLAlchemy 2.0** (async) + **asyncpg** (Postgres) / aiosqlite (dev fallback)
- **PostgreSQL 16** (alpine) — no PostGIS required for MVP
- **APScheduler** for background mock data refresh (every 15 min)
- **Docker** (multi-stage, python:3.12-slim) + docker-compose at project root
- No ML models in MVP (pure rule-based + mock generators)
- Spanish-only

**Constraints**:
- Mock data only in Phase 1-5 (real CSN/MeteoChile/CONAF APIs in future phase)
- All risk scores are 0-100 floats
- 4 hazards only for MVP
- Seismic events use combined model (distance attenuation + future CSN data)

---

## 2. Architecture

```
backend/
├── app/
│   ├── main.py                    # FastAPI + lifespan (seed + scheduler)
│   ├── config.py                  # pydantic-settings (DATABASE_URL, etc.)
│   ├── database.py                # async engine, session, get_db
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                # get_db dependency
│   │   ├── comunas.py             # Comuna risk endpoints
│   │   ├── regiones.py            # Region risk + aggregation
│   │   ├── risk.py                # National overview / map data
│   │   ├── events.py              # Seismic events + impact
│   │   └── alerts.py              # Active alerts (stub for MVP)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── region.py              # Region (codregion PK, name, area_km)
│   │   ├── comuna.py              # Comuna (cod_comuna PK, FK region, name, ...)
│   │   ├── risk_score.py          # RiskScore per comuna (4 hazards + composite)
│   │   └── seismic_event.py       # SeismicEvent (epicenter, mag, depth, time)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── risk.py                # ComunaRisk, RegionRisk, NationalRisk responses
│   │   ├── event.py               # SeismicEvent + Impact responses
│   │   └── alert.py               # Alert schema (stub)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── risk_service.py        # Compute scores per comuna, dominant, severity
│   │   ├── region_service.py      # Aggregate comuna scores → region (weighted avg)
│   │   ├── seismic_service.py     # Haversine + attenuation model for sismo_score
│   │   └── mock_service.py        # Realistic mock generators + refresh jobs
│   └── data/
│       ├── __init__.py
│       ├── seed_regions.py        # Load 16 regions from regional.geojson
│       ├── seed_comunas.py        # Load 346 comunas from comunas.geojson
│       ├── regional.geojson       # Copied from frontend at setup
│       └── comunas.geojson        # Copied from frontend at setup
├── pyproject.toml                 # Dependencies (no ML for MVP)
├── Dockerfile
├── entrypoint.sh
├── .env.example
└── alembic/                       # (future migrations)
```

---

## 3. Core Data Models (SQLAlchemy)

### Region
```python
codregion: int (PK)      # 1-16 (official Chilean codes; 0 = "sin demarcar" excluded)
name: str                # "Región de ..."
area_km: float
```

### Comuna
```python
cod_comuna: int (PK)
name: str                # "Comuna"
provincia: str
codregion: int (FK → Region)
latitude: float          # centroid for distance calc
longitude: float
area_km: float           # optional, for future weighting
```

### RiskScore (latest per comuna)
```python
cod_comuna: int (FK)
sismo_score: float (0-100)
ola_calor_score: float
ola_frio_score: float
viento_score: float
composite_score: float
dominant_hazard: str     # "sismo" | "ola_calor" | ...
severity: str            # "bajo" | "moderado" | "alto" | "critico"
computed_at: datetime
```

### SeismicEvent
```python
id: int (PK)
latitude, longitude: float
magnitude: float         # Richter
depth_km: float
occurred_at: datetime
source: str              # "mock" | "CSN" (future)
```

---

## 4. Hazards (MVP)

1. **sismo** — area-of-influence model (see §6)
2. **ola_calor** — temperature extreme (zone-based mock)
3. **ola_frio** — cold wave (zone-based mock)
4. **viento** — wind gust extreme (geography + seasonality mock)

Composite = simple average of 4 scores (future: weighted by exposure/vulnerability).

---

## 5. API Contract (v1)

All responses JSON, Spanish field names where user-facing.

### National / Map
`GET /api/v1/risk/national`
→ `[{ codregion, name, composite_score, dominant_hazard, severity, ... }]`

### Region Detail
`GET /api/v1/regiones/{codregion}/risk`
→ RegionRiskResponse: 4 hazard scores (aggregated), composite, list of top comunas by risk, last_updated

### Comuna Detail
`GET /api/v1/comunas/{cod_comuna}/risk`
→ ComunaRiskResponse: 4 hazard scores, composite, dominant, severity, computed_at

### Seismic Events
`GET /api/v1/events?since=24h`
→ list of recent events (mock + future real)

`GET /api/v1/events/{id}/impact`
→ list of affected comunas with estimated intensity at centroid

### Alerts (stub for MVP)
`GET /api/v1/alerts/active`
→ [] (empty for now; will be populated when real alert sources integrated)

### Health
`GET /health` → `{ "status": "ok", "version": "...", "uptime_seconds": ... }`

---

## 6. Seismic Model (Combined — MVP)

**Generation (mock)**:
- 3–5 events per day
- Epicenters biased toward known seismic zones (north, central-south subduction, etc.)
- Magnitudes 3.0–7.5 (log-normal distribution)
- Depths 10–150 km

**Impact calculation (for each comuna)**:
1. Haversine distance from epicenter to comuna centroid
2. Simple attenuation:
   ```
   intensity = magnitude - (log10(distance_km + 1) * 2.5) - (depth_km / 100.0)
   clamped to [0, 10] (Modified Mercalli approximation)
   ```
3. Convert to 0-100 risk score:
   - Events in last 24h only
   - sismo_score = max( intensity_to_risk(intensity) for active events )
   - intensity_to_risk: linear map 0→0, 10→100

**Future CSN integration**:
- When real data available: prefer official "intensidad reportada por zona" over calculated attenuation.
- Store raw CSN payload in `SeismicEvent.raw_data` (JSON).

---

## 7. Regional Aggregation

For each hazard:
```
region.hazard_score = average( comuna.hazard_score for comuna in region )
```
(Initially uniform weight. Future: population-weighted or area-weighted.)

Composite and dominant follow the same rules as comunas.

---

## 8. Mock Data Refresh (APScheduler)

- Job every 15 minutes:
  - Slight random walk on ola_calor/ola_frio/viento scores (simulate weather evolution)
  - Occasionally spawn new SeismicEvent
  - Recompute all RiskScore rows
  - Update "last_updated" timestamps
- Seed on startup: full set of 346 comunas + 16 regions + initial risk scores + 10 historical seismic events

---

## 9. Docker & Deployment

Root `docker-compose.yml` (orchestrates frontend + backend + db):

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_BASE: http://localhost:8000
    depends_on: [backend]
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: postgresql+asyncpg://chilerisk:chilerisk@db:5432/chilerisk
      BACKEND_CORS_ORIGINS: '["http://localhost:3000"]'
    depends_on: [db]
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD }
    volumes: [pgdata:/var/lib/postgresql/data]
volumes: { pgdata: }
```

Backend Dockerfile: multi-stage, install from pyproject.toml, non-root user, health endpoint.

---

## 10. Implementation Phases

1. **Phase 1 – Foundations**
   - pyproject.toml, config, database, models
   - Seed scripts (regions + comunas from copied GeoJSON)
   - Basic FastAPI app with /health

2. **Phase 2 – Mock Generators + Risk Engine**
   - mock_service: generators for 4 hazards
   - risk_service: compute + persist RiskScore per comuna
   - region_service: aggregation logic
   - seismic_service: Haversine + attenuation

3. **Phase 3 – API Endpoints**
   - All v1 routers with Pydantic schemas
   - National, region, comuna, events, impact
   - Response caching (simple in-memory or Redis later)

4. **Phase 4 – Scheduler + Data Refresh**
   - APScheduler jobs for periodic mock evolution
   - Startup seed + initial seismic events
   - Proper lifespan shutdown

5. **Phase 5 – Docker + Integration**
   - Dockerfile + entrypoint
   - Root docker-compose.yml
   - .env.example
   - End-to-end test: frontend calls backend, sees risk on map/detail pages
   - docs/BACKEND.md (API reference) updated

---

## 11. Deliverables (when complete)

- `docs/BACKEND-PLAN.md` (this file)
- `docs/BACKEND.md` — full API + schema reference (like FRONTEND.md)
- Working `backend/` package with Docker support
- Root `docker-compose.yml` for local dev
- No modifications to frontend/ unless user explicitly requests (per AGENTS.md)

---

## 12. Future Phases (not in MVP)

- Real data sources: CSN (sismos), MeteoChile (temperatura/viento), CONAF (incendios)
- Vulnerability layers + population weighting for regional aggregation
- Alert generation rules (thresholds → Alert records)
- Authentication / API keys (if public exposure)
- PostGIS for geospatial queries (distance, intersects)
- ML models for forecasting (TFT-style, following TrueRisk pattern)

---

**Ready for incremental implementation.**

Last updated: 2026-05-28
