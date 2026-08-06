# Frontend — referencia estable

## Stack

- Next.js 16 (Turbopack) + React + Tailwind CSS. Auth UI aún no; el monitor usa proxy `/api/backend` con JWT guest.
- HTTP: `lib/api.ts` → same-origin `/api/backend/*` (firma `jose` + `AUTH_SECRET`) → FastAPI. **TanStack Query** (`@tanstack/react-query`) — ver § [Datos del backend (TanStack Query)](#datos-del-backend-tanstack-query).
- Docker: `frontend/Dockerfile` (multi-stage bun + `output: "standalone"` en `next.config.ts`) + `.dockerignore`. Health: `GET /api/health`.
- Mapas: **MapLibre GL JS 6.1** vía wrapper vendido `components/ui/map.tsx` (mapcn: exporta `Map`, `MapControls`, `useMap`, `MapGeoJSON`, etc.).
- Superficies / Mica: `lib/surface.ts` + `MicaLightProvider` en root layout — ver [DESIGN.md](DESIGN.md).

## Rutas

Índice canónico en [AGENTS.md](../AGENTS.md). Existentes hoy:

| Ruta | Página | Estado |
|---|---|---|
| `/` | Landing (sin citizen navbar) | pública |
| `/monitor` | Mapa multi-amenaza (API real + Alertas + Fecha) | pública + navbar |
| `/evacuacion` | Mapa evacuación (capas tsunami/volcán/incendio + puntos cercanos) | pública + navbar |
| `/desastres`, `/desastres/[tipo]` | Guías de preparación SENAPRED (catálogo + detalle) | pública + navbar |
| `/inicio`, `/preparacion`, `/asistente`, `/simulacros`, `/cuenta` | Stubs “Próximamente” | pública + navbar |

Citizen chrome vive en `app/(citizen)/` (route group; URLs sin prefijo). Auth (`/iniciar-sesion`, …) aún no. Código de features en inglés.

## Superficies y Mica

- Tokens: `SURFACE_PANEL_CLASS`, `SURFACE_MICA_INTERACTIVE_CLASS`, `SURFACE_PANEL_SHELL_CLASS` en `lib/surface.ts`.
- CSS theme-aware: `.surface-mica` en `app/globals.css` (`--mica-spot`, `--mica-mid`, blend claro/oscuro).
- Provider: `components/mica-light-provider.tsx` (rAF + `pointer: fine` + `prefers-reduced-motion`) montado dentro de `ThemeProvider` en `app/layout.tsx`.
- Cableado actual: shell de `MapControls` (`ControlGroup`), card de `MapPopup` en `components/ui/map.tsx`, `CitizenNavbar`, y paneles de `/evacuacion`.

## Mapa de evacuación (`/evacuacion`)

Página dedicada (no `ChileMap`). Host **mapcn** (`Map` / `useMap` / `MapControls` / `MapPopup`).

- `app/(citizen)/evacuacion/page.tsx` → `EvacuationPageShell`
- `components/map/evacuacion-map.tsx` — mapa + capas imperativas; basemap **satélite** (default) / **calle** OpenFreeMap Liberty+Dark (cambio de basemap vía `styles`/`setStyle`, sin remount — conserva centro/zoom como el tema); marcador de ubicación del usuario (punto azul con ping) visible **junto a los puntos de encuentro** (zoom ≥ `EVACUATION_MEETING_POINTS_MIN_ZOOM`)
- `lib/evacuacion-layers.ts` — tsunami / volcán / incendio; polígonos pesados = PMTiles only; flechas de rutas al **extremo final** de cada LineString
- `components/evacuacion/*` — leyenda (chips + lista scrollable; checkboxes custom), puntos cercanos (acciones **En mapa** / **Google Maps**); columna desktop reparte altura entre ambos paneles; popup de capa (`EvacuationPopupShell` / `EvacuationPopupContent`) sigue el patrón territorio/sismo (`MapPopup` `md+`, `Sheet` móvil); sección **Detalle** muestra descripción de qué es / qué hacer por capa (`getEvacuationPopupDescription`, sin fila de ubicación); auto-locate silencioso si `permissions.geolocation === "granted"`; sin modal de ubicación al entrar
- Assets: `public/data/evacuacion/` vía `make evacuacion-data` (GDAL + tippecanoe). Polígonos pesados = **solo PMTiles**; líneas/puntos = GeoJSON. **Cota 30 m fuera de v1.**
- API: `GET /api/v1/meeting-points/nearest` vía `useNearestMeetingPoints`; deep-link `?hazard=tsunami|volcanic&lat=&lon=`
- Defaults capas: peligros volcánicos ON, radios OFF; incendio off hasta toggle

## Guías de desastres (`/desastres`)

Contenido vendoreado de senapred.cl (25 guías: 22 "Prepárate con SENAPRED" + 3 "Preparación inclusiva"). 100% estático: sin backend ni TanStack Query.

- `scripts/sync-senapred-guides.mjs` (`bun run sync:senapred`) — scraper one-shot: parsea Elementor HTML → `data/senapred/<slug>.json` + imágenes a `public/data/senapred/img/<slug>/`. Captura también los fondos de sección/columna (`elementor-frontend-inline-css` → bloque `background`) y las 25 imágenes de tarjetas de `/recomendaciones/` → `public/data/senapred/img/catalog/` + `cardImage` en cada JSON + `index.json`. Commit del snapshot; re-run para refrescar.
- `lib/senapred-guides.ts` — tipos (`GuideBlock`: text/links/step/figure/subheading), `listGuideSummaries` / `getGuide` (require context sobre JSON vendoreado), iconos lucide por slug (`GUIDE_ICONS` record + `getGuideIcon`), `GUIDE_GROUPS`, `FEATURED_GUIDE_SLUGS` / `isFeaturedGuideSlug` (amenazas prioritarias del catálogo).
- `app/(citizen)/desastres/page.tsx` — catálogo con hero de marca (`DisastersCatalogHero`: full-bleed con asset `public/data/senapred/img/catalog/hero.png` (1672×941) + scrim institucional Chile + stats mono), bloque **Amenazas prioritarias** (6 featured `FEATURED_GUIDE_SLUGS`, sismos en span 2 cols `md+`), resto de grupos en cards imagen-first (`GuideCard` variants featured/standard/inclusive, headers de sección con count mono y `border-b`), aside atribución con link a SENAPRED. Scroll-reveal con `ScrollRoot` + `Reveal`.
- `app/(citizen)/desastres/[tipo]/page.tsx` — SSG vía `generateStaticParams`; slug desconocido → `notFound()`. Cuerpo: `components/disasters/guide-content.tsx` (back-link "Todas las guías" al catálogo; hero alto `h-72 sm:h-[28rem]` con gradiente profundo y título/blurb/contador de secciones cuando `intro[0]` es `background`; columna de lectura `max-w-3xl`; secciones numeradas `01…NN` con reveals; pasos con pictogramas SENAPRED y peso visual propio; fondos de sección full-bleed; botones Descargables/NNA).
- `components/disasters/scroll-reveal.tsx` — `ScrollRoot` (main scroller como root del `IntersectionObserver` de Motion) + `Reveal` (fade+rise one-shot, `once: true`, estático si `prefers-reduced-motion`). Uso obligatorio en páginas scrollables del shell citizen (`h-dvh overflow-hidden`).
- Atribución por guía ("Fuente: SENAPRED · <título>" + link al original).

## Citizen navbar

- `components/layout/citizen-navbar.tsx` — top bar fija (`SURFACE_PANEL_SHELL_CLASS`) + Sheet móvil; compacto `md`–`xl` (iconos + label activo + Tooltip). Marca móvil `text-sm` (igual que links del Sheet); pill del Sheet sin spring.
- `lib/citizen-nav.ts` — ítems IA (rutas ES) + `isNavActive`.
- `lib/citizen-layout.ts` — `CITIZEN_NAVBAR_CLEARANCE_PX` / `CITIZEN_NAVBAR_PAD_TOP_CLASS` para contenido y paneles futuros.
- `components/layout/page-stub.tsx` — placeholder compartido (`h-dvh overflow-y-auto`).
- Layout: `app/(citizen)/layout.tsx` (`h-dvh overflow-hidden`). Detalle visual: [DESIGN.md](DESIGN.md) §7.3.

## Sistema de mapa (`/monitor`)

Migrado desde `old_frontend/`: cartografía + detalle de territorio + **panel Alertas** + **panel Fecha** + capa sismos, cableados al backend vía `lib/api.ts` y React Query. Sin leyenda de riesgo ni Controles.

- `app/(citizen)/monitor/page.tsx` — `MonitorLiveDataProvider` + `ChileMap` vía `next/dynamic` (`ssr: false`) + `MapAlertsOverlay` bajo la navbar fija.
- `app/api/backend/[...path]/route.ts` — proxy JWT guest (`sub: "guest"`) hacia `BACKEND_INTERNAL_URL`.
- `lib/api.ts` / `lib/types.ts` / `lib/queries.ts` / `lib/query-cache.ts` — cliente HTTP + keys TQ + TTL hoy/histórico.
- `hooks/use-map-data.ts` — GeoJSON estático + enriquecimiento regional `/risk/national` (props de popup); comunas sin scores de mapa; `refreshMapRisk` al cambiar fecha.
- `components/map/monitor-live-data.tsx` — un suscriptor `useActiveAlerts` + `useAirQuality`; hijos leen context; prefetch al cambiar fecha.
- `hooks/use-active-alerts.ts`, `use-air-quality.ts`, `use-recent-events.ts`, `use-comuna-risk.ts`, `use-region-risk.ts`, `use-national-risk.ts`, `use-meteochile-zones.ts`, `use-simulacros.ts` (lista/next/slug; página stub aún).
- `components/map/chile-map.tsx` — `ChileMap` + `ChileLayers` (capas imperativas vía `useMap()`). Coropleta real; click región/comuna → `TerritoryDetailShell`; click marker sismo → `SeismicEventShell`; markers filtrados por alertas `hazard_type=sismo`. Controles `MapControls` bottom-right. Zoom 3–10. Auto-centrado en la ubicación del usuario al entrar **solo si** el permiso de geolocalización ya está concedido (sin prompt; misma política que `/evacuacion`, `isWithinChileMapBounds`).
- `components/map/map-alerts-overlay.tsx` — host izquierda: Alertas + Fecha (desktop); FABs bottom-left (móvil) → Sheets.
- `components/map/active-alerts-panel.tsx` — filtros por fuente; datos vía `useMonitorLiveData`.
- `components/map/query-date-control.tsx` — selector de día; estado `useQueryDate` → `ui-store`; dispara reconsulta API.
- `stores/ui-store.ts` — preferencias monitor: `selectedDate`, `alertsExpanded`, `dateExpanded`, `alertsFilter` (zustand + persist).
- `hooks/use-query-date.ts` — `{ selectedDate, setSelectedDate }` sobre el store.
- `components/ui/calendar.tsx` + `popover.tsx` — calendario ops (mono, `rounded-none`) usado por Fecha.
- `components/map/alert-ui.tsx` — `ActiveAlertCard` / `AirQualityAlertCard` + badges.
- `components/map/territory-detail-shell.tsx` — shell por breakpoint; riesgo + alertas filtradas del territorio (alerts/air desde `MonitorLiveData`).
- `components/map/territory-detail-content.tsx` — cuerpo compartido: badge por alerta más grave, lista de alertas, estados `loading` / `empty` / `ready`.
- `components/map/seismic-event-shell.tsx` / `seismic-event-detail.tsx` — popup/sheet al click del marker sismo (CSN).
- `components/ui/skeleton.tsx` — placeholder de carga (Alertas / popups).
- `lib/seismic.ts` — accent por magnitud, URLs CSN/intensidad, copy de ubicación.
- `components/map/map-config.ts` — URLs GeoJSON, zoom, paleta, tipos props.
- `lib/citizen-layout.ts` — navbar clearance + insets/width paneles mapa.
- `lib/alert-types.ts` — reexport de tipos alerta/aire desde `lib/types.ts`.
- `lib/alerts-display.ts` / `lib/air-quality-display.ts` — meta de badges, sort, copy de cards.
- `lib/alerts-mock.ts` / `lib/territory-risk-mock.ts` — mocks apagados (`USE_*_MOCK = false`); conservar solo como referencia.
- `lib/comunas-geojson.ts` — `prepareComunasGeojson`.
- `lib/risk-scale.ts` — alertas ChileRisk; CSS vars `--alert-*`; hex MapLibre.
- Datos estáticos: `regional.geojson` + `comunas_medium.geojson` (default, ~2.3 MB) + `comunas_labels.geojson` (puntos precalculados); alternativa A/B: `comunas_simplified.geojson` (~0.3 MB, fallback). El full raw (~18 MB) **vive fuera del repo** en `~/data/chilerisk/comunas_full.geojson` (override `COMUNAS_FULL_SRC=...`); no se sirve por defecto. Regenerar medium: `make comunas-data` (`scripts/build-comunas-geojson.sh`, Docker GDAL ogr2ogr `-simplify` sobre full). Risk scores inyectados desde API vía `setData` (solo regiones, 16 features). Niveles de alerta/aire se aplican con `setFeatureState` — sin re-tile.

### Capas (orden z, ids = los del viejo)

`region-fill` (maxzoom 7) → `comuna-fill`/`comuna-line`/`comuna-label` (minzoom 7) → `region-line` → `region-label-custom` (5–7) → `meteochile-zone-fill`/`meteochile-zone-line` (franjas DMC; **solo filtro Meteo**) → `earthquake-layer`. **Filtro Alertas ≠ Aire/Meteo:** `mapAlertFillColorExpression()` según `alert_level` leído de `feature-state` (`coalesce` feature-state → prop → `""`; `source=meteochile` excluido de la coropleta CUT). **Filtro Aire:** `mapAirFillColorExpression()` (mismo patrón `air_level`). **Meteo:** polígonos oficiales vía `/alerts/meteochile/zones` (no se pintan en “Todas”). `composite_score` no pinta el mapa. Geometría: `setData` **una vez** por source tras cargar; cambios de nivel = `applySourceLevelState` (feature-state por id, con cache de estados). Opacidad: pulso rest→hover (`fillOpacityPaint`, `ALERT_PULSE_FPS` 10 Hz + `fill-opacity-transition`) **solo sobre la capa visible** según zoom (región < 7, comuna ≥ 7); se pausa con tab oculto, `prefers-reduced-motion` o sin niveles activos. Pulsing-dots sísmicos: canvas 64 px, estáticos (sin `triggerRepaint`) cuando no hay sismos linkeados.

### Detalle región/comuna

Click sobre una región (zoom < 7) o comuna (zoom ≥ 7) abre el detalle compartido:

| Viewport | Shell |
|----------|--------|
| `md+` | `MapPopup` anclado (`max-w-[310px]`) |
| `<md` | `Sheet` `side="bottom"` (`SURFACE_PANEL_SHELL_CLASS`, max-h ~55dvh) |

Cuerpo: header con color/label de la **alerta más grave** del territorio (`ALERT_LEVEL_META`, o peor GEC si solo hay Aire Chile). Sección **Alertas · N** + listado full-bleed (`ActiveAlertCard` + `AirQualityAlertCard`, mismo formato rail/tint/badge; Aire Chile linkea a la ficha externa, sin “Ver detalle”). Respeta `alertsFilter`. Datos live (risk + `/alerts/active` + `/air-quality`).

### Popup sismo (marker)

Click en el centro del pulsing-dot (`earthquake-layer`, hitbox ≤20px) abre detalle CSN:

| Viewport | Shell |
|----------|--------|
| `md+` | `MapPopup` (`SeismicEventShell`, `max-w-[310px]`) |
| `<md` | `Sheet` bottom (`SURFACE_PANEL_SHELL_CLASS`) |

Header con accent por magnitud (`getSeismicAccentColor`: ≥5.5 roja / ≥5 naranja / resto ámbar) + badge `M x.x`. Stats (profundidad, hora, Mercalli) + links CSN / intensidades / SENAPRED relacionados. Datos desde `useRecentEvents` (lookup por `event_id` del feature).

### Panel Alertas

| Viewport | UI |
|----------|-----|
| `lg+` | Columna fija izquierda (`MAP_PANEL_*`, 320px) con `ActiveAlertsPanel flow` |
| `md`–`lg` | Rail angosto pegado a la izquierda; al expandir → 320px |
| `<md` | FAB “Alertas” bottom-left → `Sheet` bottom con `ActiveAlertsPanel embedded` |

Datos reales (`/alerts/active?date=` + `/air-quality?date=` + `/alerts/meteochile/zones` con filtro Meteo). Al cambiar fecha, mientras `isPending` → **Skeleton** (nunca EmptyState). Cards en `alert-ui.tsx`: rail + tint ~12% + badge (mismo patrón ActiveAlert / Aire Chile; Aire sin expand “Ver detalle”). El filtro por fuente (`alertsFilter`) controla lista, coropleta y markers sismo (`senapred` / `chilerisk` / `sernageomin`); **Meteo** pinta franjas DMC oficiales solo con ese chip activo. En “Todas”, Meteo aparece en la lista sin franjas. Alcance por comuna vía PIP centroides + overrides (`ip`→5201). Niveles DMC: Aviso→amarilla, Alerta→naranja, Alarma→roja.

### Loading / Skeleton (obligatorio)

`components/ui/skeleton.tsx` — pulso `bg-muted` (`rounded-none` por defecto del tema).

**Regla:** cualquier lista o panel alimentado por React Query que dependa de `selectedDate` / `?date=` **debe** ramificar `isPending` (o `isLoading`) **antes** de decidir EmptyState. Con `data ?? []`, un fetch pendiente se ve como “sin datos”.

| Superficie | Comportamiento |
|------------|----------------|
| Panel Alertas | `AlertsListSkeleton` si `isPending` del context `MonitorLiveData` |
| Popup territorio (alertas) | Skeleton de cards si `alertsLoading && alerts.length === 0` |
| Popup territorio (riesgo) | `LoadingSkeleton` con `Skeleton` si status `loading` |

No uses `animate-pulse` ad-hoc en paneles nuevos: reutiliza `Skeleton`.

### Panel Fecha

| Viewport | UI |
|----------|-----|
| `lg+` | Columna izquierda bajo Alertas — `QueryDateControl` (320px) |
| `md`–`lg` | Mismo rail/expand que Alertas |
| `<md` | FAB “Fecha” (sobre Alertas) → `Sheet` bottom con `embedded` |

Estado en `stores/ui-store` vía `useQueryDate` (hoy por defecto; clamp 30 días; persist localStorage). Al cambiar fecha se reconsulta risk/alerts/air/events (prefetch en `MonitorLiveDataProvider`).

## Datos del backend (TanStack Query)

Norma del proyecto: **todo GET al backend desde el cliente** pasa por TanStack Query (`useQuery` / `fetchQuery` / `prefetchQuery`). Prohibido `useEffect` + `fetch` ad hoc en componentes UI.

| Pieza | Rol |
|-------|-----|
| `app/providers.tsx` | `QueryClientProvider` — defaults: `staleTime: STALE.risk`, `refetchOnWindowFocus: false`, `refetchOnReconnect: false` |
| `lib/queries.ts` | `queryKeys` canónicos |
| `lib/query-cache.ts` | `STALE.*` + `staleTimeForLive(date, liveMs)` — **hoy** TTL corto; **`?date=` pasado** → 60 min |
| `lib/api.ts` | Cliente HTTP (sin cache propio) |
| `hooks/use-*.ts` | Suscriptores TQ |

### TTL por recurso

| Recurso | Hook | staleTime (hoy) | Histórico |
|---------|------|-----------------|-----------|
| alerts / meteo zones | `useActiveAlerts`, `useMeteoChileZones` | 5 min (`STALE.alerts`) | 60 min |
| air-quality | `useAirQuality` (+ zone/comuna) | 15 min (`STALE.air`) | 60 min |
| risk (national/region/comuna) | `useNationalRisk` / `useRegionRisk` / `useComunaRisk` / `use-map-data` | 10 min (`STALE.risk`) | 60 min |
| recent events | `useRecentEvents` | 3 min (`STALE.events`) | 60 min |
| simulacros lista / slug | `useSimulacros`, `useSimulacro` | 60 min (`STALE.simulacros`) | n/a |
| next simulacro | `useNextSimulacro` | 15 min (`STALE.simulacroNext`) | n/a |

Monitor: `MonitorLiveDataProvider` es el **único** suscriptor de alerts+air; panel, badge móvil, mapa y popup territorio leen `useMonitorLiveData()`. Prefetch al cambiar `selectedDate`.

### Excepciones

- Chat / streaming → `useMutation` o SSE; no cache GET.
- Assets estáticos (`public/data`, CDN, worker MapLibre) → fuera de TQ.

### Notas de integración (importante)

- **Worker de MapLibre**: maplibre v6 es ESM-only y en bundlers `import.meta.url` no resuelve al worker → `setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs")` en `components/ui/map.tsx`. Los archivos `maplibre-gl-worker.mjs` + `maplibre-gl-shared.mjs` viven copiados en `public/vendor/maplibre/` (el worker importa su sibling por ruta relativa). Sin esto el mapa nunca dispara `load` (ni tiles ni capas).
- **Tema**: el layout fuerza `dark`, pero `next-themes` (`ThemeProvider` con `defaultTheme="system"`) lo sobreescribe con la preferencia del sistema (`ThemeHotkey`: tecla `d`). El mapa ya **no** fuerza tema: el basemap sigue el tema de la app (positron en claro, CARTO dark-matter en oscuro) y las capas se recalibran con `MAP_THEME_COLORS` (slates con halos blancos en claro; los valores oscuros del mapa viejo en oscuro). El effect de `ChileLayers` depende de `resolvedTheme` y se re-ejecuta tras el style swap de mapcn.
- **Comunas detail (A/B):** `COMUNAS_DETAIL` en `map-config.ts` — tres tiers: `"full"` (raw fuera del repo, `~/data/chilerisk/comunas_full.geojson`, ~18 MB; solo debug/A-B, copiar localmente), `"medium"` (**default runtime**, ~2.3 MB, `make comunas-data` desde full), `"simplified"` (~0.3 MB fallback/A-B). Hard refresh al cambiar. Geometría: `setData` **una vez** por source; niveles de alerta/aire via `setFeatureState` (ver `applySourceLevelState` en `chile-map.tsx`) — no re-tile en filtros ni ticks live. Vista regional primero (`mapReady`); comunas cargan en paralelo. Labels de comuna: `comunas_labels.geojson` precalculado (`scripts/build-comunas-labels.mjs`, sourced de simplified), capa adjunta al zoom ≥ `COMUNAS_MIN_ZOOM`. Fecha cambia solo props de riesgo regionales (`setData` de 16 features) + re-aplica feature-state.
- **JWT guest:** hasta NextAuth, el proxy firma `sub: "guest"` con `AUTH_SECRET` (mismo valor que el backend en compose).

*Last updated: 2026-08-05 (desastres: hero full-bleed `catalog/hero.png` + headers ops con counts; detalle con back-link chip; scroll-reveal ScrollRoot/Reveal)*
