# FRONTEND.md — Component & hook reference

Referencia de lo **shipped** en el mapa y datos. Índice agente: [AGENTS.md](../AGENTS.md). Diseño: [DESIGN.md](./DESIGN.md).

---

## Map page composition

**Route:** `app/(citizen)/monitor/page.tsx`

```tsx
<ChileMap />
<MapOverlays />  // desktop columns + mobile Drawer
```

**Evacuation:** `app/(citizen)/evacuation/page.tsx` → `EvacuationPageShell` (same breakpoint pattern).

### Responsive map chrome (`md` = 768px)

| Viewport | UI |
|----------|-----|
| `md+` | Floating glass columns + DnD (`MapLeftPanelsColumn` / `MapRightPanelsColumn` or `EvacuationLeftPanelsColumn`) |
| `<md` | Columns hidden; persistent **bottom sheet** (collapsed bar always visible; expand for tab content) |

- Breakpoint helpers: `MAP_MOBILE_BREAKPOINT`, `MAP_DESKTOP_ONLY_CLASS`, `MAP_DESKTOP_ONLY_CONTENTS_CLASS`, `MAP_MOBILE_ONLY_CLASS` in `lib/citizen-layout.ts`
- Primitive: `components/map/map-mobile-bottom-sheet.tsx` — portal a `body`, handle + status + tabs, expanded/collapsed
- Monitor: `components/map/monitor-mobile-drawer.tsx` — tabs **Alertas** \| **Fecha** \| **Vistas** (sin Controles/`MapActionsPanel` en móvil)
- Evacuation: `components/evacuation/evacuation-mobile-drawer.tsx` — tabs **Puntos** \| **Capas**; sheet oculto mientras el prompt de ubicación está activo

### `<MapOverlays />`

**Path:** `components/map/map-overlays.tsx`

- Desktop (`md+`): `DndContext` with `PointerSensor` (`distance: 4`), `KeyboardSensor`, `restrictToWindowEdges` → left/right columns
- Mobile: `MonitorMobileDrawer` (persistent bottom sheet)
- ID contexto: `ALERTS_DND_CONTEXT_ID` (`"chilerisk-active-alerts"`)

Overlays draggables deben vivir **dentro** del `DndContext` desktop.

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
- Draggable: `useDraggablePanel({ id: "active-alerts-panel" })` (modo overlay)
- **`embedded`:** sin shell, drag ni título de panel (el tab del bottom sheet ya lo identifica) — contenido dentro del sheet móvil
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

Leyenda de buckets de riesgo (`MAP_RISK_BUCKETS` en `lib/risk-scale.ts`) y glosario de niveles de alerta (`ALERT_LEVEL_META`). Ancla `bottom-right`, collapsible, draggable (`id: "risk-legend-panel"`).

**Selector de modo Riesgo / Alertas:** las tabs internas (`shadcn Tabs`) están **controladas por el store global** (`useUIStore.mapColorMode` + `setMapColorMode`). Cambiar la tab actualiza el color del mapa en `ChileMap`:

- **`risk`** (default) → `region-fill` y `comuna-fill` usan `mapRiskFillColorExpression()` (color por `composite_score`).
- **`alerts`** → `region-fill` y `comuna-fill` usan `mapAlertFillColorExpression()` (match por `alert_level` por feature). El **relleno oscila** (`fill-opacity` interpola con `requestAnimationFrame`, período 1500–3000 ms según severidad). Sin alerta activa → fill verde `#085e08` (bucket "bajo") con entrada propia en el glosario.

Bordes siempre blancos (`#ffffff`) — no codifican severidad. La capa legacy `region-alert-line` (borde con color de alerta) fue eliminada.

**Estado:** `useUIStore.mapColorMode: "risk" | "alerts"` (default `"risk"`, session-only, no `persist`).

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
| `MAP_MOBILE_BREAKPOINT` | `"md"` — cutoff paneles flotantes vs Drawer |
| `MAP_DESKTOP_ONLY_CLASS` | `hidden md:flex` — columnas de paneles |
| `MAP_DESKTOP_ONLY_CONTENTS_CLASS` | `hidden md:contents` — wrapper DnD desktop |
| `MAP_MOBILE_ONLY_CLASS` | `md:hidden` — FAB / drawer host |

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

### `/simulacros` — Calendario SERNAPRED

**Path:** `app/(citizen)/simulacros/page.tsx`

Lista los simulacros oficiales de SERNAPRED scrapeados del sitio público. (Sin datos mock/sintéticos). Si el backend no puede sincronizar, el endpoint queda vacío hasta el próximo ciclo del scheduler (24h por defecto).

Shell: `PREPARATION_PAGE_*` (`lib/preparation-ui.ts`) + `PreparationBreadcrumb` + `PreparationContextBanner` (CTA al paso 8 del plan).

**Composición (top → bottom):**

1. `<SimulacrosPageHero next={…} upcomingTotal={…} />` — hero glass (`PREPARATION_HERO_SHELL_CLASS`), stats (próximos / tipos), **countdown dominante** del próximo simulacro (`SimulacrosCountdown`) y barra de 4 tipos SENAPRED.
2. `<PreparationContextBanner>` — “Registra en tu plan” → `/preparation/family-plan/step/8?from=simulacros`.
3. `<SimulacrosImportanceAccordion>` — colapsable: importancia de los simulacros SERNAPRED.
4. `<SimulacrosCalendarSection>` — header + filtros **sticky** (`PREPARATION_STICKY_SUBNAV_CLASS`: chips de tipo + `<SimulacrosFilterBar>` tabs Próximos/Pasados + región + rango) + `<SimulacrosTimeline>` agrupado por mes (rail por evento, headers tipo CategoryShell, filas compactas sin “Hoy” duplicado). Sin React Chrono / rejilla.
5. `<SimulacrosFooter>` — referencia oficial + `next_synced_at` + “Actualizar”.

**Componentes:** `components/preparation/simulacros/{simulacros-page-hero, simulacros-types-chips, simulacros-importance-accordion, simulacros-filter-bar, simulacros-calendar-section, simulacros-timeline, simulacros-month-header, simulacro-list-row, simulacros-empty-state, simulacros-skeleton, simulacros-footer, simulacros-countdown}.tsx`. Helpers: `lib/simulacros-format.ts`, `lib/simulacros-labels.ts`, `lib/simulacros-visual.ts`. Tokens compartidos: `lib/preparation-ui.ts`.

**Estados:** skeleton mientras `isLoading`, error state con botón "Reintentar", empty state (`PREPARATION_EMPTY_STATE_CLASS`) separado para upcoming vs past.

### Plan Familia Preparada

Rutas: `/preparation` (hub), `/preparation/emergency-kit` (guía del kit), `/preparation/family-plan/step/[1-8]`, `/preparation/family-plan/summary`.

**Tokens UI:** `lib/preparation-ui.ts` (page shell `py-24`, sticky subnav, hero shell, save pill). Banners cruzados: `PreparationContextBanner`. Breadcrumbs: `PreparationBreadcrumb`.

Componentes: `components/preparation/family-plan/*`, `components/preparation/emergency-kit/*`, `components/preparation/preparation-{page-hero,topic-grid,context-banner,breadcrumb}.tsx`. Tipos: `FamilyPlan`, `FamilyPlanData` en `lib/types.ts`. Mapa de vivienda (paso 4): módulo `components/preparation/family-plan/floor-map/` (chrome + tip “Cómo editar”; canvas sin rediseño profundo). Summary: checklist de pasos incompletos con deep-link al step + CTA PDF.

**Wizard chrome:** `FamilyPlanStepNav` — desktop pills; móvil sticky (paso + pct + prev/next) + expand “Ver todos los pasos”. `FamilyPlanWizardShell` — breadcrumb Preparación → Plan → Paso N; save pill semántica; footer sticky móvil (Anterior | Guardado | Siguiente) que se oculta al focus de input.

**Step content layout:** primitivas en `family-plan-layout.tsx` (`FamilyPlanStepRoot`, `StatusBanner`, `CategoryShell`, `ItemCard`, `FormGrid`, `EmptyState`/`AddPanel`, `StatusChip`) + `FamilyPlanField`/`FamilyPlanSection`. Todos los pasos 1–8 (y chrome exterior del floor-map) usan el mismo ritmo `gap-4` y grids `sm:grid-cols-2`.

**Conexión bidireccional Kit ↔ Plan:** `/preparation/emergency-kit` usa `PreparationContextBanner` (desktop) + CTA sticky móvil → `/preparation/family-plan/step/7?from=emergency-kit`. Categorías y necesidades especiales usan `FamilyPlanCategoryShell`. Kits especiales siempre visibles; chip “En tu hogar” si el plan los marca. El wizard muestra el mismo patrón de banner de contexto cuando viene del kit.

**Conexión Calendario SERNAPRED ↔ Plan:** `/simulacros` → banner + CTA “Agregar a mi plan” por card hacia step 8 (`?source=senapred&…`). `StepDrills` pre-rellena y muestra banner de retorno. Hub apunta topic “Comunicación y simulacros” a `/simulacros`.

**Hub `/preparation` — bloques (orden top → bottom):**

1. `PreparationPageHero` — identidad de sección (título + copy + meta estática pasos/guías). **Sin progreso del plan** (evita duplicar el dashboard).
2. `FamilyPlanDashboard` — dueño único del progreso: `FamilyPlanStatusBanner` (anillo + chip + CTA Continuar/Resumen) + grilla de 8 steps (todos links, también completados).
3. `PreparationTopicGrid` — 4 recursos complementarios (`FamilyPlanCategoryShell`): kit / evacuación / hogar / simulacros. No incluye “Plan familiar” (ya cubierto arriba).
4. Aside desastres → `/disasters`.

**Hooks compartidos:** `lib/use-plan-stats.ts` (`usePlanStats`) — read-only sobre `["familyPlan"]` query (`completionPct`, `pendingCount`, `steps[]`). Reutiliza cache de `useFamilyPlan`.

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

## Globe page background (non-map citizen)

**Layout:** `app/(citizen)/layout.tsx` mounts `GlobePageBackground` (`components/globe/globe-page-background.tsx`).

- Fixed `RotatingEarth` with `skipIntro` + `autoRotate` (no Chile zoom; continuous rotation).
- Hidden on `/monitor` and `/evacuation` (MapLibre routes).
- Landing `/` keeps its own globe + intro via `app/page.tsx`.
- Props: `skipIntro`, `autoRotate` on `components/globe/rotating-earth.tsx`.
- Surfaces: content panels use `GLASS_PANEL_CLASS` (same as map overlays); page heroes use gradient shell without glass — see [DESIGN.md](./DESIGN.md) §5.1.

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

*Last updated: 2026-07-23*