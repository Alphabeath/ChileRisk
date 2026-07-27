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
- Evacuation map (`EvacuationMap`): al aceptar geolocalización (o si el permiso ya está `granted`), dibuja un marcador DOM “Tu ubicación” (punto azul + pulso; respeta `prefers-reduced-motion`) y hace `flyTo` a esas coords
- Deep-link emergencia: `/evacuation?hazard=tsunami|volcanic&lat=&lon=` — `EvacuationPageShell` llama `getNearestMeetingPoints` y hace `flyTo` al punto más cercano (fallback KMZ client-side)

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

MapLibre — 16 regiones, 346 comunas (zoom ≥ 7), popups React (alertas SERNAPRED/ChileRisk/SERNAGEOMIN + GEC Aire Chile por zona), marcadores sísmicos M≥4.5, coloreado por `useMapData()` (respeta `selectedDate`). Zoom/brújula: `MapNavigationControl` (glass, no `NavigationControl` nativo).

**Props:** ninguna (autocontenido).

**Data:** `/data/regional.geojson`, `/data/comunas.geojson` — ver `map-config.ts`.

### Capas GIS: fuente vs runtime

| Carpeta | Rol |
|---------|-----|
| `frontend/public/data/` | Runtime MapLibre (`/data/...` en `map-config.ts`). **Commitear.** |
| `frontend/data/*.ts` | Contenido TS (`disasters.ts`, `simulacros.ts`) importado por la app. **Commitear.** |
| `frontend/data/{tsunami,volcanos,wildfire}/` | Fuentes GIS (shapefile, KMZ, TIF) para regenerar GeoJSON/KMZ en `public/data/`. **Commitear** (pipeline). |
| No poner GeoJSON duplicados en `frontend/data/` | `comunas.geojson` / `regional.geojson` viven solo en `public/data/` (y seed backend). |

**Regenerar wildfire:** `python3 scripts/convert-wildfire.py` (input `frontend/data/wildfire/ocurr_1km_2025.shp` → `public/data/wildfire/wildfire-occurrence.geojson`). Tsunami/volcanos: fuentes en `frontend/data/`; conversión a `public/data/` aún no tiene script en repo.

**A11y:** `role="application"`, `aria-label` mapa Chile.

---

### `<MapNavigationControl />`

**Path:** `components/map/map-navigation-control.tsx`

Zoom + / − y brújula (restablecer norte). Glass + Mica (`MAP_NAV_CONTROL_CLASS` / `MAP_NAV_BUTTON_CLASS` en `lib/map-panel-styles.ts`), posición top-right bajo navbar (`CITIZEN_NAVBAR_CLEARANCE_PX` + `MAP_PANEL_RIGHT_INSET_PX`). Sustituye `maplibregl.NavigationControl` en `ChileMap` y `EvacuationMap`.

---

### `<ActiveAlertsPanel />`

**Path:** `components/map/active-alerts-panel.tsx`  
**Alias deprecado:** `SenapredAlertsPanel` desde `senapred-alerts-panel.tsx`

Lista unificada: SERNAPRED + ChileRisk + SERNAGEOMIN (`useActiveAlerts`) + condiciones GEC Aire Chile (`useAirQuality`). Orden por severidad (GEC y alertas en la misma lista).

- Posición default: top-left bajo navbar
- Draggable: `useDraggablePanel({ id: "active-alerts-panel" })` (modo overlay)
- **`embedded`:** sin shell/drag (tab móvil **Alertas**)
- Badge en header: conteo del filtro activo (todas = alertas + zonas)
- **Filtro por fuente (chips visibles** bajo el header, grilla 3 cols):
  - `Todas` · `Chile Risk` · `Sernapred` · `Volcán` · `Aire`
  - Cada chip muestra conteo; filtrado client-side
  - `EmptyState` adapta el copy por filtro
- Cards: `ActiveAlertCard` + `AirQualityAlertCard` en `alert-ui.tsx` (GEC: badge nivel + expandible medidas / CTA Aire Chile; SERNAGEOMIN: badge + link `external_url`)
- Modo mapa `air` sigue en **Vistas** (no en este panel)

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

Leyenda de buckets de riesgo (`MAP_RISK_BUCKETS`), glosario SERNAPRED (`ALERT_LEVEL_META`) y glosario GEC (`AIR_QUALITY_LEVEL_META`). Ancla `bottom-right`, collapsible, draggable (`id: "risk-legend-panel"`).

Filas de color usan `LegendRow` (grid `0.75rem` + texto) para alinear el swatch con la primera línea del label.

**Selector de modo Riesgo / Alertas / Aire:** tabs controladas por `useUIStore.mapColorMode` + `setMapColorMode`. Cambiar la tab actualiza el color del mapa en `ChileMap`:

- **`risk`** → `mapRiskFillColorExpression()` (color por `composite_score`).
- **`alerts`** → `mapAlertFillColorExpression()` (match por `alert_level`). Relleno oscilante según severidad. Sin alerta → verde `#085e08`.
- **`air`** → `mapAirFillColorExpression()` (match por `air_level`). Sin cobertura GEC → gris neutro `#3a3f4a`.

Bordes siempre blancos (`#ffffff`) — no codifican severidad.

**Estado:** `useUIStore.mapColorMode: "risk" | "alerts" | "air"` (session-only, no `persist`).

---

### `map-config.ts` / `map-popup.tsx`

Sin cambios de rol: constantes MapLibre; popups con `createPopupContent()` + glass `.cr-popup` en `globals.css`. Sección sísmica usa `popup-seismic-section.tsx` y mensajes según fecha (`formatSeismicEmptyForDate`).

**Vista inicial:** `getMapFitBoundsPadding()` / `getMapPopupOptions()` en `map-popup-options.ts` — desktop reserva paneles (~296px L/R); móvil (`≤767px`) padding simétrico para centrar Chile y dejar hueco al bottom sheet.

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

- `source`: `"senapred" | "chilerisk" | "sernageomin"`
- `record_kind`: `"alerta" | "evento"`
- `external_url`, `hazard_type`, `affected_scope`, `comuna_codes`, `thread_root_id`, …

**API:** `getActiveAlerts()` → `GET /api/v1/alerts/active?date=…` — hoy: SERNAPRED vigentes hasta desactivación (lookback); histórico: emitidas ese día. Ver [QUERY-DATE.md](../../docs/QUERY-DATE.md).

**staleTime:** 2 min.

### `useAirQuality()` / `useAirQualityZone(slug)`

**Path:** `hooks/use-air-quality.ts`

```ts
useAirQuality(opts?: { date?: string; region?: number; episodeOnly?: boolean })
useAirQualityZone(slug: string | null, date?: string)
```

**Tipo:** `AirQualityZone` (`lib/types.ts`) — niveles GEC `bueno|regular|alerta|preemergencia|emergencia`.

**API:** `getAirQuality()` → `GET /api/v1/air-quality?date=…`

**staleTime:** 5 min.

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

### `/drills` — Calendario SERNAPRED

**Path:** `app/(citizen)/drills/page.tsx` (redirect permanente `/simulacros` → `/drills`)

Lista los simulacros oficiales de SERNAPRED scrapeados del sitio público. (Sin datos mock/sintéticos). Si el backend no puede sincronizar, el endpoint queda vacío hasta el próximo ciclo del scheduler (24h por defecto).

Shell: `PREPARATION_PAGE_*` (`lib/preparation-ui.ts`) + `PreparationContextBanner` (CTA al paso 8 del plan). Sin breadcrumb encima del hero.

**Composición (top → bottom):**

1. `<SimulacrosPageHero upcomingTotal={…} />` — `CitizenPageHero` (stats próximos/tipos + barra de 4 tipos SENAPRED).
2. `<SimulacrosNextDrillPanel next={…} />` — countdown del próximo simulacro (panel glass bajo el hero).
3. `<PreparationContextBanner>` — “Registra en tu plan” → `/preparation/family-plan/step/8?from=drills`.
4. `<SimulacrosImportanceAccordion>` — colapsable: importancia de los simulacros SERNAPRED.
5. `<SimulacrosTypesSection>` — panel glass con los 4 tipos SENAPRED (legible sobre el globo).
6. `<SimulacrosCalendarSection>` — header + filtros **sticky** (`PREPARATION_STICKY_SUBNAV_CLASS`: chips de tipo + `<SimulacrosFilterBar>` tabs Próximos/Pasados + región + rango) + `<SimulacrosTimeline>` agrupado por mes (rail alineado: línea + markers comparten centro; headers + filas). Sin React Chrono / rejilla.
7. `<SimulacrosFooter>` — referencia oficial + `next_synced_at` + “Actualizar”.

**Componentes:** `components/preparation/simulacros/{simulacros-page-hero, simulacros-next-drill-panel, simulacros-types-section, simulacros-types-chips, simulacros-importance-accordion, simulacros-filter-bar, simulacros-calendar-section, simulacros-timeline, simulacros-month-header, simulacro-list-row, simulacros-empty-state, simulacros-skeleton, simulacros-footer, simulacros-countdown}.tsx`. Helpers: `lib/simulacros-format.ts`, `lib/simulacros-labels.ts`, `lib/simulacros-visual.ts`. Tokens compartidos: `lib/preparation-ui.ts` + `components/layout/citizen-page-hero.tsx`.

**Estados:** skeleton mientras `isLoading`, error state con botón "Reintentar", empty state (`PREPARATION_EMPTY_STATE_CLASS`) separado para upcoming vs past.

### Plan Familia Preparada

Rutas: `/preparation` (hub), `/preparation/emergency-kit` (guía del kit), `/preparation/family-plan/step/[1-8]`, `/preparation/family-plan/summary`.

**Tokens UI:** `lib/preparation-ui.ts` (page shell `py-24`, sticky subnav, hero shell, save pill). Banners cruzados: `PreparationContextBanner`. Breadcrumbs: `PreparationBreadcrumb`.

Componentes: `components/preparation/family-plan/*`, `components/preparation/emergency-kit/*`, `components/preparation/preparation-{page-hero,topic-grid,context-banner,breadcrumb}.tsx`. Tipos: `FamilyPlan`, `FamilyPlanData` en `lib/types.ts`. Mapa de vivienda (paso 4): módulo `components/preparation/family-plan/floor-map/` (chrome + tip “Cómo editar”; canvas sin rediseño profundo). Summary: checklist de pasos incompletos con deep-link al step + CTA PDF.

**Wizard chrome:** `FamilyPlanStepNav` — desktop pills; móvil sticky (paso + pct + prev/next) + expand “Ver todos los pasos”. `FamilyPlanWizardShell` — breadcrumb Preparación → Plan → Paso N; save pill semántica; footer sticky móvil (Anterior | Guardado | Siguiente) que se oculta al focus de input.

**Step content layout:** primitivas en `family-plan-layout.tsx` (`FamilyPlanStepRoot`, `StatusBanner`, `CategoryShell`, `ItemCard`, `FormGrid`, `EmptyState`/`AddPanel`, `StatusChip`) + `FamilyPlanField`/`FamilyPlanSection`. Todos los pasos 1–8 (y chrome exterior del floor-map) usan el mismo ritmo `gap-4` y grids `sm:grid-cols-2`.

**Conexión bidireccional Kit ↔ Plan:** `/preparation/emergency-kit` usa `PreparationContextBanner` (desktop) + CTA sticky móvil → `/preparation/family-plan/step/7?from=emergency-kit`. Categorías y necesidades especiales usan `FamilyPlanCategoryShell`. Kits especiales siempre visibles; chip “En tu hogar” si el plan los marca. El wizard muestra el mismo patrón de banner de contexto cuando viene del kit.

**Conexión Calendario SERNAPRED ↔ Plan:** `/drills` → banner + CTA “Agregar a mi plan” por card hacia step 8 (`?source=senapred&…`). `StepDrills` pre-rellena y muestra banner de retorno. Hub apunta topic “Comunicación y simulacros” a `/drills`.

**Hub `/preparation` — bloques (orden top → bottom):**

1. `PreparationPageHero` — `CitizenPageHero`: identidad + stats (pasos/guías) + franja Plan/Kit/Simulacros. **Sin progreso del plan** (evita duplicar el dashboard).
2. `FamilyPlanDashboard` — dueño único del progreso: `FamilyPlanStatusBanner` (anillo + chip + CTA Continuar/Resumen) + grilla de 8 steps (todos links, también completados).
3. `PreparationTopicGrid` — 4 recursos complementarios (`FamilyPlanCategoryShell`): kit / evacuación / hogar / simulacros. No incluye “Plan familiar” (ya cubierto arriba).
4. Aside desastres → `/disasters`.

**Hooks compartidos:** `lib/use-plan-stats.ts` (`usePlanStats`) — read-only sobre `["familyPlan"]` query (`completionPct`, `pendingCount`, `steps[]`). Reutiliza cache de `useFamilyPlan`.

---

## Inicio / home ciudadano (`/dashboard`)

**Route:** `app/(citizen)/dashboard/page.tsx` — briefing del día (sin mapa). Navbar label: **Inicio**. Shell: `PREPARATION_PAGE_*` + `FamilyPlanProvider`.

**Layout (desktop):** strip hero + grilla `lg:grid-cols-12` — columna principal `col-span-8` (comuna → resumen del día → alertas nacionales); rail derecho sticky `col-span-4` (plan familiar → sismos recientes). **Móvil:** comuna → resumen → plan → sismos → alertas.

- **Hero** — `dashboard-page-hero.tsx`: strip identidad (título “ChileRisk hoy”, línea corta) + footer atajos (Monitor · Preparación · Asistente). **Sin** eyebrow/chip ni resumen IA ni `CitizenPageHero` min-height de catálogo.
- **Resumen IA** — `dashboard-summary-panel.tsx` (glass): `useDashboardSummary()` → `GET /api/v1/dashboard/summary`. Debajo de la card de comuna. Link “Asistente →”.
- **Chrome** — `DashboardSection`: glass + mica, eyebrow meta, título + ícono, link “Ver más”.
- `DashboardComunaCard` — `useComunaToday` + `ComunaTodayCard` + acciones en **grid 2×2 a ancho completo** (Compartir / PNG / Ver mapa / Mi plan).
- `DashboardFamilyPlanCard` — anillo de progreso + barra + CTA en rail.
- `DashboardEventsCard` — sismos recientes en el rail (debajo del plan): ubicación CSN, magnitud (+ tipo), profundidad etiquetada, tiempo relativo, chip Percibido/Instrumental, Mercalli si hay, link al informe; orden por relevancia (percibido → magnitud → hora).
- `DashboardAlertsCard` — top 5 alertas nacionales bajo el resumen. → `/monitor`.

Query keys: `dashboardSummary()`, `airQualityByComuna(cod, date)`, `nearestComuna`, alertas/simulacro vía `useComunaToday`. Tipo `DashboardSummary` en `lib/types.ts`.

---

## Modo Emergencia

Reactivo global en `app/(citizen)/layout.tsx` vía `EmergencyModeHost`. Fases: **takeover SAE** (1.ª activación, 12s) → **banner** → **chip reabrible** (post-dismiss). Visuales por severidad en `lib/emergency-ui.ts` (`EMERGENCY_VISUALS`, CTAs).

- Hook: `hooks/use-emergency-mode.ts` — matching multi-objetivo (`matchEmergencyAlert`, puro + tests): la alerta naranja/roja dispara si aplica al **hogar** (`home_comuna_code` + región vía `useComunaRisk`, misma fuente que `useComunaToday`) **o** al GPS (`useNearestComuna`); el objetivo que matchea alimenta `comunaCode/comunaName/regionCode` (geo gana si la alerta también aplica ahí). Dismiss por `sessionStorage` keyed por `alert.id`; `reactivate()` lo revierte (chip)
- UI: `components/emergency/`
  - `emergency-takeover.tsx` — full-screen SAE `z-[85]` (anillos + campana + countdown 12s); ack en `sessionStorage` `chilerisk:emergency-ack:<id>`; colapsa a banner con Escape/CTA/timeout
  - `emergency-banner.tsx` — fixed bajo navbar; cinta de peligro animada + fondo saturado + título `font-black` + chip "ACTIVA · hace Xm" (tick 30s) + **`getActiveAlertMainText`** + detail SERNAPRED vía **`sanitizeAlertHtml`** o **`htmlToPlainText`**; CTAs ¿Qué hago? (sólido) / Evacuar (outline, solo tsunami/volcán) / Compartir; ✕ minimiza al chip
  - `emergency-reopen-chip.tsx` — pill pulsante bajo navbar; click → `reactivate()`
  - `emergency-page-frame.tsx` — marco fijo `inset-0` `z-30` (vignette elíptica + pulse; período/color por severidad vía CSS vars; `calm` al minimizar); CSS en `globals.css`
  - `emergency-sheet.tsx` — bottom sheet portal (`z-[90]`) para compartir
  - `emergency-share-card.tsx` — preview de tarjeta visual (gradiente por severidad + cinta de peligro + “Estoy seguro/a”) capturada con `toPng` (pixelRatio 2, mismo patrón que `comuna-today-share-bar`) → Web Share con archivo / descarga PNG / copiar texto enriquecido
  - `emergency-action-sheet.tsx` — drawer vaul legacy (disponible; el host usa CTAs del banner)

**¿Qué hago?** → minimiza a chip (`dismiss()`) + `emergencyAssistantPath()` (`lib/emergency-ui.ts`) navega a `/assistant?q=<prompt de emergencia>`; `AssistantChat` auto-envía `?q=` al montar (una vez, limpia la URL con `history.replaceState`). Sin sheet de guía.

---

## Mi comuna hoy (en dashboard)

Sin ruta propia. La tarjeta vive en `/dashboard` vía `DashboardComunaCard`.

- Hook: `hooks/use-comuna-today.ts` — hogar → GPS; agrega risk + aire + alertas de comuna + simulacro **solo si región/comuna aplica** + sismo
- UI: `components/comuna-today/comuna-today-card.tsx` (glass), `comuna-today-share-bar.tsx` (acciones glass+mica; Compartir genera PNG y usa Web Share `files`, fallback descarga)
- Alertas en la card: lista desglosada (máx. 5) con badge nivel + fuente + texto principal

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
- Landing `/` keeps its own globe + intro via `app/page.tsx`. Footer: alojado en [CubePath](https://cubepath.com/) (`/cubepath.png` con fondo transparente) + crédito a [TrueRisk](https://truerisk.cloud/).
- Props: `skipIntro`, `autoRotate` on `components/globe/rotating-earth.tsx`.
- Surfaces: content panels use `GLASS_PANEL_CLASS` (same as map overlays); page heroes use gradient shell without glass — see [DESIGN.md](./DESIGN.md) §5.1.

---

## Asistente ciudadano (`/assistant`)

Chat agentico (DeepSeek en backend) con tools de lectura: plan familia, alertas, simulacros, riesgo, aire, puntos de encuentro, guías de desastre.

- Página: `app/(citizen)/assistant/page.tsx` — `h-dvh`; banner compacto + chat `max-w-7xl`
- Flujo UI: encabezado compacto → conversación → composer → disclaimer mínimo
- UI:
  - `components/assistant/assistant-chat.tsx` — shell glass, SSE, GPS auto → comuna, composer
  - `components/assistant/assistant-message.tsx` — burbujas con avatar integrado (usuario / asistente)
  - `components/assistant/assistant-history.tsx` — sidebar desktop; drawer absoluto dentro del shell del chat en móvil
  - `components/assistant/assistant-markdown.tsx` — GFM; links internos con `next/link` (acento sky/primary)
- Ubicación: GPS al cargar → `GET /api/v1/comunas/nearest`; chip «Ubicación» solo en `lg+` (texto, no botón). El system prompt del agente recibe comuna/lat/lon resueltos y no debe pedir Cuenta. Fallback: comuna de hogar.
- Shell del chat: glass translúcido (`bg-black/20–30`) para ver el globo de fondo
- Transcript: shadcn `MessageScroller` (auto-scroll); scroll solo en el panel de conversación
- Cliente: `postChat` / `streamChat` / threads / `getNearestComuna` / `getUserProfile` en `lib/api.ts`
- Hooks: `hooks/use-assistant.ts` (`useNearestComuna`, threads, profile)
- Navbar: entrada «Asistente»; middleware protege `/assistant`
- Preferencia de comuna de hogar (opcional): `PATCH /api/v1/users/me` desde `/account`

---

## Autenticación (Auth.js)

| Ruta | Acceso |
|------|--------|
| `/` | Pública (landing) |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Públicas (`/login` y `/register` redirigen a `/dashboard` si ya hay sesión) |
| Prefijos en `middleware.ts` (`/monitor`, `/dashboard`, …) | Requieren sesión |

Post-login / post-registro por defecto: `/dashboard` (Inicio). `callbackUrl` de middleware se respeta si venía de una ruta protegida.

- Config: `auth.ts`, `auth.config.ts`
- Handlers: `app/api/auth/[...nextauth]/route.ts`
- Registro / reset: `app/api/auth/register|forgot-password|reset-password`
- Proxy API autenticado: `app/api/backend/[...path]` → FastAPI con JWT HS256
- Cliente HTTP: `lib/api.ts` usa base `/api/backend` (same-origin)
- UI: `components/auth/*`, cuenta en `app/(citizen)/account/page.tsx`
- **Demo hackathon:** `/login` → `DemoLoginCard` (credenciales + copiar + “Entrar con cuenta demo”). Credenciales en `lib/demo-login.ts`; seed backend `SEED_DEMO_USER`.

Variables: `frontend/.env.example` (`AUTH_SECRET`, Google OAuth, `BACKEND_INTERNAL_URL`).

---

*Last updated: 2026-07-26*