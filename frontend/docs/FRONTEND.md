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
- Badge en header: total global
- **Filtro por fuente** (Popover shadcn, filtrado client-side, sin re-fetch):
  - Botón `Filter` entre el handle drag y el botón colapsar
  - Dot rojo en el icono cuando hay filtro activo
  - Sub-label en el título muestra filtro activo (`· Chile Risk`, etc.)
  - Opciones: `Todas` (default) · `Chile Risk` · `Sernapred`
  - Cada opción muestra conteo (rojo si >0, neutro si 0) + check cuando activa
  - `EmptyState({ filter })` adapta el copy según filtro activo
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

### `useSimulacros(params?)` / `useNextSimulacro()` / `useSimulacro(slug)`

**Path:** `hooks/use-simulacros.ts`

```ts
useSimulacros(params?: {
  from?: string         // YYYY-MM-DD
  to?: string
  region?: number       // 1-16
  type?: DrillType
  source?: "future" | "recent" | "archive"
  upcoming_only?: boolean
  past_only?: boolean
  limit?: number
  offset?: number
})
useNextSimulacro()              // GET /api/v1/simulacros/next
useSimulacro(slug)              // GET /api/v1/simulacros/{slug}
```

**Tipo:** `Simulacro` (`lib/types.ts`):

- `slug`, `title`, `drill_date` (YYYY-MM-DD), `region_code`, `region_name`
- `drill_type`: `"sismo_tsunami_borde_costero" | "sismo_tsunami_educacion" | "erupcion_volcanica" | "remocion_en_masa" | "otro"`
- `participating_comunas: string[]`, `summary`, `detail_url`, `mensaje_sae`
- `source`: `"future"` (calendario próximo) | `"recent"` (pasado reciente) | `"archive"`

**API:** `listSimulacros` → `GET /api/v1/simulacros?…`. Helper `buildSimulacroDrillHref(sim)` (`lib/simulacros-to-drill.ts`) construye el link al step 8 del Plan Familia con `?source=senapred&date=&emergency_type=&outcome=` para pre-rellenar el form de registro de simulacros.

**staleTime:** 30 min (calendario cambia con poca frecuencia).

### Otros hooks con fecha

| Hook | Endpoint |
|------|----------|
| `useNationalRisk` | `/api/v1/risk/national?date=` |
| `useMapData` | national + `/risk/comunas?date=` + GeoJSON |
| `useRecentEvents` | `/api/v1/events?date=` |
| `useComunaRisk` | `/api/v1/comunas/{id}/risk?date=` |
| `useFamilyPlan` | `GET/PUT /api/v1/family-plan` (autosave debounced) |

Claves: `lib/queries.ts`. Cliente HTTP único: `lib/api.ts`.

### `/preparation/simulacros` — Calendario SERNAPRED

**Path:** `app/(citizen)/preparation/simulacros/page.tsx`

Lista los simulacros oficiales de SERNAPRED scrapeados del sitio público. Sin flag mock — si el backend no puede sincronizar, el endpoint queda vacío hasta el próximo ciclo del scheduler (24h por defecto).

**Composición (top → bottom):**

1. Back link + botón glass "Actualizar".
2. `<SimulacrosPageHero next={useNextSimulacro()} upcomingTotal={…} />` — hero glass con gradiente Chile, stat boxes (cuenta regresiva, total próximos, tipos) y barra de 4 tipos SENAPRED.
3. `<SimulacrosEducation />` — contenido institucional SENAPRED: importancia (5 puntos) + guía de tipos con imágenes oficiales (`lib/simulacros-content.ts`).
4. `<SimulacrosFilterBar>` — tabs `Próximos` (default) / `Pasados` + chips de filtro (región 1-16, tipo de simulacro). Solo datos del bloque **CALENDARIO SIMULACROS 2026** (scraping).
5. Grid de `<SimulacroCard variant="upcoming" | "past">` — título SERNAPRED, banda por `drill_type` (`lib/simulacros-visual.ts`), badge `Mensaje SAE`, badge `HOY`, botón "Ver en SENAPRED" solo si `detail_url` apunta a `/simulacros_t/` (pasados con informe publicado) + "Agregar a mi plan" (solo próximos).
6. `<SimulacrosFooter>` — referencia oficial + link + `next_synced_at`.

**Componentes:** `components/preparation/simulacros/{simulacros-page-hero, simulacros-education, simulacros-filter-bar, simulacro-card, simulacros-empty-state, simulacros-skeleton, simulacros-footer}.tsx`. Helpers: `lib/simulacros-format.ts`, `lib/simulacros-labels.ts`, `lib/simulacros-visual.ts`, `lib/simulacros-content.ts`.

**Estados:** skeleton mientras `isLoading`, error state con botón "Reintentar", empty state separado para upcoming vs past.

### Plan Familia Preparada

Rutas: `/preparation` (dashboard), `/preparation/emergency-kit` (guía educativa del kit), `/preparation/family-plan/step/[1-8]`, `/preparation/family-plan/summary`.

Componentes: `components/preparation/family-plan/*`, `components/preparation/emergency-kit/*`. Tipos: `FamilyPlan`, `FamilyPlanData` en `lib/types.ts`. Mapa de vivienda (paso 4): módulo `components/preparation/family-plan/floor-map/`; layout tipo mapa (plano full-width + toolbar flotante `floor-map-toolbar`); herramientas por toggle (habitación/marcador/anotación → clic en plano); constantes en `lib/floor-map-constants.ts`, tools en `lib/floor-map-tools.ts`; plantillas en `lib/floor-map-templates.ts`; miniatura en `family-plan-summary`.

**Conexión bidireccional Kit ↔ Plan:** la página `/preparation/emergency-kit` tiene un CTA "Guardar en tu plan" que navega a `/preparation/family-plan/step/7?from=emergency-kit`. El step 7 detecta el query y muestra un banner superior con link de retorno. La banner `<EmergencyKitGuideLink variant="banner">` también aparece en la parte superior del step 7 fuera del flujo `?from=`.

**Conexión Calendario SERNAPRED ↔ Plan:** la página `/preparation/simulacros` lista los simulacros oficiales con countdown al próximo. Cada simulacro futuro tiene un CTA "Agregar a mi plan" que navega a `/preparation/family-plan/step/8?source=senapred&slug=…&date=…&emergency_type=…&outcome=…`. El `StepDrills` detecta `?source=senapred`, pre-rellena el form con esos datos (reutilizando el último drill si está vacío, o creando uno nuevo), y muestra un banner superior con link de retorno al calendario. La página `/preparation` apunta el CTA del topic card "Comunicación y simulacros" al calendario (`/preparation/simulacros`), y el `StepDrills` añade un link "Ver calendario oficial de SERNAPRED →" en la parte superior cuando el usuario NO viene del calendario.

**Dashboard `/preparation` — bloques (orden top → bottom):**

1. `PreparationPageHero` — glass + gradient Chile, watermark SVG silueta de Chile, 4 stat boxes (`Pasos pendientes` live + pasos del plan / guías / amenazas). **Sin strip inferior** — la taxonomía Antes/Durante/Después es de `/disasters`, no se reusa acá.
2. `FamilyPlanDashboard` — anillo de progreso SVG (`r=40`, `stroke-dasharray`) + grilla de 8 step chips (`grid-cols-2 sm:grid-cols-4`). Cada chip usa color **temático del step** (no por fase): `STEP_ACCENT[step]` mappea step→color (1=blue, 2=amber, 3=emerald, 4=orange, 5=cyan, 6=violet, 7=rose, 8=pink) para el ícono + número. Chips completados = `bg-emerald-500/[0.06]`, ícono + check en emerald uniforme. Pendientes = `<Link>` al step. **Sin leyenda ni border-left de fase**.
3. `PreparationTopicGrid` — 4 cards (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`), header con gradient saturado + ícono `size-12`, 3 bullet rows con íconos lucide en chip de color.
4. Aside `Siguiente paso` → gradient Chile + watermark `ShieldAlert`, link a `/disasters`.

**Hooks compartidos:** `lib/use-plan-stats.ts` (`usePlanStats`) — read-only sobre `["familyPlan"]` query, calcula `completionPct`, `pendingCount` (= 8 − completed) y `steps[]`. Reutiliza el cache de React Query con `useFamilyPlan` (mismo query key → sin doble fetch).

---

## Deprecations (compat)

| Antiguo | Actual |
|---------|--------|
| `/evacuacion`, `EvacuacionMap` | `/evacuation`, `EvacuationMap` |
| `/preparacion`, `PreparacionPageHero` | `/preparation`, `PreparationPageHero` |
| `SenapredAlertsPanel` | `ActiveAlertsPanel` |
| `SenapredAlert` (type) | `ActiveAlert` |
| `senapred_url` | `external_url` |
| `SENAPRED_DND_CONTEXT_ID` | `ALERTS_DND_CONTEXT_ID` |

---

## Autenticación (Auth.js)

| Ruta | Acceso |
|------|--------|
| `/` | Pública (landing) |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Públicas |
| `(citizen)/*` | Requiere sesión (`middleware.ts`) |- Config: `auth.ts`, `auth.config.ts`
- Handlers: `app/api/auth/[...nextauth]/route.ts`
- Registro / reset: `app/api/auth/register|forgot-password|reset-password`
- Proxy API autenticado: `app/api/backend/[...path]` → FastAPI con JWT HS256
- Cliente HTTP: `lib/api.ts` usa base `/api/backend` (same-origin)
- UI: `components/auth/*`, cuenta en `app/(citizen)/account/page.tsx`

Variables: `frontend/.env.example` (`AUTH_SECRET`, Google OAuth, `BACKEND_INTERNAL_URL`).

---

*Last updated: 2026-06-11*