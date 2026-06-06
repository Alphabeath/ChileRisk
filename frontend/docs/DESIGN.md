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

**Default theme:** `<html class="dark">` in `app/layout.tsx`. Citizen pages assume dark background (`bg-background` ≈ near-black).

---

## 2. Surfaces (two families)

### 2.1 Glass surface — primary for map & citizen content

Used for: map popups, floating panels (`MapOverlays`), **Disasters** (`/disasters`), alert lists, query-date control, risk legend.

**Always import** from `@/lib/glass-panel`:

```ts
import { GLASS_PANEL_CLASS, GLASS_DIVIDER } from "@/lib/glass-panel"
```

| Token | Value | Use |
|-------|--------|-----|
| `GLASS_PANEL_CLASS` | `border border-white/10 bg-black/60 shadow-2xl shadow-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-black/50` | Panel/card shell |
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
hover:bg-white/[0.06]
focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30
```

**Inputs on glass:**

```txt
border border-white/10 bg-white/[0.04] text-white/90 placeholder:text-white/40
h-9 (compact) or h-10
```

### 2.2 Shadcn / semantic surface — forms, controls & sparse pages

Used for: `Button` (with `asChild`), `Tooltip`, `Calendar` + `Popover`, `Tabs`, dashboard verification tables, navbar chrome, and complex interactive primitives.

- Tokens: `bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `primary`, `destructive`.
- **Customized primitives** (see `components/ui/`):
  - `button.tsx`: **sharp** (`rounded-none`), uppercase, `tracking-widest`, `text-xs`, data-slot/data-variant attrs, cva variants. Our Button deviates from shadcn defaults to match the operations aesthetic — use `variant` + minimal `className` (prefer layout only: `h-*`, `w-*`, `gap-*`, `justify-*`).
  - `card.tsx`: sharp edges, uppercase `CardTitle`, full composition expected (`CardHeader`/`CardTitle`/`CardContent`/`CardFooter`).
- **Hybrid rule**: Glass (`GLASS_PANEL_CLASS` + `lib/map-panel-styles.ts`) is primary for citizen-facing map overlays, disasters catalog/detail, alert panels, and popups. Use shadcn components/tokens when you need Radix primitives (date picking, tabs, tooltips, asChild composition) or on semantic/dashboard surfaces.
- When using any shadcn component (even inside glass wrappers or with heavy glass overrides for look):
  - Follow the critical rules in `frontend/.agents/skills/shadcn/rules/` (no `space-x/y-*` — use `flex` + `gap-*`; `cn()` for conditional/layout only; semantic tokens & built-in variants before raw colors/overrides; `data-icon="inline-start|inline-end"` + **no** `size-*` on icons inside `Button`/`TabsTrigger`/etc.; full `Card` composition; `TabsTrigger` always inside `TabsList`, etc.).
  - Prefer `npx shadcn@latest add <component>` (run from `frontend/`) over hand-rolled markup for new controls. Review added files.
- Prefer glass for **new citizen-facing content pages**; shadcn for forms, verification UIs, or when the primitive (Calendar, Popover, Tabs, Dialog primitives) provides real value.

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

```txt
min-h-screen bg-background
mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8   ← catalog
mx-auto max-w-6xl …                             ← disaster detail (wider for 2-col steps)
```

`py-24` clears the floating **`CitizenNavbar`** (`fixed top-4`, `z-50`).

### 5.2 Page width

| Page type | Max width |
|-----------|-----------|
| Catalog / list | `max-w-7xl` |
| Detail with grids | `max-w-6xl` |
| Dashboard debug | `max-w-7xl` |

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

---

## 6. Z-index stack

| Layer | z-index |
|-------|---------|
| MapLibre base | default |
| Map popups | ~20 |
| Floating map panels / glass overlays | `z-20` |
| Citizen navbar | `z-50` |

Floating map UI: `position: fixed`, initial position `top-20 left-4` (clear navbar). Draggable panels: `useDraggablePanel` only.

---

## 7. Components cookbook

### 7.1 Hero (glass + brand or disaster color)

```tsx
<header className={cn(GLASS_PANEL_CLASS, "relative overflow-hidden")}>
  <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/25" />
  <WatermarkIcon className="absolute … text-white/[0.07]" />
  <div className="relative p-5 sm:p-8">…</div>
</header>
```

Reference: `components/disasters/disasters-page-hero.tsx`, disaster detail header in `app/(citizen)/disasters/[tipo]/page.tsx`.

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

- Floating pill: `border bg-background/80 backdrop-blur-xl`
- Active route: `bg-primary text-primary-foreground`
- Section routes (e.g. `/disasters`): `pathname.startsWith(href)`

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
| Shared glass constant | `lib/glass-panel.ts` |
| Alert presentation | `components/map/alert-ui.tsx`, `lib/alerts-display.ts` |

---

## 12. Pre-ship checklist (UI)

- [ ] Glass panels use `GLASS_PANEL_CLASS` (not ad-hoc `bg-card rounded-xl`).
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

**Last updated:** 2026-06-06 — disasters catalog + detail redesign (total steps in hero/cards, refined related mini-cards, step counts, glass meta headers), new patterns documented in §3.3, respects all glass/phase/color rules.