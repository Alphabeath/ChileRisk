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

Dedicated React components for map popups. Content is rendered with React and mounted into MapLibre `Popup` instances using `setDOMContent` + `createRoot`.

**Exports**:

| Export | Description |
|---|---|
| `RegionPopupContent({ properties, onViewDetail? })` | Renders region info + hazards + "Ver comunas" action button that triggers map zoom |
| `ComunaPopupContent({ properties, onViewDetail? })` | Renders comuna info + hazards + optional seismic; no action button |
| `createPopupContent(reactNode)` | Returns `{ element, destroy }` for safe mounting/unmounting of React content inside a `maplibregl.Popup` |

**Usage in map** (internal):
```tsx
const { element, destroy } = createPopupContent(
  <RegionPopupContent properties={props} onViewDetail={() => { popup.remove(); /* zoom logic */ }} />
)
popup.setDOMContent(element).addTo(map)
popup.on("close", destroy)
```

**Accessibility**: Uses semantic headings, native `<button type="button">`, focus-visible rings on actions.

---

*Last updated*: 2026-06-01
