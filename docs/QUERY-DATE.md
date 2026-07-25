# Consulta por día (`?date=`)

El mapa y varios endpoints permiten ver **riesgo, sismos y alertas de un día calendario en Chile**, no solo “ahora”.

---

## Ventana permitida

| Límite | Backend | Frontend |
|--------|---------|----------|
| Máximo | Hoy (TZ Chile en API; UI usa `todayIsoDate()` en browser) | `clampQueryDate` / `todayIsoDate()` |
| Mínimo | 30 días atrás | `QUERY_DATE_MAX_DAYS_BACK = 30` en `frontend/lib/query-date.ts` |
| Formato | `YYYY-MM-DD` (`date` query param) | ISO en `ui-store.selectedDate` |

**Backend:** `app/services/query_date_window.py` — `today_chile()`, `clamp_query_date()`, `day_bounds_utc()` (día civil Chile → rango UTC en DB).

**Frontend:** `frontend/lib/query-date.ts` — espejo de reglas para UI; `useQueryDate()` lee/escribe `stores/ui-store.ts`.

---

## Endpoints con `date`

| Método | Path | Notas |
|--------|------|--------|
| GET | `/api/v1/risk/national?date=` | Agregado regional desde snapshots diarios |
| GET | `/api/v1/risk/comunas?date=` | `composite_score` por comuna (coropleta) |
| GET | `/api/v1/comunas/{cod}/risk?date=` | Vector de hazards del día |
| GET | `/api/v1/events?date=` | Sismos en ventana del día (sustituye `hours=` en rutas con date) |
| GET | `/api/v1/alerts/active?date=` | **Hoy:** ATP vigentes en lookback hasta desactivación/cierre; eventos solo últimas `SENAPRED_EVENTO_ACTIVE_HOURS` (48h). **Histórico:** emitidas ese día civil (`isPrincipal` + dedupe `url_access`; sin cierres ATP/`Cierre de evento`; puede incluir `is_active=False`) |
| GET | `/api/v1/air-quality?date=` | Condición GEC Aire Chile por zona (cobertura parcial PPDA) |
| GET | `/api/v1/air-quality/{slug}?date=` | Detalle zona GEC |
| GET | `/api/v1/air-quality/by-comuna/{cod}?date=` | Lookup por comuna CUT |

Sin `date` → hoy Chile.

**Sin date en:** `GET /api/v1/regiones/{codregion}/risk` (siempre último score live), `GET /api/v1/events/{id}/impact`.

---

## Snapshots diarios (backend)

- Tabla/modelo: `DailyRiskScore` (`app/models/daily_risk_score.py`)
- Servicio: `app/services/daily_risk_service.py` — `get_or_compute_daily_scores`, cache por fecha, lock por día
- El mapa histórico no recalcula Haversine en cada request: usa filas `score_date = query_date`

---

## Frontend — UI

| Pieza | Ruta |
|-------|------|
| Selector de día | `components/map/query-date-control.tsx` |
| Estado global | `stores/ui-store.ts` + `hooks/use-query-date.ts` |
| Overlays del mapa | `components/map/map-overlays.tsx` (`DndContext` compartido) |
| Hooks que pasan fecha | `use-national-risk`, `use-map-data`, `use-recent-events`, `use-comuna-risk`, `use-active-alerts` |
| API | `lib/api.ts` — `?date=` en risk/events/alerts |

Panel de fecha: anclado `bottom-left`, draggable vía `useDraggablePanel({ corner: "bottom-left" })`.

---

## Contrato

Cambios en ventana, TZ, o campos devueltos → actualizar **este archivo**, `backend/docs/BACKEND.md`, `frontend/docs/FRONTEND.md`, y tipos en `frontend/lib/types.ts` / `backend/app/schemas/`.

---

*Last updated: 2026-07-25*