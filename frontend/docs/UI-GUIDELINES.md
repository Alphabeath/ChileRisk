# ChileRisk — UI implementation guidelines

`frontend/docs/UI-GUIDELINES.md` es el contrato detallado y canónico de implementación: rutas de código, superficies/Mica, tokens semánticos, paletas de dominio, breakpoints, componentes, accesibilidad y excepciones.

`frontend/DESIGN.md` es la proyección portable para Impeccable y otros agentes compatibles con `DESIGN.md`: frontmatter estructurado más principios resumidos.

Si divergen, `UI-GUIDELINES.md` y el código canónico citado allí ganan; el mismo cambio debe sincronizar después `frontend/DESIGN.md`. El archivo portable nunca introduce una regla que no exista en la guía o el código.

**Related:** [AGENTS.md](../AGENTS.md) (índice), [FRONTEND.md](./FRONTEND.md) (componentes + data plumbing del monitor), [portable spec](../DESIGN.md), [DOC-MAINTENANCE.md](../../docs/DOC-MAINTENANCE.md), `app/globals.css`, `lib/surface.ts`, `lib/risk-scale.ts`, `lib/alerts-display.ts`.

**División de verdad:** esta guía gobierna los detalles de implementación; `FRONTEND.md` gobierna las capas MapLibre, hooks TQ y contrato de datos.

---

## 1. Product tone

ChileRisk is a **citizen risk monitor** for Chile: serious, clear, data-forward. App surfaces should feel like an operations tool; the landing may be more expressive.

| Do                                            | Don't                                                  |
| --------------------------------------------- | ------------------------------------------------------ |
| High contrast, scanable chrome                | Pastel marketing cards as the main app look            |
| Short labels, uppercase metadata              | Long paragraphs in headers                             |
| Theme-aware surfaces + Mica                   | Dark-only `bg-black/60` glass or legacy glass patterns |
| Institutional Chile accents (blue/red)        | Random purple gradients                                |
| Phase language: **Antes · Durante · Después** | Invent new step naming per page                        |

**Theme:** SSR defaults to `<html class="dark">` in `app/layout.tsx`. Runtime `next-themes` (`ThemeProvider`, `defaultTheme="system"`, hotkey `d`) overrides with system preference. Map basemap and layer chrome follow the resolved theme.

---

## 2. Surfaces (two families)

**No** `GLASS_PANEL_CLASS` / `bg-black/60 backdrop-blur` as the canonical shell. That pattern breaks light theme.

Always import shells from `@/lib/surface`:

```ts
import {
  SURFACE_PANEL_CLASS,
  SURFACE_PANEL_SHELL_CLASS,
  SURFACE_MICA_INTERACTIVE_CLASS,
} from "@/lib/surface"
```

### 2.1 Semantic / shadcn

Used for: forms, auth, sparse citizen pages, `Button`, `Tooltip`, calendars, tabs.

- Tokens: `bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `primary`, `destructive`.
- **Button** (`components/ui/button.tsx`): `rounded-none`, uppercase, `tracking-widest`, `text-xs`. Prefer `variant` + layout-only `className` (`h-*`, `w-*`, `gap-*`).

### 2.2 Map overlay surface

Used for: floating map panels (`ActiveAlertsPanel`, `QueryDateControl`), `MapControls` group, mobile Sheets, citizen navbar shell.

| Token                            | Role                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `SURFACE_PANEL_CLASS`            | `rounded-none border border-border bg-background/80 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/70` |
| `SURFACE_MICA_CLASS`             | `surface-mica`                                                                                                              |
| `SURFACE_MICA_INTERACTIVE_CLASS` | `surface-mica interactive-mica`                                                                                             |
| `SURFACE_PANEL_SHELL_CLASS`      | panel + interactive Mica (default for floating columns / Sheets)                                                            |

**Exceptions (intentional):**

| Surface                         | Shell                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `MapPopup` (territorio / sismo) | `bg-popover` + border + `SURFACE_MICA_INTERACTIVE_CLASS` — **not** the blurred panel shell                                           |
| `MapControls` `ControlGroup`    | Same classes as `SURFACE_PANEL_CLASS` inlined + Mica (keep in sync if tokens change)                                                 |
| `CitizenNavbar`                 | `SURFACE_PANEL_SHELL_CLASS` + override `bg-background/55 supports-[backdrop-filter]:bg-background/40` (más transparente que paneles) |

**Corners:** sharp — **no** `rounded-xl` / `rounded-2xl` on map overlays or ops chrome. Allowed exceptions: count/date pills `rounded-full`; MapLibre attribution may use `rounded-md`.

**Text on overlays:** use semantic tokens (`text-foreground`, `text-muted-foreground`), not hard-coded `text-white/90`. Landing copy over the globe may use slate/white shadows for contrast (see §6).

---

## 3. Mica (cursor specular)

Windows-inspired highlight. **Decoration only** — not a severity signal.

```
MicaLightProvider → --mica-cursor-x/y en <html> → .interactive-mica { --mx/--my } → ::after radial
```

> **Hydration-safe by construction:** cursor coords live on `document.documentElement`
> (`--mica-cursor-x/y`, set imperatively), never inline on React-managed nodes —
> inline `style` mutations on React elements break hydration/remount diffs
> ("A tree hydrated but some attributes…"). Surfaces resolve them via
> `.surface-mica.interactive-mica { --mx: var(--mica-cursor-x); … }`.

| Concern    | Rule                                                                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Classes    | `surface-mica` / `interactive-mica` (never `glass-mica`)                                                                                                         |
| Specular   | Theme-aware CSS vars `--mica-spot`, `--mica-mid`, `--mica-opacity-rest` / `--mica-opacity-hover`, `--mica-size` / `--mica-size-interactive` in `:root` / `.dark` |
| Blend      | Light: `soft-light`; dark: `screen`                                                                                                                              |
| Provider   | `components/mica-light-provider.tsx` in root layout inside `ThemeProvider`                                                                                       |
| Motion     | `pointermove` + rAF coalesce; off if `prefers-reduced-motion` or `pointer: coarse`                                                                               |
| Stacking   | Host: `isolation: isolate`. `::after` at `z-index: 0`. Content above via `relative z-10` when needed                                                             |
| Where      | Shell of elevated surfaces (CitizenNavbar, `MapControls` group, `MapPopup`, Alertas/Fecha panels). Not every dense control button                                |
| Rest state | Soft specular always on (`--mica-opacity-rest`); stronger on hover / cursor follow                                                                               |
| Landing    | Omits Mica                                                                                                                                                       |

Coords helpers: `lib/use-mica-light.ts`. CSS: `app/globals.css`.

---

## 4. Color

### 4.1 Brand (`app/globals.css`)

| Token                                       | Value                | Role                                      |
| ------------------------------------------- | -------------------- | ----------------------------------------- |
| `--primary-chile`                           | `#0032A0`            | Institutional blue — heroes, CTAs, badges |
| `--secondary-chile`                         | `#DA291C`            | Alert accent, strong emphasis             |
| `--alert-preventiva`                        | `#4ade80`            | Alerta temprana preventiva (verde)        |
| `--alert-amarilla`                          | `#fbbf24`            | Alerta amarilla                           |
| `--alert-roja`                              | `#DA291C`            | Alerta roja (= `--secondary-chile`)       |
| `--alert-unavailable`                       | `#3a3f4a`            | Map/territory sin datos                   |
| `--ocean`                                   | light/dark oklch     | Landing / globe atmosphere                |
| `--chile-star-fill` / `--chile-star-stroke` | white / blue (light) | Globe star mark                           |
| `--primary`                                 | oklch UI primary     | Active nav / shadcn primary               |
| `--destructive`                             | oklch                | Errors                                    |

Tailwind (vía `@theme`): `bg-alert-preventiva`, `text-alert-roja`, `border-alert-amarilla`, etc. En JS/inline: `ALERT_CSS_VAR` / `bucket.cssVar` (`lib/risk-scale.ts`). MapLibre sigue usando hex — no acepta `var()`.

### 4.2 Alert levels — two layers

**A. ChileRisk score buckets (3)** — `lib/risk-scale.ts`  
Gating del evaluador / barras por amenaza: preventiva · amarilla · roja. Tokens CSS `--alert-*` + `ALERT_HEX` / `ALERT_MAP_HEX`.

| Alerta     | Rango score | CSS / UI hex          | MapLibre (`ALERT_MAP_HEX`) |
| ---------- | ----------- | --------------------- | -------------------------- |
| Preventiva | 0–34        | `#4ade80`             | `#16a34a`                  |
| Amarilla   | 35–54       | `#fbbf24`             | `#ca8a04`                  |
| Roja       | 55–100      | `#DA291C`             | `#DA291C`                  |
| Sin datos  | —           | `--alert-unavailable` | `#64748b`                  |

**B. Unified API / UI levels (5)** — `lib/types.ts` + `ALERT_LEVEL_META` in `lib/alerts-display.ts`  
Cards, badges, coropleta y pulso también reconocen `naranja` e `informativa` (SENAPRED / SERNAGEOMIN / MeteoChile / legado). No hay CSS vars `--alert-naranja` / `--alert-informativa` aún — hex en meta + match MapLibre.

| Nivel                        | UI hex (`ALERT_LEVEL_META`) | MapLibre fill   |
| ---------------------------- | --------------------------- | --------------- |
| preventiva / amarilla / roja | mismos que §4.2 A           | `ALERT_MAP_HEX` |
| naranja                      | `#fb923c`                   | `#ea580c`       |
| informativa                  | `#a78bfa`                   | `#7c3aed`       |

Prioridad (más grave → menos): roja → naranja → amarilla → preventiva → informativa.

**Ink:** `alertLevelUsesDarkInk` — texto oscuro en preventiva / amarilla / naranja / informativa; blanco en roja.

**Naranja** en producto = nivel unificado (volcán SERNAGEOMIN, Alerta DMC, etc.), no un 4.º bucket de score ChileRisk. API puede emitir legacy `bajo`/`moderado`/`alto`/`critico` — `bucketForAlert()` los mapea a los 3 buckets de score.

Helpers score: `alertLevelFromScore`, `bucketForAlert`. Map fill: `mapAlertFillColorExpression()` (incluye naranja/informativa). UI cards: `ALERT_LEVEL_META` / Tailwind `*-alert-*` donde exista token.

### 4.3 Air quality GEC (`lib/air-quality-display.ts`)

Niveles GEC Aire Chile. MapLibre usa `mapAirFillColorExpression()` sobre `air_level` cuando `alertsFilter === "airechile"`.

| Nivel         | Hex                                     |
| ------------- | --------------------------------------- |
| bueno         | `#2eae00`                               |
| regular       | `#f5d400`                               |
| alerta        | `#ff9800`                               |
| preemergencia | `#e65100`                               |
| emergencia    | `#c62828`                               |
| sin cobertura | `#3a3f4a` (`AIR_QUALITY_UNCOVERED_HEX`) |

### 4.4 Seismic accent (`lib/seismic.ts`)

Marker + popup header (`getSeismicAccentColor`):

| Magnitud | Hex       | Ink   |
| -------- | --------- | ----- |
| ≥ 5.5    | `#DA291C` | white |
| ≥ 5      | `#e07020` | dark  |
| &lt; 5   | `#cc9e23` | dark  |

### 4.5 Map chrome by theme

Line/label colors: `MAP_THEME_COLORS` in `components/map/map-config.ts` (slates + white halos in light; white lines / muted labels in dark). Risk fill color is theme-agnostic; **opacity** is higher in light so fills don’t wash out on positron.

### 4.6 Phase semantics (reserved)

`/desastres` implementa las guías SENAPRED vendoreadas (secciones numeradas, sin fases Antes/Durante/Después) — no usa acentos de fase. Si un futuro componente introduce fases:

| Fase    | Acento previsto |
| ------- | --------------- |
| Antes   | blue            |
| Durante | amber           |
| Después | emerald         |

---

## 5. Typography

| Font       | Variable                    | Usage                               |
| ---------- | --------------------------- | ----------------------------------- |
| Inter      | `--font-sans` (`next/font`) | UI body / titles                    |
| Geist Mono | `--font-mono` (`next/font`) | Stats, codes, tabular, panel titles |

| Role                           | Guidance                                                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Ops meta / labels              | `text-[10px] font-semibold uppercase tracking-[1.2px]` or Button `tracking-widest`                                                     |
| Panel titles (Alertas / Fecha) | `MAP_PANEL_TITLE_CLASS` — `font-mono text-[11px] font-bold uppercase tracking-[1.1px] text-muted-foreground` (`lib/citizen-layout.ts`) |
| Body                           | semantic foreground, compact on overlays (`text-sm` / `text-[12.5px]`)                                                                 |
| Mono stats                     | `font-mono tabular-nums uppercase tracking-wider`                                                                                      |
| Landing hero                   | expressive size + slate/white over globe; may use `text-white/90` in dark for legibility                                               |

---

## 6. Layout & shapes

- **Landing `/`:** full-bleed rotating globe + split wordmark Chile/Risk + one CTA button pointing to `/iniciar-sesion` (ruta ausente). No citizen navbar, no Mica. Expressive shadows OK.
- **Map pages (`/monitor`):** full viewport (`h-dvh`); overlays under navbar clearance (`CITIZEN_NAVBAR_CLEARANCE_PX` in `lib/citizen-layout.ts`).
- **Citizen non-map (`/desastres`, stubs):** content under fixed top navbar (`pt-12` / `CITIZEN_NAVBAR_PAD_TOP_CLASS`); semantic page shell (`h-full overflow-y-auto` main). `/desastres` sigue la misma gramática ciudadana que `/simulacros`: hero de marca full-bleed compacto `min-h-[32rem]` (`catalog/hero.png` + variante dark `hero noche.png` + scrim + eyebrow/rail/título centrado + metadata mono `N guías`) → apertura editorial (`DisastersIntroduction`) → amenazas prioritarias como tiles de campo de color (`GuideCard` `featured`, acento semántico por amenaza vía `getDisasterAccent` (`lib/disaster-visuals.ts`: agua→azul, fuego→rojo-naranja, tierra→terracota, frío→azul hielo; ≥4.5:1 con blanco), ilustración + blurb + CTA blanco) → catálogo restante y enfoque inclusivo con cards date-first (columna media en acento, título, CTA “Guía”) sin rail `border-left` → cierre azul institucional `--primary-chile` con panel CTA “Ver en SENAPRED”. Bandas de catálogo usan inner `max-w-6xl` y encabezados mono eyebrow `#0167b7`/`sky-300` + rail. `DisastersSectionNav` es un rail fijo de tres anchors desde `lg` sobre el mismo `ScrollRoot`. Detalle de guía: hero inmersivo a alto de viewport (asset 1920×1080 del bloque `background` ancho, o azul institucional `--primary-chile` + icono decorativo si no hay) + bandas editoriales de ancho completo con acento por desastre (`lib/disaster-visuals.ts`, `--guide-accent`/`--guide-accent-ink`/`--guide-tint`), texto corrido en `max-w-4xl`, fondos anchos `isWideBackground` (basename `bg`) integrados al pie de su banda como sibling full-bleed `w-full` (las figuras verticales mal tipadas quedan contenidas) y chapter bands para secciones solo-imagen. `GlobePageBackground` exists but is **not mounted** yet — do not assume globe behind pages.
- **Citizen non-map (`/simulacros`):** same `h-full overflow-y-auto` shell and `pt-12`. The full-bleed hero inherits `/desastres`: local light/dark SENAPRED artwork, centered short title, blue rail, vertical scrim and bottom mono metadata. The route then follows a close ChileRisk translation of SENAPRED: compact editorial introduction with mono eyebrow/rail → five numbered reason rows (`#0167b7`) → institutional date-first agenda titled “Calendario de ejercicios” (panel “Próximo ejercicio” usa el campo de color del tipo de simulacro, misma gramática que las cards inferiores; solo las fichas publicadas muestran título enlazado y CTA “Detalle” hacia `/simulacros/[slug]`, sin botón “Fuente”) → four compact full-width scenario bands with image always left and vertically centered copy (coastal `#00a6d0`, education `#0fb1af`, volcanic `#b33a4a`, landslide `#6b4a2e`) → blue participation close with mono eyebrow, stacked title and bordered CTA panel. Scenario colors are editorial fields, never alert/risk semantics. The calendar preserves 44px touch targets, loading/error/empty states and date-first event cards. Completed cards suppress long summary/comuna copy. Official scenario illustrations are vendored under `public/data/senapred/img/simulacros/`; no runtime remote images or WordPress chrome.
- **Citizen non-map (`/simulacros/[slug]`):** mismo shell scroll + `pt-12`. Hero date-first con campo de color `DRILL_TYPE_COLORS` (o imagen hotlink SENAPRED + scrim), horario dentro del bloque de fecha y badges inferiores en orden tipo → región → SAE; título = `headline` o `title`. Cuerpo: lead de resumen + comuna(s), luego agrupaciones source-ordered por `body_blocks` (apertura con `h2`/`h3`, pasos en una lista única con rail de acento, callouts `border-l-4`, link lists CTA y SAE notice); una agrupación de heading + único link list puede ser banda de acción invertida. Cierre `--primary-chile` con volver al calendario + “Ver en SENAPRED”. Sin cards soft ni semántica de alerta.

- **Territory detail:** desktop `md+` → `MapPopup` anclado (~310px); móvil `<md` → bottom `Sheet`. Cuerpo compartido `TerritoryDetailContent`.
- **Seismic detail:** same breakpoint shell (`SeismicEventShell` / `SeismicEventDetailContent`) on marker click.
- **Alertas + Fecha:** desktop `lg+` → columna fija izquierda 320px (`SURFACE_PANEL_SHELL_CLASS`); `md`–`lg` → rail angosto flush left (`MAP_PANEL_RAIL_WIDTH_CLASS`) que se expande a 320px; móvil `<md` → FABs bottom-left + bottom `Sheet`. Prefs en `stores/ui-store` + persist `chilerisk-ui-v1`. `MapControls` existe; la leyenda de riesgo sigue pendiente.
- **Radius:** `rounded-none` on Button, map shells, popups, navbar. Count badges and compact date pills may use `rounded-full`.
- **Scrollbars (global):** thin (5px), sharp (`border-radius: 0`), muted thumb / transparent track — `app/globals.css`. Do not invent per-panel scrollbar skins.

---

## 7. Components cookbook

### 7.1 Button

Use shadcn `Button` variants. Layout-only overrides. Brand CTA on landing may use `bg-[var(--primary-chile)]` + `normal-case` when the ops uppercase look is wrong for marketing.

### 7.2 Skeleton

`components/ui/skeleton.tsx` — loading placeholder (`animate-pulse bg-muted`). Use for **any** React Query surface that can look empty while `isPending` (especially date-scoped lists). Never render EmptyState when `data` is still undefined because of `data ?? []`. See FRONTEND.md § Loading / Skeleton.

### 7.3 CitizenNavbar

Fixed top bar (`h-12`, `SURFACE_PANEL_SHELL_CLASS` + transparency override §2.2). Brand → `/inicio`. Separator entre marca e ítems.

| Viewport  | Pattern                                                                     |
| --------- | --------------------------------------------------------------------------- |
| `< md`    | Hamburguesa → Sheet right (lista icono+label, tap ≥44px); cierra al navegar |
| `md`–`xl` | Iconos; **label solo en activo**; Tooltip en inactivos                      |
| `xl+`     | Icono + label en todos                                                      |

Active: pill `bg-primary` a alto completo de la bar; posición/`width` animadas con spring en desktop (misma en ambos sentidos; `duration: 0` si `prefers-reduced-motion` o en Sheet). Labels ops: `text-[10px] uppercase tracking-[1.2px]` (desktop) / marca móvil + Sheet `text-sm`. Ítems: `lib/citizen-nav.ts`. Layout citizen: `h-dvh overflow-hidden`. Landing `/` y auth futuras **sin** esta navbar (solo route group `(citizen)`).

### 7.4 MapControls / MapPopup

- **Controls:** `ControlGroup` = panel blur classes + Mica; bottom-right on `/monitor`.
- **Popup:** `bg-popover` + Mica (§2.2). Contained in vendored `components/ui/map.tsx` — change classNames only, not MapLibre logic.

### 7.5 Territory detail + Alertas + Fecha

**Territory (región/comuna):** shared `TerritoryDetailContent` inside `TerritoryDetailShell` — `MapPopup` (`md+`) or bottom `Sheet` (`<md`). Header badge/color = alerta más grave (`ALERT_LEVEL_META`) o peor GEC si solo Aire. Lista de alertas afectantes; clima + hazard bars. Live vía risk + `MonitorLiveDataProvider` (alerts + air).

**Alertas panel:** `MapAlertsOverlay` → `ActiveAlertsPanel` (`flow` / `embedded`) + `alert-ui` cards.

- Cards: rail izquierdo 3px + tint ~12% del nivel + badge (no fill sólido). Aire Chile: mismo patrón, sin expand “Ver detalle”.
- While `isPending` after date change → Skeleton (not EmptyState).
- Shell `SURFACE_PANEL_SHELL_CLASS`; titles `MAP_PANEL_TITLE_CLASS`.
- **Filter chips** (6): Todas · Chile Risk · Senapred · Volcán · Meteo · Aire — controlan lista, coropleta CUT, markers sismo y franjas Meteo. Count pills `rounded-full`.
- Datos: `/alerts/active` + `/air-quality` (+ `/alerts/meteochile/zones` cuando filtro = Meteo). Ver FRONTEND.md § Panel Alertas.

**Fecha panel:** `QueryDateControl` under Alertas / mobile FAB+Sheet. Date picker = styled `Calendar` (DayPicker) in `Popover` — not the native OS dialog. Window 30 days (`lib/query-date.ts`); state in `ui-store`.

**Future legend / controls panels:** same shell + semantic text pattern.

### 7.6 Seismic detail

`SeismicEventShell` + `SeismicEventDetailContent` — same popup/sheet breakpoints as territory. Header accent by magnitude (§4.4); badge `M x.x`; stats + links CSN / intensidades. Markers: pulsing-dot layer; filtered by sismo-related active alerts when source filters apply. Detail: FRONTEND.md § Popup sismo.

### 7.7 Evacuation map (`/evacuacion`)

Dedicated mapcn map (not `ChileMap`). **Satellite** basemap by default; **Calle** toggle uses OpenFreeMap Liberty/Dark (theme-aware via hotkey `d`) and sits under bottom-right `MapControls` (`items-end` / `w-fit` so zoom stays square). Floating left column: separate **Puntos** / **Capas** shells with `gap-2`; its height is fixed to the available viewport. Panels keep natural height, are capped at half that space, and may shrink as nearby points load; their internal lists scroll, so the Volcán tab cannot extend below the viewport. Capas checkboxes are custom (no native chrome). Feature popup matches territory/seismic chrome (mono header, accent hero, detail rows, full-bleed footer actions; `MapPopup` `md+` / bottom `Sheet` `<md`). Meeting points use **original KMZ icons** (tsunami PE; volcanic PE/PET by `tipo`). Silent auto-locate when geolocation permission is already `granted`; no blocking location modal. Heavy polygons are **PMTiles only**; lines/points stay GeoJSON. Volcanic **hazard zones on** / **radii off** by default. Routes `#0077ff`.

---

## 8. Map-specific rules

- Basemap: CARTO **positron** (light) / **dark-matter** (dark) via mapcn theme — no fixed `theme` on `ChileMap`.
- Camera: `MAP_MIN_ZOOM`/`MAP_MAX_ZOOM` (3–10) on `/monitor`. Region fill until zoom **7**; comunas from `COMUNAS_MIN_ZOOM = 7`.
- **Choropleth by filter:**
  - Default / ChileRisk / SENAPRED / Volcán: `mapAlertFillColorExpression()` on `alert_level` (most severe; `source=meteochile` excluded from CUT fill).
  - Aire: `mapAirFillColorExpression()` on `air_level`.
  - Meteo: official DMC zone polygons (`meteochile-zone-*`); DMC levels → Aviso=amarilla, Alerta=naranja, Alarma=roja. Franjas **only** when chip = Meteo (in “Todas”, Meteo rows appear in the list without polygons).
- Never paint from `composite_score`.
- **Alert fill pulse:** `fill-opacity` oscila rest → hover max; hover always at max. Periods (`ALERT_PULSE_PERIOD_MS` in `map-config.ts`): roja **3800** · naranja **4400** · amarilla **5000** · preventiva / informativa **6200** ms. Air mode maps GEC → those periods via `airPulsePeriodMs`. Off if `prefers-reduced-motion`.
- Detail / z-order / TQ: [FRONTEND.md](./FRONTEND.md).

---

## 9. Accessibility

- Visible `focus-visible` rings (`ring-ring` / inset on compact controls).
- Mica disabled for `prefers-reduced-motion` and coarse pointers.
- Do not rely on Mica or color alone for severity — keep labels/text.
- Filter chips and FABs: clear labels; mobile tap targets ≥44px where chrome is touch-first.

---

## 10. Motion

- Landing: `motion` allowed (globe intro + hero fade).
- `/desastres` catalog + guide detail: `motion` scroll-reveal (`whileInView`) scoped to page `ScrollRoot` (main scroller, no el viewport); `useReducedMotion` → render estático; `once: true`.
- `/simulacros`: the five reason rows enter as one 520 ms left-to-right scan with a 55 ms sibling cadence; `prefers-reduced-motion` renders them statically.
- App chrome / overlays: CSS transitions (`duration-150`/`200`) only unless a feature needs more (CitizenNavbar active pill: measured `left`/`width` spring).
- Map fill pulse: MapLibre opacity animation (not React motion).
- No `framer-motion`. No `sonner` without asking.
- Honor `prefers-reduced-motion` (Mica off; navbar pill `duration: 0`; map pulse off).

---

## 11. Do's and Don'ts

**Do**

- Semantic tokens + Chile accents for brand moments
- Canonical risk / unified alert / air / seismic hexes
- Mica via `lib/surface.ts` on elevated shells (respect §2.2 exceptions)
- Spanish routes / English code / Spanish UI ([AGENTS.md](../AGENTS.md))
- Keep FRONTEND.md in sync for monitor data wiring when visuals change

**Don't**

- Purple-on-white or cream+terracotta AI-default looks (informativa purple is a **severity** color, not a theme)
- Dark-only glass (`bg-black/60` + `text-white/90`) as the ops system
- Invent severity colors outside `risk-scale` / `alerts-display` / `air-quality-display` / `seismic`
- `rounded-2xl` on map overlays
- Copy `glass-mica` / `GLASS_PANEL_*` legacy patterns
- `framer-motion` / unsolicited `sonner`

---

_Last updated: 2026-08-10 (simulacro detail scrape)_
