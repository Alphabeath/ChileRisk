# Evacuación — datos estáticos (runtime)

Generados desde la fuente SHP [`frontend/data/evacuacion-source/`](../../../data/evacuacion-source/) con:

```bash
make tippecanoe-image   # una vez (si tippecanoe no está en PATH)
make evacuacion-data
```

Requiere Docker:

- GDAL: `ghcr.io/osgeo/gdal:ubuntu-small-latest`
- tippecanoe 2.x: binario en PATH **o** imagen `chilerisk-tippecanoe:2.79.0` (`scripts/Dockerfile.tippecanoe`)

**Qué se sirve**

| Tipo | Capas |
|------|--------|
| PMTiles | Áreas tsunami, peligros volcánicos, ocurrencia incendio |
| GeoJSON | Vías, puntos de encuentro, volcanes activos, radios |
| PNG icons | `icons/meeting-point-*.png` (PE / PET / tsunami PE desde KMZ fuente) |

Los GeoJSON intermedios de las capas PMTiles se borran al final del build (no van a `public/`).

La carpeta fuente `evacuacion-source/` (~218 MB, incluye cota 30 m) **no se sirve** y está en `.gitignore`. Cota 30 m nacional queda fuera de v1.

*Last updated: 2026-08-07*