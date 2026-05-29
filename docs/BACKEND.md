# BACKEND.md — ChileRisk API Reference

**Base URL (local)**: `http://localhost:8000`

All endpoints return JSON. All risk values are 0–100 floats.

---

## Core Concepts

- **Comuna** (346): Smallest administrative unit with its own risk vector.
- **Region** (16): Aggregation of the comunas that belong to it (uniform average for MVP).
- **Hazard**: `sismo`, `ola_calor`, `ola_frio`, `viento`
- **Severity**: `bajo` | `moderado` | `alto` | `critico` (derived from composite score)

---

## Endpoints

### Health
`GET /health`
→ `{ "status": "ok", "version": "0.1.0", "uptime_seconds": 123.4 }`

### National Overview (Map)
`GET /api/v1/risk/national`
→ `NationalRiskEntry[]`

Each entry:
```json
{
  "codregion": 13,
  "name": "Región de Los Ríos",
  "composite_score": 47.3,
  "dominant_hazard": "ola_frio",
  "severity": "moderado",
  "comuna_count": 12
}
```

### Region Detail
`GET /api/v1/regiones/{codregion}/risk`

Returns the aggregated scores for the region plus the list of all its comunas with individual scores.

### Comuna Detail
`GET /api/v1/comunas/{cod_comuna}/risk`

Returns full hazard vector + metadata for one comuna.

### Seismic Events
`GET /api/v1/events?hours=48`

Recent events (mock data in MVP).

`GET /api/v1/events/{id}/impact`

Returns the event + up to 50 most affected comunas with estimated intensity and risk contribution from that single event (computed via Haversine + attenuation).

### Alerts (MVP stub)
`GET /api/v1/alerts/active`
→ `[]`

---

## Data Models (selected)

### RiskScore (internal)
- `sismo_score`, `ola_calor_score`, `ola_frio_score`, `viento_score`
- `composite_score`, `dominant_hazard`, `severity`, `computed_at`

### SeismicEvent
- `latitude`, `longitude`, `magnitude`, `depth_km`, `occurred_at`, `source`

---

## Seismic Impact Model (MVP)

- Haversine distance from epicenter to comuna centroid
- Attenuation: `intensity = mag - 2.2*log10(dist+10) - depth/80`
- Intensity (0-10) linearly mapped to risk score (0-100)
- Only events from the last 24 h affect live scores
- Future: when CSN data is integrated, official intensities will override the calculated ones

---

## Mock Data Behavior

- On first startup: 12 recent seismic events + one RiskScore per comuna are generated.
- Every 15 minutes (configurable): small random walk (±2.8 pts) is applied to all hazard scores and composites are recalculated.
- North regions bias toward `ola_calor` + high `sismo`
- South regions bias toward `ola_frio` + `viento`

---

## Running Locally

### With Docker (recommended)
```bash
docker compose up --build
```

### Backend only (dev)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Use `DATABASE_URL=sqlite+aiosqlite:///./dev.db` for zero-dependency local testing.

---

## Future Work (documented in BACKEND-PLAN.md)

- Real data sources (CSN, MeteoChile, CONAF)
- Population-weighted regional aggregation
- Alert generation engine
- Authentication & rate limiting
- PostGIS for geospatial queries

---

*Last updated: 2026-05-28 (MVP complete)*
