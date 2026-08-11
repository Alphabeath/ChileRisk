# ChileRisk — arquitectura

Vista cross-stack del sistema. La referencia de API está en [backend/docs/BACKEND.md](../backend/docs/BACKEND.md); el estado y la implementación cliente en [frontend/docs/FRONTEND.md](../frontend/docs/FRONTEND.md); el contrato de fecha en [QUERY-DATE.md](./QUERY-DATE.md). El routing de agentes parte en [../AGENTS.md](../AGENTS.md).

---

## Sistema

Los flujos de ingesta y consulta convergen en FastAPI. El navegador no accede directamente a PostgreSQL.

```mermaid
graph LR
    subgraph Providers[Proveedores reales]
        CSN[CSN]
        METEO[Open-Meteo / GloFAS]
        SENAPRED[SERNAPRED]
        SERNAGEOMIN[SERNAGEOMIN]
        AIRE[Aire Chile]
        AAA[MeteoChile AAA]
    end

    CSN --> API[FastAPI + APScheduler]
    METEO --> API
    SENAPRED --> API
    SERNAGEOMIN --> API
    AIRE --> API
    AAA --> API
    API <--> DB[(PostgreSQL 16)]

    Browser[Browser / MapLibre] --> Proxy[Proxy Next.js]
    Proxy --> API
    Assets[GeoJSON / PMTiles vendoreados] --> Browser
```

### Componentes

| Capa | Tecnología | Propósito |
|------|------------|-----------|
| Browser | Next.js 16, React 19, MapLibre, TanStack Query | Superficies ciudadanas, mapa y consultas por día |
| Proxy | Route handler Next `/api/backend` | Mantiene el origen del navegador y reenvía a FastAPI con JWT guest |
| API | FastAPI + Pydantic + SQLAlchemy async | Contrato HTTP, riesgo, alertas e integraciones |
| Proveedores | CSN, Open-Meteo/GloFAS, SERNAPRED, SERNAGEOMIN, Aire Chile, MeteoChile AAA | Ingestas reales de clima, inundación, sismos, alertas y calidad del aire |
| Base de datos | PostgreSQL 16 | Geografía, scores live, snapshots, eventos y caches de fuentes |
| Scheduler | APScheduler | Actualiza proveedores y recalcula datos derivados |
| Assets runtime | GeoJSON, PMTiles y snapshots JSON vendoreados | Cartografía y guías estáticas del frontend; no son ingestas backend |

---

## Flujo de datos

1. **Geografía:** el backend siembra 16 regiones y 346 comunas; el frontend sirve GeoJSON/PMTiles vendoreados desde `frontend/public/data/`.
2. **Sismos:** CSN (`sismologia.cl`) → `seismic_events`; `impact_service` precalcula impactos por comuna al insertar.
3. **Clima:** lotes Open-Meteo → `climate_readings` y actualización de scores.
4. **Inundación:** lotes Open-Meteo Flood/GloFAS → scores de inundación; el sync tolera el límite HTTP 429 con el corte documentado.
5. **Alertas oficiales:** SERNAPRED, SERNAGEOMIN, Aire Chile y MeteoChile AAA se sincronizan en tablas propias; la API unifica las alertas activas.
6. **Riesgo live:** `risk_service.recompute_all_scores` aplica datos e impactos al score actual según el scheduler.
7. **Riesgo histórico:** `daily_risk_service.get_or_compute_daily_scores` materializa y sirve snapshots por `score_date` dentro de la ventana de 30 días.
8. **Consulta web:** `frontend/lib/api.ts` → proxy Next → FastAPI; TanStack Query coordina caché, reconsulta y fecha global.

La semántica de la fecha civil de Chile está en [QUERY-DATE.md](./QUERY-DATE.md).

---

## Scheduler y fuentes

| Job | Intervalo / configuración | Fuente o efecto |
|-----|---------------------------|-----------------|
| `risk_refresh` | `RISK_REFRESH_MINUTES` | Recalcula riesgo live |
| `csn_sync` | 5 min | Eventos sísmicos CSN |
| `meteo_update` | 60 min | Open-Meteo |
| `flood_update` | `FLOOD_REFRESH_MINUTES` | GloFAS / Open-Meteo Flood |
| `senapred_sync` | `SENAPRED_REFRESH_MINUTES` | Alertas, eventos y simulacros SENAPRED |
| `airechile_sync` | `AIRECHILE_REFRESH_MINUTES` | Condiciones GEC de Aire Chile |
| `sernageomin_sync` | `SERNAGEOMIN_REFRESH_MINUTES` | Alertas volcánicas OVDAS |
| `meteochile_aaa_sync` | `METEOCHILE_REFRESH_MINUTES` | Avisos, Alertas y Alarmas DMC |

El `lifespan` de `backend/app/main.py` siembra catálogos y ejecuta sincronizaciones iniciales. El flood startup se agenda con `asyncio.create_task` para no bloquear el healthcheck; el scheduler se configura después de la inicialización.

Todas las integraciones operativas usan proveedores reales: [CSN](https://www.sismologia.cl), [Open-Meteo](https://open-meteo.com) y [GloFAS](https://www.globalfloods.eu/), [SERNAPRED](https://senapred.cl), [SERNAGEOMIN](https://www.sernageomin.cl/alertas-volcanicas/), [Aire Chile](https://airechile.mma.gob.cl/) y [MeteoChile AAA](https://archivos.meteochile.gob.cl/portaldmc/AAA/datos_AAA.json). Si una fuente falla o queda vacía, no se fabrica un valor de reemplazo.

---

## Contrato FE ↔ BE

El contrato se genera desde el backend y se verifica en la raíz:

```text
backend/app/schemas/ → OpenAPI runtime (/openapi.json)
    → make sync-contract
    → frontend/lib/api-schema.d.ts
```

`frontend/lib/types.ts` y `frontend/lib/api.ts` adaptan el contrato para la UI. OpenAPI runtime es la fuente canónica; las tablas humanas de [backend/docs/BACKEND.md](../backend/docs/BACKEND.md) deben actualizarse si divergen.

---

## Optimizaciones arquitectónicas

| Decisión | Ancla comprobable |
|----------|-------------------|
| Mapa cargado sin SSR | `frontend/app/(citizen)/monitor/page.tsx`: `next/dynamic` con `{ ssr: false }` |
| Polígonos pesados de evacuación | `frontend/lib/evacuacion-layers.ts`: PMTiles; líneas y puntos en GeoJSON |
| Geometría separada de niveles | `frontend/components/map/chile-map.tsx`: `setData` y `setFeatureState` |
| TTL live/histórico | `frontend/lib/query-cache.ts`: `staleTimeForLive` |
| Impacto sísmico precomputado | `backend/app/services/impact_service.py`: `recompute_all_scores` consume impactos |
| Lotes y tolerancia del proveedor | `backend/app/services/openmeteo_service.py` y `backend/app/services/flood_service.py` |
| Snapshots diarios y lock por fecha | `backend/app/services/daily_risk_service.py`: `get_or_compute_daily_scores` |
| Cuerpos de alerta bajo demanda | `backend/app/api/alerts.py`: `include_content=false` por defecto |

La tabla muestra decisiones de arquitectura; no incluye métricas ni promesas de latencia.

---

## Despliegue

`docker-compose.yml` en la raíz define el camino local y de despliegue:

| Servicio | Puerto | Notas |
|----------|--------|-------|
| `frontend` | 3000 | Next standalone; healthcheck local |
| `backend` | 8000 | FastAPI; healthcheck local; no se publica directamente |
| `db` | 5434 en host | PostgreSQL; no se publica a Internet |
| `adminer` | 8080 | Solo profile `tools` local |

`make up` equivale a `docker compose --profile tools up --build` e incluye Adminer. Las plantillas de entorno son [`.env.example`](../.env.example) y [`backend/.env.example`](../backend/.env.example).

### Destino configurado: `chilerisk.cl`

El despliegue previsto usa Docker Compose en Dokploy/CubePath:

1. El servicio `frontend` atiende el dominio HTTPS en el puerto 3000.
2. El proxy del frontend reenvía `/api/backend` a `backend:8000` dentro de la red Docker.
3. El backend no necesita dominio público.
4. `AUTH_SECRET`, CORS, credenciales de PostgreSQL y claves opcionales se configuran por entorno; no se escriben en el repositorio.
5. El volumen `pgdata` persiste la base de datos y no se expone fuera del host.

El dominio es un destino de despliegue configurado. La prueba funcional documentada usa el stack local.

---

## Estructura del monorepo

Monorepo políglota sin Turborepo:

- **Ownership:** `AGENTS.md` por área; referencias de stack en `backend/docs/` y `frontend/docs/`; cross-stack en `docs/`.
- **Docker:** contextos separados `./frontend` y `./backend`.
- **Contrato:** OpenAPI runtime → `make sync-contract` → `frontend/lib/api-schema.d.ts`.
- **Frontend runtime:** assets GeoJSON/PMTiles y snapshots JSON vendoreados; no se leen desde PostgreSQL.
- **Makefile:** `up`, desarrollo nativo, `verify*`, sincronización de contrato y builders de datos.

Al añadir una nueva área, conserva el patrón de `AGENTS.md`, README/índice y una entrada en este mapa.

---

## Mapa documental

| Ubicación | Rol |
|-----------|-----|
| [docs/README.md](./README.md) | Índice cross-stack task-first |
| [backend/docs/README.md](../backend/docs/README.md) | Índice backend task-first |
| [frontend/docs/README.md](../frontend/docs/README.md) | Índice frontend task-first |
| [HARNESS.md](./HARNESS.md) | Playbooks y verificación |
| [DOC-MAINTENANCE.md](./DOC-MAINTENANCE.md) | Política de evidencia y actualización |
| [QUERY-DATE.md](./QUERY-DATE.md) | Contrato `?date=` |
| [backend/docs/BACKEND.md](../backend/docs/BACKEND.md) | API, fuentes, servicios y modelos |
| [frontend/docs/FRONTEND.md](../frontend/docs/FRONTEND.md) | Estado y arquitectura cliente |
| [frontend/docs/UI-GUIDELINES.md](../frontend/docs/UI-GUIDELINES.md) | Contrato visual detallado y canónico |
| [frontend/DESIGN.md](../frontend/DESIGN.md) | Proyección visual portable de Impeccable |

*Last updated: 2026-08-07*
