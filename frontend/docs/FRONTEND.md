# Frontend — referencia estable

Esta referencia describe el estado real del frontend ciudadano, sus rutas, datos y decisiones de implementación. El índice de routing es [../AGENTS.md](../AGENTS.md); la entrada task-first es [README.md](README.md).

## Estado de rutas

Las URLs son **español**, el código (`components/`, hooks, exports y tipos) es **inglés** y el copy visible es **español**. Esta es la matriz canónica de la aplicación:

| Ruta                                 | Superficie                                                     | Estado       |
| ------------------------------------ | -------------------------------------------------------------- | ------------ |
| `/`                                  | Landing sin citizen navbar                                     | `disponible` |
| `/monitor`                           | Mapa multi-amenaza con API real, alertas, fecha, sismos y aire | `disponible` |
| `/evacuacion`                        | Mapa de evacuación, capas oficiales y puntos cercanos          | `disponible` |
| `/desastres`                         | Catálogo de guías SENAPRED                                     | `disponible` |
| `/desastres/[tipo]`                  | Detalle estático de una guía SENAPRED                          | `disponible` |
| `/simulacros`                        | Calendario SENAPRED                                            | `disponible` |
| `/simulacros/[slug]`                 | Detalle scrapeado de un ejercicio SENAPRED                     | `disponible` |
| `/inicio`                            | Home ciudadano                                                 | `stub`       |
| `/preparacion`                       | Hub de preparación                                             | `stub`       |
| `/asistente`                         | Asistente ciudadano                                            | `stub`       |
| `/cuenta`                            | Cuenta y comuna de hogar                                       | `stub`       |
| `/iniciar-sesion`                    | Login                                                          | `ausente`    |
| `/registro`                          | Registro                                                       | `ausente`    |
| `/olvide-contrasena`                 | Recuperación de contraseña                                     | `ausente`    |
| `/restablecer-contrasena`            | Restablecimiento de contraseña                                 | `ausente`    |
| `/preparacion/kit-emergencia`        | Guía de kit de emergencia                                      | `ausente`    |
| `/preparacion/plan-familia/paso/[n]` | Wizard Plan Familia                                            | `ausente`    |

Los cuatro `stub` usan el componente compartido `components/layout/page-stub.tsx` y muestran “Próximamente”. No se crean redirects ES→EN ni se documenta UI de autenticación que todavía no existe.

## Arquitectura cliente/API

- **Stack:** Next.js 16 con App Router, React 19, TypeScript, Tailwind CSS 4, Bun, `maplibre-gl` 6, mapcn, Motion, Zustand, `@tanstack/react-query` y d3 para la landing.
- **HTTP:** `lib/api.ts` llama al origen same-origin `/api/backend/*`; `app/api/backend/[...path]/route.ts` reenvía a FastAPI y firma un JWT guest con `jose` y `AUTH_SECRET`. El navegador no lee PostgreSQL.
- **Providers:** `app/providers.tsx` monta `QueryClientProvider`; `app/(citizen)/layout.tsx` mantiene el shell ciudadano de alto completo y la navbar fija.
- **Mapa:** `components/ui/map.tsx` vende el wrapper mapcn (`Map`, `MapControls`, `useMap`, `MapGeoJSON`, `MapPopup`). `MapControls` existe y vive en la esquina inferior derecha de `/monitor`; la leyenda de riesgo sigue pendiente.
- **Docker:** `frontend/Dockerfile` construye con Bun y `output: "standalone"`; `GET /api/health` es el healthcheck del frontend.

### Assets y límites de datos

- GeoJSON y PMTiles de runtime viven en `frontend/public/data/`; son assets vendoreados, no ingestas PostgreSQL.
- `/desastres` lee snapshots JSON e imágenes SENAPRED comprometidos en `frontend/data/senapred/` y `frontend/public/data/senapred/`; no necesita GET al backend.
- `frontend/data/evacuacion-source/` describe la fuente SHP externa; el resultado runtime se genera en `frontend/public/data/evacuacion/` con `make evacuacion-data`.
- `lib/api.ts` expone solamente risk nacional/regional/comunal, sismos, alertas, MeteoChile, aire, simulacros y puntos de encuentro. El resto de endpoints del backend no tiene consumidor web completo.

## Optimización implementada

Decisiones comprobables de código/configuración; no son métricas de latencia:

- **Carga del mapa:** `/monitor` usa `next/dynamic` con `{ ssr: false }` para cargar `ChileMap` solo en cliente.
- **Polígonos pesados:** `lib/evacuacion-layers.ts` usa PMTiles para áreas grandes; líneas, puntos y radios siguen en GeoJSON.
- **Geometría separada de niveles:** `map-config.ts` deja `COMUNAS_DETAIL="medium"` como tier runtime; `components/map/chile-map.tsx` ejecuta `setData` para geometría y `setFeatureState` para cambios de nivel, sin re-tile.
- **Consultas live/históricas:** `lib/query-cache.ts` diferencia hoy de fechas pasadas con `staleTimeForLive`; hoy usa TTL corto y el histórico 60 minutos.
- **Suscripción compartida:** `MonitorLiveDataProvider` concentra alerts + aire, expone el resultado a paneles/mapa y hace prefetch al cambiar la fecha.
- **SSG:** las guías `/desastres/[tipo]` usan `generateStaticParams`; el catálogo vendoreado no depende de una consulta backend en cada visita.
- **Worker MapLibre:** `components/ui/map.tsx` fija `setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs")` y conserva los archivos worker vendoreados.
- **Datos observados:** el mapa actualiza los props de riesgo regionales y reaplica `feature-state`; no recarga geometría para cada cambio de nivel o tick live.

## Superficies disponibles

### `/monitor`

`app/(citizen)/monitor/page.tsx` monta `MonitorLiveDataProvider`, `ChileMap` y `MapAlertsOverlay` bajo la navbar. El mapa ofrece:

- coropleta real por región/comuna, detalle territorial y markers de sismos CSN;
- filtros **Alertas**, **Aire** y **Meteo**; `composite_score` no pinta el mapa;
- fecha global `selectedDate` con reconsulta de riesgo, alertas, aire y eventos dentro de 30 días;
- franjas oficiales de MeteoChile mediante `/alerts/meteochile/zones`, visibles solo con el filtro Meteo; para una fecha pasada el backend devuelve `FeatureCollection` vacía;
- `MapControls` bottom-right, zoom 3–10 y geolocalización silenciosa solo cuando el permiso ya está concedido.

`components/map/map-alerts-overlay.tsx` aloja Alertas y Fecha en desktop y los FAB/Sheets en móvil. `active-alerts-panel.tsx` filtra por fuente; el contexto compartido alimenta badge, mapa y detalle territorial.

#### Capas y estados del mapa

El orden canónico es:

`region-fill` → `comuna-fill` / `comuna-line` / `comuna-label` → `region-line` → `region-label-custom` → `meteochile-zone-fill` / `meteochile-zone-line` → `earthquake-layer`.

Los niveles de alerta y aire se leen desde `feature-state`, con fallback a props. MeteoChile no se mezcla con la coropleta CUT: sus polígonos son franjas DMC oficiales y solo aparecen con ese filtro.

#### Detalle territorial y sismos

- Región (`zoom < 7`) o comuna (`zoom ≥ 7`) abre `TerritoryDetailShell`: `MapPopup` en `md+`, `Sheet` bottom en móvil.
- El encabezado usa la alerta más grave; el cuerpo lista alertas y GEC con estados loading/empty/ready.
- Click en un marker abre `SeismicEventShell` con magnitud, profundidad, hora, Mercalli y enlaces CSN/SENAPRED.
- La lista depende de datos reales; una consulta pendiente muestra `Skeleton` antes de decidir un estado vacío.

### `/evacuacion`

Es una página dedicada, no reutiliza `ChileMap`. `EvacuationPageShell` monta el wrapper mapcn (`Map`, `useMap`, `MapControls`, `MapPopup`) con:

- basemap satélite por defecto y modo calle OpenFreeMap Liberty/Dark sin remount;
- capas tsunami, volcán e incendio desde `lib/evacuacion-layers.ts`;
- polígonos grandes en PMTiles; vías, puntos de encuentro, volcanes activos y radios en GeoJSON;
- `components/evacuacion/` para leyenda, puntos cercanos, popups y acciones “En mapa”/“Google Maps”;
- geolocalización silenciosa cuando `permissions.geolocation === "granted"`;
- `GET /api/v1/meeting-points/nearest` mediante `useNearestMeetingPoints` y deep-link `?hazard=tsunami|volcanic&lat=&lon=`.

Los peligros volcánicos parten activados; radios e incendio se habilitan por control. La cota de 30 m queda fuera de v1.

### `/desastres` y `/desastres/[tipo]`

El snapshot vendoreado contiene 25 guías: 22 “Prepárate con SENAPRED” y 3 de “Preparación inclusiva”. Es contenido estático, sin TanStack Query ni dependencia de la API en runtime.

- `scripts/sync-senapred-guides.mjs` (`bun run sync:senapred`) convierte HTML de SENAPRED a JSON, imágenes e índice comprometidos.
- `lib/senapred-guides.ts` concentra tipos de bloques, grupos, iconos y slugs destacados.
- `lib/disaster-visuals.ts` es la fuente de acentos semánticos por amenaza (agua→azul, fuego→rojo, tierra→terracota, etc.) para `GuideCard` y `GuideContent`; no usa muestreo automático del asset.
- `components/disasters/disasters-page.tsx` compone hero → intro editorial → amenazas prioritarias (tiles de campo de color) → catálogo restante → enfoque inclusivo → cierre SENAPRED, con `ScrollRoot`, `Reveal` y `DisastersSectionNav`.
- El detalle usa `generateStaticParams`, devuelve `notFound()` para slugs desconocidos y atribuye cada guía a SENAPRED con enlace al original.

### `/simulacros`

- `app/(citizen)/simulacros/page.tsx` es Server Component y define `metadata.title = "Simulacros"`.
- `components/simulacros/simulacros-page.tsx` compone bajo la navbar un hero centrado equivalente a `/desastres`, apertura editorial, cinco razones, calendario, cuatro bandas de escenario y cierre atribuido.
- `simulacros-agenda.tsx` es el límite client del calendario: consulta `useSimulacros({ limit: 200 })`, conserva filtros locales, pestañas Próximos/Realizados, agrupación por mes, panel “próximo ejercicio” con campo de color del tipo de simulacro y estados loading/error/empty. Solo una `detail_url` con ruta `/simulacros_t/{slug}/` habilita el título enlazado y el CTA “Detalle”; las fichas aún no publicadas no generan enlaces ni columna de acciones, y las cards no duplican un botón “Fuente”.
- `simulacros-type-filter.tsx` entrega chips de filtro por tipo (rail de color SENAPRED, grilla ordenada) usados por la agenda.
- `simulacros-overview.tsx` conserva la secuencia editorial y los cuatro campos cromáticos de escenario en bandas compactas a ancho completo (imagen fija a la izquierda, texto centrado verticalmente); sus ilustraciones oficiales están vendoreadas en `public/data/senapred/img/simulacros/`.
- `lib/simulacros-content.ts` conserva el snapshot editorial y atribución; `lib/simulacros.ts` normaliza etiquetas y fechas sin desfase UTC.

### `/simulacros/[slug]`

- `app/(citizen)/simulacros/[slug]/page.tsx` monta `SimulacroDetailPage` (client) bajo `ScrollRoot` + `CITIZEN_NAVBAR_PAD_TOP_CLASS`.
- Datos vía `useSimulacro(slug)` → `GET /api/v1/simulacros/{slug}` (`SimulacroDetail`: headline, schedule_note, hero_image_url, body_blocks).
- Hero date-first con el horario dentro del bloque de fecha; el cuerpo elimina el heading editorial del título de calendario, muestra resumen + comuna(s), agrupa headings y payloads en orden fuente y convierte pasos en listas únicas con rail de acento, callouts, link lists y SAE. El cierre azul institucional mantiene CTA “Ver en SENAPRED” y volver al calendario.
- Loading = Skeleton; 404/error = estado vacío con vuelta a `/simulacros`.

## Navbar y superficies

- `components/layout/citizen-navbar.tsx` es la barra fija y usa Sheet móvil; `lib/citizen-nav.ts` contiene ítems e `isNavActive`.
- `lib/citizen-layout.ts` define `CITIZEN_NAVBAR_CLEARANCE_PX` y `CITIZEN_NAVBAR_PAD_TOP_CLASS`; `page-stub.tsx` usa el segundo para los stubs.
- `lib/surface.ts` concentra `SURFACE_PANEL_CLASS`, `SURFACE_MICA_INTERACTIVE_CLASS` y `SURFACE_PANEL_SHELL_CLASS`.
- `components/mica-light-provider.tsx` aporta Mica theme-aware dentro de `ThemeProvider`, respetando `pointer: fine`, rAF y `prefers-reduced-motion`.
- Los tokens, paletas de dominio, radio sharp, Mica y cookbooks viven en [UI-GUIDELINES.md](UI-GUIDELINES.md); no se copian en este documento ni en `DESIGN.md`.

## Reglas TanStack Query e integración

Todo GET del backend desde cliente pasa por `useQuery`, `fetchQuery` o `prefetchQuery`. No usar `useEffect` + `fetch` ad hoc en componentes UI.

| Pieza                | Responsabilidad                                                                         |
| -------------------- | --------------------------------------------------------------------------------------- |
| `app/providers.tsx`  | `QueryClientProvider`; `refetchOnWindowFocus` y `refetchOnReconnect` están desactivados |
| `lib/queries.ts`     | `queryKeys` canónicos                                                                   |
| `lib/api.ts`         | Cliente HTTP sin caché propia                                                           |
| `hooks/use-*.ts`     | Suscriptores de dominio                                                                 |
| `lib/query-cache.ts` | Política de TTL live/histórico descrita en “Optimización implementada”                  |

### TTL por recurso

| Recurso                    | Hook o consumidor                                                   | Hoy    | Histórico |
| -------------------------- | ------------------------------------------------------------------- | ------ | --------- |
| Alertas / zonas MeteoChile | `useActiveAlerts`, `useMeteoChileZones`                             | 5 min  | 60 min    |
| Aire                       | `useAirQuality`, zone/comuna                                        | 15 min | 60 min    |
| Riesgo                     | `useNationalRisk`, `useRegionRisk`, `useComunaRisk`, `use-map-data` | 10 min | 60 min    |
| Eventos recientes          | `useRecentEvents`                                                   | 3 min  | 60 min    |
| Simulacros lista / detalle | `useSimulacros`, `useSimulacro`                                     | 60 min | n/a       |
| Próximo simulacro          | `useNextSimulacro`                                                  | 15 min | n/a       |

Excepciones:

- chat o streaming: `useMutation` o SSE, no cache GET;
- assets `public/data`, CDN y worker MapLibre: fuera de TanStack Query;
- contenido vendoreado de SENAPRED: snapshot local, sin request runtime.

### Cliente y contrato

El cliente `lib/api.ts` expone:

- `getNationalRisk`, `getRegionRisk`, `getComunaRisk`;
- `getRecentEvents`, `getActiveAlerts`, `getMeteoChileZones`;
- `getAirQuality`, `getAirQualityZone`, `getAirQualityByComuna`;
- `getSimulacros`, `getNextSimulacro`, `getSimulacro`;
- `getNearestMeetingPoints`.

Para cambios JSON: `backend/app/schemas/` → `make sync-contract` → `lib/api-schema.d.ts` → `lib/types.ts`/`lib/api.ts`, y actualizar [../../docs/QUERY-DATE.md](../../docs/QUERY-DATE.md) si usa fecha. El contrato runtime OpenAPI gana cualquier resumen humano.

_Last updated: 2026-08-10_
