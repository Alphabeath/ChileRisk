# Evacuación — fuente geospatial (SHP)

> **Las fuentes SHP/KMZ viven fuera del repo** en `~/data/chilerisk/evacuacion-source/`
> (~218 MB, para mantener el monorepo liviano). Este directorio solo conserva este
> README. Para rebuild: `make evacuacion-data` (o `./scripts/build-evacuacion-data.sh`),
> que lee `$EVAC_SOURCE` (default `$HOME/data/chilerisk/evacuacion-source`).

Input crudo para `make evacuacion-data`. **No** se sirve al navegador.

| Carpeta | Contenido |
|---------|-----------|
| `Tsunami/` | Áreas, vías, puntos de encuentro (cota 30 m excluida del build v1) |
| `Volcan/` | Peligros, radios, volcanes activos, vías, puntos |
| `Incendio/` | Ocurrencia 1 km (vector; el `.tif` no se convierte) |

Salida runtime: [`../public/data/evacuacion/`](../public/data/evacuacion/) (`make evacuacion-data`; PMTiles vía tippecanoe local o `make tippecanoe-image`).
