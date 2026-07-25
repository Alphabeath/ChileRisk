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
| **Contrato FE** | `make sync-contract` → `frontend/lib/api-schema.d.ts` (commiteado; `make verify-contract` falla si hay drift) |
| **Resumen humano** | Tablas de esta página |

Si OpenAPI y esta doc divergen, **OpenAPI gana**; actualiza las tablas aquí en el mismo task.

---

## Quick start

```bash
# Desde la raíz del monorepo
make up

# Datos reales (por defecto)
USE_REAL_CSN=true USE_REAL_METEO=true USE_REAL_SENAPRED=true docker compose up --build

# Para deshabilitar una fuente (sin datos mock de reemplazo):
# USE_REAL_CSN=false USE_REAL_METEO=true ...

# Reset DB
make down-v && make up
```

Desarrollo nativo: `make dev-backend` (requiere DB; ver `backend/.env.example`).

---

## API — endpoints

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/health` | `{ status, version, uptime_seconds, sync[] }` — **público** (`sync` = resumen sin errores) |
| GET | `/api/v1/system/sync-status` | Última corrida por job (`csn_sync`, `meteo_update`, …) — **JWT** |
| POST | `/api/v1/auth/register` | Registro email/contraseña |
| POST | `/api/v1/auth/verify-credentials` | Validación login (servidor Next) |
| POST | `/api/v1/auth/oauth/google` | Upsert usuario Google |
| POST | `/api/v1/auth/forgot-password` | Solicitud reset (Resend) |
| POST | `/api/v1/auth/reset-password` | Cambio de contraseña |
| GET | `/api/v1/risk/national?date=` | Riesgo agregado por región (mapa) — **JWT** |
| GET | `/api/v1/risk/comunas?date=` | `composite_score` por comuna (coropleta) |
| GET | `/api/v1/regiones/{codregion}/risk` | Detalle región + comunas (live, sin `date`) |
| GET | `/api/v1/comunas/nearest?lat=&lon=` | Comuna más cercana al GPS (centroide) — **JWT** |
| GET | `/api/v1/comunas/{cod_comuna}/risk?date=` | Vector de hazards de la comuna |
| GET | `/api/v1/events?date=` | Sismos del día calendario Chile |
| GET | `/api/v1/events/{id}/impact` | Impacto precomputado (hasta 50 comunas) |
| GET | `/api/v1/alerts/active?date=&region=&comuna=&level=&kind=&hazard=` | SERNAPRED + ChileRisk + SERNAGEOMIN |
| GET | `/api/v1/stats/national` | Promedios y distribución severidad |
| GET | `/api/v1/stats/regiones/{codregion}` | Stats de región |
| GET | `/api/v1/stats/trends?days=7` | Placeholder |
| GET | `/api/v1/stats/compare?regiones=13,14,15` | Comparación (máx. 8) |
| GET | `/api/v1/family-plan` | Plan Familia Preparada del usuario (JSON) — **JWT** |
| PUT | `/api/v1/family-plan` | Upsert plan completo + `completion_pct` — **JWT** |
| GET | `/api/v1/simulacros?from=&to=&region=&type=&source=&upcoming_only=&past_only=&limit=&offset=` | Calendario SERNAPRED (próximos + pasados) — **JWT** |
| GET | `/api/v1/simulacros/next` | Próximo simulacro (`drill_date >= hoy`) o `null` — **JWT** |
| GET | `/api/v1/simulacros/{slug}` | Detalle (incluye `summary`, `participating_comunas`, `mensaje_sae`) — **JWT** |
| GET | `/api/v1/air-quality?date=&region=&episode_only=` | Condiciones GEC Aire Chile del día (zonas PPDA) — **JWT** |
| GET | `/api/v1/air-quality/by-comuna/{cod}?date=` | Lookup por CUT (404 si no cubierta) — **JWT** |
| GET | `/api/v1/air-quality/{slug}?date=` | Detalle zona (medidas, pronóstico, restricciones) — **JWT** |
| POST | `/api/v1/chat` | Asistente ciudadano (DeepSeek + tools) — **JWT** |
| POST | `/api/v1/chat/stream` | Mismo agente vía SSE (`token` / `done`) — **JWT** |
| GET | `/api/v1/chat/threads` | Historial de hilos del usuario — **JWT** |
| GET | `/api/v1/chat/threads/{id}` | Detalle de hilo + mensajes — **JWT** |
| GET | `/api/v1/users/me` | Perfil (`home_comuna_code`) — **JWT** |
| PATCH | `/api/v1/users/me` | Actualizar comuna de hogar — **JWT** |
| GET | `/api/v1/meeting-points/nearest?lat=&lon=&hazard=&limit=` | Puntos de encuentro oficiales más cercanos — **JWT** |
| GET | `/api/v1/disaster-guides` | Guías estáticas de preparación — **JWT** |
| GET | `/api/v1/disaster-guides/{slug}` | Guía por slug — **JWT** |

Parámetro `date`: `YYYY-MM-DD`, día civil Chile; default hoy; ventana 30 días — ver [QUERY-DATE.md](../../docs/QUERY-DATE.md).

### `GET /api/v1/alerts/active`

Fuentes unificadas en `ActiveAlertOut` (`app/schemas/alert.py`):

- **senapred** — alertas ATP (`record_kind=alerta`) y eventos “Sismos y otros” (`evento`)
- **chilerisk** — alertas generadas por umbrales de riesgo (`alert_evaluator`)
- **sernageomin** — alertas volcánicas elevadas vigentes (scrape OVDAS; solo “hoy”, no histórico `?date=`)

Filtros opcionales: `region` (1–16), `comuna`, `level`, `kind`, `hazard` (`sismo`, `volcan`, `incendio`, …).

Campos notables: `external_url`, `affected_scope`, `comuna_codes`, `thread_root_id`, `hazard_type`, scores ChileRisk cuando `source=chilerisk`.

SERNAPRED (parity con [senapred.cl/alertas](https://senapred.cl/alertas) / `/eventos`): vigente = `isActive` + `isPrincipal` (ATP y eventos). **Hoy** (sin `date` o `date=hoy`): ATP vigentes dentro de `SENAPRED_LOOKBACK_DAYS` hasta desactivación/cierre. **Eventos** (`record_kind=evento`): además se limitan a `SENAPRED_EVENTO_ACTIVE_HOURS` (default 48) — AppSync casi nunca baja `isActive` en sismos, así que sin tope quedarían semanas en el panel. **Histórico** (`?date=` pasado): ventana de un día civil Chile por `senapred_issued_at`; pueden incluirse filas `is_active=False` (p. ej. no principales / ya cerradas). Dedupe por hilo (`url_access` canónico, fallback cadena `parentId`) + `region_code` para expansiones multi-región. Geografía: `metaData.comunas` / `provincias` + NLP. Boletines de **cierre** no se listan (hoy ni histórico): ATP `Se cancela…` sin `declara`; eventos `(Cierre de/del evento)` — AppSync a menudo deja `isActive`+`isPrincipal` true en esos títulos.

SERNAGEOMIN: scrape de [alertas-volcanicas](https://www.sernageomin.cl/alertas-volcanicas/); solo niveles elevados (≥ amarilla); `hazard_type=volcan`. Coexiste con alertas ATP SERNAPRED de tipo volcán (sin dedupe cruzado). El HTML del sitio es frágil (Fusion Builder / imágenes); el parser usa alt/title + regex.

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
| `USE_REAL_CSN` | true | Scraper sismologia.cl (cuando false: sin eventos sísmicos) |
| `USE_REAL_METEO` | true | Open-Meteo por comuna (cuando false: sin actualizaciones de clima) |
| `USE_REAL_SENAPRED` | true | Sync GraphQL SERNAPRED (cuando false: sin alertas/eventos oficiales) |
| `SENAPRED_REFRESH_MINUTES` | 10 | Intervalo sync alertas |
| `SENAPRED_ALERT_BASE_URL` | https://senapred.cl/alerta/ | Link alertas |
| `SENAPRED_EVENT_BASE_URL` | https://senapred.cl/evento/ | Link eventos |
| `SENAPRED_COGNITO_IDENTITY_POOL_ID` | (público) | Pool anónimo AppSync |
| `SENAPRED_APPSYNC_ENDPOINT` | (URL GraphQL) | Endpoint AWS |
| `SENAPRED_LOOKBACK_DAYS` | 30 | Retención en tabla local (alineado con `?date=` de 30 días) |
| `SENAPRED_EVENTO_ACTIVE_HOURS` | 48 | Max edad de eventos en listado “hoy” (sismos no se desactivan en AppSync) |
| `SIMULACROS_BASE_URL` | https://senapred.cl/simulacros/ | Calendario público (scraping) |
| `SIMULACROS_LOOKBACK_DAYS` | 365 | Retención de simulacros pasados |
| `SIMULACROS_LOOKFORWARD_DAYS` | 180 | (informativo) Calendario público solo expone año en curso |
| `SIMULACROS_REFRESH_MINUTES` | 360 | Sync cada 6 h |
| `SIMULACROS_REQUEST_TIMEOUT_SECONDS` | 30 | Timeout httpx |
| `SIMULACROS_MAX_RECENT_PAGES` | 5 | Páginas `/simulacros/N/` a recorrer |
| `USE_REAL_AIRECHILE` | true | Scraping Aire Chile GEC (cuando false: sin condiciones de aire) |
| `AIRECHILE_BASE_URL` | https://airechile.mma.gob.cl/ | Portal MMA |
| `AIRECHILE_REFRESH_MINUTES` | 180 | Intervalo sync GEC |
| `AIRECHILE_REQUEST_TIMEOUT_SECONDS` | 30 | Timeout httpx |
| `USE_REAL_SERNAGEOMIN` | true | Scraping alertas volcánicas OVDAS (cuando false: sin fuente SERNAGEOMIN) |
| `SERNAGEOMIN_ALERTS_URL` | https://www.sernageomin.cl/alertas-volcanicas/ | Página de vigentes |
| `SERNAGEOMIN_REFRESH_MINUTES` | 60 | Intervalo sync |
| `SERNAGEOMIN_REQUEST_TIMEOUT_SECONDS` | 30 | Timeout httpx |
| `SERNAGEOMIN_SSL_VERIFY` | false | TLS: el sitio suele servir cadena incompleta |
| `CSN_BASE_URL` / `CSN_RECENT_PATH` | sismologia.cl | Scraper |
| `OPENMETEO_API_BASE` | api.open-meteo.com | Clima |
| `CACHE_TTL_SECONDS` | 300 | Cache general |
| `CACHE_METEO_TTL_SECONDS` | 21600 | Cache meteo |
| `AUTH_SECRET` | (requerido prod) | Mismo valor que Auth.js; valida `Authorization: Bearer` |
| `AUTH_URL` | http://localhost:3000 | Base para enlaces de reset |
| `RESEND_API_KEY` | — | Email recuperación contraseña |
| `AUTH_EMAIL_FROM` | noreply@… | Remitente Resend |
| `DEEPSEEK_API_KEY` | — | API key DeepSeek (asistente; nunca en FE) |
| `DEEPSEEK_BASE_URL` | https://api.deepseek.com | OpenAI-compatible base |
| `DEEPSEEK_MODEL` | deepseek-v4-flash | Modelo default del agente |
| `DEEPSEEK_MAX_TOOL_ROUNDS` | 5 | Tope de rondas tool-calling |
| `CHAT_HISTORY_ENABLED` | true | Persistencia de hilos/mensajes |

Rutas `/api/v1/risk|regiones|comunas|events|alerts|stats|chat|users|meeting-points|disaster-guides` exigen header `Authorization: Bearer <JWT HS256>` emitido por el proxy Next (`lib/api-token.ts`). `/api/v1/auth/*` y `/health` son públicos.

---

## Scheduler

| Job | Intervalo | Condición |
|-----|-----------|-----------|
| `risk_refresh` | `RISK_REFRESH_MINUTES` | siempre (si scheduler on) |
| `csn_sync` | 5 min | `USE_REAL_CSN=true` |
| `meteo_update` | 60 min | `USE_REAL_METEO=true` |
| `senapred_sync` | `SENAPRED_REFRESH_MINUTES` | `USE_REAL_SENAPRED=true` |
| `simulacros_sync` | `SIMULACROS_REFRESH_MINUTES` | siempre |
| `airechile_sync` | `AIRECHILE_REFRESH_MINUTES` | `USE_REAL_AIRECHILE=true` |
| `sernageomin_sync` | `SERNAGEOMIN_REFRESH_MINUTES` | `USE_REAL_SERNAGEOMIN=true` |

Definición: `app/scheduler/jobs.py`. Lifespan: `app/main.py` (seed, sync inicial, migraciones ligeras `senapred_alerts`).

---

## Fuentes de datos reales

| CSN | Meteo | SERNAPRED | Comportamiento |
|-----|-------|-----------|----------------|
| true | true | true | Datos 100% reales (recomendado) |
| * | * | * | Fuentes deshabilitadas no aportan datos (sin mocks). `sismo_score` solo desde `seismic_impacts` (0 si no hay impacto reciente); clima vía Open-Meteo / recompute. |

`DailyRiskScore` siempre se calcula bajo demanda para el `?date=` pedido (sin generación sintética).

---

## Modelos principales

| Modelo | Archivo | Rol |
|--------|---------|-----|
| Region, Comuna | `models/region.py`, `comuna.py` | Geografía 16 + 346 |
| RiskScore | `risk_score.py` | Score “live” por comuna |
| DailyRiskScore | `daily_risk_score.py` | Snapshot por `score_date` |
| SeismicEvent | `seismic_event.py` | CSN (source="csn") |
| SeismicImpact | `seismic_impact.py` | Impacto precomputado evento↔comuna |
| ClimateReading | `climate_reading.py` | Lecturas Open-Meteo |
| SenapredAlert | `senapred_alert.py` | Cache alertas/eventos SERNAPRED |
| Simulacro | `simulacro.py` | Calendario público de simulacros (próximos + pasados) |
| AireChileDaily | `airechile_daily.py` | Condición GEC diaria por zona (Aire Chile scrape) |
| SernageominVolcanicAlert | `sernageomin_volcanic_alert.py` | Alertas volcánicas elevadas vigentes (SERNAGEOMIN scrape) |
| User, OAuthAccount, PasswordResetToken | `user.py`, … | Auth (SQLAlchemy único ORM) |
| FamilyPlan | `family_plan.py` | Plan Familia Preparada (1 por `user_id`, JSON) |
| SyncRun | `sync_run.py` | Últimas corridas de jobs del scheduler |
| MeetingPoint | `meeting_point.py` | Puntos de encuentro tsunami/volcán (seed JSON) |
| ChatThread / ChatMessage | `chat_thread.py` | Historial del asistente |

Schema: Alembic (`backend/alembic/`). Entrypoint corre `alembic upgrade head` antes de uvicorn. Volúmenes legacy ya alineados: `make db-stamp`. Schema roto en dev: `make down-v` + `make up`. Nueva revisión: `make db-revision MSG="…"`.

---

## Servicios (mapa)

| Servicio | Responsabilidad |
|----------|-----------------|
| `risk_service` | `recompute_all_scores` — lee `seismic_impacts`, no Haversine en loop |
| `daily_risk_service` | Snapshots por fecha; locks; advisory lock PG |
| `impact_service` | Precompute al llegar evento |
| `csn_service` | Scrape + dedup ±3 min |
| `openmeteo_service` | Batch 40 comunas/request |
| `senapred_service` | GraphQL paginado + upsert; `isPrincipal` ATP/eventos; dedupe `url_access` |
| `simulacro_parsers` | HTML → dict solo bloque **CALENDARIO SIMULACROS \<year\>** (ignora "Simulacros recientes") |
| `simulacro_sync` | httpx fetch índice + enrich páginas detalle con link + upsert |
| `simulacro_service` | Lectura DB (`list`, `next`, `by_slug`, `prune`) |
| `airechile_service` | Scrape Aire Chile GEC + lectura (`list`, `zone`, `by_comuna`, `prune`) |
| `sernageomin_service` | Scrape alertas volcánicas SERNAGEOMIN + upsert/prune |
| `sernageomin_parsers` | HTML → alertas elevadas (alt/title + regex) |
| `alert_service` | Lista unificada `/alerts/active` |
| `alert_evaluator` | Umbrales → alertas ChileRisk |
| `region_service` | Agregación regional + cache |
| `stats_service` | Endpoints `/stats/*` |
| `query_date_window` | TZ Chile, clamp 30 días |
| `aws_sigv4` | Cognito Identity + firma AppSync |
| `risk_utils` | Funciones puras de composite/severidad (sin generación de datos) |
| `chat_agent_service` | Loop DeepSeek + tools; scope solo ChileRisk; ubicación en system prompt; ante riesgo comunal prioriza `get_active_alerts` sobre scores compuestos |
| `chat_tools` | Registry/ejecución de tools de lectura (alertas > riesgo compuesto para situación comunal; meeting points con URLs Google Maps) |
| `chat_history_service` | Persistencia de hilos |
| `meeting_point_service` | Seed + nearest meeting points + helpers Google Maps |
| `disaster_guide_service` | Guías estáticas de desastre |
| `user_profile_service` | Preferencia `home_comuna_code`; resolve chat: explicit → GPS → hogar |
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

*Last updated: 2026-07-25*