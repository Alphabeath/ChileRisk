# AGENTS.md — ChileRisk Backend

**Índice y reglas de scope** en `backend/`. Referencia: [docs/BACKEND.md](docs/BACKEND.md). Mantenimiento: [../docs/DOC-MAINTENANCE.md](../docs/DOC-MAINTENANCE.md).

**Quick:** [../docs/HARNESS-QUICK.md](../docs/HARNESS-QUICK.md) · endpoint §1 · JSON §2 · bugfix §6 · `make verify`

**Memoria:** `engram_mem_context` + `engram_mem_search "contrato|riesgo|date"` antes de editar. Ver [../docs/ENGRAM-PROTOCOL.md](../docs/ENGRAM-PROTOCOL.md). Summary solo si `engram_mem_save`.

---

## Scope

- Trabajo **solo** en `backend/` (incluye `backend/docs/`).
- No tocar `frontend/`, `TrueRisk/`, `misc/`, raíz salvo `docs/` cross-cutting en el mismo task.
- `pyproject.toml` / deps nuevas → aprobación explícita.

---

## Índice documentación

| Tema | Documento |
|------|-----------|
| API, env, modelos, scheduler | [docs/BACKEND.md](docs/BACKEND.md) |
| `?date=` y `DailyRiskScore` | [../docs/QUERY-DATE.md](../docs/QUERY-DATE.md) |
| Arquitectura / Docker | [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) |
| ML futuro | [docs/ML-INTEGRATION.md](docs/ML-INTEGRATION.md) |
| Catálogo backend | [docs/README.md](docs/README.md) |
| Monorepo | [../AGENTS.md](../AGENTS.md) |

---

## Tech stack

Python 3.12 · FastAPI · Pydantic v2 · SQLAlchemy 2.0 async · asyncpg · PostgreSQL 16 · APScheduler · httpx · beautifulsoup4 · cachetools · slowapi · Docker.

---

## Árbol relevante

```
backend/app/
├── api/           # risk, events, alerts, chat, users, meeting-points, …
├── models/        # daily_risk_score, chat_thread, meeting_point, …
├── schemas/       # contrato → make sync-contract → frontend/lib/api-schema.d.ts (+ types.ts)
├── services/      # daily_risk, chat_agent, meeting_point, …
└── scheduler/jobs.py
backend/docs/      # BACKEND.md, ML-INTEGRATION.md
```

Detalle: [docs/BACKEND.md](docs/BACKEND.md).

---

## Dónde poner código nuevo

| Añades… | Ubicación |
|---------|-----------|
| Endpoint | `app/api/<recurso>.py` + `main.py` |
| Schema respuesta | `app/schemas/<recurso>.py` |
| ORM | `app/models/<entidad>.py` + `models/__init__.py` |
| Lógica | `app/services/<nombre>_service.py` |
| Job | `app/scheduler/jobs.py` + flag en `config.py` |
| Fuente externa | Servicio tipo `csn_service` / `senapred_service` |
| Env var | `config.py` + `.env.example` + [docs/BACKEND.md](docs/BACKEND.md) |
| Doc API/modelo | [docs/BACKEND.md](docs/BACKEND.md) |

---

## Contrato frontend

- `app/schemas/*` → `make sync-contract` + `frontend/lib/types.ts` (mismo task).
- JSON público → [docs/BACKEND.md](docs/BACKEND.md) + [../frontend/docs/FRONTEND.md](../frontend/docs/FRONTEND.md) si UI.
- Tipo canónico alertas: `ActiveAlertOut`.

---

## Pitfalls

- `limiter` solo desde `app.core.limiter`.
- Haversine solo en `impact_service` al insertar evento.
- Radio: `max(20, 50 * (magnitude - 2.0))` km.
- CSN dedup ±3 min + magnitud.
- Meteo lotes de 40.
- SERNAPRED máx. 20×100 ítems; Cognito cache ~50 min.
- `_is_active`: `isActive` + `isPrincipal` (alertas **y** eventos, parity con senapred.cl) + cancel puro.
- `_CANCEL_RE` / `is_cancel_title`: ATP cancel puro (`^se cancel(?!.*\bdeclara\b)`) **o** cierre de evento (`cierre de/del evento`); "se cancela X y declara Y" permanece activa.
- `/alerts/active`: **hoy** = lookback ATP hasta desactivación; **eventos** solo últimas `SENAPRED_EVENTO_ACTIVE_HOURS` (default 48). **histórico** = día civil. Dedupe por hilo (`url_access` canónico, fallback `parentId`) **antes** de filtrar `is_active`; clave incluye `region_code` (multi-región). Boletines de cierre (ATP cancel / evento `Cierre de…`) **nunca** se reexponen (hoy ni histórico).
- Geografía: título región → `metaData.comunas` → NLP título/contenido → `metaData.provincias` (scope región).
- Aire Chile máx. zonas PPDA catalogadas; HTML frágil.
- SERNAGEOMIN: HTML Fusion Builder frágil; solo ≥ amarilla; `SERNAGEOMIN_SSL_VERIFY` default false (cadena TLS incompleta).
- Schema: Alembic (`alembic upgrade head` en entrypoint). No `create_all` en lifespan.
- `settings` singleton al import.

---

## Después de cambios

1. `python3 -m py_compile app/...`
2. API/modelos → [docs/BACKEND.md](docs/BACKEND.md) (+ [QUERY-DATE](../docs/QUERY-DATE.md) si `date`)
3. `make up` o `GET /health`

```bash
make up
make logs-backend
make psql
```

---

*Last updated: 2026-07-25*