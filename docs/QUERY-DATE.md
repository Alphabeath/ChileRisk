# Consulta por día (`?date=`)

El monitor permite consultar riesgo, sismos, alertas, calidad del aire y franjas MeteoChile para un día civil de Chile. Sin `date`, todos los endpoints usan hoy en la zona horaria `America/Santiago`.

---

## Ventana permitida

| Límite | Backend | Frontend |
|--------|---------|----------|
| Máximo | Hoy (`today_chile()`) | `todayIsoDate()` |
| Mínimo | 30 días atrás (`QUERY_DATE_MAX_DAYS_BACK = 30`) | `QUERY_DATE_MAX_DAYS_BACK = 30` |
| Formato | `YYYY-MM-DD` | ISO en `ui-store.selectedDate` |

La implementación backend está en `app/services/query_date_window.py`:

- `clamp_query_date` limita una fecha a la ventana.
- `day_bounds_utc` convierte el día civil de Chile en rango UTC para la base de datos.
- `today_chile` define el extremo superior.

El espejo frontend está en `frontend/lib/query-date.ts`; `useQueryDate()` lee y escribe `stores/ui-store.ts`.

---

## Endpoints con `date`

| Método | Path | Notas |
|--------|------|-------|
| GET | `/api/v1/risk/national?date=` | Agregado regional desde snapshots diarios |
| GET | `/api/v1/risk/comunas?date=` | `composite_score` por comuna; tooling/gating, no pinta el mapa |
| GET | `/api/v1/comunas/{cod}/risk?date=` | Vector de hazards de la comuna |
| GET | `/api/v1/events?date=` | Sismos de la ventana del día |
| GET | `/api/v1/alerts/active?date=` | Alertas unificadas con semántica distinta para hoy e histórico |
| GET | `/api/v1/alerts/meteochile/zones?date=` | Franjas GeoJSON oficiales DMC solo para hoy |
| GET | `/api/v1/air-quality?date=` | Condición GEC por zona PPDA |
| GET | `/api/v1/air-quality/{slug}?date=` | Detalle de una zona GEC |
| GET | `/api/v1/air-quality/by-comuna/{cod}?date=` | Lookup por comuna CUT |

Sin `date` → hoy Chile. Sin parámetro de fecha: `/api/v1/regiones/{codregion}/risk` siempre devuelve el último score live y `/api/v1/events/{id}/impact` devuelve el impacto precomputado.

### Contrato MeteoChile AAA

`GET /api/v1/alerts/meteochile/zones?date=` llama al feed de franjas DMC y devuelve un `FeatureCollection`:

- **Hoy:** devuelve las franjas oficiales activas (`type: "FeatureCollection"`, `features` con los polígonos DMC). El frontend solo las dibuja cuando está seleccionado el filtro **Meteo**.
- **Fecha pasada dentro de la ventana:** devuelve exactamente `{ "type": "FeatureCollection", "features": [] }`. No se fabrican franjas históricas.
- **Fecha fuera de la ventana:** `clamp_query_date` la lleva al límite permitido antes de aplicar la misma regla.

La ruta backend está en `backend/app/api/alerts.py`; la integración usa `build_active_zone_geojson` en `backend/app/services/meteochile_aaa_service.py`. El hook frontend es `useMeteoChileZones`, con `staleTimeForLive` para diferenciar hoy de histórico.

### Alertas unificadas

`/api/v1/alerts/active` conserva la semántica oficial:

- **Hoy:** ATP vigentes dentro del lookback hasta desactivación/cierre; eventos limitados por `SENAPRED_EVENTO_ACTIVE_HOURS` (48 h por defecto).
- **Histórico:** registros emitidos durante ese día civil, con deduplicación por hilo; puede incluir filas `is_active=False` cuando corresponda al snapshot de emisión.
- **MeteoChile y SERNAGEOMIN:** sus datos operativos no generan franjas históricas; las franjas DMC siguen el contrato anterior.

---

## Snapshots diarios

- Modelo: `DailyRiskScore` en `backend/app/models/daily_risk_score.py`.
- Servicio: `get_or_compute_daily_scores` en `backend/app/services/daily_risk_service.py`.
- Conversión temporal: `day_bounds_utc` en `backend/app/services/query_date_window.py`.
- Protección: caché por fecha y lock/advisory lock para evitar recomputaciones concurrentes.

El monitor histórico consulta filas con `score_date = query_date`; no recalcula Haversine en cada request.

---

## Frontend — UI

| Pieza | Ruta |
|-------|------|
| Selector de día | `frontend/components/map/query-date-control.tsx` |
| Estado | `frontend/stores/ui-store.ts` + `frontend/hooks/use-query-date.ts` |
| Utilidades y ventana | `frontend/lib/query-date.ts` |
| Datos live compartidos | `frontend/components/map/monitor-live-data.tsx` |
| Overlays | `frontend/components/map/map-alerts-overlay.tsx` |
| Hooks con fecha | `use-national-risk`, `use-map-data`, `use-active-alerts`, `use-air-quality`, `use-recent-events`, `use-comuna-risk`, `use-meteochile-zones` |
| Cliente HTTP | `frontend/lib/api.ts` |
| TTL | `frontend/lib/query-cache.ts`: `staleTimeForLive` |

`MonitorLiveDataProvider` coordina las consultas de alertas y aire y prefetch al cambiar `selectedDate`. El filtro Meteo utiliza el endpoint de zonas y no mezcla esos polígonos con la coropleta de riesgo.

---

## Cambios de contrato

Cambios en ventana, zona horaria o campos devueltos requieren actualizar este archivo, [backend/docs/BACKEND.md](../backend/docs/BACKEND.md), [frontend/docs/FRONTEND.md](../frontend/docs/FRONTEND.md) y los tipos correspondientes en `backend/app/schemas/` y `frontend/lib/types.ts`. OpenAPI runtime sigue siendo la fuente canónica.

*Last updated: 2026-08-07*
