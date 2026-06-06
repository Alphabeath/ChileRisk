# FRONTEND.md — Component & hook reference

Referencia de lo **shipped** en el mapa y datos. Índice agente: [AGENTS.md](../AGENTS.md). Diseño: [DESIGN.md](./DESIGN.md).

---

## Map page composition

**Route:** `app/(citizen)/map/page.tsx`

```tsx
<ChileMap />
<MapOverlays />  // DndContext + paneles
```

### `<MapOverlays />`

**Path:** `components/map/map-overlays.tsx`

- `DndContext` con `PointerSensor` (`distance: 4`), `KeyboardSensor`, `restrictToWindowEdges`
- Renderiza: `ActiveAlertsPanel`, `QueryDateControl`, `RiskLegendPanel`
- ID contexto: `ALERTS_DND_CONTEXT_ID` (`"chilerisk-active-alerts"`)

Cualquier overlay draggable debe vivir **dentro** de este contexto.

---

## Map components

### `<ChileMap />`

**Path:** `components/map/chile-map.tsx`

MapLibre — 16 regiones, 346 comunas (zoom ≥ 7), popups React, marcadores sísmicos M≥4.5, coloreado por `useMapData()` (respeta `selectedDate`).

**Props:** ninguna (autocontenido).

**Data:** `/data/regional.geojson`, `/data/comunas.geojson` — ver `map-config.ts`.

**A11y:** `role="application"`, `aria-label` mapa Chile.

---

### `<ActiveAlertsPanel />`

**Path:** `components/map/active-alerts-panel.tsx`  
**Alias deprecado:** `SenapredAlertsPanel` desde `senapred-alerts-panel.tsx`

Lista alertas unificadas (SERNAPRED alertas/eventos + ChileRisk). Usa `useActiveAlerts()` + `sortActiveAlerts` (`lib/alerts-display.ts`).

- Posición default: top-left bajo navbar (`MAP_PANEL_DEFAULT_TOP_PX` desde `lib/citizen-layout.ts`)
- Draggable: `useDraggablePanel({ id: "active-alerts-panel" })`
- Glass: `bg-black/60 backdrop-blur-xl`, esquinas rectas
- Badge en header: conteos por fuente (SERNAPRED alerta/evento, ChileRisk)
- Cards: `ActiveAlertCard` en `alert-ui.tsx` / `senapred-alert-ui.tsx`

---

### `<QueryDateControl />`

**Path:** `components/map/query-date-control.tsx`

Selector de día para mapa y hooks (`useQueryDate` → `ui-store.selectedDate`).

- Ancla: `corner: "bottom-left"` + drag
- Prev/next día, calendario (`Calendar` + `Popover` shadcn), “Hoy”
- Ventana: 30 días — `lib/query-date.ts`
- API: pasa `date` en risk/events/alerts vía hooks

Ver [QUERY-DATE.md](../../docs/QUERY-DATE.md).

---

### `<RiskLegendPanel />`

**Path:** `components/map/risk-legend-panel.tsx`

Leyenda de buckets de riesgo (`MAP_RISK_BUCKETS` en `lib/risk-scale.ts`). Ancla `bottom-right`, collapsible, draggable (`id: "risk-legend-panel"`).

---

### `map-config.ts` / `map-popup.tsx`

Sin cambios de rol: constantes MapLibre; popups con `createPopupContent()` + glass `.cr-popup` en `globals.css`. Sección sísmica usa `popup-seismic-section.tsx` y mensajes según fecha (`formatSeismicEmptyForDate`).

---

## Layout helpers

### `lib/citizen-layout.ts`

| Export | Uso |
|--------|-----|
| `MAP_PANEL_DEFAULT_TOP_PX` | Top bajo `CitizenNavbar` |
| `MAP_PANEL_WIDTH_CLASS` | `w-[260px] max-w-[calc(100vw-2rem)]` compartido por paneles |

### `hooks/use-draggable-panel.ts`

| Opción | Comportamiento |
|--------|----------------|
| `defaultPosition` | Fixed x/y (alertas) |
| `corner` + `cornerInset` | bottom-left / bottom-right; re-ancla en resize |

Retorna: `ref`, `handleProps`, `style`, `isDragging`, `isMoved`, `resetPosition`.

---

## Data hooks

### `useQueryDate()`

**Path:** `hooks/use-query-date.ts` — `{ selectedDate, setSelectedDate }` desde zustand.

### `useActiveAlerts(params?)`

**Path:** `hooks/use-active-alerts.ts`

```ts
useActiveAlerts(params?: {
  region?: number
  level?: AlertLevel
  date?: string  // default: selectedDate del store
})
```

**Tipo:** `ActiveAlert` (`lib/types.ts`):

- `source`: `"senapred" | "chilerisk"`
- `record_kind`: `"alerta" | "evento"`
- `external_url`, `hazard_type`, `affected_scope`, `comuna_codes`, `thread_root_id`, …

**API:** `getActiveAlerts()` → `GET /api/v1/alerts/active?date=…`

**staleTime:** 2 min.

### Otros hooks con fecha

| Hook | Endpoint |
|------|----------|
| `useNationalRisk` | `/api/v1/risk/national?date=` |
| `useMapData` | national + `/risk/comunas?date=` + GeoJSON |
| `useRecentEvents` | `/api/v1/events?date=` |
| `useComunaRisk` | `/api/v1/comunas/{id}/risk?date=` |

Claves: `lib/queries.ts`. Cliente HTTP único: `lib/api.ts`.

---

## Deprecations (compat)

| Antiguo | Actual |
|---------|--------|
| `SenapredAlertsPanel` | `ActiveAlertsPanel` |
| `SenapredAlert` (type) | `ActiveAlert` |
| `senapred_url` | `external_url` |
| `SENAPRED_DND_CONTEXT_ID` | `ALERTS_DND_CONTEXT_ID` |

---

*Last updated: 2026-06-05*