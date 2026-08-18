# Frontend — referencia estable

Esta referencia describe el estado real del frontend ciudadano, sus rutas, datos y decisiones de implementación. El índice de routing es [../AGENTS.md](../AGENTS.md).

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
| `/preparacion`                       | Plan Familia Preparada SENAPRED                                | `disponible` |
| `/preparacion/kit-emergencia`        | Guía de kit de emergencia SENAPRED                             | `disponible` |
| `/inicio`                            | Hub ciudadano invitado (índice + pulso nacional)               | `disponible` |
| `/asistente`                         | Asistente ciudadano                                            | `stub`       |
| `/cuenta`                            | Perfil, comuna de hogar y preferencias de aviso                | `disponible` |
| `/iniciar-sesion`                    | Login email/contraseña (Auth.js)                               | `disponible` |
| `/registro`                          | Alta de cuenta                                                 | `disponible` |
| `/olvide-contrasena`                 | Solicitud de reset                                             | `disponible` |
| `/restablecer-contrasena`            | Cambio de contraseña con token                                 | `disponible` |
| `/preparacion/plan-familia/paso/[n]` | Wizard Plan Familia                                            | `ausente`    |

El `stub` restante (`/asistente`) usa `components/layout/page-stub.tsx`. Auth vive fuera del route group `(citizen)` y no monta la navbar. No hay Google OAuth ni verificación de correo. Las preferencias `notify_email_*` se persisten; el envío de avisos no está implementado. `/inicio` es un hub invitado; la personalización por comuna de hogar sigue ausente.

## Arquitectura cliente/API

- **Stack:** Next.js 16 con App Router, React 19, TypeScript, Tailwind CSS 4, Bun, `maplibre-gl` 6, mapcn, Motion, Zustand, `@tanstack/react-query` y d3 para la landing.
- **HTTP:** `lib/api.ts` llama al origen same-origin `/api/backend/*`; `app/api/backend/[...path]/route.ts` reenvía a FastAPI y firma un JWT HS256 con `jose` y `AUTH_SECRET`. Si hay sesión Auth.js, el `sub` es el `id` de la cuenta; si no, `guest`. El navegador no lee PostgreSQL.
- **Auth:** Auth.js Credentials (`frontend/auth.ts`) valida contra `POST /api/v1/auth/login`. Registro, forgot y reset van por el proxy. `/cuenta` consume `GET/PATCH /users/me` y `GET /comunas`. Sin `AUTH_SECRET` en `frontend/`, el modo `development` usa el mismo fallback que el JWT guest (`lib/auth-secret.ts`); en producción el secreto es obligatorio.
- **Providers:** `app/providers.tsx` monta `SessionProvider` y `QueryClientProvider`; `app/(citizen)/layout.tsx` mantiene el shell ciudadano de alto completo y la navbar fija.
- **Mapa:** `components/ui/map.tsx` vende el wrapper mapcn (`Map`, `MapControls`, `useMap`, `MapGeoJSON`, `MapPopup`). `MapControls` existe y vive en la esquina inferior derecha de `/monitor`; la leyenda de riesgo sigue pendiente.
- **Docker:** `frontend/Dockerfile` construye con Bun y `output: "standalone"`; `GET /api/health` es el healthcheck del frontend.

### Assets y límites de datos

- GeoJSON y PMTiles de runtime viven en `frontend/public/data/`; son assets vendoreados, no ingestas PostgreSQL.
- `/desastres` lee snapshots JSON e imágenes SENAPRED comprometidos en `frontend/data/senapred/` y `frontend/public/data/senapred/`; no necesita GET al backend.
- `frontend/data/evacuacion-source/` describe la fuente SHP externa; el resultado runtime se genera en `frontend/public/data/evacuacion/` con `make evacuacion-data`.
- `lib/api.ts` expone risk nacional/regional/comunal, sismos, alertas, MeteoChile, aire, simulacros, puntos de encuentro, auth, perfil y el catálogo de comunas. El resto de endpoints del backend no tiene consumidor web completo.

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
- `MapControls` bottom-right, zoom 3–10 y geolocalización manual o silenciosa cuando el permiso ya está concedido; al terminar el `flyTo`, abre el detalle de la comuna que contiene la ubicación del usuario.

`components/map/map-alerts-overlay.tsx` aloja la columna operacional de Alertas + Fecha en `lg+` y el `MapBottomDrawer` tabulado bajo `lg`, con rail inferior de ancho completo y safe-area. `active-alerts-panel.tsx` filtra por fuente; el contexto compartido alimenta badge, mapa y detalle territorial.

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

Es una página dedicada, no reutiliza `ChileMap`. `EvacuationPageShell` monta el wrapper mapcn (`Map`, `useMap`, `MapControls`, `MapPopup`) con columna operacional **Puntos** / **Capas** en `lg+` y el `MapBottomDrawer` tabulado bajo `lg`:

- basemap satélite por defecto y modo calle OpenFreeMap Liberty/Dark sin remount;
- capas tsunami, volcán e incendio desde `lib/evacuacion-layers.ts`;
- polígonos grandes en PMTiles; vías, puntos de encuentro, volcanes activos y radios en GeoJSON;
- `components/evacuacion/` para leyenda, puntos cercanos, popups y acciones “En mapa”/“Google Maps”;
- geolocalización silenciosa cuando `permissions.geolocation === "granted"`;
- `GET /api/v1/meeting-points/nearest` mediante `useNearestMeetingPoints` y deep-link `?hazard=tsunami|volcanic&lat=&lon=`.

Los peligros volcánicos parten activados; radios e incendio se habilitan por control. La cota de 30 m queda fuera de v1.
En ambas rutas, el drawer cambia únicamente el chrome responsive: no cambia endpoints, datos, filtros, capas, popups territoriales ni callbacks operacionales.

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
- `simulacros-agenda.tsx` es el límite client del calendario: consulta `useSimulacros({ limit: 200 })`, conserva filtros locales, pestañas Próximos/Realizados, agrupación por mes y estados loading/error/empty. En Próximos, el ejercicio más cercano se destaca una sola vez dentro de los resultados filtrados y en la misma columna que el resto de la agenda; conserva la composición date-first de las cards inferiores sobre un campo completo del color de su tipo. Al cambiar a Realizados desaparece. Solo una `detail_url` con ruta `/simulacros_t/{slug}/` habilita el título enlazado y el CTA “Detalle”; las fichas aún no publicadas no generan enlaces ni columna de acciones, y las cards no duplican un botón “Fuente”.
- `simulacros-type-filter.tsx` entrega chips de filtro por tipo (rail de color SENAPRED, grilla ordenada) usados por la agenda.
- `simulacros-overview.tsx` conserva la secuencia editorial y los cuatro campos cromáticos de escenario en bandas compactas a ancho completo (imagen fija a la izquierda, texto centrado verticalmente); sus ilustraciones oficiales están vendoreadas en `public/data/senapred/img/simulacros/`.
- `lib/simulacros-content.ts` conserva el snapshot editorial y atribución; `lib/simulacros.ts` normaliza etiquetas y fechas sin desfase UTC.

### `/simulacros/[slug]`

- `app/(citizen)/simulacros/[slug]/page.tsx` monta `SimulacroDetailPage` (client) bajo `ScrollRoot` + `CITIZEN_NAVBAR_PAD_TOP_CLASS`.
- Datos vía `useSimulacro(slug)` → `GET /api/v1/simulacros/{slug}` (`SimulacroDetail`: headline, schedule_note, hero_image_url, body_blocks).
- Hero date-first con el horario dentro del bloque de fecha; el cuerpo elimina el heading editorial del título de calendario, muestra resumen + comuna(s), agrupa headings y payloads en orden fuente y convierte pasos en listas únicas con rail de acento, callouts, link lists y SAE. El cierre azul institucional mantiene CTA “Ver en SENAPRED” y volver al calendario.
- Loading = Skeleton; 404/error = estado vacío con vuelta a `/simulacros`.

### `/preparacion`

`app/(citizen)/preparacion/page.tsx` es Server Component (`metadata.title = "Preparación"`) y monta `PreparacionPage` bajo `ScrollRoot` + `CITIZEN_NAVBAR_PAD_TOP_CLASS`. Es la traducción editorial de [senapred.cl/familia-preparada](https://senapred.cl/familia-preparada/): hero sobre la plaza, apertura (título centrado en vertical en dos columnas), cuatro compromisos en una fila en `xl+`, 8 pasos sobre `Pueblo_002_M.png`, y biblioteca como cards de igual altura.

- Snapshot y paleta editorial en `lib/familia-preparada-content.ts`; fondos `Pueblo_001_M.png` / `Pueblo_002_M.png` y personajes en `public/data/senapred/img/familia-preparada/`. Sin TanStack Query ni GET al backend. Los colores de las cards son editoriales SENAPRED, no niveles de alerta. En `lg+` las cards de los 8 pasos no ocupan todo el ancho para dejar ver el pueblo.
- El paso 7 enlaza a `/preparacion/kit-emergencia`; el paso 8 enlaza a `/simulacros`. No hay wizard ni consumidor de `GET/PUT /api/v1/family-plan`.
- `/preparacion/plan-familia/paso/[n]` sigue `ausente`.

### `/preparacion/kit-emergencia`

`app/(citizen)/preparacion/kit-emergencia/page.tsx` es Server Component (`metadata.title = "Kit de emergencia"`) y monta `KitEmergenciaPage`. Traducción editorial de [senapred.cl/kit-de-emergencia](https://senapred.cl/kit-de-emergencia/): hero a sangrado con `hero.png` / `hero noche.png`, apertura 48–72 h, 12 ítems del kit básico con el texto oficial completo y los PNG a tamaño real, nota sobre adaptar el listado al grupo familiar, provisiones adicionales, kit para el auto y footer `footer.png` / `footer noche.png`.

- Snapshot en `lib/kit-emergencia-content.ts`; iconos en `public/data/senapred/img/kit-emergencia/` (básico, `provisiones-adicionales/`, `vehiculo/`). Sin TanStack Query ni GET al backend.
- El ítem del plan de emergencia enlaza a `/preparacion`. La navbar incluye un ítem propio **Kit** (`/preparacion/kit-emergencia`); Preparación ya no es `section`.

### `/inicio`

`app/(citizen)/inicio/page.tsx` es Server Component (`metadata.title = "Inicio"`) y monta `InicioPage` bajo `ScrollRoot` + `CITIZEN_NAVBAR_PAD_TOP_CLASS`. Es el hub ciudadano invitado: hero sobre `hero.png` / `hero noche.png` (título centrado) → pulso nacional en campos de color (alerta + próximo simulacro) → grilla de seis destinos `disponible` (Monitor destacado) → bento de cuenta con beneficios y registro/login.

- Destinos y copy en `lib/inicio-content.ts`. No incluye `/asistente` (stub) ni `/cuenta` (vive en el cierre).
- El pulso es isla cliente (`inicio-national-pulse.tsx`): `useActiveAlerts` + `useNextSimulacro`, con Skeleton / vacío honesto / reintento. El próximo ejercicio enlaza a `/simulacros/[slug]` solo si `hasSimulacroDetailPage`.
- `auth()` en la ruta decide el cierre: invitado ve registro/login; con sesión, un enlace a `/cuenta` sin resumen territorial.
- Sin selector de comuna, sin `composite_score` nacional y sin contrato nuevo.

### `/cuenta`

`app/(citizen)/cuenta/page.tsx` monta `CuentaPage`. Sin sesión muestra CTAs a `/iniciar-sesion` y `/registro`. Con sesión carga `useMe` + `useComunasCatalog`, permite editar nombre, comuna de hogar y flags de aviso, y cierra sesión hacia `/inicio`. El correo es de solo lectura.

### Auth

`/iniciar-sesion`, `/registro`, `/olvide-contrasena` y `/restablecer-contrasena` viven en `app/(auth)/` sin navbar. Login usa Auth.js Credentials; registro y reset llaman al backend vía proxy y luego inician sesión o redirigen.

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

*Last updated: 2026-08-17*
