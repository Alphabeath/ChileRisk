# Backend — ChileRisk

**Stack:** Python 3.12 · FastAPI · SQLAlchemy 2.0 async · PostgreSQL 16 · APScheduler  
**Base URL:** `http://localhost:8000`  
**Índice operativo:** [AGENTS.md](../AGENTS.md)  
**Mantenimiento:** [../../docs/DOC-MAINTENANCE.md](../../docs/DOC-MAINTENANCE.md)  
**Playbooks:** [../../docs/HARNESS.md](../../docs/HARNESS.md)

---

## Contrato API (canónico)

| Fuente | Uso |
|--------|-----|
| **Runtime** | `GET /openapi.json` con el backend en marcha (`http://localhost:8000/openapi.json`) |
| **Swagger UI** | `http://localhost:8000/docs` |
| **Snapshot opcional** | `make export-openapi` → `backend/docs/openapi.json` (requiere deps Python del backend) |
| **Resumen humano** | Tablas de esta página |

Si OpenAPI y esta doc divergen, **OpenAPI gana**; actualiza las tablas aquí en el mismo task.

---

## Quick start

```bash
# Desde la raíz del monorepo
make up

# Solo mock
USE_REAL_CSN=false USE_REAL_METEO=false docker compose up --build

# Datos reales
USE_REAL_CSN=true USE_REAL_METEO=true USE_REAL_SENAPRED=true docker compose up --build

# Reset DB
make down-v && make up
```

Desarrollo nativo: `make dev-backend` (requiere DB; ver `backend/.env.example`).

---

## API — endpoints

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/health` | `{ status, version, uptime_seconds }` — **público** |
| POST | `/api/v1/auth/register` | Registro email/contraseña |
| POST | `/api/v1/auth/verify-credentials` | Validación login (servidor Next) |
| POST | `/api/v1/auth/oauth/google` | Upsert usuario Google |
| POST | `/api/v1/auth/forgot-password` | Solicitud reset (Resend) |
| POST | `/api/v1/auth/reset-password` | Cambio de contraseña |
| GET | `/api/v1/risk/national?date=` | Riesgo agregado por región (mapa) — **JWT** |
| GET | `/api/v1/risk/comunas?date=` | `composite_score` por comuna (coropleta) |
| GET | `/api/v1/regiones/{codregion}/risk` | Detalle región + comunas (live, sin `date`) |
| GET | `/api/v1/comunas/{cod_comuna}/risk?date=` | Vector de hazards de la comuna |
| GET | `/api/v1/events?date=` | Sismos del día calendario Chile |
| GET | `/api/v1/events/{id}/impact` | Impacto precomputado (hasta 50 comunas) |
| GET | `/api/v1/alerts/active?date=&region=&comuna=&level=&kind=&hazard=` | SERNAPRED + ChileRisk |
| GET | `/api/v1/stats/national` | Promedios y distribución severidad |
| GET | `/api/v1/stats/regiones/{codregion}` | Stats de región |
| GET | `/api/v1/stats/trends?days=7` | Placeholder |
| GET | `/api/v1/stats/compare?regiones=13,14,15` | Comparación (máx. 8) |
| GET | `/api/v1/family-plan` | Plan Familia Preparada del usuario (JSON) — **JWT** |
| PUT | `/api/v1/family-plan` | Upsert plan completo + `completion_pct` — **JWT** |

Parámetro `date`: `YYYY-MM-DD`, día civil Chile; default hoy; ventana 30 días — ver [QUERY-DATE.md](../../docs/QUERY-DATE.md).

### `GET /api/v1/alerts/active`

Fuentes unificadas en `ActiveAlertOut` (`app/schemas/alert.py`):

- **senapred** — alertas ATP (`record_kind=alerta`) y eventos “Sismos y otros” (`evento`)
- **chilerisk** — alertas generadas por umbrales de riesgo (`alert_evaluator`)

Filtros opcionales: `region` (1–16), `comuna`, `level`, `kind`, `hazard` (`sismo`, `volcan`, `incendio`, …).

Campos notables: `external_url`, `affected_scope`, `comuna_codes`, `thread_root_id`, `hazard_type`, scores ChileRisk cuando `source=chilerisk`.

Rate limits: lectura 100/min; events 60; impact 30; stats 50; alerts 60.

---

## Configuración

Root `.env` (Docker) o `backend/.env` (local). Plantilla: `backend/.env.example`.

| Variable | Default (típico) | Descripción |
|----------|------------------|-------------|
| `DATABASE_URL` | sqlite dev / postgres en compose | SQLAlchemy async |
| `BACKEND_CORS_ORIGINS` | localhost:3000,3001 | JSON array |
| `ENABLE_SCHEDULER` | true | Jobs en background |
| `RISK_REFRESH_MINUTES` | 15 | Recompute `risk_scores` |
| `USE_REAL_CSN` | true | Scraper sismologia.cl |
| `USE_REAL_METEO` | true | Open-Meteo por comuna |
| `USE_REAL_SENAPRED` | true | Sync GraphQL SERNAPRED |
| `SENAPRED_REFRESH_MINUTES` | 10 | Intervalo sync alertas |
| `SENAPRED_ALERT_BASE_URL` | https://senapred.cl/alerta/ | Link alertas |
| `SENAPRED_EVENT_BASE_URL` | https://senapred.cl/evento/ | Link eventos |
| `SENAPRED_COGNITO_IDENTITY_POOL_ID` | (público) | Pool anónimo AppSync |
| `SENAPRED_APPSYNC_ENDPOINT` | (URL GraphQL) | Endpoint AWS |
| `SENAPRED_LOOKBACK_DAYS` | 7 | Retención en tabla local |
| `CSN_BASE_URL` / `CSN_RECENT_PATH` | sismologia.cl | Scraper |
| `OPENMETEO_API_BASE` | api.open-meteo.com | Clima |
| `CACHE_TTL_SECONDS` | 300 | Cache general |
| `CACHE_METEO_TTL_SECONDS` | 21600 | Cache meteo |
| `AUTH_SECRET` | (requerido prod) | Mismo valor que Auth.js; valida `Authorization: Bearer` |
| `AUTH_URL` | http://localhost:3000 | Base para enlaces de reset |
| `RESEND_API_KEY` | — | Email recuperación contraseña |
| `AUTH_EMAIL_FROM` | noreply@… | Remitente Resend |

Rutas `/api/v1/risk|regiones|comunas|events|alerts|stats` exigen header `Authorization: Bearer <JWT HS256>` emitido por el proxy Next (`lib/api-token.ts`). `/api/v1/auth/*` y `/health` son públicos.

---

## Scheduler

| Job | Intervalo | Condición |
|-----|-----------|-----------|
| `risk_refresh` | `RISK_REFRESH_MINUTES` | siempre (si scheduler on) |
| `csn_sync` | 5 min | `USE_REAL_CSN=true` |
| `meteo_update` | 60 min | `USE_REAL_METEO=true` |
| `senapred_sync` | `SENAPRED_REFRESH_MINUTES` | `USE_REAL_SENAPRED=true` |

Definición: `app/scheduler/jobs.py`. Lifespan: `app/main.py` (seed, sync inicial, migraciones ligeras `senapred_alerts`).

---

## Modo híbrido

| CSN | Meteo | SERNAPRED | Comportamiento startup |
|-----|-------|-----------|------------------------|
| false | false | * | Mock eventos + scores iniciales |
| true | false | * | Sync CSN; clima mock |
| false | true | * | Mock sismos; meteo real |
| true | true | true | Solo fuentes reales; scores on-demand |

Con CSN+Meteo true **no** se generan mocks. `DailyRiskScore` se calcula al consultar fechas históricas.

---

## Modelos principales

| Modelo | Archivo | Rol |
|--------|---------|-----|
| Region, Comuna | `models/region.py`, `comuna.py` | Geografía 16 + 346 |
| RiskScore | `risk_score.py` | Score “live” por comuna |
| DailyRiskScore | `daily_risk_score.py` | Snapshot por `score_date` |
| SeismicEvent | `seismic_event.py` | CSN o mock |
| SeismicImpact | `seismic_impact.py` | Impacto precomputado evento↔comuna |
| ClimateReading | `climate_reading.py` | Lecturas Open-Meteo |
| SenapredAlert | `senapred_alert.py` | Cache alertas/eventos SERNAPRED |
| User, OAuthAccount, PasswordResetToken | `user.py`, … | Auth (SQLAlchemy único ORM) |
| FamilyPlan | `family_plan.py` | Plan Familia Preparada (1 por `user_id`, JSON) |

Schema MVP: `Base.metadata.create_all` + ALTER puntual en lifespan (sin Alembic). Cambios de schema → `docker compose down -v` o migración explícita acordada.

---

## Servicios (mapa)

| Servicio | Responsabilidad |
|----------|-----------------|
| `risk_service` | `recompute_all_scores` — lee `seismic_impacts`, no Haversine en loop |
| `daily_risk_service` | Snapshots por fecha; locks; advisory lock PG |
| `impact_service` | Precompute al llegar evento |
| `csn_service` | Scrape + dedup ±3 min |
| `openmeteo_service` | Batch 40 comunas/request |
| `senapred_service` | GraphQL paginado + upsert |
| `alert_service` | Lista unificada `/alerts/active` |
| `alert_evaluator` | Umbrales → alertas ChileRisk |
| `region_service` | Agregación regional + cache |
| `stats_service` | Endpoints `/stats/*` |
| `query_date_window` | TZ Chile, clamp 30 días |
| `aws_sigv4` | Cognito Identity + firma AppSync |
| `mock_service` | Generadores cuando flags off |
| `usgs_service` | **Deprecated** — no usar |

Detalle de attenuation, radios de impacto, paginación SERNAPRED: sección “Pitfalls” en [AGENTS.md](../AGENTS.md).

---

## Estructura de carpetas

```
backend/app/
├── main.py              # FastAPI + lifespan
├── config.py            # Settings
├── database.py
├── api/                 # routers (risk, events, alerts, …)
├── models/
├── schemas/             # Pydantic (contrato con frontend)
├── services/            # lógica de negocio
├── scheduler/jobs.py
├── data/                # seed GeoJSON + resolvers región
└── core/limiter.py      # SlowAPI (no importar desde main)
```

---

## Tests

`backend/tests/` — ventana de fechas, daily risk, lookback SERNAPRED. Ejecutar según entorno del desarrollador (no hay target `make test` en raíz aún).

---

## Referencias cruzadas

- Arquitectura: [../../docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
- ML (futuro): [ML-INTEGRATION.md](./ML-INTEGRATION.md)
- Frontend API client: `frontend/lib/api.ts`

---

*Last updated: 2026-06-05*