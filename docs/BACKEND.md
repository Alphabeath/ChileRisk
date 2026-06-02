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
| GET | `/api/v1/alerts/active?region=&level=` | Active SERNAPRED alerts |

### `GET /api/v1/alerts/active`

Alertas oficiales de SERNAPRED sincronizadas desde `senapred.cl/sismos-alertas`.
Soportan dos filtros opcionales:

| Param   | Type                                | Descripción |
|---------|-------------------------------------|-------------|
| region  | int (1–16)                          | `codregion` para filtrar por región |
| level   | `preventiva` \| `amarilla` \| `naranja` \| `roja` | Filtrar por nivel |

Rate limit: 60 req/min. Respuesta: lista de objetos `SenapredAlertOut`.

```json
[
  {
    "id": "be345812-43e3-469a-8dc9-7e3c67ffc5c7",
    "level": "preventiva",
    "category": "Otros",
    "title": "Se declara Alerta Temprana Preventiva para la Región de Los Lagos por evento meteorológico",
    "content": "<p>...</p>",
    "url_access": "se-declara-alerta-temprana-preventiva-...",
    "senapred_url": "https://senapred.cl/alerta/se-declara-alerta-temprana-preventiva-...",
    "issued_at": "2026-06-02T11:45:00+00:00",
    "synced_at": "2026-06-02T19:46:16+00:00",
    "region_code": 10,
    "region_name": "Región de los Lagos",
    "is_monitor": false,
    "parent_id": null
  }
]
```

All risk values are 0–100 floats. Rate limits: 100 req/min (read), 60 (events), 30 (impact), 60 (alerts).

---

## Configuration

Edit the root `.env` file:

```env
USE_REAL_SENAPRED=true        # true = real alerts from SERNAPRED
SENAPRED_REFRESH_MINUTES=10   # SERNAPRED sync frequency
SENAPRED_ALERT_BASE_URL=https://senapred.cl/alerta/  # base para construir el link al artículo
RISK_REFRESH_MINUTES=15       # Risk recompute frequency
ENABLE_SCHEDULER=true
```

Full reference: `backend/.env.example`

---

## Architecture

```
Frontend (Next.js) → Backend (FastAPI) → PostgreSQL
                        ↓
           CSN / sismologia.cl   (sismos — HTML scrape)
           Open-Meteo            (temperatura/viento — batch REST)
           SERNAPRED             (alertas — AWS AppSync GraphQL + Cognito Identity)
```

- **Scheduler**: risk refresh (15 min), CSN sync (5 min), Open-Meteo update (60 min), SERNAPRED sync (10 min)
- **Seismic model**: Haversine distance + attenuation → intensity → risk score
- **Climate model**: Per-comuna (346 batched requests) → scores applied individually
- **SERNAPRED sync**: anonymous Cognito Identity Pool → STS temp creds → SigV4-signed GraphQL query `alertasByDate` → upsert local `senapred_alerts` table
- **Composite**: simple average of 4 hazard scores

---

## Detailed Reference

For complete documentation (models, services, code rules, commands), see:

```
backend/AGENTS.md
```

---

*Last updated: 2026-06-02 — SERNAPRED alerts integration*
