# Backend — ChileRisk

**Stack**: Python 3.12 + FastAPI + SQLAlchemy 2.0 async + PostgreSQL 16

**Base URL**: `http://localhost:8000`

---

## Quick Start

```bash
# Mock mode (default)
docker compose up --build

# Real seismic data (CSN)
USE_REAL_CSN=true docker compose up --build

# Both real sources
USE_REAL_CSN=true USE_REAL_METEO=true docker compose up --build

# Clean database
docker compose down -v && docker compose up --build
```

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/risk/national` | Aggregated risk for 16 regions (map) |
| GET | `/api/v1/regiones/{codregion}/risk` | Region detail + comuna list |
| GET | `/api/v1/comunas/{cod_comuna}/risk` | Single comuna hazard vector |
| GET | `/api/v1/events?hours=48` | Recent seismic events |
| GET | `/api/v1/events/{id}/impact` | Impact on comunas from one event |
| GET | `/api/v1/stats/national` | National averages + severity distribution |
| GET | `/api/v1/stats/regiones/{codregion}` | Region statistics |
| GET | `/api/v1/stats/trends?days=7` | Trend data (placeholder) |
| GET | `/api/v1/stats/compare?regiones=13,14,15` | Compare up to 8 regions |
| GET | `/api/v1/alerts/active` | Active alerts (stub → `[]`) |

All risk values are 0–100 floats. Rate limits: 100 req/min (read), 60 (events), 30 (impact).

---

## Configuration

Edit the root `.env` file:

```env
USE_REAL_CSN=false          # true = real earthquakes from sismologia.cl
USE_REAL_METEO=false        # true = real weather from Open-Meteo
RISK_REFRESH_MINUTES=15     # Risk recompute frequency
ENABLE_SCHEDULER=true
```

Full reference: `backend/.env.example`

---

## Architecture

```
Frontend (Next.js) → Backend (FastAPI) → PostgreSQL
                        ↓
           CSN / sismologia.cl (sismos)
           Open-Meteo (temperatura/viento)
```

- **Scheduler**: risk refresh (15 min), CSN sync (5 min), Open-Meteo update (45 min)
- **Seismic model**: Haversine distance + attenuation → intensity → risk score
- **Climate model**: Region centroids (16 API calls) → scores applied to all comunas in region
- **Composite**: simple average of 4 hazard scores

---

## Detailed Reference

For complete documentation (models, services, code rules, commands), see:

```
backend/AGENTS.md
```

---

*Last updated: 2026-05-29*
