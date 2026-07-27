# ChileRisk — UX/UI design system

Reference for layouts, pages, and components in `frontend/`. Read this **before** building or restyling citizen UI, map overlays, or content pages.

**Related:** [AGENTS.md](../AGENTS.md) (índice), [FRONTEND.md](./FRONTEND.md) (componentes), [DOC-MAINTENANCE.md](../../docs/DOC-MAINTENANCE.md), `frontend/.agents/skills/shadcn/SKILL.md` + `rules/` (cuando toques componentes shadcn), `app/globals.css`, `lib/glass-panel.ts`, `lib/citizen-layout.ts` (posición paneles mapa).

---

## 1. Product tone

ChileRisk is a **citizen risk monitor** for Chile: serious, clear, data-forward. The UI should feel like an operations tool, not a marketing landing page.

| Do | Don't |
|----|--------|
| High contrast on dark surfaces | Pastel cards on white for main app flows |
| Short labels, uppercase metadata | Long paragraphs in headers |
| Glass panels over maps / dark bg | Heavy `rounded-2xl` “startup” cards |
| Institutional Chile accents (blue/red) | Random purple gradients |
| Phase language: **Antes · Durante · Después** | Invent new step naming per page |

**Default theme:** `<html class="dark">` in `app/layout.tsx`. Map pages sit on MapLibre; other citizen pages sit on the rotating globe (`GlobePageBackground`). Body `bg-background` remains as fallback while the globe loads.

---

## 2. Surfaces (two families)

### 2.1 Glass surface — primary for map & citizen content

Used for: map popups, floating panels (`MapOverlays`), **Disasters** (`/disasters`), alert lists, query-date control, risk legend.

**Map fill pulse (alerts mode):** Cuando `mapColorMode === "alerts"` y hay alertas activas, el `fill-opacity` de `region-fill` y `comuna-fill` oscila con `requestAnimationFrame`. Período: 1500 ms (roja) → 2000 (naranja) → 2500 (amarilla) → 3000 (preventiva/informativa). Respetar `prefers-reduced-motion: reduce` (no iniciar el loop, dejar opacidad base). Bordes siempre blancos; no oscilan.

**Always import** from `@/lib/glass-panel`:

```ts
import { GLASS_PANEL_CLASS, GLASS_DIVIDER, GLASS_MICA_INTERACTIVE_CLASS } from "@/lib/glass-panel"
```

| Token | Value | Use |
|-------|--------|-----|
| `GLASS_PANEL_CLASS` | `border border-white/10 bg-black/60 shadow-2xl shadow-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-black/50` | Panel/card shell |
| `GLASS_MICA_INTERACTIVE_CLASS` | `glass-mica interactive-mica` | Cursor-following specular highlight (requires `MicaLightProvider` in citizen layout) |
| `GLASS_DIVIDER` | `border-white/10` | Borders between sections (`border-b`, `divide-x`) |

**Corners:** sharp — **no** `rounded-xl` / `rounded-2xl` on glass panels. Map overlays and disasters UI use square edges.

**Text on glass:**

| Role | Classes |
|------|---------|
| Primary | `text-white/90` – `text-white` |
| Body | `text-white/80`, `text-[12.5px]` leading-snug |
| Muted | `text-white/45` – `text-white/55` |
| Meta / labels | `text-[10px] font-semibold uppercase tracking-[1.2px]` |
| Mono stats | `font-mono text-[10px] uppercase tracking-wider tabular-nums` |

**Interactive on glass:**

```txt
hover:bg-white/[0.06] / hover:bg-black/50 / hover:bg-white/[0.08]
focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30
transition-all duration-150/200 (colors + subtle transforms on icons/arrows only)
```

**Micro-interactions (glass citizen pages):** 
- Subtle-to-noticeable lifts (`hover:-translate-y-px` / `-translate-y-[2px]`) and icon scales (`group-hover:scale-[1.2]` / `1.25`) on cards, nav tabs, steps.
- Step items and filter chips get stronger `hover:bg-` + active press scale.
- **Mica cursor light**: All interactive glass surfaces (citizen navbar, disasters heroes/cards/nav/panels, map overlays, popups) use `GLASS_MICA_INTERACTIVE_CLASS` on the panel shell. `MicaLightProvider` in `app/(citizen)/layout.tsx` delegates `mousemove` globally and sets CSS vars `--mx` / `--my`. Soft radial white highlight (Windows Mica-inspired). Low opacity, screen blend. CSS in `app/globals.css`; coords helpers in `lib/use-mica-light.ts`. `MAP_PANEL_SHELL_CLASS` and `DISASTERS_NAV_LINK_CLASS` include Mica by default.
- All via CSS `transition-all duration-150/200`. No stagger, no motion lib on glass (per §10). Landing hero is the only place for `motion`. Respect `prefers-reduced-motion`.

**Inputs on glass:**

```txt
border border-white/10 bg-white/[0.04] text-white/90 placeholder:text-white/40
h-9 (compact) or h-10
```

### 2.2 Shadcn / semantic surface — forms, controls & sparse pages

Used for: `Button` (with `asChild`), `Tooltip`, `Calendar` + `Popover`, `Tabs`, dashboard verification tables, and complex interactive primitives. Navbar chrome uses glass (§7.7); active link state uses `primary` token.

- Tokens: `bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `primary`, `destructive`.
- **Customized primitives** (see `components/ui/`):
  - `button.tsx`: **sharp** (`rounded-none`), uppercase, `tracking-widest`, `text-xs`, data-slot/data-variant attrs, cva variants. Our Button deviates from shadcn defaults to match the operations aesthetic — use `variant` + minimal `className` (prefer layout only: `h-*`, `w-*`, `gap-*`, `justify-*`).
  - `card.tsx`: sharp edges, uppercase `CardTitle`, full composition expected (`CardHeader`/`CardTitle`/`CardContent`/`CardFooter`).
- **Hybrid rule**: Glass (`GLASS_PANEL_CLASS` + `lib/map-panel-styles.ts`) is primary for citizen-facing map overlays, disasters catalog/detail, alert panels, and popups. Use shadcn components/tokens when you need Radix primitives (date picking, tabs, tooltips, asChild composition) or on semantic/dashboard surfaces.
- When using any shadcn component (even inside glass wrappers or with heavy glass overrides for look):
  - Follow the critical rules in `frontend/.agents/skills/shadcn/rules/` (no `space-x/y-*` — use `flex` + `gap-*`; `cn()` for conditional/layout only; semantic tokens & built-in variants before raw colors/overrides; `data-icon="inline-start|inline-end"` + **no** `size-*` on icons inside `Button`/`TabsTrigger`/etc.; full `Card` composition; `TabsTrigger` always inside `TabsList`, etc.).
  - Prefer `npx shadcn@latest add <component>` (run from `frontend/`) over hand-rolled markup for new controls. Review added files.
- Prefer glass for **new citizen-facing content pages**; shadcn for forms, verification UIs, or when the primitive (Calendar, Popover, Tabs, Dialog primitives) provides real value.
- Map mobile: persistent `MapMobileBottomSheet` (custom portal, not vaul Drawer modal).

---

## 3. Color

### 3.1 CSS variables (`app/globals.css`)

| Token | Role |
|-------|------|
| `--primary-chile` `#0032A0` | Institutional blue — heroes, badges, links |
| `--secondary-chile` `#DA291C` | Alert accent (also map earthquake markers) |
| `--primary` | UI primary (oklch blue) — navbar active state |
| `--destructive` | Errors, critical emphasis |

Use Chile tokens for **brand moments** (page heroes, SENAPRED-adjacent content):

```txt
from-[var(--primary-chile)]/55 via-red-950/70 to-[var(--secondary-chile)]/45
```

### 3.2 Map risk choropleth

Do **not** invent new risk colors. Use `MAP_RISK_BUCKETS` from `lib/risk-scale.ts` (synced with MapLibre `fill-color` in `map-config.ts`).

### 3.3 Per-disaster tint (`data/disasters.ts`)

Each disaster has `color: "from-…/20 to-…/20"` (Tailwind gradient stops).

| Context | How to apply |
|---------|----------------|
| Catalog card header | `bg-gradient-to-br` + `desastre.color` on top band |
| Detail hero | Full-area gradient + `from-black/90` overlay for readability |
| Detail phase nav | `bg-gradient-to-r` + `desastre.color` under `bg-black/50` |
| Phase panel header | `bg-gradient-to-r` + `desastre.color` at ~80% opacity + `bg-black/55` overlay |

**Rule:** catalog and detail must feel like the **same** disaster — reuse the same `desastre.color`, not generic gray glass only.

**Catalog & cards:** Use `GLASS_PANEL_CLASS` + color band header (icon + category). Cards show title, description (line-clamp), and meta "Antes · Durante · Después" + total step count. Grid `gap-3` (sm:2, lg:3 cols).

**Detail phases:** Fixed 3-phase nav (sticky glass, observer-driven active + progress bar tinted by disaster color). Each `DisasterPhasePanel` uses left border accent + header with color gradient overlay + numbered step grid (priority "durante" first item gets amber treatment per §3.4). Related disasters: compact glass cards reusing color band + step count.

### 3.4 Phase semantics (fixed)

Used across disasters detail UI:

| Phase | Border accent | Icon tint |
|-------|----------------|-----------|
| Antes | `border-l-blue-500` | `text-blue-400` |
| Durante | `border-l-amber-500` | `text-amber-400` |
| Después | `border-l-emerald-500` | `text-emerald-400` |

Left border: `border-l-[3px]` (same pattern as `ActiveAlertCard` in `alert-ui.tsx`).

### 3.5 Alert badges (`lib/alerts-display.ts`)

```txt
inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5
text-[9px] font-semibold uppercase tracking-wider
```

Severity dot: `size-1.5 rounded-full` + hex from meta + subtle glow `box-shadow: 0 0 6px ${hex}99`.

---

## 4. Typography

| Font | Variable | Usage |
|------|----------|--------|
| Inter | `--font-sans` | Everything (body + heading) |

| Pattern | Classes |
|---------|---------|
| Page title (glass) | `text-2xl font-semibold tracking-tight text-white sm:text-3xl` – `text-5xl` for heroes |
| Section label | `text-[11px] font-semibold uppercase tracking-[1.2px] text-white/90` |
| Dashboard title | `text-3xl font-semibold tracking-tight` + `text-muted-foreground` subtitle |
| Card title (shadcn) | `font-heading text-lg font-semibold tracking-wider uppercase` |

**Icons:** `lucide-react` only. Sizes: `size-3` – `size-4` in dense UI; `size-5` – `size-7` in heroes.

---

## 5. Layout & spacing

### 5.1 Citizen pages (non-map)

**Background:** `GlobePageBackground` in `app/(citizen)/layout.tsx` — fixed `RotatingEarth` (`skipIntro` + `autoRotate`), hidden on `/monitor` and `/evacuation`. Page shells are **transparent** (`min-h-screen`, no `bg-background`) so the globe shows through. Light veil `bg-black/30` over the globe for contrast.

```txt
min-h-screen                    ← shell (transparent; globe from layout)
mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8   ← catalog / preparation
mx-auto max-w-6xl …                             ← disaster detail (wider for 2-col steps)
```

`py-24` clears the floating **`CitizenNavbar`** (`fixed top-4`, `z-50`).

**Surfaces over the globe:** content panels use the **same glass** as map overlays (`GLASS_PANEL_CLASS` + `GLASS_MICA_INTERACTIVE_CLASS` from `lib/glass-panel.ts` — reference: `/monitor` / `/evacuation` panels). **Page heroes** are the exception: brand gradient + `border border-white/10`, **no** glass/blur (`CitizenPageHero` / `PREPARATION_HERO_SHELL_CLASS`).

### 5.2 Page width

| Page type | Max width |
|-----------|-----------|
| Catalog / list | `max-w-7xl` |
| Detail with grids | `max-w-6xl` |
| Home `/dashboard` | `max-w-7xl` |

Avoid narrow headers (`max-w-2xl`) on full-width catalog pages — hero should span content width.

### 5.3 Grids

| Content | Layout |
|---------|--------|
| Disaster cards | `grid gap-3 sm:grid-cols-2 lg:grid-cols-3` |
| Phase steps | `grid grid-cols-1 sm:grid-cols-2 gap-2` inside panel |
| Phase nav (detail) | `grid grid-cols-3 divide-x` — equal columns, min height ~5.5rem |
| Stats row | `grid grid-cols-3 gap-2` – `gap-3` |

### 5.4 Sticky subnav

Detail phase tabs: `sticky top-20 z-10`, `scroll-mt-32` on phase sections.

### 5.5 Preparation section

Citizen preparation flows (`/preparation`, kit, Plan Familia, `/drills`) share tokens in `lib/preparation-ui.ts`:

| Token | Use |
|-------|-----|
| `PREPARATION_PAGE_SHELL_CLASS` / `PREPARATION_PAGE_INNER_CLASS` | Transparent shell + `py-24` / `max-w-7xl` / `gap-4–5` (globe from layout) |
| `PREPARATION_STICKY_SUBNAV_CLASS` | Step nav / filters under navbar (`top-20`) |
| `PREPARATION_HERO_SHELL_CLASS` | Brand hero shell — **no** glass/blur |
| `preparationSavePillClass` | Autosave status pill on wizard |

Cross-flow banners (kit ↔ plan, simulacros ↔ plan): `PreparationContextBanner`. Breadcrumbs: `PreparationBreadcrumb`. Forms: `FamilyPlanField` (`gap-2`, optional `icon` / helper) + `FamilyPlanSection` (divider under title).

**Step content layout** (`components/preparation/family-plan/family-plan-layout.tsx`): every wizard step body uses the same rhythm — `FamilyPlanStepRoot` (`gap-4`); optional `FamilyPlanStatusBanner`; category lists via `FamilyPlanCategoryShell` (accent `border-l-[3px]`); editable items via `FamilyPlanItemCard`; forms via `FamilyPlanFormGrid` (`grid gap-3 sm:grid-cols-2`, full-width with `FAMILY_PLAN_FORM_FULL_CLASS`); empty/add via `FamilyPlanEmptyState` / `FamilyPlanAddPanel` + CTA `w-full sm:w-fit`; status via `FamilyPlanStatusChip`. Canonical form breakpoint is **`sm:`** only (no `md`/`lg` in step forms). Floor-map keeps its canvas chrome; only outer root uses `StepRoot`.

Mobile wizard chrome: sticky compact step nav below `lg` (`top-20`) + sticky footer with prev/next; hide footer on input focus when needed. From `lg` up: equal-width step tabs (all visible, titles truncate) + single global progress bar. Desktop step row is not sticky so it does not cover the step title.

### 5.6 Modo Emergencia

When `useEmergencyMode` detects alerta naranja/roja, `EmergencyModeHost` runs three phases: **takeover SAE** (first activation) → **banner** (persistent) → **chip reabrible** (after dismiss). Severity visuals live in **`lib/emergency-ui.ts`** (`EMERGENCY_VISUALS`, `emergencyVisual()`, CTA classes) — roja pulses faster and stronger than naranja.

**Targeting** (`matchEmergencyAlert`, pure + tested): an alert fires if it applies to the **home comuna** (region from `useComunaRisk(homeCode)` — same source as the Mi comuna card) **or** the GPS location (`useNearestComuna`). Display fields (`comunaName` etc.) come from the matched target; geo wins when the winning alert also applies there. Do not reintroduce a single geo-first/home-first resolution — the mismatch with `useComunaToday` (home-first) silently disabled emergency mode when GPS differed from home.

1. **`EmergencyTakeover`** (`z-[85]`, SAE-style full-screen, once per alert per session — ack in `sessionStorage` `chilerisk:emergency-ack:<id>`):
   - Saturated gradient background (`from-red-700 via-red-900` roja / `from-orange-600 via-orange-800` naranja) + animated hazard stripes top/bottom + concentric expanding rings behind a ringing `BellRing` icon
   - Giant title `Alerta {Roja|Naranja}` (`text-5xl sm:text-7xl font-black uppercase`), hazard label, `getActiveAlertMainText(alert)`
   - CTAs: ¿Qué hago? (solid white) / Evacuar ahora (outline, only tsunami/volcanic) / Entendido (collapses)
   - Auto-collapses to banner after 12s (visible countdown bar); Escape or any CTA also collapses. Focus goes to the primary CTA; `role="alertdialog"`.
2. **`EmergencyBanner`** (`z-40`, under navbar):
   - Animated caution-tape stripe bar on top (`.emergency-stripe-bar`), saturated background (`from-red-700/95 to-red-950/95` — **not** near-black), entrance slide-down + flash (`.emergency-banner-enter`)
   - Title `text-xl sm:text-2xl font-black uppercase` + "• ACTIVA · hace Xm" chip with live dot (30s tick via `useNowTick`)
   - Body: `getActiveAlertMainText(alert)`; optional detail from `content`/`risk_detail` — if HTML, **`sanitizeAlertHtml`** + `.alert-html-content`; else plain text via **`htmlToPlainText`**
   - CTAs: ¿Qué hago? (solid white, primary) / Evacuar (outline, only when `evacuationHazard` is tsunami/volcanic) / Compartir (ghost); X **minimizes** to the reopen chip (not a full hide)
3. **`EmergencyReopenChip`** (`z-40`, under navbar): pulsing pill `ALERTA {nivel} — {comuna}`; click calls `reactivate()` (undoes dismiss — clears `sessionStorage` + state in `useEmergencyMode`). The host keeps rendering while dismissed (`active` excludes dismissed — early-return must check `alert`/`isResolving`, not `active`).
4. **`EmergencyPageFrame`** (`z-30`, `pointer-events-none`): elliptical vignette via a single `radial-gradient` (`.emergency-page-frame` in `globals.css`) + opacity pulse (0.55–0.95). Color + period from `emergencyVisual()` via CSS vars `--emergency-frame-color` / `--emergency-frame-period` (roja 1.4s, naranja 2.2s). With `calm` (banner minimized): static + dimmer (`.emergency-page-frame--calm`). Static under `prefers-reduced-motion`. Do **not** stack four edge linear-gradients (corner seams).

**¿Qué hago?** minimizes the alert to the reopen chip (`dismiss()`) and navigates to **`/assistant?q=<prompt>`** (`emergencyAssistantPath()` in `lib/emergency-ui.ts`) — `AssistantChat` auto-sends `?q=` once on mount (ref guard + `history.replaceState` cleans the URL). No guide sheet: the assistant answers in-context with geo + thread history, and the banner never covers the chat.

Do **not** change global `CITIZEN_NAVBAR_CLEARANCE_PX` when the banner is absent.

Share uses **`EmergencySheet`** (fixed `createPortal` bottom sheet at `z-[90]`, opaque `bg-neutral-950`) — not vaul Drawer — so the panel always paints above navbar / takeover / vignette.

**Share card** (`EmergencyShareCard`): the sheet previews a saturated alert card (severity gradient + caution stripes + giant `ALERTA {nivel}` + alert text + emerald "Estoy seguro/a" status band + `chilerisk.cl` footer). Capture follows the Mi comuna pattern (`comuna-today-share-bar.tsx`): `toPng(cardRef, { pixelRatio: 2 })` → `File` → `navigator.share({ files })` when `canShare`, else PNG download; enriched caption text (`ALERTA {nivel} — {hazard} en {comuna}. Estoy seguro/a · …`) also ships in the share payload and via "Copiar texto".

---

## 6. Z-index stack

| Layer | z-index |
|-------|---------|
| MapLibre base | default |
| Map popups | ~20 |
| Floating map panels / glass overlays | `z-20` |
| Map navigation control (zoom/compass) | `z-20` (same glass stack) |
| Map mobile bottom sheet | `z-70` (portal) |
| Citizen navbar | `z-50` |
| Emergency takeover SAE (Modo Emergencia) | `z-[85]` (sobre navbar, bajo `EmergencySheet`) |
| Emergency banner / reopen chip (Modo Emergencia) | `z-40` (bajo navbar, sobre contenido) |
| Emergency page frame (bordes) | `z-30` (`pointer-events-none`) |
| Drawers (vaul map / misc sheets) | overlay `z-[70]`, content `z-[80]` |
| Emergency share sheet | `z-[90]` (`EmergencySheet` portal) |

Floating map UI (`md+`): `position: fixed`, columns under navbar. Draggable panels: `useDraggablePanel` only. Map zoom/compass: `MapNavigationControl` (React glass — not native MapLibre `NavigationControl`).

**Mobile map chrome (`<md`):** hide floating columns; persistent `MapMobileBottomSheet` (handle + status strip + tabs) portaled to `document.body`. Collapsed = mapa usable; expanded = contenido de la tab + scrim ligero, con transición `grid-template-rows` (~320ms). Monitor tabs: Alertas \| Fecha \| Vistas (sin Controles). Evacuation: Puntos \| Capas; sheet oculto mientras el location prompt está activo. Panel prop `embedded` strips shell/drag handle **y el título del panel** (el tab ya lo nombra).

---

## 7. Components cookbook

### 7.1 Hero (`CitizenPageHero`)

Shared shell for citizen content pages (navbar routes except full-bleed maps):

```tsx
import {
  CitizenPageHero,
  HeroStatBox,
} from "@/components/layout/citizen-page-hero"

<CitizenPageHero
  gradientClass="bg-gradient-to-br from-[var(--primary-chile)]/55 …"
  watermark={<Icon className="absolute …" />}
  title="…"
  description="…"
  stats={<dl className="grid …"><HeroStatBox … /></dl>}
  footer={/* optional phase / type strip */}
/>
```

- Shell: `PREPARATION_HERO_SHELL_CLASS` (no glass/blur).
- Title row uses a shared `min-h` so catalog heroes align across routes.
- No category/eyebrow chip above the title — title starts the leading column.
- Variable content (e.g. next-drill countdown) lives **under** the hero, not inside it.

Reference: `components/layout/citizen-page-hero.tsx`; composers in `preparation-page-hero`, `disasters-page-hero`, `simulacros-page-hero`, `emergency-kit-hero`, `disaster-detail-hero`, `dashboard-page-hero` (home `/dashboard`).

### 7.2 Stat box (glass)

```tsx
<div className="border border-white/20 bg-black/35 px-4 py-4 text-center backdrop-blur-sm">
  <dt className="text-[10px] uppercase … text-white/55">Label</dt>
  <dd className="font-mono text-2xl font-semibold text-white">42</dd>
</div>
```

### 7.3 Filter chips (glass toolbar)

Full-width segment or wrap row; active: `border-white/20 bg-white/15 text-white`. Inactive: `text-white/50 hover:bg-white/[0.06]`.

### 7.4 Disaster card (catalog)

`GLASS_PANEL_CLASS` + top band `bg-gradient-to-br` + `desastre.color` + body with uppercase title. Link: `/disasters/[slug]`.

### 7.5 Phase panel

`GLASS_PANEL_CLASS` + `border-l-[3px]` + tinted header + **2-column** step grid with bordered cells `border-white/10 bg-white/[0.03]`.

### 7.6 Buttons on glass

Prefer native `<button>` / `<Link>` with glass styles (see SENAPRED link in disasters page). Use shadcn `Button` when on semantic surfaces (dashboard) or need `asChild`.

### 7.7 Navbar (`CitizenNavbar`)

Import from `@/lib/glass-panel`:

```ts
import { CITIZEN_NAVBAR_SHELL_CLASS, CITIZEN_NAVBAR_LINK_CLASS } from "@/lib/glass-panel"
```

- Position: `fixed top-4 left-1/2 z-50 -translate-x-1/2`
- Shell: `CITIZEN_NAVBAR_SHELL_CLASS` (`GLASS_PANEL_CLASS` + `GLASS_MICA_INTERACTIVE_CLASS`, sharp edges)
- Links: `CITIZEN_NAVBAR_LINK_CLASS` + `text-[10px] uppercase tracking-[1.2px]`
- Active route: `bg-primary text-primary-foreground`
- Inactive: `text-white/55 hover:bg-white/[0.06] hover:text-white/90`
- Section routes (e.g. `/disasters`): `pathname.startsWith(href)`
- Focus: `focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30`
- Overflow: horizontal drag/scroll (pointer: mouse click-drag + touch) when items exceed `max-w-[calc(100vw-2rem)]`; scrollbar hidden; edge fades (`from-black/75`) when more content exists left/right; drag past threshold suppresses link navigation; active link scrolls into view on route change.

### 7.8 shadcn components & CLI (cuando aplique)

- Añade componentes con `cd frontend && npx shadcn@latest add button card ...` (o el que necesites). Nunca edites a mano desde node_modules.
- Después de añadir: revisa el archivo generado, corrige imports si hace falta, reemplaza iconos por `lucide-react` (nuestro `iconLibrary`), y verifica que respeta las reglas de `rules/styling.md` / `composition.md`.
- En zonas glass: solo usa shadcn cuando el primitivo justifica (ej. `Calendar`+`Popover` para fecha, `Tabs`). El resto usa las constantes glass + markup controlado + `cn()`.
- Overrides de `className` en Button/Card/etc. deben limitarse a layout/posición. Colores y tipografía van por variants o tokens (o las glass constants cuando el look lo requiere).
- Ver también `frontend/.agents/skills/shadcn/SKILL.md` (contexto del proyecto, presets `radix-sera`, aliases, etc.).

---

## 8. Map-specific rules

- Popups: `MAP_POPUP_GLASS_CLASS` === `GLASS_PANEL_CLASS` (re-export in `map-popup.tsx`).
- Panel headers: `text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75`.
- Collapse chevrons: `size-3.5`, rotate when collapsed.
- Empty states: centered, `text-[12px]`, icon `size-6` `text-emerald-400/70` or `text-[#DA291C]/80` for errors.
- Drag handle: not a `<button>`; control buttons `stopPropagation` on `onPointerDown`.

---

## 9. Accessibility

- WCAG 2.2 AA target.
- All glass controls: visible `focus-visible` ring (white/30 inset on glass, `ring-ring` on shadcn).
- `aria-label` on icon-only buttons and map `role="application"`.
- Search inputs: `aria-label` in Spanish.
- Phase nav: `aria-label="Fases de preparación"`; tabs `role="tablist"` / `role="tab"`.
- Don’t rely on color alone — pair severity/color with text labels.

---

## 10. Motion

- Package: `motion` (not `framer-motion`) — landing hero only unless user asks.
- Glass UI: CSS `transition-colors` only; no gratuitous stagger animations.
- Map: respect `prefers-reduced-motion` for pulsing earthquake markers (existing CSS).

---

## 11. File placement

| UI area | Location |
|---------|----------|
| Disasters feature | `components/disasters/*`, `data/disasters.ts`, `lib/disasters-visual.ts` |
| Map overlays | `components/map/*` |
| Shared glass constant | `lib/glass-panel.ts`, `components/mica-light-provider.tsx` |
| Preparation UI tokens | `lib/preparation-ui.ts`, `components/preparation/*` |
| Alert presentation | `components/map/alert-ui.tsx`, `lib/alerts-display.ts` |

---

## 12. Pre-ship checklist (UI)

- [ ] Glass panels use `GLASS_PANEL_CLASS` (not ad-hoc `bg-card rounded-xl`).
- [ ] Interactive glass shells include `GLASS_MICA_INTERACTIVE_CLASS` (or inherit via `MAP_PANEL_SHELL_CLASS` / `DISASTERS_NAV_LINK_CLASS`).
- [ ] Text on dark glass uses white opacity scale (not `text-muted-foreground` on glass).
- [ ] Citizen page has top padding for navbar.
- [ ] Disaster detail uses `desastre.color` in hero + nav + phase headers.
- [ ] Phase nav uses full width (3 columns) on detail.
- [ ] Dense lists use 2-column grid where there are 4+ items.
- [ ] Focus states work keyboard-only.
- [ ] External SENAPRED links keep official URL; label can say “SENAPRED”.
- [ ] Si usas componentes de `components/ui/` (shadcn): se respetan las critical rules (`frontend/.agents/skills/shadcn/rules/*`): sin `space-y/x-*`, `data-icon` en íconos dentro de Button/etc., `cn()` solo layout, variants primero, sin overrides de color/tipografía en className.
- [ ] No se introdujeron nuevos componentes shadcn sin pasar por `npx shadcn@latest add` + revisión.

---

**Last updated:** 2026-07-26 — Modo Emergencia de alto impacto (takeover SAE + banner saturado + chip reabrible + `lib/emergency-ui.ts`); Mi comuna embebida en `/dashboard`.