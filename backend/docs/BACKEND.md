# Backend — ChileRisk

**Stack:** Python 3.12 · FastAPI · SQLAlchemy 2.0 async · PostgreSQL 16 · APScheduler  
**Base URL:** `http://localhost:8000`  
**Índice operativo:** [AGENTS.md](../AGENTS.md)  
**Mantenimiento:** [../../docs/DOC-MAINTENANCE.md](../../docs/DOC-MAINTENANCE.md)  
**Flujo de contrato FE↔BE:** [../../docs/CONTRACT.md](../../docs/CONTRACT.md)

## Contrato OpenAPI y quick start

| Fuente | Uso |
|--------|-----|
| **Runtime** | `GET /openapi.json` con el backend en marcha (`http://localhost:8000/openapi.json`) |
| **Swagger UI** | `http://localhost:8000/docs` |
| **Snapshot opcional** | `make export-openapi` → `backend/docs/openapi.json` |
| **Contrato FE** | `make sync-contract` → `frontend/lib/api-schema.d.ts`; `make verify-contract` detecta drift |
| **Resumen humano** | Tablas de esta referencia |

Si OpenAPI y esta página divergen, **OpenAPI gana**; actualiza las tablas en el mismo task.

```bash
# Desde la raíz del monorepo
make up

# `make up` equivale a `docker compose --profile tools up --build --detach`.
# El stack se ejecuta en segundo plano y devuelve el control a la terminal.

# Reset destructivo de la base local
make down-v && make up
```

Desarrollo nativo: `make dev-backend` (requiere DB y [backend/.env.example](../.env.example)).

## Endpoints

Prefijo común: `/api/v1`. Las rutas protegidas reciben el JWT HS256 que emite el proxy Next (`sub: "guest"` o el `id` de la cuenta). `/health` y `/api/v1/auth/*` son públicas. `GET/PATCH /users/me` y `GET/PUT /family-plan` exigen cuenta (401 si el JWT es guest).

### Sistema

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/health` | `{ status, version, uptime_seconds, sync[] }`; `sync` resume jobs conocidos |
| GET | `/api/v1/system/sync-status` | Última corrida por job; JWT |

### Auth

| Método | Path | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Crea cuenta email/contraseña; 409 si el email existe |
| POST | `/api/v1/auth/login` | Valida credenciales para Auth.js; 401 si fallan |
| POST | `/api/v1/auth/forgot-password` | Solicitud de reset (siempre 204; envía Resend si hay key) |
| POST | `/api/v1/auth/reset-password` | Cambia la contraseña con token de una hora |

### Riesgo y geografía

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/v1/risk/national?date=` | Riesgo agregado por región; JWT |
| GET | `/api/v1/risk/comunas?date=` | `composite_score` por comuna para gating/tooling; JWT |
| GET | `/api/v1/regiones/{codregion}/risk` | Detalle regional y comunas, score live; JWT |
| GET | `/api/v1/comunas` | Catálogo liviano 346 comunas (`cod_comuna`, nombre, región); JWT |
| GET | `/api/v1/comunas/nearest?lat=&lon=` | Comuna más cercana al GPS; JWT |
| GET | `/api/v1/comunas/{cod_comuna}/risk?date=` | Vector de hazards de la comuna; JWT |

### Sismos

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/v1/events?date=` | Sismos del día civil de Chile |
| GET | `/api/v1/events/{id}/impact` | Impacto territorial precomputado, hasta 50 comunas |

### Alertas

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/v1/alerts/active?date=&region=&comuna=&level=&kind=&hazard=&include_content=` | Alertas unificadas SERNAPRED + ChileRisk + SERNAGEOMIN + MeteoChile AAA |
| GET | `/api/v1/alerts/meteochile/zones?date=` | `FeatureCollection` de franjas DMC; solo hoy entrega features |

`GET /api/v1/alerts/active` devuelve `ActiveAlertOut` (`app/schemas/alert.py`):

- **`senapred`:** alertas ATP (`record_kind=alerta`) y eventos “Sismos y otros” (`evento`). Hoy usa lookback ATP hasta desactivación/cierre y limita eventos a `SENAPRED_EVENTO_ACTIVE_HOURS` (48 h por defecto). Histórico filtra el día civil de emisión, deduplica por hilo y puede conservar `is_active=False`.
- **`chilerisk`:** alertas generadas por `alert_evaluator` a partir de umbrales observados.
- **`sernageomin`:** alertas volcánicas elevadas vigentes (solo hoy, no histórico `?date=`).
- **`meteochile`:** Avisos, Alertas y Alarmas DMC de `datos_AAA.json` (solo hoy), fan-out por región CUT.

Filtros opcionales: `region` (1–16), `comuna`, `level`, `kind` y `hazard`. `include_content=true` incluye el HTML/texto pesado; el default es `false` y el monitor usa título, nivel y geografía.

MeteoChile AAA usa el feed público [datos_AAA.json](https://archivos.meteochile.gob.cl/portaldmc/AAA/datos_AAA.json). Mapea Aviso→`amarilla`, Alerta→`naranja`, Alarma→`roja`; agrupa como `MultiPolygon` las zonas multipartes numeradas del catálogo oficial y resuelve CUT mediante intersección polígono-comuna. Las áreas libres hacen fan-out por las regiones CUT intersectadas; `ip`→5201 y `jf`→5104 son overrides exactos. Las franjas GeoJSON de `/alerts/meteochile/zones` se dibujan solo con el filtro Meteo del frontend.

### Estadísticas

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/v1/stats/national` | Promedios y distribución de severidad |
| GET | `/api/v1/stats/regiones/{codregion}` | Estadísticas de una región |
| GET | `/api/v1/stats/trends?days=7` | **Placeholder**; no se presenta como serie implementada |
| GET | `/api/v1/stats/compare?regiones=13,14,15` | Comparación, máximo 8 regiones |

### Dashboard

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/v1/dashboard/summary` | Resumen IA del día; JWT |

`dashboard_service` arma top de regiones, alertas severas, sismos de 24 h y, cuando existe, riesgo comunal/GEC del hogar. Usa `TTLCache(maxsize=400, ttl=900)` por `home_comuna_code`. Si falta `DEEPSEEK_API_KEY` o falla el LLM, devuelve **503** `Resumen IA no disponible`; no usa un fallback determinista.

### Plan familiar

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/v1/family-plan` | Plan Familia Preparada del usuario; JWT |
| PUT | `/api/v1/family-plan` | Upsert del plan y `completion_pct`; JWT |

### Simulacros

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/v1/simulacros?from=&to=&region=&type=&source=&upcoming_only=&past_only=&limit=&offset=` | Calendario SENAPRED; JWT |
| GET | `/api/v1/simulacros/next` | Próximo simulacro o `null`; JWT |
| GET | `/api/v1/simulacros/{slug}` | Detalle enriquecido (`SimulacroDetailOut`: headline, schedule_note, hero_image_url, body_blocks tipados); JWT |

### Calidad del aire

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/v1/air-quality?date=&region=&episode_only=` | Condiciones GEC por zona PPDA; JWT |
| GET | `/api/v1/air-quality/by-comuna/{cod}?date=` | Lookup por CUT; **404** si la comuna no está cubierta |
| GET | `/api/v1/air-quality/{slug}?date=` | Detalle de zona; **404** si el slug no existe |

### Chat

| Método | Path | Descripción |
|--------|------|-------------|
| POST | `/api/v1/chat` | Agente DeepSeek con tools de lectura; JWT |
| POST | `/api/v1/chat/stream` | El mismo agente por SSE (`token`/`done`); JWT |
| GET | `/api/v1/chat/threads` | Historial de hilos; JWT |
| GET | `/api/v1/chat/threads/{id}` | Detalle de hilo y mensajes; JWT |

### Puntos de encuentro

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/v1/meeting-points/nearest?lat=&lon=&hazard=&limit=` | Puntos oficiales más cercanos; JWT |

### Guías de desastre

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/v1/disaster-guides` | Catálogo de guías; JWT |
| GET | `/api/v1/disaster-guides/{slug}` | Guía por slug; JWT |

### Usuarios

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/v1/users/me` | Perfil, comuna de hogar y preferencias de aviso; JWT de cuenta (no guest) |
| PATCH | `/api/v1/users/me` | Nombre, comuna de hogar y flags `notify_email_*`; JWT de cuenta |

`date` usa formato `YYYY-MM-DD`, día civil Chile y ventana de 30 días. Contrato completo: [../../docs/QUERY-DATE.md](../../docs/QUERY-DATE.md). Rate limits: lectura 100/min, events 60, impact 30, stats 50 y alerts 60.

### Errores y datos reales

- Si una fuente real falla o entrega una respuesta vacía, esa fuente queda sin datos hasta la siguiente sincronización; no se genera un reemplazo.
- Dashboard sin DeepSeek responde 503, como se indicó arriba.
- Zonas de Aire Chile o lookups de comuna no cubiertos responden 404; ese error representa cobertura real, no un valor sintético.
- Las franjas MeteoChile para una fecha pasada devuelven `FeatureCollection` vacía, no un snapshot inventado.

## API consumida por la web | API backend-only

La columna web se limita a las funciones que aparecen en `frontend/lib/api.ts`. El resto sigue disponible para integraciones o futuras superficies, pero no se presenta como UI terminada.

| API consumida por la web | API backend-only |
|--------------------------|-------------------|
| **Riesgo:** `/api/v1/risk/national?date=`, `/api/v1/regiones/{codregion}/risk`, `/api/v1/comunas/{cod}/risk?date=` | **Dashboard:** `/api/v1/dashboard/*` |
| **Sismos:** `/api/v1/events?date=` | **Plan Familia:** `/api/v1/family-plan` (cuenta; sin wizard web) |
| **Alertas:** `/api/v1/alerts/active`, `/api/v1/alerts/meteochile/zones` | **Chat:** `/api/v1/chat/*` |
| **Aire:** `/api/v1/air-quality`, `/air-quality/{slug}`, `/air-quality/by-comuna/{cod}` | **Stats:** `/api/v1/stats/*` (**trends** placeholder) |
| **Simulacros:** `/api/v1/simulacros`, `/simulacros/next`, `/simulacros/{slug}` | **Sistema:** `/api/v1/system/*` |
| **Puntos de encuentro:** `/api/v1/meeting-points/nearest` | **Riesgo/geografía no consumidos:** `/api/v1/risk/comunas`, `/api/v1/comunas/nearest` |
| **Auth:** `/api/v1/auth/register`, `/login`, `/forgot-password`, `/reset-password` | |
| **Usuarios:** `/api/v1/users/me` | |
| **Comunas catálogo:** `/api/v1/comunas` | |
| | **Impacto de evento:** `/api/v1/events/{id}/impact` |
| | **Guías API:** `/api/v1/disaster-guides/*`; la web usa su snapshot SENAPRED vendoreado |

## Configuración, scheduler y fuentes

Root `.env` (Docker) o `backend/.env` (local). Plantilla: [backend/.env.example](../.env.example).

### Variables principales

| Variable | Default típico | Descripción |
|----------|----------------|-------------|
| `DATABASE_URL` | SQLite dev / Postgres Compose | SQLAlchemy async |
| `BACKEND_CORS_ORIGINS` | localhost:3000,3001 | JSON array; en producción se configura por entorno |
| `ENABLE_SCHEDULER` | `true` | Jobs en background |
| `RISK_REFRESH_MINUTES` | `15` | Recompute `risk_scores` |
| `CSN_BASE_URL` / `CSN_RECENT_PATH` | sismologia.cl | Scraper CSN |
| `OPENMETEO_API_BASE` | api.open-meteo.com | Clima |
| `FLOOD_REFRESH_MINUTES` | `360` | GloFAS / Open-Meteo Flood |
| `SENAPRED_REFRESH_MINUTES` | `10` | Alertas y eventos |
| `SENAPRED_ALERT_BASE_URL` | senapred.cl/alerta | Links de alertas |
| `SENAPRED_EVENT_BASE_URL` | senapred.cl/evento | Links de eventos |
| `SENAPRED_COGNITO_IDENTITY_POOL_ID` | público | Pool anónimo AppSync |
| `SENAPRED_APPSYNC_ENDPOINT` | URL GraphQL | Endpoint AWS |
| `SENAPRED_LOOKBACK_DAYS` | `30` | Retención de alertas |
| `SENAPRED_EVENTO_ACTIVE_HOURS` | `48` | Edad máxima de eventos “hoy” |
| `SIMULACROS_BASE_URL` | senapred.cl/simulacros | Calendario público |
| `SIMULACROS_LOOKBACK_DAYS` | `365` | Retención pasada |
| `SIMULACROS_LOOKFORWARD_DAYS` | `180` | Ventana informativa |
| `SIMULACROS_REFRESH_MINUTES` | `1440` | Sync diario |
| `SIMULACROS_REQUEST_TIMEOUT_SECONDS` | `30` | Timeout httpx |
| `SIMULACROS_MAX_RECENT_PAGES` | `5` | Páginas recientes |
| `AIRECHILE_BASE_URL` | airechile.mma.gob.cl | Portal MMA |
| `AIRECHILE_REFRESH_MINUTES` | `180` | Sync GEC |
| `AIRECHILE_REQUEST_TIMEOUT_SECONDS` | `30` | Timeout httpx |
| `SERNAGEOMIN_ALERTS_URL` | página de alertas | Vigentes OVDAS |
| `SERNAGEOMIN_REFRESH_MINUTES` | `60` | Sync volcánico |
| `SERNAGEOMIN_REQUEST_TIMEOUT_SECONDS` | `30` | Timeout httpx |
| `SERNAGEOMIN_SSL_VERIFY` | `false` | Cadena TLS incompleta del sitio |
| `METEOCHILE_AAA_URL` | `…/datos_AAA.json` | Feed AAA DMC |
| `METEOCHILE_REFRESH_MINUTES` | `15` | Sync AAA |
| `METEOCHILE_REQUEST_TIMEOUT_SECONDS` | `30` | Timeout httpx |
| `CACHE_TTL_SECONDS` | `300` | Cache general |
| `CACHE_METEO_TTL_SECONDS` | `21600` | Cache meteorológico |
| `AUTH_SECRET` | requerido en prod | JWT HS256 compartido con Auth.js; mínimo 32 bytes |
| `AUTH_URL` | http://localhost:3000 | Enlaces de reset (`/restablecer-contrasena`) |
| `RESEND_API_KEY` | vacío | Recuperación de contraseña |
| `POSTGRES_PASSWORD` | chilerisk local | Cambiar en VPS |
| `AUTH_EMAIL_FROM` | noreply@… | Remitente Resend |
| `DEEPSEEK_API_KEY` | vacío | Dashboard/chat; nunca en frontend |
| `DEEPSEEK_BASE_URL` | api.deepseek.com | Base OpenAI-compatible |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` | Modelo del agente |
| `DEEPSEEK_MAX_TOOL_ROUNDS` | `5` | Límite de tool-calling |
| `CHAT_HISTORY_ENABLED` | `true` | Persistencia de hilos |

### Scheduler y lifespan

| Job | Intervalo | Condición |
|-----|-----------|-----------|
| `risk_refresh` | `RISK_REFRESH_MINUTES` | `ENABLE_SCHEDULER=true` |
| `csn_sync` | 5 min | `ENABLE_SCHEDULER=true` |
| `meteo_update` | 60 min | `ENABLE_SCHEDULER=true` |
| `senapred_sync` | `SENAPRED_REFRESH_MINUTES` | `ENABLE_SCHEDULER=true` |
| `simulacros_sync` | `SIMULACROS_REFRESH_MINUTES` | `ENABLE_SCHEDULER=true` |
| `airechile_sync` | `AIRECHILE_REFRESH_MINUTES` | `ENABLE_SCHEDULER=true` |
| `sernageomin_sync` | `SERNAGEOMIN_REFRESH_MINUTES` | `ENABLE_SCHEDULER=true` |
| `meteochile_aaa_sync` | `METEOCHILE_REFRESH_MINUTES` | `ENABLE_SCHEDULER=true` |
| `flood_sync` | `FLOOD_REFRESH_MINUTES` | `ENABLE_SCHEDULER=true` |

`backend/app/main.py` ejecuta seed y sincronización inicial, llama `recompute_all_scores`, inicia APScheduler y agenda el flood startup sin bloquear el healthcheck.

### Proveedores reales

| Proveedor | Datos | Implementación |
|-----------|-------|----------------|
| CSN | Catálogo sísmico reciente | `csn_service`; dedup por tiempo y magnitud |
| Open-Meteo | Clima por comuna | `openmeteo_service`; lotes REST |
| Open-Meteo Flood / GloFAS | Descarga fluvial | `flood_service`; lotes y corte por 429 |
| SERNAPRED | Alertas, eventos y simulacros | AppSync/Cognito y parsers |
| SERNAGEOMIN | Alertas volcánicas OVDAS | Scrape HTML; solo niveles ≥ amarilla |
| Aire Chile | Condiciones GEC PPDA | Scrape HTML; cobertura parcial |
| MeteoChile AAA | Avisos, Alertas y Alarmas DMC | `meteochile_aaa_service`; feed JSON y franjas oficiales |

`RiskScore` solo se crea/actualiza desde ingestas reales y derivados observados. `DailyRiskScore` se calcula bajo demanda para la fecha solicitada y omite comunas sin entradas.

## Optimización implementada

| Decisión | Símbolo, literal o configuración que la prueba |
|----------|-----------------------------------------------|
| Impacto sísmico antes del recompute | `impact_service` + `recompute_all_scores` |
| Clima en lotes | batch `40` en `openmeteo_service` |
| Flood acotado por proveedor | batch `20` y corte por HTTP `429` en `flood_service` |
| Snapshots históricos serializados | `_pg_advisory_lock` + `get_or_compute_daily_scores` |
| Caches de lectura | `TTLCache` en `region_service`, `stats_service` y `dashboard_service` |
| Payload de alertas liviano | `include_content=false` en `/alerts/active` |
| Startup no bloqueante | flood startup mediante `asyncio.create_task` en `app/main.py` |

No se prometen latencias ni porcentajes: la tabla solo enumera mecanismos presentes en el código.

## Modelos, servicios, estructura y tests

### Modelos principales

| Modelo | Archivo | Rol |
|--------|---------|-----|
| `Region`, `Comuna` | `models/region.py`, `models/comuna.py` | Geografía 16 + 346 |
| `RiskScore` | `models/risk_score.py` | Score live por comuna |
| `DailyRiskScore` | `models/daily_risk_score.py` | Snapshot por `score_date` |
| `SeismicEvent` | `models/seismic_event.py` | Evento CSN |
| `SeismicImpact` | `models/seismic_impact.py` | Impacto evento↔comuna |
| `ClimateReading` | `models/climate_reading.py` | Lecturas Open-Meteo |
| `SenapredAlert` | `models/senapred_alert.py` | Alertas/eventos SERNAPRED |
| `Simulacro` | `models/simulacro.py` | Calendario + detalle scrapeado (`headline`, `schedule_note`, `hero_image_url`, `detail_body`) |
| `AireChileDaily` | `models/airechile_daily.py` | GEC diaria por zona |
| `SernageominVolcanicAlert` | `models/sernageomin_volcanic_alert.py` | Alertas volcánicas vigentes |
| `MeteoChileAaaAlert` | `models/meteochile_aaa_alert.py` | AAA DMC por ítem×región |
| `User`, `PasswordResetToken` | `models/user.py`, `models/password_reset_token.py` | Cuentas email/contraseña |
| `FamilyPlan` | `models/family_plan.py` | Plan Familia JSON |
| `SyncRun` | `models/sync_run.py` | Últimas corridas |
| `MeetingPoint` | `models/meeting_point.py` | Puntos oficiales |
| `ChatThread`, `ChatMessage` | `models/chat_thread.py` | Historial del asistente |

Schema: Alembic (`backend/alembic/`). El entrypoint ejecuta `alembic upgrade head` antes de uvicorn; no usar `create_all` en lifespan.

### Servicios

| Servicio | Responsabilidad |
|----------|-----------------|
| `risk_service` | `recompute_all_scores`; lee impactos, no ejecuta Haversine en loop |
| `daily_risk_service` | Snapshots por fecha, caché y locks |
| `impact_service` | Precompute evento→comuna |
| `query_date_window` | TZ Chile y clamp de 30 días |
| `csn_service` | Fetch y dedup CSN |
| `openmeteo_service` | Fetch clima batch 40 y persistencia |
| `flood_service` | Fetch GloFAS batch 20 y score fluvial |
| `senapred_service` | GraphQL paginado, upsert y dedup |
| `simulacro_parsers` / `simulacro_sync` / `simulacro_service` | Parse índice + detalle Elementor (`parse_detail_page`), sync y lectura; el sync prueba cada slug en `/simulacros_t/{slug}/` aunque el índice no tenga enlace, acepta contenido solo dentro de un `wp-post` y rechaza el fallback HTTP 200 a la portada (`wp-page`). Un fallback confirmado limpia detalle contaminado y vuelve a los datos factuales del calendario; fallos HTTP o posts temporalmente vacíos conservan el último `headline`/horario/fotografía/cuerpo válidos |
| `airechile_service` | Scrape y lectura GEC |
| `meteochile_aaa_service` | Fetch, sync AAA y GeoJSON de franjas |
| `sernageomin_service` / `sernageomin_parsers` | Scrape y parseo volcánico |
| `alert_service` | Lista única `/alerts/active` |
| `alert_evaluator` | Umbrales → alertas ChileRisk |
| `region_service` | Agregación regional + cache |
| `stats_service` | Endpoints `/stats/*` |
| `aws_sigv4` | Cognito Identity y firma AppSync |
| `risk_utils` | Composite/severidad puras; sin generación de datos |
| `chat_agent_service` / `chat_tools` | Loop DeepSeek y tools de lectura |
| `chat_history_service` | Persistencia de hilos |
| `meeting_point_service` | Seed, nearest y URLs Google Maps |
| `disaster_guide_service` | Guías API estáticas |
| `user_profile_service` | Preferencia y resolución de hogar |
| `usgs_service` | Deprecated; no usar |

### Estructura

```text
backend/app/
├── main.py              # FastAPI + lifespan
├── config.py            # Settings
├── database.py
├── api/                 # routers
├── models/              # SQLAlchemy ORM
├── schemas/             # Pydantic → OpenAPI
├── services/            # lógica de negocio e integraciones
├── scheduler/jobs.py    # jobs APScheduler
├── data/                # seeds y resolvers geográficos
└── core/limiter.py      # SlowAPI; no importar desde main
```

### Tests

`backend/tests/` cubre ventana de fechas, daily risk y lookback SERNAPRED. El target de área es `make verify-backend`: ejecuta `python3 -m compileall -q app` y pytest condicional si está instalado en el host. En Docker: `docker compose exec backend python -m pytest tests/ -q`.

Referencias: [../../docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md), [../../docs/QUERY-DATE.md](../../docs/QUERY-DATE.md) y `frontend/lib/api.ts`.

*Last updated: 2026-08-17*
