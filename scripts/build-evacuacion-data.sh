#!/usr/bin/env bash
# Convert frontend/data/evacuacion-source/ SHP → frontend/public/data/evacuacion/
# Heavy polygons → PMTiles only (intermediate GeoJSON deleted). Lines/points → GeoJSON.
# Requires Docker (GDAL). tippecanoe: on PATH, or Docker image (auto-built if missing).
#
# Usage: ./scripts/build-evacuacion-data.sh
#        make evacuacion-data
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Source SHP/KMZ lives OUTSIDE the repo (~218 MB) to keep disk lean.
# Override with EVAC_SOURCE; fall back to the legacy in-tree path if populated.
SRC="${EVAC_SOURCE:-$HOME/data/chilerisk/evacuacion-source}"
if [ ! -d "$SRC" ] && [ -d "${ROOT}/frontend/data/evacuacion-source" ] && \
   find "${ROOT}/frontend/data/evacuacion-source" -type f ! -name 'README.md' | grep -q .; then
  SRC="${ROOT}/frontend/data/evacuacion-source"
fi
OUT="${ROOT}/frontend/public/data/evacuacion"
TMP="${ROOT}/.tmp/evacuacion-build"
GDAL_IMAGE="${GDAL_IMAGE:-ghcr.io/osgeo/gdal:ubuntu-small-latest}"
TIPPECANOE_IMAGE="${TIPPECANOE_IMAGE:-chilerisk-tippecanoe:2.79.0}"
TIPPECANOE_DOCKERFILE="${ROOT}/scripts/Dockerfile.tippecanoe"

die() { echo "error: $*" >&2; exit 1; }

[[ -d "$SRC" ]] || die "missing $SRC: restore SHP/KMZ sources to $SRC (or export EVAC_SOURCE=...)"

mkdir -p "$OUT" "$TMP"
rm -rf "${TMP:?}/"*

gdal() {
  docker run --rm \
    -v "$SRC:/src:ro" \
    -v "$TMP:/tmp/out" \
    -v "$OUT:/out" \
    "$GDAL_IMAGE" \
    "$@"
}

ensure_tippecanoe() {
  if command -v tippecanoe >/dev/null 2>&1; then
    TIPPECANOE_MODE=host
    return 0
  fi
  if ! command -v docker >/dev/null 2>&1; then
    die "tippecanoe not on PATH and Docker unavailable"
  fi
  if ! docker image inspect "$TIPPECANOE_IMAGE" >/dev/null 2>&1; then
    echo "→ Building tippecanoe image ${TIPPECANOE_IMAGE} (once)"
    docker build -t "$TIPPECANOE_IMAGE" -f "$TIPPECANOE_DOCKERFILE" "${ROOT}/scripts"
  fi
  TIPPECANOE_MODE=docker
}

run_tippecanoe() {
  if [[ "$TIPPECANOE_MODE" == "host" ]]; then
    tippecanoe "$@"
  else
    docker run --rm \
      -v "$OUT:/out" \
      -u "$(id -u):$(id -g)" \
      "$TIPPECANOE_IMAGE" \
      "$@"
  fi
}

# $1=src under /src  $2=basename  $3=simplify degrees (optional "")  $4=s_srs (optional "")
to_geojson() {
  local src_rel="$1"
  local name="$2"
  local simplify="${3:-}"
  local s_srs="${4:-}"
  local dest="/tmp/out/${name}.geojson"
  echo "→ GeoJSON ${name}"
  local args=(ogr2ogr -overwrite -f GeoJSON -t_srs EPSG:4326 -lco COORDINATE_PRECISION=5)
  if [[ -n "$s_srs" ]]; then
    args+=(-s_srs "$s_srs")
  fi
  if [[ -n "$simplify" ]]; then
    args+=(-simplify "$simplify")
  fi
  args+=("$dest" "/src/${src_rel}")
  gdal "${args[@]}"
  gdal sh -c "mv '/tmp/out/${name}.geojson' '/out/${name}.geojson'"
}

# Heavy polygons → PMTiles (required for v1 perf). GeoJSON kept as fallback.
to_pmtiles() {
  local name="$1"
  local minzoom="${2:-5}"
  local maxzoom="${3:-14}"
  local layer="${4:-$name}"
  local geojson dest
  if [[ "$TIPPECANOE_MODE" == "docker" ]]; then
    geojson="/out/${name}.geojson"
    dest="/out/${name}.pmtiles"
  else
    geojson="${OUT}/${name}.geojson"
    dest="${OUT}/${name}.pmtiles"
  fi

  echo "→ PMTiles ${name} (z${minzoom}-${maxzoom}, layer ${layer})"
  run_tippecanoe \
    -o "$dest" \
    --force \
    --minimum-zoom="$minzoom" \
    --maximum-zoom="$maxzoom" \
    --drop-densest-as-needed \
    --extend-zooms-if-still-dropping \
    -l "$layer" \
    "$geojson"
}

echo "== Evacuación data build =="
echo "src: $SRC"
echo "out: $OUT"
echo "gdal: $GDAL_IMAGE"

ensure_tippecanoe
echo "tippecanoe: ${TIPPECANOE_MODE} (${TIPPECANOE_IMAGE})"

# Tsunami (WGS84; vias lack .prj → force 4326)
to_geojson "Tsunami/Area de evacuacion/Áreas_de_Evacuación_Tsunami.shp" \
  "tsunami-areas" "0.0003"
to_geojson "Tsunami/Vias evacuacion/Vías_de_Evacuación_Tsunami.shp" \
  "tsunami-routes" "0.0001" "EPSG:4326"
to_geojson "Tsunami/Puntos de encuentro/Puntos_de_Encuentro_Tsunami.shp" \
  "tsunami-meeting-points" "" "EPSG:4326"

# Volcán
to_geojson "Volcan/Areas de peligro volcanico/peligros_volcanicos.shp" \
  "volcanic-hazards" "0.0004"
to_geojson "Volcan/Radio volcanes activos/radios_volcanes.shp" \
  "volcanic-radii" "0.0002"
to_geojson "Volcan/Volcanes activos/volcanes_geologicamente_activos.shp" \
  "active-volcanoes"
to_geojson "Volcan/Vias de evacuacion/Vías_de_Evacuación_Volcánica.shp" \
  "volcanic-routes" "0.0001"
to_geojson "Volcan/Puntos de encuentro/Puntos_Encuentro_Volcánico.shp" \
  "volcanic-meeting-points"

# Incendio — UTM 19S → WGS84
to_geojson "Incendio/ocurr_1km_2025.shp" \
  "wildfire-occurrence" "0.002" "EPSG:32719"

to_pmtiles "tsunami-areas" 8 14 "tsunami_areas"
to_pmtiles "volcanic-hazards" 6 14 "volcanic_hazards"
to_pmtiles "wildfire-occurrence" 5 13 "wildfire_occurrence"

# Heavy GeoJSON is only an intermediate for tippecanoe — not served at runtime.
for f in tsunami-areas volcanic-hazards wildfire-occurrence; do
  [[ -f "${OUT}/${f}.pmtiles" ]] || die "missing ${OUT}/${f}.pmtiles"
  rm -f "${OUT}/${f}.geojson"
done

# Original meeting-point icons from source KMZ (PE / PET / tsunami PE).
extract_kmz_icon() {
  local kmz="$1"
  local member="$2"
  local dest="$3"
  [[ -f "$kmz" ]] || die "missing $kmz"
  mkdir -p "$(dirname "$dest")"
  unzip -p "$kmz" "$member" >"$dest"
  [[ -s "$dest" ]] || die "empty icon extract: $dest"
}

echo "→ Extracting meeting-point icons from KMZ"
extract_kmz_icon \
  "${SRC}/Volcan/Puntos de encuentro/Puntos_Encuentro_Volcánico.kmz" \
  "Layer0_Symbol_8e77edb0_0.png" \
  "${OUT}/icons/meeting-point-pe.png"
extract_kmz_icon \
  "${SRC}/Volcan/Puntos de encuentro/Puntos_Encuentro_Volcánico.kmz" \
  "Layer0_Symbol_8e780510_0.png" \
  "${OUT}/icons/meeting-point-pet.png"
extract_kmz_icon \
  "${SRC}/Tsunami/Puntos de encuentro/Puntos_de_Encuentro_Tsunami.kmz" \
  "Layer0_Symbol_6036a6b0_0.png" \
  "${OUT}/icons/meeting-point-tsunami-pe.png"

cat > "${OUT}/manifest.json" <<EOF
{
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "note": "Cota 30 m excluded (v1). Heavy polygons are PMTiles only; lines/points stay GeoJSON. Meeting-point icons from source KMZ.",
  "tippecanoe": "${TIPPECANOE_MODE}",
  "layers": {
    "tsunamiAreas": { "pmtiles": "tsunami-areas.pmtiles", "sourceLayer": "tsunami_areas" },
    "tsunamiRoutes": { "geojson": "tsunami-routes.geojson" },
    "tsunamiMeetingPoints": { "geojson": "tsunami-meeting-points.geojson", "icon": "icons/meeting-point-tsunami-pe.png" },
    "volcanicHazards": { "pmtiles": "volcanic-hazards.pmtiles", "sourceLayer": "volcanic_hazards" },
    "volcanicRadii": { "geojson": "volcanic-radii.geojson" },
    "activeVolcanoes": { "geojson": "active-volcanoes.geojson" },
    "volcanicRoutes": { "geojson": "volcanic-routes.geojson" },
    "volcanicMeetingPoints": {
      "geojson": "volcanic-meeting-points.geojson",
      "icons": { "PE": "icons/meeting-point-pe.png", "PET": "icons/meeting-point-pet.png" }
    },
    "wildfireOccurrence": { "pmtiles": "wildfire-occurrence.pmtiles", "sourceLayer": "wildfire_occurrence" }
  }
}
EOF

echo ""
echo "Sizes:"
du -h "$OUT"/* | sort -h
echo "Done."
