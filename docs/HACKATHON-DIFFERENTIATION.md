# Hackathon — Plan de Diferenciación ChileRisk vs TrueRisk

**Fecha**: 2026-07-26
**Estado**: Ideas 1–2 implementadas (Modo Emergencia + Mi Comuna Hoy). Ideas 3–4 pendientes.
**Contexto**: Hackaton CubePath — criterios: Utilidad, Originalidad, Calidad implementación, Presentación, Uso infra CubePath
**Tiempo**: 1-2 días
**Prioridades**: Experiencia ciudadana + Integración sistemas oficiales

---

## Análisis competitivo

### TrueRisk (España) — lo que hace bien
- 7 modelos ML (XGBoost, LightGBM, TFT, GNN) con métricas publicadas
- 16+ fuentes de datos (AEMET, IGN, USGS, NASA FIRMS, Copernicus, SAIH, MITECO, REE)
- Model explainability (SHAP)
- Multi-canal alertas (Push, SMS Twilio, Telegram)
- Property risk assessment
- 648 commits, muy maduro

### TrueRisk — lo que NO tiene (ventaja ChileRisk)
| Capacidad | ChileRisk | TrueRisk |
|-----------|-----------|----------|
| Monitoreo volcánico (SERNAGEOMIN) | ✅ scrape + niveles + geografía | ❌ |
| GEC Aire Chile (episodios críticos PPDA) | ✅ niveles + medidas + restricciones | Solo OpenAQ genérico |
| Calendario simulacros oficiales (SERNAPRED) | ✅ scrape + countdown + tipos | ❌ |
| Puntos de encuentro oficiales | ✅ seed KMZ + nearest por GPS | ❌ |
| Plan Familiar Preparado (8 pasos) | ✅ wizard + autosave + kit | "Emergency plans" genéricos |
| Chat IA con tools contextuales | ✅ DeepSeek + 7 tools | OpenAI genérico |
| Granularidad comunal (346) | ✅ | 52 provincias |
| Integración SERNAPRED (alertas ATP + eventos) | ✅ Cognito + SigV4 | ❌ (no hay equivalente España) |
| Modo fecha histórica (?date=) | ✅ 30 días | ❌ |

### Posicionamiento para el jurado
TrueRisk = **dashboard técnico con ML** (impresiona al ingeniero).
ChileRisk = **herramienta de emergencia ciudadana integrada al Estado** (impresiona al usuario y al jurado de utilidad).

Frase para la presentación:
> "TrueRisk te dice qué riesgo hay. ChileRisk te dice qué hacer, dónde ir, y cuándo practicar."

---

## Idea 1: Modo Emergencia

**Estado: implementado** (2026-07-26) — banner con descripción de la alerta + marco de página fade/pulse; ver `frontend/docs/FRONTEND.md` / `DESIGN.md` §5.6.

### Concepto
Cuando existe una alerta activa de severidad ≥ naranja (SERNAPRED, ChileRisk o SERNAGEOMIN),
la interfaz se transforma: un banner de emergencia ocupa el tope de la pantalla y ofrece
acciones inmediatas contextualizadas al hazard y la comuna del usuario.

### Por qué diferencia
TrueRisk muestra alertas en una lista. ChileRisk **reacciona** ante ellas como lo haría
el SAE (Sistema de Alerta de Emergencia) en el teléfono: interrumpe, guía, actúa.

### Qué ya existe (leverage)
- `useActiveAlerts()` → alertas unificadas con `alert_level`, `hazard_type`, `comuna_codes`
- `ActiveAlertsPanel` + `alert-ui.tsx` → cards con severidad
- `useNearestComuna` + GPS → comuna del usuario
- `GET /api/v1/meeting-points/nearest?lat=&lon=&hazard=` → puntos de encuentro
- Chat DeepSeek con tools (`find_nearest_meeting_point`, `get_disaster_guide`, `get_active_alerts`)
- `GLASS_PANEL_CLASS` + design system glass/mica
- `EvacuationMap` con geolocalización + flyTo

### Implementación

#### Frontend (nuevo)
| Componente | Ubicación | Rol |
|-----------|-----------|-----|
| `EmergencyBanner` | `components/emergency/emergency-banner.tsx` | Banner fijo top (bajo navbar), animación pulse, color por severidad |
| `EmergencyActionSheet` | `components/emergency/emergency-action-sheet.tsx` | Drawer/sheet con 3 acciones: "¿Qué hago?", "Punto de encuentro", "Compartir estado" |
| `EmergencyGuidePanel` | `components/emergency/emergency-guide-panel.tsx` | Respuesta IA contextual (stream desde `/api/v1/chat/stream` con prompt forzado al hazard) |
| `EmergencyShareCard` | `components/emergency/emergency-share-card.tsx` | Card compartible "Estoy seguro en [comuna]" (Web Share API / clipboard) |
| `useEmergencyMode` | `hooks/use-emergency-mode.ts` | Deriva de `useActiveAlerts`: filtra alertas ≥ naranja que afectan la comuna del usuario → `{ active, alert, hazard, severity }` |

#### Lógica de activación
```ts
const alertas = useActiveAlerts()
const comuna = useNearestComuna() || userProfile.home_comuna_code
const emergencia = alertas.find(a =>
  (a.alert_level === "naranja" || a.alert_level === "roja") &&
  a.comuna_codes.includes(comuna)
)
```

#### UX flow
1. Usuario abre cualquier página citizen → `useEmergencyMode` detecta alerta
2. Banner aparece con animación (slide-down + pulse border):
   - Rojo: `bg-red-950/90 border-red-500`
   - Naranja: `bg-orange-950/90 border-orange-500`
   - Texto: "⚠ ALERTA {NIVEL} — {hazard_label} en {comuna_name}"
   - Subtexto: fuente + hora emisión
3. Botones en banner: "¿Qué hago?" | "Evacuar" | "✕"
4. "¿Qué hago?" → abre `EmergencyGuidePanel` (glass sheet):
   - Llama al chat con system prompt: "El usuario está en {comuna} con alerta {hazard} nivel {level}. Da instrucciones concretas de seguridad en 3 pasos cortos."
   - Muestra respuesta streaming + botón "Preguntar más" (link a /assistant)
5. "Evacuar" → flyTo al punto de encuentro más cercano en EvacuationMap (o link `/evacuation?lat=&lon=&hazard=`)
6. "Compartir estado" → genera texto "Estoy seguro/a en {comuna} — ChileRisk {fecha}" + Web Share API

#### Backend (mínimo)
- Sin endpoints nuevos. Usa existentes: `/alerts/active`, `/meeting-points/nearest`, `/chat/stream`
- Opcional: campo `emergency_instructions` estático por hazard en `disaster_guides.json` (fallback sin IA)

#### Esfuerzo: ~4-5 horas

### Demo para jurado (30 seg)
1. Abrir /dashboard → banner rojo aparece (alerta SERNAPRED activa en comuna del usuario)
2. Click "¿Qué hago?" → IA responde en 2 seg con 3 pasos concretos
3. Click "Evacuar" → mapa vuela al punto de encuentro más cercano
4. "Esto no es un dashboard. Es lo que tu teléfono debería hacer en una emergencia."

---

## Idea 2: "Mi Comuna Hoy" — Tarjeta Ciudadana Compartible

**Estado: implementado** (2026-07-26) — integrada en `/dashboard` (`DashboardComunaCard`); sin ruta `/comuna-today`.

### Concepto
Una vista tipo "Spotify Wrapped del riesgo": una sola tarjeta visual que resume TODO lo que
un ciudadano necesita saber sobre su comuna hoy, y que puede compartir como imagen o link.

### Por qué diferencia
TrueRisk requiere navegar provincias y tabs. ChileRisk entrega **una respuesta, una tarjeta,
un segundo**. Es contenido social, no solo un dashboard.

### Qué ya existe (leverage)
- `useComunaRisk(cod)` → vector de hazards + composite_score
- `useAirQuality()` + `useAirQualityZone(slug)` → nivel GEC
- `useRecentEvents()` → sismos del día
- `useNextSimulacro()` → próximo simulacro
- `useActiveAlerts()` → alertas vigentes
- `useNearestComuna` → GPS → comuna
- `DashboardComunaCard` ya muestra score + severidad (base visual)
- Design system glass + mica + mono stats

### Implementación

#### Frontend (nuevo)
| Componente | Ubicación | Rol |
|-----------|-----------|-----|
| `ComunaTodayPage` | `app/(citizen)/comuna-today/page.tsx` | Página dedicada (link desde dashboard + navbar) |
| `ComunaTodayCard` | `components/comuna-today/comuna-today-card.tsx` | Tarjeta principal (visual, compartible) |
| `ComunaTodayShareBar` | `components/comuna-today/comuna-today-share-bar.tsx` | Botones: copiar link, Web Share, descargar PNG (html2canvas) |
| `useComunaToday` | `hooks/use-comuna-today.ts` | Agrega todos los datos en un solo hook |

#### Estructura de la tarjeta
```
┌─────────────────────────────────────────┐
│  CHILERISK · {fecha}                    │
│                                         │
│  {COMUNA_NAME}                          │
│  Región de {region_name}                │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  RIESGO HOY        72/100       │    │
│  │  ████████████░░░░  ALTO         │    │
│  │  Dominante: Ola de calor        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  🌡 Aire: Preemergencia (restricciones) │
│  🌍 Último sismo: M4.2 hace 2 días     │
│  🌋 Volcán Villarrica: Alerta amarilla  │
│  📅 Próximo simulacro: 30 jul (región)  │
│  ⚠️  2 alertas activas                  │
│                                         │
│  "Tu comuna está en riesgo ALTO hoy.    │
│   Revisa tu plan familiar."             │
│                                         │
│  [Compartir] [Ver mapa] [Mi plan]       │
└─────────────────────────────────────────┘
```

#### Lógica de agregación (`useComunaToday`)
```ts
const { data: risk } = useComunaRisk(cod)
const { data: air } = useAirQualityByComuna(cod)
const { data: events } = useRecentEvents()  // filtrar por cercanía
const { data: alerts } = useActiveAlerts({ region })
const { data: nextDrill } = useNextSimulacro()
const { data: volcanoes } = useActiveAlerts()  // filtrar source=sernageomin
```

#### Compartir
- **Link**: `/comuna-today?cod={cod_comuna}` (página pública con meta OG)
- **Imagen**: `html2canvas` sobre la card → download PNG
- **Web Share API**: navigator.share({ title, text, url })
- **OG meta**: `opengraph-image.tsx` con score + comuna (Next.js generateMetadata)

#### Backend (mínimo)
- Opcional: `GET /api/v1/comunas/{cod}/today` que agrega todo en una respuesta (reduce round-trips)
- Si no, el frontend agrega con hooks existentes (funciona igual)

#### Esfuerzo: ~3-4 horas

### Demo para jurado (20 seg)
1. Abrir /comuna-today → tarjeta aparece con datos reales
2. Click "Compartir" → se genera imagen PNG
3. "Esto es lo que un ciudadano necesita. Una tarjeta. Cero jerga técnica."

---

## Idea 3: Dashboard Volcánico

### Concepto
Vista dedicada al monitoreo volcánico de Chile: mapa con los volcanes activos, sus niveles
de alerta SERNAGEOMIN, y contexto ciudadano ("¿qué significa esto para mi comuna?").

### Por qué diferencia
Chile tiene ~90 volcanes activos, 25 de ellos con monitoreo permanente SERNAGEOMIN.
TrueRisk (España) NUNCA tendrá esto. Es el diferenciador geográfico más fuerte.

### Qué ya existe (leverage)
- `sernageomin_volcanic_alerts` (tabla) → volcano_key, name, level, region_code, comuna_codes, external_url, is_active
- `sernageomin_service.py` → sync cada 60 min desde sernageomin.cl
- `sernageomin_volcanoes.py` → catálogo con `VolcanoGeo` (key, name, region_code, comuna_codes, aliases)
- `ActiveAlertsPanel` ya muestra alertas volcánicas (source=sernageomin)
- `EvacuationMap` + meeting points (hazard=volcanic)
- `disaster_guides.json` → guía "volcanes" (antes/durante/después)
- Chat tool `get_disaster_guide(slug="volcanes")`

### Implementación

#### Backend (nuevo endpoint)
```python
# GET /api/v1/volcanoes
# Response: list[VolcanoStatusOut]
class VolcanoStatusOut(BaseModel):
    volcano_key: str
    volcano_name: str
    level: str              # "verde" | "amarilla" | "naranja" | "roja"
    level_label: str        # "Alerta Amarilla" etc.
    region_code: int | None
    region_name: str | None
    comuna_codes: list[int]
    comuna_names: list[str]
    external_url: str
    issued_at: datetime | None
    page_updated_at: datetime | None
    is_active: bool
    latitude: float | None
    longitude: float | None
```

- Fuente: JOIN `sernageomin_volcanic_alerts` (activas) + catálogo `SERNAGEOMIN_VOLCANOES` (para coords)
- **Falta**: coordenadas lat/lon en el catálogo. Agregar a `VolcanoGeo` (~25 volcanes, datos públicos SERNAGEOMIN)
- Incluir también volcanes del catálogo SIN alerta activa (level="verde", is_active=false) para contexto

#### Frontend (nuevo)
| Componente | Ubicación | Rol |
|-----------|-----------|-----|
| `VolcanoesPage` | `app/(citizen)/volcanoes/page.tsx` | Página dedicada |
| `VolcanoMap` | `components/volcanoes/volcano-map.tsx` | MapLibre con marcadores por volcán (color = nivel) |
| `VolcanoListPanel` | `components/volcanoes/volcano-list-panel.tsx` | Lista glass: activos primero, ordenados por severidad |
| `VolcanoDetailSheet` | `components/volcanoes/volcano-detail-sheet.tsx` | Al click: nivel, comunas afectadas, "¿Qué significa?", link SERNAGEOMIN, CTA evacuación |
| `VolcanoLevelBadge` | `components/volcanoes/volcano-level-badge.tsx` | Badge color: verde/amarillo/naranja/rojo |
| `useVolcanoes` | `hooks/use-volcanoes.ts` | `GET /api/v1/volcanoes` |

#### UX flow
1. Página `/volcanoes` → mapa de Chile con marcadores (triángulos ▲) coloreados por nivel
2. Panel lateral (glass): "Volcanes con alerta elevada" (activos) + "Todos los monitoreados"
3. Click en volcán → sheet con:
   - Nombre + nivel (badge grande)
   - "Alerta Amarilla: El volcán presenta cambios en su actividad..."
   - Comunas potencialmente afectadas (chips)
   - Botón "Ver guía de erupción" → `/disasters/volcanes`
   - Botón "Puntos de encuentro" → `/evacuation?hazard=volcanic`
   - Link "Fuente: SERNAGEOMIN" (external_url)
4. Si el usuario tiene comuna de hogar en `comuna_codes` de un volcán activo → banner contextual

#### Mapa
- Marcadores: `maplibregl.Marker` con elemento DOM (triángulo SVG, color por nivel)
- Popup al hover: nombre + nivel
- FlyTo al click
- Capa base: mismo estilo que ChileMap

#### Esfuerzo: ~5-6 horas (3h backend con coords + 3h frontend)

### Demo para jurado (30 seg)
1. Abrir /volcanoes → mapa con 5-8 volcanes en alerta amarilla/naranja (datos REALES de hoy)
2. Click "Nevados de Chillán" → sheet: "Alerta Naranja, comunas: Pinto, Coihueco, San Fabián"
3. "¿Qué hago?" → link a guía + puntos de encuentro volcanic
4. "Esto no existe en ningún otro proyecto. Son datos reales de SERNAGEOMIN, actualizados cada hora."

---

## Idea 4: PWA Offline "Modo Catástrofe"

### Concepto
En emergencias reales (terremoto, tsunami), las redes se saturan o caen. ChileRisk como PWA
cachea los datos críticos del usuario y los mantiene accesibles sin conexión.

### Por qué diferencia
TrueRisk es una web app tradicional. ChileRisk demuestra que pensó en el **caso de uso real**:
un ciudadano sin señal después de un M8+ necesita saber a dónde ir.

### Qué ya existe (leverage)
- Next.js 16 (soporte PWA nativo con manifest + service worker)
- Meeting points ya seedeados (datos estáticos, cacheables)
- `disaster_guides.json` (estático, cacheable)
- Risk scores + alertas (API, cacheables con stale-while-revalidate)
- EvacuationMap (MapLibre tiles cacheables)

### Implementación

#### Frontend
| Archivo | Rol |
|---------|-----|
| `public/manifest.json` | PWA manifest (name, icons, theme_color, display: standalone) |
| `public/sw.js` | Service worker (o `next-pwa` / `@ducan-dal/next-pwa`) |
| `app/layout.tsx` | `<link rel="manifest">` + meta theme-color |
| `components/offline/offline-banner.tsx` | Banner "Modo offline — datos de hace X min" |
| `hooks/use-online-status.ts` | `navigator.onLine` + event listeners |

#### Estrategia de cache (service worker)
| Recurso | Estrategia | TTL |
|---------|-----------|-----|
| `/data/comunas.geojson`, `/data/regional.geojson` | Cache-first | Permanente |
| `/data/volcanoes.geojson` (nuevo) | Cache-first | Permanente |
| `/api/backend/api/v1/risk/*` | Stale-while-revalidate | 15 min |
| `/api/backend/api/v1/alerts/active` | Stale-while-revalidate | 5 min |
| `/api/backend/api/v1/meeting-points/*` | Cache-first | Permanente |
| `/api/backend/api/v1/disaster-guides` | Cache-first | Permanente |
| MapLibre tiles | Cache-first | 7 días |
| App shell (HTML/JS/CSS) | Precache | Build |

#### UX offline
1. Usuario pierde conexión → banner amarillo sutil: "Sin conexión — mostrando datos guardados (hace 12 min)"
2. Mapa sigue funcionando (tiles cacheadas + GeoJSON local)
3. Puntos de encuentro accesibles (cache-first)
4. Guías de desastre accesibles (estáticas)
5. Risk scores muestran último valor cacheado + timestamp
6. Banner rojo si datos > 1h: "Datos pueden estar desactualizados"

#### Instalación PWA
- Prompt "Agregar a pantalla de inicio" (beforeinstallprompt)
- Iconos: 192x192, 512x512 (logo ChileRisk)
- `display: standalone` → se siente como app nativa
- Splash screen con color de fondo dark

#### Backend
- Sin cambios. Solo headers `Cache-Control` apropiados en respuestas (ya los tiene FastAPI por defecto)
- Opcional: `Cache-Control: public, max-age=900` en risk endpoints

#### Esfuerzo: ~3-4 horas

### Demo para jurado (20 seg)
1. Abrir ChileRisk en móvil → "Agregar a pantalla de inicio"
2. Activar modo avión → la app sigue mostrando mapa + riesgo + puntos de encuentro
3. "En un terremoto real, esto es lo que marca la diferencia entre saber a dónde ir o no."

---

## Timeline sugerido (2 días)

| Bloque | Idea | Entregable |
|--------|------|-----------|
| Día 1 AM (4h) | **Idea 1: Modo Emergencia** | Banner + "¿Qué hago?" IA + link evacuación |
| Día 1 PM (3h) | **Idea 2: Mi Comuna Hoy** | Tarjeta + share + página /comuna-today |
| Día 2 AM (5h) | **Idea 3: Dashboard Volcánico** | Endpoint + mapa + lista + detail sheet |
| Día 2 PM (3h) | **Idea 4: PWA Offline** | Manifest + SW + offline banner + cache |
| Día 2 PM (1h) | **Pulir + deploy** | Deploy CubePath + probar flujo completo |

**Total: ~16 horas de implementación.**

---

## Criterios del jurado → cómo puntúa cada idea

| Criterio | Idea 1 | Idea 2 | Idea 3 | Idea 4 |
|----------|--------|--------|--------|--------|
| 🔧 Utilidad | ★★★★★ | ★★★★ | ★★★★ | ★★★★★ |
| 💡 Originalidad | ★★★★★ | ★★★★ | ★★★★★ | ★★★ |
| ⚙️ Calidad impl. | ★★★★ | ★★★★ | ★★★★★ | ★★★★ |
| 🎨 Presentación | ★★★★★ | ★★★★★ | ★★★★★ | ★★★ |
| ☁️ Infra CubePath | ★★★ | ★★★ | ★★★ | ★★★★ |

**Combo ganador para demo:** Idea 1 + Idea 3 (emergencia + volcanes = "nadie más tiene esto").
**Si queda tiempo:** Idea 2 (compartible = viralidad) + Idea 4 (offline = utilidad real).

---

## Notas para la presentación

### Frase de apertura
> "Chile es el país más sísmico del mundo, tiene 90 volcanes activos, y cada invierno
> tiene episodios críticos de aire. TrueRisk monitorea España con ML. Nosotros construimos
> lo que Chile necesita: una herramienta que te dice qué hacer, dónde ir, y cuándo practicar."

### Diferenciadores clave para mencionar
1. **Datos oficiales reales** — SERNAPRED, SERNAGEOMIN, CSN, Aire Chile (no genéricos)
2. **Acción, no solo información** — Modo Emergencia + puntos de encuentro + plan familiar
3. **Únicamente chileno** — Volcanes, GEC aire, simulacros SAE (nadie más lo tiene)
4. **Funciona sin internet** — PWA offline para el caso de uso real
5. **IA contextual** — DeepSeek con tools que conocen tu comuna, tus alertas, tus puntos de encuentro

### Sobre CubePath
- Deploy completo del stack (Docker Compose: frontend + backend + PostgreSQL)
- Mencionar escalabilidad: scheduler con 5 fuentes en tiempo real
- Si ofrecen GPU: mencionar roadmap ML (ML-INTEGRATION.md ya diseñado)
- Si ofrecen edge/CDN: PWA + cache se beneficia directamente

### Cuenta demo (jurado)
- Email: `demo@chilerisk.cl`
- Contraseña: `ChileRisk2026!`
- Comuna hogar: Coquimbo (`4102`)
- Se siembra al arrancar el backend (`SEED_DEMO_USER=true`). Visible en `/login`.

---

*Documento de planificación. Implementar en orden de prioridad. Cada idea es independiente y deployable por separado.*
