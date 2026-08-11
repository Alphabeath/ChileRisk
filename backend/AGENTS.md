# AGENTS.md — ChileRisk Backend

**Índice y reglas de scope** en `backend/`. Referencia de API, fuentes y servicios: [docs/BACKEND.md](docs/BACKEND.md). Mantenimiento: [../docs/DOC-MAINTENANCE.md](../docs/DOC-MAINTENANCE.md).

**Quick:** [playbook backend](../docs/HARNESS.md#backend-api-y-datos) · [contrato FE↔BE](../docs/HARNESS.md#contrato-febe) · `make verify-backend`

---

## Scope

- Trabajo solo en `backend/` (incluye `backend/docs/`).
- No tocar `frontend/`, `TrueRisk/` ni `misc/`; la raíz solo se toca para `docs/` cross-cutting en el mismo task.
- Cambios de dependencias en `pyproject.toml` requieren aprobación explícita.

## Índice documental

| Tema | Documento |
|------|-----------|
| API, OpenAPI, env, fuentes, scheduler, modelos y optimizaciones | [docs/BACKEND.md](docs/BACKEND.md) |
| `?date=` y `DailyRiskScore` | [../docs/QUERY-DATE.md](../docs/QUERY-DATE.md) |
| Arquitectura y Docker | [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) |
| Catálogo backend | [docs/README.md](docs/README.md) |
| Monorepo | [../AGENTS.md](../AGENTS.md) |

La semántica detallada de SERNAPRED, Aire Chile, SERNAGEOMIN y MeteoChile AAA vive en `docs/BACKEND.md`, no se duplica aquí.

## Stack

Python 3.12 · FastAPI · Pydantic v2 · SQLAlchemy 2.0 async · asyncpg · PostgreSQL 16 · APScheduler · httpx · beautifulsoup4 · cachetools · slowapi · Docker.

## Árbol relevante

```text
backend/app/
├── api/           # routers risk, events, alerts, auth, chat, users, …
├── models/        # daily_risk_score, chat_thread, meeting_point, …
├── schemas/       # contrato → OpenAPI → make sync-contract
├── services/      # risk, impact, daily, fuentes y servicios de producto
├── scheduler/     # jobs APScheduler
├── data/          # seeds y resolvers geográficos
└── core/          # limiter y auth
backend/docs/      # BACKEND.md
```

Routing de fuentes: `csn_service`, `openmeteo_service`, `flood_service`, `senapred_service`, `airechile_service`, `sernageomin_service` y `meteochile_aaa_service`. Los detalles de proveedor, batch y errores están en [docs/BACKEND.md](docs/BACKEND.md).

## Dónde poner código nuevo

| Añades… | Ubicación |
|---------|-----------|
| Endpoint | `app/api/<recurso>.py` + registro en `app/main.py` |
| Schema de respuesta | `app/schemas/<recurso>.py` |
| ORM | `app/models/<entidad>.py` + `models/__init__.py` |
| Lógica | `app/services/<nombre>_service.py` |
| Job | `app/scheduler/jobs.py` + flag en `config.py` |
| Fuente externa | Servicio dedicado (`csn_service`, `senapred_service`, `meteochile_aaa_service`, etc.) |
| Variable de entorno | `config.py` + `.env.example` + [docs/BACKEND.md](docs/BACKEND.md) |
| Documentación API/modelo | [docs/BACKEND.md](docs/BACKEND.md) |

## Contrato frontend

Flujo obligatorio:

```text
app/schemas/* → /openapi.json → make sync-contract
    → frontend/lib/api-schema.d.ts → frontend/lib/types.ts / frontend/lib/api.ts
```

- El contrato canónico es `GET http://localhost:8000/openapi.json`.
- Si el JSON es consumido por la web, actualiza también [../frontend/docs/FRONTEND.md](../frontend/docs/FRONTEND.md).
- Tipo canónico de alertas: `ActiveAlertOut`.
- Un cambio de fecha también actualiza [../docs/QUERY-DATE.md](../docs/QUERY-DATE.md).

## Invariantes de datos

- `limiter` solo desde `app.core.limiter`.
- Haversine solo en `impact_service` al insertar el evento; `risk_service.recompute_all_scores` consume impactos precomputados.
- Radio de impacto: `max(20, 50 * (magnitude - 2.0))` km.
- CSN deduplica por ±3 minutos y magnitud.
- Clima usa batch 40; flood usa batch 20 y corta ante HTTP 429. Detalle: [docs/BACKEND.md](docs/BACKEND.md#optimización-implementada).
- No usar valores sintéticos cuando una fuente está vacía.
- `schema` se aplica con Alembic (`alembic upgrade head`); no usar `create_all` en lifespan.
- `settings` es singleton al importar.

## Después de cambios

1. Actualiza `docs/BACKEND.md` si cambia API, modelo, job, fuente o error observable.
2. Si cambia JSON: `make sync-contract` y revisa los archivos FE indicados arriba.
3. Ejecuta desde la raíz:

```bash
make verify-backend
make up
# o comprueba GET http://localhost:8000/health con el stack activo
```

`make verify-backend` usa `compileall` y pytest condicional; no se sustituye por `python3 -m py_compile app/...` aislado.

---

*Last updated: 2026-08-07*
