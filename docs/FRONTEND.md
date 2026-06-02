# FRONTEND.md — Component API Reference

## Map Components

### `<ChileMap />`

**Path**: `frontend/components/map/chile-map.tsx`

Interactive map of Chile's 16 regions and 346 comunas using MapLibre GL with dark theme (Carto Dark Matter).

**Props**: None (self-contained component)

**Features**:
- Loads GeoJSON from local `frontend/data/` (served via `/data/`)
- Regions visible at all zoom levels
- All 16 region labels use exact names from local GeoJSON "Region" field (proper Spanish); base map place_state layer is hidden
- Comunas loaded from single file when zoom ≥ 7
- Comunas automatically hide when zoom < 7
- Hover: highlights region/comuna with lighter fill and thicker border
- Click region: popup with name, risk scores + "Ver comunas" button; clicking zooms map to the region (ensuring zoom ≥7) to reveal its comunas
- Click comuna: popup with name, province, region, risk scores + seismic impact if any (no action button)
- High-intensity recent earthquakes (M ≥ 4.5, last 24h from backend): shown as classic pulsing epicenter markers ("punto con ondas que parpadea") with size/color scaled by magnitude (Chile red for strongest). Click centers + shows quick details popup.
- Only one popup visible at a time (last click wins)
- Foreign labels (countries, islands, cities, towns, villages, POIs) hidden from base map

**Data sources**:
- Regions: `/data/regional.geojson` (source: `frontend/data/regional.geojson`)
- Comunas: `/data/comunas.geojson` (source: `frontend/data/comunas.geojson`)

**Region GeoJSON properties**:
| Property | Type | Description |
|---|---|---|
| `codregion` | `number` | Official Chilean region code (1–16) |
| `Region` | `string` | Full region name in Spanish |
| `area_km` | `number` | Area in square kilometers |

**Comuna GeoJSON properties**:
| Property | Type | Description |
|---|---|---|
| `cod_comuna` | `number` | Unique comuna code |
| `Comuna` | `string` | Comuna name |
| `Provincia` | `string` | Province name |
| `Region` | `string` | Full region name |
| `codregion` | `number` | Region code (1–16) |

**Usage**:
```tsx
import { ChileMap } from "@/components/map/chile-map"

export default function MapPage() {
  return (
    <div className="h-[calc(100vh-3.25rem)]">
      <ChileMap />
    </div>
  )
}
```

**Accessibility**: `role="application"` with `aria-label="Mapa interactivo de regiones y comunas de Chile"`

### `map-config.ts`

**Path**: `frontend/components/map/map-config.ts`

Constants, types, and helpers for the Chile map component.

**Exports**:
| Export | Type | Description |
|---|---|---|
| `REGIONS_DATA_URL` | `string` | Local path `/data/regional.geojson` for regions |
| `COMUNAS_DATA_URL` | `string` | Local path `/data/comunas.geojson` for all comunas |
| `MAP_STYLE` | `string` | Carto Dark Matter style URL |
| `CHILE_BOUNDS` | `[number, number, number, number]` | Bounding box for Chile |
| `COMUNAS_MIN_ZOOM` | `number` | Min zoom to show comunas (7) |
| `hideForeignLabels(map)` | `function` | Hides countries, islands, cities, towns, villages, states, POIs |

### `map-popup.tsx`

**Path**: `frontend/components/map/map-popup.tsx`

Dedicated React components for map popups. Content is rendered with React and mounted into MapLibre `Popup` instances using `setDOMContent` + `createRoot`. Shares the **SenapredAlertsPanel visual language**: sharp corners, dark glass (`oklch(0 0 0 / 0.6)` + `blur(20px)` in `.cr-popup`), `text-white/X` muted scale, and glowing-dot severity badges.

**Exports**:

| Export | Description |
|---|---|
| `RegionPopupContent({ properties, onViewDetail? })` | Renders region info + hazards + "Ver comunas" action button that triggers map zoom |
| `ComunaPopupContent({ properties, onViewDetail? })` | Renders comuna info + hazards + optional seismic; no action button |
| `createPopupContent(reactNode)` | Returns `{ element, destroy }` for safe mounting/unmounting of React content inside a `maplibregl.Popup` |

**Visual structure** (`PopupShell`):
- 3px top accent bar in the severity color (`getRiskAccent` from `SEVERITY_META`)
- Header row:
  - Title (`text-[13px] font-semibold text-white`)
  - Parent (region for comunas) prefixed with `<MapPin>` icon (`text-white/55`)
  - Subtitle row: severity badge + dominant hazard icon
  - Right side: `RIESGO` label in `font-mono uppercase tracking-[1.4px]` above a 22px tabular-nums composite score
- Body (children): `HazardScores` + `WeatherRow` + (comunas only) seismic impact inset
- Footer: flat sharp-cornered "Ver detalle / Ver comunas" button (`border border-white/10 bg-white/[0.04]`, `hover:bg-white/[0.08]`, mono uppercase tracking-wider)

**Sub-components** (file-local):
- `SeverityBadge({ severity })` — `rounded-sm` tag with glowing dot in severity color + uppercase label. Pulls from `SEVERITY_META` (single source of truth, also used by `getRiskAccent` and `HazardRow`).
- `HazardRow({ label, score, Icon })` — sharp bar (no rounded), severity-colored fill via `style.backgroundColor`, label in mono uppercase tracking-wider, score in tabular-nums.
- `WeatherCell({ Icon, value, label, accent })` — sharp-cornered stat with 2px left border, mono uppercase tracking-wider label.

**Color tokens** (`SEVERITY_META`):
| Severity | hex | Tailwind badge |
|---|---|---|
| `critico` | `#DA291C` | `bg-[#DA291C]/15 text-[#ff9a9a] border-[#DA291C]/45` |
| `alto` | `#e07020` | `bg-orange-500/10 text-orange-300 border-orange-400/40` |
| `moderado` | `#cc9e23` | `bg-amber-500/10 text-amber-300 border-amber-400/40` |
| `bajo` | `#15803d` | `bg-emerald-500/10 text-emerald-300 border-emerald-400/40` |

**CSS** (`.cr-popup` in `app/globals.css`):
- `background: oklch(0 0 0 / 0.6)` + `backdrop-filter: blur(20px) saturate(1.1)`
- `border-radius: 0` (sharp corners)
- `border: 1px solid oklch(1 0 0 / 0.09)` + inset top highlight
- Tip color `oklch(0 0 0 / 0.72)` per anchor direction

**Usage in map** (internal):
```tsx
const { element, destroy } = createPopupContent(
  <RegionPopupContent properties={props} onViewDetail={() => { popup.remove(); /* zoom logic */ }} />
)
popup.setDOMContent(element).addTo(map)
popup.on("close", destroy)
```

**Accessibility**: Uses semantic headings, native `<button type="button">`, focus-visible rings on actions.

### `<SenapredAlertsPanel />`

**Path**: `frontend/components/map/senapred-alerts-panel.tsx`

Floating top-left panel on the map view that lists the active SERNAPRED alerts synced by the backend. Collapsible and **draggable** to any position on the screen. Sorted by severity (roja → naranja → amarilla → preventiva) then by `issued_at` desc.

**Props**: None (self-contained; consumes `useActiveAlerts()` directly).

**Features**:
- Glassmorphic dark surface (`bg-black/60` + `backdrop-blur-xl`) matching `.cr-popup` aesthetic; **no rounded corners** (sharp edges, same as `CitizenNavbar` and map popups)
- **Draggable**: grab the header (left side) to move the panel anywhere on the screen. Position is clamped to the viewport, persisted in component state, and re-clamped on window resize. A small ↺ button appears in the header when the panel has been moved from its default position; click it to snap back to `top-4 left-16` (clear of the floating `CitizenNavbar`).
- Header layout: drag-handle area (bell icon + title + reset button when moved) on the left, toggle button (count badge + chevron) on the right. This split avoids nested buttons and gives clear visual affordance: drag the left, click the right.
- Each card:
  - Left vertical color bar matching the level (sky / amber / orange / `#DA291C`)
  - Level badge with a glowing dot of the level color
  - "Monitoreo" chip on the right when `is_monitor` is true
  - Title (clamped to 2 lines)
  - Category (uppercase, monospaced), region (shortened, e.g. "Los Lagos"), and `issued_at` (relative: `ahora` / `5m` / `3h` / `2d`)
  - External-link icon revealed on hover
  - Whole card is a link to `senapred_url` (opens in a new tab with `rel="noopener noreferrer"`)
- States:
  - Loading: 3 skeleton cards
  - Empty: green check + "Sin alertas activas" / "SERNAPRED no reporta emergencias"
  - Error: red triangle + retry button
- Sorted by `level` (roja first) then by `issued_at` desc

**Usage** (already wired into `app/(citizen)/map/page.tsx`):
```tsx
<div className="relative h-dvh w-full overflow-hidden">
  <ChileMap />
  <SenapredAlertsPanel />
</div>
```

**Accessibility**:
- `aria-label="Alertas activas de SERNAPRED"` on the `<aside>`
- Drag-handle `<div>` has `aria-label="Arrastrar panel"` and `touchAction: "none"` so pointer events are captured on touch devices
- Toggle `<button>` has `aria-expanded` and `aria-controls="senapred-alerts-list"` + `aria-label` that announces the action ("Colapsar alertas" / "Expandir alertas")
- Reset button: `aria-label="Restablecer posición"` + `title` tooltip
- Body container has `role="region"` and `aria-live="polite"` so screen readers announce new alerts
- Cards with no `senapred_url` use `aria-disabled` and `e.preventDefault()` on click
- `focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30` on every interactive element

**Drag implementation notes**:
- Uses `setPointerCapture` so the drag continues even when the pointer leaves the header
- 4 px movement threshold (`DRAG_THRESHOLD`) differentiates click vs drag; clicks on the reset button (`closest("button")` check in `pointerdown`) never start a drag
- `cursor-grab` (idle) / `cursor-grabbing` (dragging) give clear visual feedback
- `select-none` + `touchAction: "none"` on the drag handle prevent text selection and browser scroll during drag
- `e.preventDefault()` + `e.stopPropagation()` on `pointerdown` prevent the map from panning while dragging
- During drag, `panel.style.left/top` is updated via ref (no React re-render). On `pointerup`, the final position is committed to state so it persists across renders.
- `useEffect` listens to `resize` and re-clamps the position to keep the panel fully on-screen if the viewport shrinks.

**Positioning notes**:
- `fixed left-4 top-20 z-20` (initial) — sits below the floating `CitizenNavbar` (`fixed top-4 left-1/2 z-50`)
- `max-w-[calc(100vw-2rem)]` prevents overflow on narrow viewports
- `max-h-[calc(100dvh-7rem)]` keeps it within the viewport; inner list scrolls

---

## Data Hooks

### `useActiveAlerts(params?)`

**Path**: `frontend/hooks/use-active-alerts.ts`

React Query hook for active SERNAPRED alerts (data synced from `senapred.cl/sismos-alertas`).

**Signature**:
```ts
function useActiveAlerts(params?: {
  region?: number    // 1-16, optional
  level?: "preventiva" | "amarilla" | "naranja" | "roja"
}): UseQueryResult<SenapredAlert[]>
```

**Cache key**: `["activeAlerts", params]` — different filter combos get different cache slots.

**staleTime**: 2 minutes (alerts are critical, freshen quickly).

**Return type** (`SenapredAlert`):
```ts
interface SenapredAlert {
  id: string                                          // SERNAPRED UUID
  level: "preventiva" | "amarilla" | "naranja" | "roja"
  category: string | null                             // "Incendio Forestal", "Viento - Temporal", etc.
  title: string
  content: string | null                              // HTML body (may include tables, etc.)
  url_access: string | null                           // SERNAPRED slug (sin base)
  senapred_url: string | null                         // Link completo al artículo en senapred.cl — listo para abrir en nueva pestaña
  issued_at: string                                   // ISO timestamp
  synced_at: string                                   // ISO timestamp
  region_code: number | null                          // 1-16 or null if not resolvable
  region_name: string | null                          // "Región de los Lagos", etc.
  is_monitor: boolean                                 // "Monitoreo" in title
  parent_id: string | null                            // chain to principal update
}
```

The companion API wrapper is `getActiveAlerts(params?)` in `frontend/lib/api.ts`. Each alert exposes a `senapred_url` ready to open in a new tab (`target="_blank" rel="noopener noreferrer"`). There is no UI consumer yet — the dashboard/map can adopt it in a follow-up.

---

*Last updated*: 2026-06-02 — SERNAPRED alerts integration
