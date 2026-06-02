# AGENTS.md — ChileRisk Backend (v0.3)

Single source of truth for any coding agent working on the ChileRisk backend.

---

## Scope

- All backend work happens **exclusively inside `backend/`**
- Never modify files outside `backend/` (no frontend, TrueRisk, or root-level files)
- Docs updates in `docs/` require explicit user approval

---

## Tech Stack

- **Python 3.12** + **FastAPI** + **Pydantic v2** (pydantic-settings)
- **SQLAlchemy 2.0** (async) + **asyncpg** (Postgres) / **aiosqlite** (dev fallback)
- **PostgreSQL 16** (alpine, via Docker)
- **APScheduler 3.x** for background jobs
- **httpx** for async HTTP calls (CSN scraper, Open-Meteo)
- **beautifulsoup4** for CSN HTML parsing
- **cachetools** for in-memory TTL cache
- **slowapi** for rate limiting
- **python-json-logger** for structured logs
- **Docker** is the only supported deployment method

---

## Project Structure (actual)

```
backend/
├── app/
│   ├── main.py                    # FastAPI app + lifespan (seed + scheduler)
│   ├── config.py                  # pydantic-settings Settings singleton
│   ├── database.py                # async engine, session factory, Base
│   ├── core/
│   │   └── limiter.py             # SlowAPI Limiter instance (breaks circular imports)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                # get_db dependency
│   │   ├── risk.py                # GET /api/v1/risk/national
│   │   ├── regiones.py            # GET /api/v1/regiones/{codregion}/risk
│   │   ├── comunas.py             # GET /api/v1/comunas/{cod_comuna}/risk
│   │   ├── events.py              # GET /api/v1/events, /{id}/impact
│   │   ├── alerts.py              # GET /api/v1/alerts/active (SERNAPRED)
│   │   └── stats.py               # GET /api/v1/stats/national, regiones, trends, compare
│   ├── models/
│   │   ├── __init__.py
│   │   ├── region.py              # Region (codregion PK, name, area_km)
│   │   ├── comuna.py              # Comuna (cod_comuna PK, FK region, name, lat, lon)
│   │   ├── risk_score.py          # RiskScore (4 hazards + composite + severity + indexes)
│   │   ├── seismic_event.py       # SeismicEvent (lat, lon, mag, depth, time, source)
│   │   ├── climate_reading.py     # ClimateReading (per-comuna temp/wind + scores)
│   │   ├── seismic_impact.py      # SeismicImpact (precomputed event-comuna impacts)
│   │   └── senapred_alert.py      # SenapredAlert (synced from senapred.cl)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── risk.py                # Pydantic response models for risk endpoints
│   │   ├── event.py               # Pydantic response models for event endpoints
│   │   └── alert.py               # SenapredAlertOut Pydantic model (SERNAPRED)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── risk_service.py        # recompute_all_scores: main risk engine (reads precomputed impacts)
│   │   ├── region_service.py      # Region aggregation + real climate regional average
│   │   ├── seismic_service.py     # Haversine + attenuation model (utility functions)
│   │   ├── impact_service.py      # Precompute seismic impacts per event-comuna
│   │   ├── mock_service.py        # Mock generators (seismic events + risk scores)
│   │   ├── csn_service.py         # CSN / sismologia.cl scraper + auto impact computation
│   │   ├── openmeteo_service.py   # Open-Meteo batch API + per-comuna climate storage
│   │   ├── senapred_service.py    # SERNAPRED GraphQL sync (parser + upsert)
│   │   ├── aws_sigv4.py           # Cognito Identity client + SigV4 signer for AppSync
│   │   ├── stats_service.py       # National/region/trend/compare aggregations
│   │   └── usgs_service.py        # DEPRECATED — do not use
│   ├── data/
│   │   ├── __init__.py
│   │   ├── seed_regions.py        # Load 16 regions from regional.geojson
│   │   ├── seed_comunas.py        # Load 346 comunas from comunas.geojson
│   │   └── region_name_to_code.py # SERNAPRED region-name → codregion resolver
│   └── scheduler/
│       ├── __init__.py            # re-exports setup_scheduler, shutdown_scheduler
│       └── jobs.py                # APScheduler job definitions + setup
├── pyproject.toml                 # Dependencies + build config
├── Dockerfile                     # python:3.12-slim (single stage; uses entrypoint.sh)
├── entrypoint.sh                  # Stub: reserved for future migrations
└── .env.example                   # Template for environment variables
```

> No `alembic/` yet. Schema is created via `Base.metadata.create_all` in the lifespan. Don't introduce migrations without an explicit migration story.

---

## Configuration (app/config.py)

All config via `pydantic-settings`. Loaded from environment + `.env` file.

### Environment Variables

| Variable               | Default                                    | Description |
|------------------------|--------------------------------------------|-------------|
| `DATABASE_URL`         | `sqlite+aiosqlite:///./dev.db`             | Async SQLAlchemy connection string |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:3000","http://localhost:3001"]` | JSON array of allowed origins |
| `ENABLE_SCHEDULER`     | `true`                                     | Enable/disable all background jobs |
| `RISK_REFRESH_MINUTES` | `15`                                       | Frequency of the main risk recompute job |
| `USE_REAL_CSN`         | `true`                                     | `true` = fetch live earthquakes from CSN |
| `USE_REAL_METEO`       | `true`                                     | `true` = fetch live weather from Open-Meteo |
| `USE_REAL_SENAPRED`    | `true`                                     | `true` = fetch live alerts from SERNAPRED |
| `CSN_BASE_URL`         | `https://www.sismologia.cl`               | CSN website base URL |
| `CSN_RECENT_PATH`      | `/`                                        | Path to the recent earthquakes page |
| `OPENMETEO_API_BASE`   | `https://api.open-meteo.com/v1`           | Open-Meteo API base URL |
| `SENAPRED_REFRESH_MINUTES` | `10`                                  | SERNAPRED sync frequency |
| `SENAPRED_AWS_REGION`  | `us-east-1`                                | AWS region for Cognito + AppSync |
| `SENAPRED_COGNITO_IDENTITY_POOL_ID` | `us-east-1:17c696bc-53e1-49a2-991f-f1b65f752fda` | Public Identity Pool (NOT a secret) for anonymous access to SERNAPRED GraphQL |
| `SENAPRED_APPSYNC_ENDPOINT` | `https://rz2uv7ifxbgflh2bqmp6kmh4le.appsync-api.us-east-1.amazonaws.com/graphql` | SERNAPRED AppSync GraphQL endpoint |
| `SENAPRED_ALERT_BASE_URL` | `https://senapred.cl/alerta/`            | Base URL prepended to each `urlAccess` slug to produce the full link to the SERNAPRED article (returned as `senapred_url` in the API) |
| `SENAPRED_LOOKBACK_DAYS` | `7`                                      | Days of history to keep in the local table |
| `CACHE_TTL_SECONDS`    | `300`                                      | General cache TTL (5 min) |
| `CACHE_METEO_TTL_SECONDS` | `21600`                                | Meteo cache TTL (6 hours) |

### Docker Compose

When using Docker, the root `.env` file is loaded via `env_file:` directive. Edit `/home/bryan/Proyectos/ChileRisk/.env` to change toggles.

---

## Data Models (SQLAlchemy)

### Region (`app/models/region.py`)
- `codregion`: int (PK, 1-16)
- `name`: str
- `area_km`: float

### Comuna (`app/models/comuna.py`)
- `cod_comuna`: int (PK)
- `name`: str
- `provincia`: str
- `codregion`: int (FK → Region)
- `latitude`, `longitude`: float (centroid)
- `area_km`: float

### RiskScore (`app/models/risk_score.py`)
- `id`: int (PK)
- `cod_comuna`: int (FK, indexed)
- `sismo_score`, `ola_calor_score`, `ola_frio_score`, `viento_score`: float (0-100)
- `composite_score`: float (0-100)
- `dominant_hazard`: str ("sismo" | "ola_calor" | "ola_frio" | "viento")
- `severity`: str ("bajo" | "moderado" | "alto" | "critico")
- `computed_at`: datetime (timezone-aware)
- **Indexes**: `(cod_comuna, computed_at)`, `(severity)`

### SeismicEvent (`app/models/seismic_event.py`)
- `id`: int (PK)
- `latitude`, `longitude`: float
- `magnitude`: float
- `depth_km`: float
- `occurred_at`: datetime (timezone-aware)
- `source`: str ("mock" | "csn")
- `raw_data`: JSON (nullable)
- `created_at`: datetime
- **Indexes**: `(occurred_at)`, `(source)`

### ClimateReading (`app/models/climate_reading.py`)
- `id`: int (PK)
- `cod_comuna`: int (indexed)
- `temperature_c`: float
- `wind_speed_kmh`: float
- `ola_calor_score`, `ola_frio_score`, `viento_score`: float
- `measured_at`: datetime (timezone-aware)
- `source`: str ("openmeteo")
- `created_at`: datetime
- **Indexes**: `(cod_comuna, measured_at)`

### SeismicImpact (`app/models/seismic_impact.py`)
- `id`: int (PK)
- `event_id`: int (indexed)
- `cod_comuna`: int (indexed)
- `distance_km`: float
- `estimated_intensity`: float (0-10)
- `risk_score`: float (0-100)
- `computed_at`: datetime
- **Indexes**: `(event_id)`, `(cod_comuna)`, `(event_id, cod_comuna)` unique

### SenapredAlert (`app/models/senapred_alert.py`)
- `id`: int (PK surrogate)
- `senapred_id`: str (SERNAPRED UUID, **unique index**)
- `kind`: str ("alerta")
- `level`: str ("preventiva" | "amarilla" | "naranja" | "roja")
- `title`, `content`, `url_access`, `category`: str
- `is_active`, `is_monitor`: bool
- `parent_id`: str | None
- `senapred_issued_at`: datetime (indexed DESC)
- `synced_at`: datetime
- `region_code`: int | None (indexed)
- `region_name`: str | None
- `meta_data`: JSON (SERNAPRED metaData blob)
- `raw`: JSON (full GraphQL item)
- **Indexes**: `senapred_id` unique, `(senapred_issued_at)`, `(is_active, level, senapred_issued_at)`, `(region_code, is_active, senapred_issued_at)`, `(parent_id)`

---

## API Endpoints

### Health
- `GET /health` → `{ status, version, uptime_seconds }`

### Risk
- `GET /api/v1/risk/national` → list of region risk entries (for map)

### Regions
- `GET /api/v1/regiones/{codregion}/risk` → region detail + comuna list

### Comunas
- `GET /api/v1/comunas/{cod_comuna}/risk` → single comuna hazard vector

### Events
- `GET /api/v1/events?hours=48` → recent seismic events
- `GET /api/v1/events/{id}/impact` → impact on up to 50 comunas

### Stats
- `GET /api/v1/stats/national` → national averages, severity distribution, top/bottom regions
- `GET /api/v1/stats/regiones/{codregion}` → region statistics
- `GET /api/v1/stats/trends?days=7` → trend data (placeholder)
- `GET /api/v1/stats/compare?regiones=13,14,15` → side-by-side comparison (max 8)

### Alerts
- `GET /api/v1/alerts/active?region={1-16}&level={preventiva|amarilla|naranja|roja}` → SERNAPRED alerts currently active

### Rate Limits
- Most read endpoints: 100 req/min/IP
- Events list: 60/min, Impact: 30/min, Stats: 50/min, Alerts: 60/min

---

## Services

### risk_service.py — Main Risk Engine
- `recompute_all_scores(session)` → recomputes all 346 comuna risk scores
- Reads precomputed seismic impacts from `seismic_impacts` (no Haversine recalculation)
- Also updates climate scores from mock if not in real mode
- Computes `composite_score`, `dominant_hazard`, `severity` for each comuna

### seismic_service.py — Seismic Model (utility)
- `haversine_km(lat1, lon1, lat2, lon2)` → distance in km
- `estimate_intensity(mag, dist_km, depth_km)` → intensity 0-10
- `intensity_to_risk_score(intensity)` → 0-100 risk score
- Attenuation: `intensity = mag - 2.2*log10(dist+10) - depth/80`
- Used by impact_service and events endpoint (fallback only)

### impact_service.py — Precomputed Seismic Impact
- `compute_and_store_event_impact(session, event)` → calculates impact of one event on all comunas within max radius, stores in `seismic_impacts`
- `get_max_risk_per_comuna_from_impacts(session, hours=24)` → returns `{cod_comuna: max_risk_score}` for recent impacts
- Called automatically after each CSN sync and after mock event generation
- Max affected radius: `max(20, 50 * (magnitude - 2.0))` km

### csn_service.py — CSN Real Data
- Scrapes HTML from sismologia.cl (main page + detail pages)
- Parses lat/lon/mag/depth/time from individual report pages
- `sync_recent_csn_events(session, hours=48)` → inserts new events with source="csn"
- After each new event, automatically calls `compute_and_store_event_impact`
- Deduplication: skips events with same time (±3min) + magnitude

### openmeteo_service.py — Climate Real Data (v2 — batch + storage)
- `update_climate_scores_from_real_data(session)` → main orchestrator
  - Loads all 346 comunas with coordinates
  - Fetches weather in batches of 40 from Open-Meteo (comma-separated coordinates)
  - Stores each reading in `climate_readings` table
  - Updates `risk_scores` with per-comuna values
- `temperature_to_heat_score(temp_c)` → ola_calor score
- `temperature_to_cold_score(temp_c)` → ola_frio score
- `wind_to_score(wind_kmh)` → viento score

### region_service.py — Region Aggregation (v2 — real climate average)
- `get_region_aggregated_risk(session, codregion)` → includes `avg_temperature_c` and `avg_wind_speed_kmh` from `climate_readings`
- `get_all_regions_aggregated(session)` → cached list of all regions

### mock_service.py — Mock Data
- `generate_initial_seismic_events(session)` → creates 12 mock events
- `seed_initial_risk_scores(session)` → creates one RiskScore per comuna
- `recompute_all_scores` also uses mock logic when real sources are off

### stats_service.py — Statistics
- `get_national_stats(session)` → national averages, severity distribution
- `get_region_stats(session, codregion)` → region detail stats
- `get_trends(session, days)` → placeholder
- `compare_regions(session, codregion_list)` → side-by-side

### senapred_service.py — SERNAPRED Real Data
- `fetch_senapred_alerts(lookback_days, max_pages)` → paginated GraphQL fetch with SigV4-signed requests
- `sync_senapred_alerts(session)` → upsert by `senapred_id` (PG `ON CONFLICT`, SQLite fallback); prunes stale rows outside the lookback window
- `_parse_alert(raw)` → maps `codigoAlertaEvento` (`v`→preventiva, `a`→amarilla, `n`→naranja, `r`→roja), detects `is_active` and `is_monitor` from `titulo`, resolves `region_code` via `region_name_to_code.resolve()`
- GraphQL query: `alertasByDate(type: "Alerta", fechaHora: {ge: <cutoff>}, filter: {isDeleted: {eq: false}}, sortDirection: DESC, limit: 100, nextToken)`

### aws_sigv4.py — Cognito Identity + SigV4
- `CognitoIdentityClient(identity_pool_id, region, refresh_buffer_seconds=600)`:
  - Cachea credenciales STS de Cognito (default 50 min de margen, viven 1 h)
  - `get_credentials() -> StsCredentials` (async, thread-safe)
- `sign_appsync_request(method, url, body, credentials, region, service="appsync")`:
  - Devuelve headers `Authorization`, `X-Amz-Date`, `X-Amz-Security-Token`, `Content-Type` listos para `httpx`
- `is_credential_error(payload)` → detecta errores 401/expirados en respuestas GraphQL para forzar refresh

---

## Scheduler Jobs (app/scheduler/jobs.py)

| Job ID       | Function                       | Interval              | Condition |
|--------------|--------------------------------|-----------------------|-----------|
| `risk_refresh` | `_refresh_risk_scores`       | `RISK_REFRESH_MINUTES` (default 15) | Always |
| `csn_sync`     | `_sync_real_seismic_events`  | 5 min                 | `USE_REAL_CSN=true` |
| `meteo_update` | `_update_real_climate_scores` | 60 min               | `USE_REAL_METEO=true` |
| `senapred_sync`| `_sync_senapred_alerts`      | `SENAPRED_REFRESH_MINUTES` (default 10) | `USE_REAL_SENAPRED=true` |

> **Note**: the meteo log message in `jobs.py:80` says "every 45 min" but the actual `IntervalTrigger(minutes=60)` is the source of truth. The log line is stale — fix the message if you touch that block.

### Startup Behavior (lifespan in main.py)

1. Create tables (`Base.metadata.create_all`)
2. Seed regions + comunas (always, idempotent)
3. If `USE_REAL_CSN=false` → generate mock seismic events + compute impacts
4. If NOT both real flags → seed initial risk scores
5. If `USE_REAL_CSN=true` → sync CSN events (last 24h) + auto-compute impacts
6. If `USE_REAL_SENAPRED=true` → initial SERNAPRED sync (errors are logged but don't block startup)
7. Start scheduler

---

## Hybrid Data Mode

### Behavior Matrix

| `USE_REAL_CSN` | `USE_REAL_METEO` | `USE_REAL_SENAPRED` | Startup behavior | Seismic source | Climate source | Alerts source |
|----------------|------------------|----------------------|------------------|----------------|----------------|----------------|
| false          | false            | *                    | Full mock seed   | Mock generators | Mock generators | Mock (none) |
| true           | false            | *                    | CSN sync only    | CSN/sismologia.cl | Mock generators | SERNAPRED (if true) |
| false          | true             | *                    | Mock events + meteo seed | Mock generators | Open-Meteo | SERNAPRED (if true) |
| true           | true             | true                 | Real sync only   | CSN/sismologia.cl | Open-Meteo | SERNAPRED |
| true           | true             | false                | Real sync only   | CSN/sismologia.cl | Open-Meteo | (empty table) |

**Important**: When both flags are `true`, **no mock data is generated**. RiskScore rows are created on-demand by the meteo service or by the recompute job.

### How Climate Updates Work (per comuna, batched)

Open-Meteo is queried using **batch requests** (comma-separated coordinates):
- All 346 comunas are loaded with their lat/lon from the DB
- Coordinates are sent in batches of 40 per HTTP request (~9 requests total)
- Each comuna gets its own **individual temperature and wind reading**
- Readings are stored in `climate_readings` table
- `risk_scores` are updated with per-comuna values
- Regional averages are computed dynamically from `climate_readings`

### How Seismic Events Relate to Comunas (precomputed)

The relationship between seismic events and comunas is **precomputed and stored** in `seismic_impacts`:
- When a new event arrives (CSN sync or mock), `impact_service.compute_and_store_event_impact` is called
- It calculates Haversine distance from event epicenter to each comuna
- Only comunas within the max affected radius are computed: `max(20, 50 * (magnitude - 2.0))` km
- Results are stored in `seismic_impacts` (event_id, cod_comuna, distance_km, intensity, risk_score)
- During `recompute_all_scores`, the service reads precomputed impacts instead of recalculating
- This eliminates ~34,600 Haversine calculations per recompute cycle

### How SERNAPRED Alerts Work (no user credentials)

- The SERNAPRED web app at `senapred.cl/sismos-alertas` reads from an AWS AppSync GraphQL endpoint that uses **Amazon Cognito Identity Pools** for unauthenticated public access
- Our service mirrors that flow: `CognitoIdentityClient.get_credentials()` returns temporary STS credentials (`AccessKeyId`/`SecretAccessKey`/`SessionToken`) valid for ~1h
- Every GraphQL POST is signed with SigV4 (`sign_appsv4_request()`) using those temp creds
- Credentials are cached for 50 min to avoid hammering the Identity service (1 h validity)
- The GraphQL query is `alertasByDate(type: "Alerta", fechaHora: {ge: <cutoff>}, filter: {isDeleted: {eq: false}}, sortDirection: DESC, limit: 100, nextToken)` — paginated by `nextToken`
- The Identity Pool ID is **public** (not a secret) — it's the same value the SENAPRED SPA bundles in their `static/js/main.*.js`. Anyone can call `GetId` against it. If the SENAPRED team rotates the ID or disables unauthenticated access, the sync will fail and the last successful sync's data remains in our DB
- Region names from `metaData.regiones` (e.g. `"Región de los Lagos"`) are mapped to our `codregion` (1-16) via `app/data/region_name_to_code.py:resolve()`

---

## Code Rules

### Style
- No comments unless explicitly requested by the user
- Type hints everywhere (Python 3.12 syntax)
- Keep functions under 50 lines when possible
- Async functions for all DB and HTTP operations

### Patterns
- All DB access via `AsyncSession` from `app.database`
- Use `app.core.limiter.limiter` for rate limiting (never import from `app.main`)
- All config from `app.config.settings` singleton
- External HTTP calls via `httpx.AsyncClient`
- Cache with `cachetools.TTLCache` (in-memory)

### Prohibited
- Do not modify `pyproject.toml` without explicit approval
- Do not add new dependencies without updating the plan first
- Do not create files outside `backend/` without explicit approval
- Do not run `git commit`, `git push`, or create PRs
- Do not import from `app.main` in any API router (circular import)
- Do not hardcode API URLs — always use `settings.*`

### Required After Changes
1. Verify syntax: `python3 -m py_compile app/path/to/file.py`
2. Ensure all imports resolve (no circular dependencies)
3. Rebuild Docker: `docker compose up --build`

---

## Quick Reference Commands

From repo root: `make up`, `make clean` (caches), `make logs-backend`, `make help` (see root Makefile + docs/ARCHITECTURE.md "Monorepo Structure"). Frontend uses bun (see its Dockerfile and AGENTS).

```bash
# Start with real CSN data
USE_REAL_CSN=true USE_REAL_METEO=false docker compose up --build

# Start with both real sources
USE_REAL_CSN=true USE_REAL_METEO=true docker compose up --build

# Start mock-only
USE_REAL_CSN=false USE_REAL_METEO=false docker compose up --build

# Clean database (removes all data)
docker compose down -v && docker compose up --build

# Check hybrid mode variables inside container
docker compose exec backend env | grep -E "(USE_REAL|CSN|METEO)"

# Verify CSN events in DB
docker compose exec db psql -U chilerisk -d chilerisk -c \
  "SELECT source, COUNT(*) FROM seismic_events GROUP BY source;"

# Verify risk scores distribution
docker compose exec db psql -U chilerisk -d chilerisk -c \
  "SELECT dominant_hazard, COUNT(*) FROM risk_scores GROUP BY dominant_hazard;"

# Force manual CSN sync
docker compose exec backend python -c "
import asyncio
from app.services.csn_service import sync_recent_csn_events
from app.database import async_session
async def t():
    async with async_session() as s:
        n = await sync_recent_csn_events(s, 24)
        print(f'Inserted: {n}')
asyncio.run(t())
"

# Force manual climate update
docker compose exec backend python -c "
import asyncio
from app.services.openmeteo_service import update_climate_scores_from_real_data
from app.database import async_session
async def t():
    async with async_session() as s:
        n = await update_climate_scores_from_real_data(s)
        print(f'Updated: {n}')
asyncio.run(t())
"

# Force full recompute
docker compose exec backend python -c "
import asyncio
from app.database import async_session
from app.services.risk_service import recompute_all_scores
async def t():
    async with async_session() as s:
        n = await recompute_all_scores(s)
        print(f'Recomputed: {n}')
asyncio.run(t())
"
```

---

## Decision rules

### "Where do I put a new X?"

| You want to add...                       | Put it in...                                | Notes |
|------------------------------------------|---------------------------------------------|-------|
| A new HTTP endpoint                      | `app/api/<resource>.py` + register in `app/main.py` | One file per resource, mount under `/api/v1/<resource>` |
| The Pydantic response model for it       | `app/schemas/<resource>.py`                 | If cross-cutting (e.g., shared by events + stats), put in the most specific file |
| A new ORM model                          | `app/models/<entity>.py` + import from `app/models/__init__.py` | Always with indexes on hot columns |
| A new service / business logic            | `app/services/<thing>_service.py`           | Async functions; take `AsyncSession` as first arg |
| A new background job                     | extend `app/scheduler/jobs.py`              | `IntervalTrigger`, `replace_existing=True`, gate on a settings flag |
| A new external data source               | `app/services/<source>_service.py`          | Mirror the shape of `csn_service.py` / `openmeteo_service.py` / `senapred_service.py` |
| A new env var                            | `app/config.py:Settings` + root `.env.example` + table in this file | Use lowercase field; pydantic-settings maps to UPPER_SNAKE_CASE |
| A rate-limited endpoint                  | decorate with `@limiter.limit("X/minute")` from `app.core.limiter` | Never import `limiter` from `app.main` (circular) |
| A new GeoJSON seed file                  | `app/data/<file>.geojson` + load in `app/data/seed_*.py` | Idempotent upsert keyed on PK |

### "I'm adding a new endpoint. What's the skeleton?"

```python
# app/api/foo.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.schemas.foo import FooOut

router = APIRouter()

@router.get("/foo", response_model=list[FooOut])
async def list_foo(session: AsyncSession = Depends(get_db)):
    ...
```

Then in `app/main.py`:
```python
from app.api import foo
app.include_router(foo.router, prefix="/api/v1/foo", tags=["foo"])
```

If the endpoint should be rate-limited, import `limiter` from `app.core.limiter` and add the decorator. Do **not** import from `app.main`.

### "I'm adding a new model. What's the minimum?"

- Inherit from `Base` (`app.database.Base`).
- Add it to `app/models/__init__.py` so `Base.metadata` sees it before `create_all` runs.
- Index any column used in `WHERE` clauses of hot paths (risk recompute, GeoJSON enrichment, scheduler jobs).

---

## Pitfalls (learned the hard way — don't repeat them)

- **Circular import between `app.main` and routers**: routers that need `limiter` must import from `app.core.limiter`, never from `app.main`. The `app/core/` package exists to break this cycle. Adding a new shared singleton? Put it in `app/core/`, not in `main.py`.
- **Haversine in the hot loop**: `recompute_all_scores` reads from `seismic_impacts` (precomputed) — it does *not* call `haversine_km` per comuna. Don't regress this. When you need per-event impact, call `impact_service.compute_and_store_event_impact` once at event arrival, not inside the recompute loop.
- **Max affected radius is magnitude-driven**: `max(20, 50 * (magnitude - 2.0))` km. Comunas outside that radius are skipped to keep the impact table small. If you see "this comuna was affected" assertions failing, check the radius first.
- **CSN dedup window is ±3 min + magnitude match**: `sync_recent_csn_events` skips near-duplicates to avoid double-inserting when sismologia.cl reorders events on the page. Don't tighten the window without understanding why it exists.
- **Meteo batch size is 40**: 346 comunas / 40 ≈ 9 HTTP requests per refresh. Changing this number has cost implications (rate limits, latency) — discuss before changing.
- **SERNAPRED pagination limit is 100**: configurable in `senapred_service.fetch_senapred_alerts()`. Max 20 pages per sync to avoid runaway. Lookback is `SENAPRED_LOOKBACK_DAYS` (default 7).
- **Cognito credentials cache TTL is 50 min**: STS creds live 1h; the 10-min buffer avoids signing requests with creds about to expire. Tunable via `CognitoIdentityClient(refresh_buffer_seconds=...)`.
- **`Base.metadata.create_all` is the only schema mechanism**: it adds missing tables/columns but does not drop or alter existing ones. For a real migration story we'd need Alembic. Right now, schema changes require `docker compose down -v` to wipe the volume.
- **Settings are loaded from `.env` once at import**: `app.config.settings` is a module-level singleton. Tests that need to flip `USE_REAL_CSN` must monkeypatch the settings object — `pydantic-settings` does not re-read env at runtime.
- **`region_service` caches** (`_national_cache`, `_region_cache`) are module-level. The lifespan clears them on startup. If you add caching elsewhere, clear it in the same place.
- **`async_session` is the session factory**; the `get_db` FastAPI dependency yields from it. Don't open a second session inside a service that already received one.

---

## ML Readiness (Future — not implemented yet)

The following is the documented plan for future ML integration. None of this is implemented yet.

### Tables needed (future)

| Table | Purpose |
|-------|---------|
| `risk_score_history` | Periodic snapshots of all scores (time series for training) |
| `ml_features` | Computed features per comuna + timestamp |
| `ml_models` | Model metadata (version, metrics, training date) |
| `ml_predictions` | Model predictions vs actuals (feedback loop) |

### Candidate features for the model

- `sismo_score_24h_max`, `sismo_score_7d_avg`
- `ola_calor_score_current`, `ola_calor_score_3d_trend`
- `ola_frio_score_current`, `viento_score_current`
- `temperature_c_current`, `wind_speed_kmh_current`
- `distance_to_last_earthquake_km`, `magnitude_last_event`
- `population_density` (future external data)
- `distance_to_coast_km` (future geospatial)
- `elevation_m` (future geospatial)
- `month`, `season` (seasonality encoding)

### Proposed architecture

```
Scheduler → every N minutes:
  1. Compute features from current data
  2. Store in ml_features table
  3. If trained model exists → predict score
  4. Store prediction in ml_predictions
  5. Compare prediction vs actual → feedback loop
```

### Design considerations for current code

- `climate_readings` table provides historical temperature/wind data for time-series features
- `seismic_impacts` table provides precomputed impact data for seismic features
- `risk_scores` with `computed_at` provides the target variable history
- All current scoring functions can serve as baseline features for the ML model

---

**Last updated**: 2026-06-02 (v0.4.1 — SERNAPRED `senapred_url` link to source article: new `senapred_alert_base_url` env var, `SenapredAlertOut.senapred_url` field computed in `alerts.py`)
