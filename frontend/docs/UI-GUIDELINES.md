# ChileRisk — UI implementation guidelines

`frontend/docs/UI-GUIDELINES.md` es el contrato detallado y canónico de implementación: familias visuales, superficies/Mica, tokens, paletas de dominio, primitivos de layout, cookbooks, accesibilidad y excepciones.

`frontend/DESIGN.md` es la proyección portable para Impeccable: frontmatter estructurado más principios resumidos.

Si divergen, `UI-GUIDELINES.md` y el código canónico citado allí ganan; el mismo cambio debe sincronizar después `frontend/DESIGN.md`. El archivo portable nunca introduce una regla que no exista en la guía o el código.

**Related:** [AGENTS.md](../AGENTS.md) (índice), [FRONTEND.md](./FRONTEND.md) (rutas, componentes y data plumbing), [portable spec](../DESIGN.md), [DOC-MAINTENANCE.md](../../docs/DOC-MAINTENANCE.md), `app/globals.css`, `lib/surface.ts`, `lib/risk-scale.ts`, `lib/alerts-display.ts`.

**División de verdad:** esta guía gobierna la implementación visual. `FRONTEND.md` gobierna el estado de rutas, capas MapLibre, hooks TQ y contrato de datos. Una ruta nueva elige primero una familia (§2) y reutiliza primitivos (§7.2); no copia el párrafo de otra página.

---

## 1. Product tone

ChileRisk is a **citizen risk monitor** for Chile: serious, clear, data-forward. Landing may be expressive. Monitor and evacuation stay operational. SENAPRED pages are close translations of official material, not marketing.

| Do | Don't |
| -- | ----- |
| High contrast, scanable chrome | Pastel marketing cards as the main app look |
| Short labels; uppercase metadata on ops and editorial eyebrows | Long paragraphs in headers |
| Theme-aware surfaces; Mica only on elevated ops chrome | Dark-only `bg-black/60` glass |
| Institutional Chile accents (`--primary-chile`, `--secondary-chile`) | Random purple gradients as theme |
| Official attribution (SENAPRED, CSN, DMC, Aire Chile) | Invented data, email-delivery claims, or alert hexes on editorial fields |

**Theme:** SSR defaults to `<html class="dark">` in `app/layout.tsx`. Runtime `next-themes` (`ThemeProvider`, `defaultTheme="system"`, hotkey `d`) overrides with system preference. Map basemap and layer chrome follow the resolved theme.

**Wordmarks (do not mix):**

| Surface | Treatment |
| ------- | --------- |
| Landing `/` | Chile slate/white + Risk red, with globe contrast shadows |
| Auth | Chile `text-foreground` + Risk `--primary-chile` |
| `/inicio` H1 | «ChileRisk» all white on `--primary-chile` |
| Navbar | «ChileRisk» single word, semantic |

---

## 2. Visual families

Pick a family before inventing layout. Do not blend catalog heroes into forms, or Mica into SENAPRED pages.

| Family | Routes | Shell | Mica | Color role |
| ------ | ------ | ----- | ---- | ---------- |
| **Landing** | `/` | Full-bleed globe, no navbar | No | Expressive wordmark + `--primary-chile` CTA |
| **Ops / mapa** | `/monitor`, `/evacuacion` | `h-dvh` under navbar clearance | Yes, on elevated shells | Alert / air / seismic / map chrome |
| **Editorial SENAPRED** | `/desastres`, `/desastres/[tipo]`, `/simulacros`, `/simulacros/[slug]`, `/preparacion`, `/preparacion/kit-emergencia` | `ScrollRoot` + `pt-12` | No | Official fields (§5.7); never `--alert-*` |
| **Hub / formularios** | `/inicio`, `/cuenta`, `(auth)/*`, `/asistente` | Scroll + `pt-12` (auth: `min-h-dvh`, no navbar) | No | Semantic tokens; `/inicio` uses a poster header over local hero art, not a SENAPRED catalog clone |

`GlobePageBackground` exists but is **not mounted**. Do not assume a globe behind citizen pages.

---

## 3. Surfaces

**No** `GLASS_PANEL_CLASS` / `bg-black/60 backdrop-blur` as the canonical shell. That pattern breaks light theme.

Always import overlay shells from `@/lib/surface`:

```ts
import {
  SURFACE_PANEL_CLASS,
  SURFACE_PANEL_SHELL_CLASS,
  SURFACE_MICA_INTERACTIVE_CLASS,
} from "@/lib/surface"
```

### 3.1 Semantic / shadcn

Used for: forms, auth, `/cuenta`, `/asistente`, sparse citizen chrome, `Button`, `Tooltip`, calendars.

- Tokens: `bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `primary`, `destructive`.
- **Button** (`components/ui/button.tsx`): `rounded-none`, uppercase, `tracking-widest`, `text-xs`. Prefer `variant` + layout-only `className` (`h-*`, `w-*`, `gap-*`).

Editorial pages also use these tokens for reading bands (`bg-background`, `bg-card`). They do not use Mica.

### 3.2 Map overlay surface

Used for: floating map panels (`ActiveAlertsPanel`, `QueryDateControl`), `MapControls` group, mobile Sheets, citizen navbar shell.

| Token | Role |
| ----- | ---- |
| `SURFACE_PANEL_CLASS` | `rounded-none border border-border bg-background/80 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/70` |
| `SURFACE_MICA_CLASS` | `surface-mica` |
| `SURFACE_MICA_INTERACTIVE_CLASS` | `surface-mica interactive-mica` |
| `SURFACE_PANEL_SHELL_CLASS` | panel + interactive Mica (default for floating columns / Sheets) |

**Exceptions (intentional):**

| Surface | Shell |
| ------- | ----- |
| `MapPopup` (territorio / sismo / evacuación) | `bg-popover` + border + `SURFACE_MICA_INTERACTIVE_CLASS` — **not** the blurred panel shell |
| `MapControls` `ControlGroup` | Same classes as `SURFACE_PANEL_CLASS` inlined + Mica (keep in sync if tokens change) |
| `CitizenNavbar` | `SURFACE_PANEL_SHELL_CLASS` + override `bg-background/55 supports-[backdrop-filter]:bg-background/40` (más transparente que paneles) |

**Corners:** sharp — **no** `rounded-xl` / `rounded-2xl` on map overlays, navbar, buttons or ops chrome. Allowed exceptions: count/date pills `rounded-full`; MapLibre attribution may use `rounded-md`.

**Text on overlays:** semantic tokens (`text-foreground`, `text-muted-foreground`), not hard-coded `text-white/90`. Landing copy over the globe may use slate/white shadows (§7.3).

---

## 4. Mica (cursor specular)

Windows-inspired highlight. **Decoration only** — not a severity signal. Landing, editorial SENAPRED, auth, `/inicio` and `/cuenta` omit it.

```
MicaLightProvider → --mica-cursor-x/y en <html> → .interactive-mica { --mx/--my } → ::after radial
```

> **Hydration-safe by construction:** cursor coords live on `document.documentElement`
> (`--mica-cursor-x/y`, set imperatively), never inline on React-managed nodes —
> inline `style` mutations on React elements break hydration/remount diffs
> ("A tree hydrated but some attributes…"). Surfaces resolve them via
> `.surface-mica.interactive-mica { --mx: var(--mica-cursor-x); … }`.

| Concern | Rule |
| ------- | ---- |
| Classes | `surface-mica` / `interactive-mica` (never `glass-mica`) |
| Specular | Theme-aware CSS vars `--mica-spot`, `--mica-mid`, `--mica-opacity-rest` / `--mica-opacity-hover`, `--mica-size` / `--mica-size-interactive` in `:root` / `.dark` |
| Blend | Light: `soft-light`; dark: `screen` |
| Provider | `components/mica-light-provider.tsx` in root layout inside `ThemeProvider` |
| Motion | `pointermove` + rAF coalesce; off if `prefers-reduced-motion` or `pointer: coarse` |
| Stacking | Host: `isolation: isolate`. `::after` at `z-index: 0`. Content above via `relative z-10` when needed |
| Where | Shell of elevated ops surfaces (CitizenNavbar, `MapControls` group, `MapPopup`, Alertas/Fecha panels). Not every dense control button |
| Rest state | Soft specular always on (`--mica-opacity-rest`); stronger on hover / cursor follow |

Coords helpers: `lib/use-mica-light.ts`. CSS: `app/globals.css`.

---

## 5. Color

Three independent palettes. Do not reuse one family's hexes to mean another family's concept.

1. **Brand + semantic UI** — `app/globals.css`
2. **Domain ops** — score / unified alert / air / seismic / map
3. **Editorial SENAPRED** — fields of official color; never `--alert-*`

### 5.1 Brand (`app/globals.css`)

| Token | Value | Role |
| ----- | ----- | ---- |
| `--primary-chile` | `#0032A0` | Institutional blue — heroes, closures, landing CTA, fallback |
| `--secondary-chile` | `#DA291C` | Alert accent, landing Risk, strong emphasis |
| `--alert-preventiva` | `#4ade80` | Alerta temprana preventiva (verde) |
| `--alert-amarilla` | `#fbbf24` | Alerta amarilla |
| `--alert-roja` | `#DA291C` | Alerta roja (= `--secondary-chile`) |
| `--alert-unavailable` | `#3a3f4a` | Map/territory sin datos |
| `--ocean` | light/dark oklch | Landing / globe atmosphere |
| `--chile-star-fill` / `--chile-star-stroke` | white / blue (light) | Globe star mark |
| `--primary` | oklch UI primary | Active nav / shadcn primary |
| `--destructive` | oklch | Errors |

Tailwind (vía `@theme`): `bg-alert-preventiva`, `text-alert-roja`, `border-alert-amarilla`, etc. En JS/inline: `ALERT_CSS_VAR` / `bucket.cssVar` (`lib/risk-scale.ts`). MapLibre sigue usando hex — no acepta `var()`.

`#0167b7` is **not** a CSS variable. It is the SENAPRED editorial blue used in classNames. Do not treat it as `--primary-chile`.

### 5.2 Alert levels — two layers

**A. ChileRisk score buckets (3)** — `lib/risk-scale.ts`  
Gating del evaluador / barras por amenaza: preventiva · amarilla · roja. Tokens CSS `--alert-*` + `ALERT_HEX` / `ALERT_MAP_HEX`.

| Alerta | Rango score | CSS / UI hex | MapLibre (`ALERT_MAP_HEX`) |
| ------ | ----------- | ------------ | -------------------------- |
| Preventiva | 0–34 | `#4ade80` | `#16a34a` |
| Amarilla | 35–54 | `#fbbf24` | `#ca8a04` |
| Roja | 55–100 | `#DA291C` | `#DA291C` |
| Sin datos | — | `--alert-unavailable` | `#64748b` |

**B. Unified API / UI levels (5)** — `lib/types.ts` + `ALERT_LEVEL_META` in `lib/alerts-display.ts`  
Cards, badges, coropleta y pulso también reconocen `naranja` e `informativa` (SENAPRED / SERNAGEOMIN / MeteoChile / legado). No hay CSS vars `--alert-naranja` / `--alert-informativa` aún — hex en meta + match MapLibre.

| Nivel | UI hex (`ALERT_LEVEL_META`) | MapLibre fill |
| ----- | --------------------------- | ------------- |
| preventiva / amarilla / roja | mismos que §5.2 A | `ALERT_MAP_HEX` |
| naranja | `#fb923c` | `#ea580c` |
| informativa | `#a78bfa` | `#7c3aed` |

Prioridad (más grave → menos): roja → naranja → amarilla → preventiva → informativa.

**Ink:** `alertLevelUsesDarkInk` — texto oscuro en preventiva / amarilla / naranja / informativa; blanco en roja.

**Naranja** en producto = nivel unificado (volcán SERNAGEOMIN, Alerta DMC, etc.), no un 4.º bucket de score ChileRisk. API puede emitir legacy `bajo`/`moderado`/`alto`/`critico` — `bucketForAlert()` los mapea a los 3 buckets de score.

Helpers score: `alertLevelFromScore`, `bucketForAlert`. Map fill: `mapAlertFillColorExpression()` (incluye naranja/informativa). UI cards: `ALERT_LEVEL_META` / Tailwind `*-alert-*` donde exista token.

### 5.3 Air quality GEC (`lib/air-quality-display.ts`)

Niveles GEC Aire Chile. MapLibre usa `mapAirFillColorExpression()` sobre `air_level` cuando `alertsFilter === "airechile"`.

| Nivel | Hex |
| ----- | --- |
| bueno | `#2eae00` |
| regular | `#f5d400` |
| alerta | `#ff9800` |
| preemergencia | `#e65100` |
| emergencia | `#c62828` |
| sin cobertura | `#3a3f4a` (`AIR_QUALITY_UNCOVERED_HEX`) |

### 5.4 Seismic accent (`lib/seismic.ts`)

Marker + popup header (`getSeismicAccentColor`):

| Magnitud | Hex | Ink |
| -------- | --- | --- |
| ≥ 5.5 | `#DA291C` | white |
| ≥ 5 | `#e07020` | dark |
| &lt; 5 | `#cc9e23` | dark |

### 5.5 Map chrome by theme

Line/label colors: `MAP_THEME_COLORS` in `components/map/map-config.ts` (slates + white halos in light; white lines / muted labels in dark). Risk fill color is theme-agnostic; **opacity** is higher in light so fills don’t wash out on positron.

### 5.6 Phase semantics

Not used. SENAPRED guides keep numbered official sections. Do not invent Antes / Durante / Después accents.

### 5.7 Editorial SENAPRED

Official color fields. Never interchangeable with §5.2–5.4.

| Token | Hex | Owner | Use |
| ----- | --- | ----- | --- |
| ChileRisk institucional | `#0032A0` (`--primary-chile`) | `globals.css` | Catalog heroes, institutional close, fallback |
| SENAPRED editorial | `#0167b7` / `sky-300` in dark | classNames | Eyebrows, rails, agenda tabs, numbered reason cells |
| Costa | `#00a6d0` / ink `#062b38` | `DRILL_TYPE_COLORS`, escenarios, Familia | Coastal drill, some commitments |
| Educación | `#0fb1af` / ink `#062f2e` | same | Education drill, kit step, teal commitment |
| Volcán (escenario) | `#b33a4a` / ink `#ffffff` | `lib/simulacros.ts` | Volcanic drill band |
| Ladera | `#6b4a2e` / ink `#fff8ef` | `lib/simulacros.ts` | Landslide drill band |
| Otro simulacro | `#0167b7` / ink `#ffffff` | `lib/simulacros.ts` | Fallback drill type |
| Familia Preparada | per-card hex + ink | `lib/familia-preparada-content.ts` | Commitment tiles and 8 steps |
| Amenaza | `getDisasterAccent(slug)` | `lib/disaster-visuals.ts` | Guide tiles / `--guide-accent` |

Guide detail also derives `--guide-accent-ink` and `--guide-tint` via `color-mix` in `guide-content.tsx`. Featured disaster tiles use white ink (`#ffffff`) and require ≥4.5:1 on the accent.

Kit tiles are **not** color fields: icon sits on `muted`, sentence uses semantic text.

---

## 6. Typography

| Font | Variable | Usage |
| ---- | -------- | ----- |
| Inter | `--font-sans` (`next/font`) | UI body / titles / editorial display |
| Geist Mono | `--font-mono` (`next/font`) | Stats, codes, tabular, panel titles, eyebrows, hero meta |

| Role | Guidance |
| ---- | -------- |
| Ops meta / labels | `text-[10px] font-semibold uppercase tracking-[1.2px]` or Button `tracking-widest` |
| Panel titles (Alertas / Fecha) | `MAP_PANEL_TITLE_CLASS` — `font-mono text-[11px] font-bold uppercase tracking-[1.1px] text-muted-foreground` (`lib/citizen-layout.ts`) |
| Editorial eyebrow | `font-mono text-[10px] font-semibold uppercase tracking-[1.4px] text-[#0167b7] dark:text-sky-300` |
| Catalog / inicio display | `text-4xl`–`text-8xl font-extrabold tracking-tight` (`tracking-[-0.03em]` on `/inicio` H1) |
| Section title | `text-xl` / `text-2xl font-extrabold tracking-tight` (hub); `text-3xl`–`text-5xl` on institutional close |
| Form title | `text-2xl font-semibold tracking-tight` |
| Reading body | `max-w-4xl` or `max-w-[62ch]`, `leading-7` / `leading-relaxed` |
| Overlay body | semantic foreground, compact (`text-sm` / `text-[12.5px]`) |
| Hero / close meta | `font-mono text-[11px] uppercase tracking-wider` |
| Mono stats | `font-mono tabular-nums uppercase tracking-wider` |
| Landing hero | expressive size + slate/white over globe; `text-white/90` OK in dark |

---

## 7. Layout & shapes

### 7.1 Shared shells

| Shell | Classes / constants | Where |
| ----- | ------------------- | ----- |
| Citizen scroll | `ScrollRoot` + `h-full overflow-y-auto` + `CITIZEN_NAVBAR_PAD_TOP_CLASS` (`pt-12`) | Editorial + `/inicio` |
| Map viewport | `h-dvh` + overlays under `CITIZEN_NAVBAR_CLEARANCE_PX` (48) | `/monitor`, `/evacuacion` |
| Citizen layout | `h-dvh overflow-hidden` on `(citizen)` | All navbar routes |
| Inner measure | `mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8` | Editorial bands, `/inicio` |
| Reading measure | `max-w-4xl` / `max-w-[62ch]` | Guide body, hub copy |
| Form column | `max-w-md` (auth) / `max-w-lg` (cuenta, stub) | Hub / formularios |
| Map panel | 320px expanded in `lg+`; `<lg` uses the full-width `MapBottomDrawer` rail and tabs | Alertas / Fecha |

`ScrollRoot` lives in `components/disasters/scroll-reveal.tsx` and is the page scroller (not the viewport) for `Reveal` and `DisastersSectionNav`.

**Radius:** `rounded-none` on Button, map shells, popups, navbar, editorial tiles. Count badges and compact date pills may use `rounded-full`.

**Scrollbars (global):** thin (5px), sharp (`border-radius: 0`), muted thumb / transparent track — `app/globals.css`. Do not invent per-panel scrollbar skins.

### 7.2 Editorial primitives

The code still duplicates these; reuse the grammar, do not invent a second one.

**Catalog hero** — `/desastres`, `/simulacros`, `/preparacion`

- `min-h-[32rem] lg:max-h-[56rem]`, full-bleed, `border-b`, fallback `bg-[var(--primary-chile)]`
- Local light/dark artwork (or plaza art on preparación) + vertical scrim
- Centered eyebrow (white/80) + rail `h-1 w-16` + display title in white with text-shadow
- Bottom mono meta on `max-w-6xl` (`N guías`, `Calendario…`, `8 pasos…`)
- Preparación extras: rail `#00a6d0`, characters (`personajes_fp.png`) sitting on the plaza

**Kit hero** — `/preparacion/kit-emergencia` only

- Same height; **no** black scrim
- Fallback `#dbeaf3` / `#0b1a2e`; official `hero.png` / `hero noche.png` (`dark:` swap)
- Title `--primary-chile` in light, white in dark; rail `#00a6d0`; SENAPRED eyebrow `#0167b7` / `sky-300`
- Centered meta «48–72 horas · Fuente SENAPRED»

**Poster brand header** — `/inicio` only

- Same height band as catalog (`min-h-[32rem] lg:max-h-[56rem]`), fallback `#d6e4ee` / `#0b1a2e`
- Local `hero.png` / `hero noche.png` (`dark:` swap) at `public/data/senapred/img/`. Soft theme wash, **not** the catalog black scrim
- Centered sky title only: rail + H1 «ChileRisk» `text-6xl`–`text-8xl` in `--primary-chile` (white in dark)
- No lockup, CTAs, lede, body or SENAPRED eyebrow on the hero

**Eyebrow + rail** — section openings on editorial pages

- Mono `#0167b7` / `sky-300` + `h-1 w-14` rail (`md:mx-0` when left-aligned)

**Color field** — featured disaster tiles, Familia commitment/step cards, simulacro scenario bands, drill-type agenda cards, `/inicio` doors

- Full field of editorial hex + paired ink on SENAPRED pages; hub doors use **only** `--primary-chile` / `bg-card`
- Never `--alert-*` on a door or SENAPRED field; never a left-rail-only card as the primary grammar

**Date-first card** — simulacro agenda + catalog (non-featured) `GuideCard`

- Date or media column in the type/accent color, title, compact CTA («Detalle» / «Guía»)
- Featured next-drill card uses the same grammar at larger scale, still in the agenda column

**Hub doors** — `/inicio` «Qué hay dentro»

- Bento `gap-2`. On `md+`: Monitor spans the full row as `--primary-chile` / white ink; next three `col-span-2`; last two `col-span-3`. Other five: `bg-muted` + `border-foreground/12` in light (`bg-card` in dark), display title, rail top `h-1` `--primary-chile`
- No alert/SENAPRED scenario hexes, no rounded cards, no Reveal

**Pulse instrument** — `/inicio` «Hoy en el país»

- Two cells on `md+` (`bg-muted/40` band). Each ready cell is a **full color field** in three bands (label / cifra / pie): Alertas uses `ALERT_LEVEL_META` hex + ink; Próximo uses `DRILL_TYPE_COLORS`. Zero alertas uses `--alert-unavailable`
- Skeleton / error stay on `bg-background`. Omit the drill cell when there is no next exercise

**Institutional close** — `/desastres`, `/simulacros`, `/simulacros/[slug]`

- `bg-[var(--primary-chile)] py-16 text-white`
- Optional bordered white/5 panel; primary CTA `bg-white text-[var(--primary-chile)]` that inverts on hover
- `/inicio` uses an account bento instead (chile field + muted tiles). `/preparacion` has **no** close. Kit close is `footer.png` / `footer noche.png` on `bg-background` (PNG center is transparent — **no** `bg-black`) plus a `bg-card` «Ver en SENAPRED» CTA

**Kit tile** — basic kit, extra provisions, car kit

- Equal-height tiles; official icon on `muted`; official sentence below; grids `sm:2` / `lg:3` / `xl:4`

**Guide accent bands** — `/desastres/[tipo]`

- `--guide-accent` / `--guide-accent-ink` / `--guide-tint` on full-width bands
- Reading column `max-w-4xl`; wide `bg` figures as full-bleed siblings at the foot of their band

### 7.3 Page deltas

Only what is unique. Wiring and route status live in [FRONTEND.md](./FRONTEND.md).

**`/`** — Globe + split wordmark + «Entrar a la plataforma» → `/inicio` and «Iniciar sesión» → `/iniciar-sesion`. Landing CTAs may use `normal-case` + `--primary-chile`. TrueRisk attribution in the footer. No navbar, no Mica.

**`/inicio`** — Hero over `hero.png` / `hero noche.png` (centered title only) → pulse instrument «Hoy en el país» → door grid of six destinations → account bento («Crea tu cuenta» chile field + three muted benefit tiles; session: «Ir a cuenta»). No comuna picker, no `composite_score`, no email-send claim.

**`/monitor`** — Full viewport. Alertas + Fecha left (`SURFACE_PANEL_SHELL_CLASS`) in `lg+`; below `lg`, `MapBottomDrawer` is a full-width bottom rail that opens the Alertas / Fecha tabs. `MapControls` bottom-right stays above the rail.

**`/evacuacion`** — Dedicated mapcn map, not `ChileMap`. Satellite default; Calle = OpenFreeMap Liberty/Dark. Left **Puntos** / **Capas** shells (`gap-2`) remain in `lg+`; below `lg`, the shared bottom drawer exposes the same two panels. Custom checkboxes. Routes `#0077ff`. Volcanic hazard on / radii off. KMZ meeting-point icons.

**`/desastres`** — Catalog hero (`catalog/hero.png` + `hero noche.png`) → editorial intro → featured color-field tiles (`GuideCard` `featured`) → remaining + inclusive catalog as date-first cards → institutional close «Ver en SENAPRED». `DisastersSectionNav`: three fixed anchors from `lg` on the same `ScrollRoot`.

**`/desastres/[tipo]`** — Immersive viewport hero (wide 1920×1080 `background` asset, or `--primary-chile` + decorative icon) → accent bands. No leftover numbered-phase chrome.

**`/simulacros`** — Catalog hero → intro + five numbered reason rows (`#0167b7` cells) → «Calendario de ejercicios» (Próximos highlights the first filtered result once as date-first «Próximo ejercicio» and excludes it from monthly groups; Realizados hides it; only published slugs get title link + «Detalle», never «Fuente») → four compact scenario bands (image left, vertically centered copy; colors §5.7) → institutional close. Completed cards drop long summary/comuna copy. Art in `public/data/senapred/img/simulacros/`.

**`/simulacros/[slug]`** — Date-first hero (`min-h-[28rem]`) on `DRILL_TYPE_COLORS` or SENAPRED hotlink image + scrim; schedule inside the date block; badges tipo → región → SAE. Body: lead + comunas, then source-ordered `body_blocks` (single step list with accent rail, `border-l-4` callouts, CTA lists, SAE notice; heading + sole link list may invert as an action band). Close: back to calendar + «Ver en SENAPRED».

**`/preparacion`** — Catalog hero on `Pueblo_001_M.png` + characters. Opening two-column `items-center` on `bg-background`. Four commitment color tiles (`sm:2` / `xl:4`). Library as equal-height `bg-card` links (`sm:2`). Eight steps inset over `Pueblo_002_M.png` in `max-w-3xl` / `max-w-4xl` (leave town visible on `lg+`). Step 7 → kit; step 8 → `/simulacros`. No official-reference close. No family-plan wizard.

**`/preparacion/kit-emergencia`** — Kit hero → opening 48–72 h + «Ver en SENAPRED» → kit tiles (12 official sentences, full-size PNG icons) → family-adaptation note → extra provisions → car kit → footer art + card CTA. Plan item links to `/preparacion`. No persistent checklist.

**`/cuenta`** — `max-w-lg` form, no Mica. States: session Skeleton; signed-out title + CTAs; load error + Cerrar sesión; form (email read-only, name, comuna `<select>` grouped by region, aviso checkboxes with honest “aún no se envían”). Sign-out → `/inicio`.

**Auth** — `(auth)` group, no navbar. `AuthShell`: `min-h-dvh`, `max-w-md`, wordmark → `/`. `AuthField`: ops 10px label + `h-11` input. Errors as `text-destructive` text, not toasts.

**`/asistente`** — `PageStub`: «Próximamente» eyebrow, title, description, CTAs Ir al monitor / Inicio.

**Territory / seismic / Alertas+Fecha** — desktop detail remains `MapPopup` (`md+`) or bottom `Sheet` on mobile. Alertas + Fecha use the 320px operational column in `lg+` and the shared `MapBottomDrawer` with tabs below `lg`. Prefs `stores/ui-store` + `chilerisk-ui-v1`.

---

## 8. Components cookbook

### 8.1 Button

Use shadcn `Button` variants. Layout-only overrides. Landing and institutional-close CTAs may use `bg-[var(--primary-chile)]` or inverted white/`--primary-chile` and `normal-case` when the ops uppercase look is wrong for that surface.

### 8.2 Skeleton

`components/ui/skeleton.tsx` — `animate-pulse bg-muted`. Use for **any** React Query surface that can look empty while `isPending` (date-scoped lists, `/inicio` pulse, `/cuenta` session). Never render EmptyState when `data` is still undefined because of `data ?? []`. See FRONTEND.md § Loading / Skeleton.

### 8.3 CitizenNavbar

Fixed top bar (`h-12`, `SURFACE_PANEL_SHELL_CLASS` + transparency override §3.2). Brand → `/inicio`. Separator between brand and items.

Ítems (`lib/citizen-nav.ts`): Inicio, Monitor, Preparación (exact), **Kit** (`/preparacion/kit-emergencia`, exact), Asistente, Simulacros, Evacuación, Desastres (`section`), Cuenta. Only Desastres matches child routes.

| Viewport | Pattern |
| -------- | ------- |
| `< md` | Hamburguesa → Sheet right (icono+label, tap ≥44px); cierra al navegar |
| `md`–`xl` | Iconos; **label solo en activo**; Tooltip en inactivos |
| `xl+` | Icono + label en todos |

Active: pill `bg-primary` a alto completo; `left`/`width` spring on desktop (`duration: 0` if `prefers-reduced-motion` or in Sheet). Labels ops `text-[10px] uppercase tracking-[1.2px]`; Sheet `text-sm`. Landing `/` and `(auth)` **omit** the navbar. `/cuenta` uses it.

### 8.4 AuthShell / AuthField / PageStub

- `AuthShell` — wordmark + `h1` `text-2xl font-semibold` + optional lede + children.
- `AuthField` — 10px uppercase label, `h-11` bordered input, optional hint. Reused on `/cuenta`.
- `PageStub` — same column as signed-out `/cuenta`; eyebrow «Próximamente».

### 8.5 Hub doors, pulse instrument, institutional close

- Doors: 1px grid; Monitor featured `--primary-chile`; other five `bg-card` + top rail. Chevron on every door.
- Pulse: two full-color instrument cells (alert level / drill type). Static `0` uses unavailable fill; omit the drill cell when empty.
- Close: `--primary-chile` band + invert-on-hover white CTA. Do not add this to `/preparacion` or replace the kit footer.

### 8.6 Color-field tile and date-first card

- Featured disaster / Familia commitment: full accent field, white or documented ink, equal height in the grid.
- Date-first: accent media/date column + title + compact uppercase CTA. Agenda «Próximo ejercicio» is the same card, not a different species.

### 8.7 MapControls / MapPopup

- **Controls:** `ControlGroup` = panel blur classes + Mica; bottom-right on `/monitor` (and evacuación Calle/zoom).
- **Popup:** `bg-popover` + Mica (§3.2). Contained in vendored `components/ui/map.tsx` — change classNames only, not MapLibre logic.

### 8.8 Territory detail + Alertas + Fecha

**Territory (región/comuna):** `TerritoryDetailContent` inside `TerritoryDetailShell` — `MapPopup` (`md+`) or bottom `Sheet` (`<md`). Header badge/color = alerta más grave (`ALERT_LEVEL_META`) o peor GEC si solo Aire. Lista de alertas afectantes; clima + hazard bars. Live vía risk + `MonitorLiveDataProvider` (alerts + air).

**Alertas panel:** `MapAlertsOverlay` → `ActiveAlertsPanel` + `QueryDateControl`; the 320px operational column is `lg+`, while `MapBottomDrawer` owns the `<lg` Alertas / Fecha tabs.

- Cards: rail izquierdo 3px + tint ~12% del nivel + badge (no fill sólido). Aire Chile: mismo patrón, sin expand “Ver detalle”.
- While `isPending` after date change → Skeleton (not EmptyState).
- Shell `SURFACE_PANEL_SHELL_CLASS`; titles `MAP_PANEL_TITLE_CLASS`.
- **Filter chips** (6): Todas · Chile Risk · Senapred · Volcán · Meteo · Aire — controlan lista, coropleta CUT, markers sismo y franjas Meteo. Count pills `rounded-full`.
- Datos: `/alerts/active` + `/air-quality` (+ `/alerts/meteochile/zones` cuando filtro = Meteo). Ver FRONTEND.md § Panel Alertas.

**Fecha panel:** `QueryDateControl` remains under Alertas in `lg+` and becomes the Fecha tab below `lg`. Date picker = styled `Calendar` (DayPicker) in `Popover` — not the native OS dialog. Window 30 days (`lib/query-date.ts`); state in `ui-store`.

**Future legend / controls panels:** same shell + semantic text pattern.

### 8.9 Seismic detail

`SeismicEventShell` + `SeismicEventDetailContent` — same popup/sheet breakpoints as territory. Header accent by magnitude (§5.4); badge `M x.x`; stats + links CSN / intensidades. Markers: pulsing-dot layer; filtered by sismo-related active alerts when source filters apply. Detail: FRONTEND.md § Popup sismo.

### 8.10 MapBottomDrawer

`components/map/map-bottom-drawer.tsx` is the shared operational shell for map controls below `lg`. It preserves the same data, state, callbacks and panel renderers while changing only the responsive chrome.

- Closed: a fixed, full-width `lg:hidden` rail (`min-h-14`) with safe-area padding, a visual handle and a non-interactive summary of tab labels/metas.
- Open: the Base UI/shadcn `Drawer` uses `swipeDirection="down"`, a generated swipe handle, backdrop, `Escape`, close button and `Tabs` with `Alertas` / `Fecha` or `Puntos` / `Capas`. Tabs and close controls are marked for swipe-ignore, and inactive `TabsContent` uses `keepMounted={false}`.
- `MAP_WIDE_MIN_QUERY` is the same `1024px` / `lg` cut used by the desktop columns. The drawer portal is remounted and closed across the breakpoint; `prefers-reduced-motion` removes overlay and popup transitions.

### 8.11 Evacuation map (`/evacuacion`)

Dedicated mapcn map (not `ChileMap`). **Satellite** basemap by default; **Calle** toggle uses OpenFreeMap Liberty/Dark (theme-aware via hotkey `d`) and sits under bottom-right `MapControls` (`items-end` / `w-fit` so zoom stays square). In `lg+`, floating left column has separate **Puntos** / **Capas** shells with `gap-2`; below `lg`, `MapBottomDrawer` exposes those same panels in tabs. Its height is fixed to the available viewport. Panels keep natural height, are capped at half that space, and may shrink as nearby points load; their internal lists scroll, so the Volcán tab cannot extend below the viewport. Capas checkboxes are custom (no native chrome). Feature popup matches territory/seismic chrome (mono header, accent hero, detail rows, full-bleed footer actions; `MapPopup` `md+` / bottom `Sheet` `<md`). Meeting points use **original KMZ icons** (tsunami PE; volcanic PE/PET by `tipo`). Silent auto-locate when geolocation permission is already `granted`; no blocking location modal. Heavy polygons are **PMTiles only**; lines/points stay GeoJSON. Volcanic **hazard zones on** / **radii off** by default. Routes `#0077ff`.

---

## 9. Map-specific rules

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

## 10. Accessibility

- Visible `focus-visible` rings (`ring-ring` / inset on compact controls).
- Mica disabled for `prefers-reduced-motion` and coarse pointers.
- Do not rely on Mica or color alone for severity — keep labels/text. Editorial color fields still need a title or CTA, not color alone.
- Map filter chips, drawer rail/tabs, internal threat tabs, directory/pulse rows, kit/commitment tiles and drawer actions: tap targets ≥44px (`min-h-11` / `min-h-14`) where chrome is touch-first.
- Color-field ink must keep ≥4.5:1 (featured disaster tiles use white).

---

## 11. Motion

| Surface | Motion |
| ------- | ------ |
| Landing | `motion` globe intro + hero/footer fade |
| `/desastres` catalog + guide | `Reveal` `whileInView` on page `ScrollRoot`; `once: true`; static if `useReducedMotion` |
| `/simulacros` reasons | One 520 ms left-to-right scan, 55 ms sibling cadence (`.simulacros-reasons-sequence`); static if reduced motion |
| `/simulacros` scenarios + `/preparacion` steps | `Reveal` horizontal only (`y={0}`) |
| `/inicio`, kit | No `Reveal` |
| App chrome / overlays | CSS `duration-150` / `200` unless a feature needs more (navbar active pill spring) |
| Map fill pulse | MapLibre opacity, not React motion |

No `framer-motion`. No `sonner` without asking. Honor `prefers-reduced-motion` (Mica off; navbar pill `duration: 0`; map pulse off; Reveal/scan static).

---

## 12. Do's and Don'ts

**Do**

- Choose a visual family (§2) before copying another route
- Semantic tokens + Chile accents for brand moments
- Canonical risk / unified alert / air / seismic hexes on ops surfaces
- Editorial hexes from `disaster-visuals` / `simulacros` / `familia-preparada-content` on SENAPRED pages
- Mica via `lib/surface.ts` on elevated ops shells only (respect §3.2 exceptions)
- Spanish routes / English code / Spanish UI ([AGENTS.md](../AGENTS.md))
- Keep FRONTEND.md in sync for monitor data wiring when visuals change

**Don't**

- Paint editorial fields with `--alert-*` or treat `#0167b7` as `--primary-chile`
- Clone the SENAPRED catalog hero (centered title + black scrim, no lockup) onto `/inicio`, `/cuenta` or auth
- Add an institutional `--primary-chile` close to `/preparacion` or a `bg-black` kit footer
- Purple-on-white or cream+terracotta AI-default looks (informativa purple is a **severity** color, not a theme)
- Dark-only glass (`bg-black/60` + `text-white/90`) as the ops system
- Invent severity colors outside `risk-scale` / `alerts-display` / `air-quality-display` / `seismic`
- `rounded-2xl` on map overlays or ops chrome
- Copy `glass-mica` / `GLASS_PANEL_*` legacy patterns
- `framer-motion` / unsolicited `sonner`

---

*Last updated: 2026-08-17*
