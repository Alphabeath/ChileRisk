#!/usr/bin/env bash
# Build frontend/public/data/comunas_medium.geojson from comunas_full.geojson.
# Docker GDAL ogr2ogr -simplify (topology-preserving Douglas–Peucker keeps
# shared borders consistent — better than a per-ring pure-Python pass).
#
# Target band: raw file 0.8–2.5 MB, ~40k–120k verts (old map asset was
# ~1.6 MB / ~76k verts). If a pass lands outside the band the script retunes
# MEDIUM_SIMPLIFY along a ladder (coarser 0.0015 → 0.002 → 0.0025 → 0.003 →
# 0.0035, or finer 0.0006 → 0.0004). Never touches comunas_simplified/full.
#
# Usage: ./scripts/build-comunas-geojson.sh
#        make comunas-data
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${ROOT}/frontend/public/data"
# Full comunas source lives OUTSIDE the repo (heavy, ~18 MB) to keep disk lean.
# Override the path with COMUNAS_FULL_SRC if it lives elsewhere.
IN="${COMUNAS_FULL_SRC:-$HOME/data/chilerisk/comunas_full.geojson}"
MEDIUM_OUT="${OUT_DIR}/comunas_medium.geojson"
GDAL_IMAGE="${GDAL_IMAGE:-ghcr.io/osgeo/gdal:ubuntu-small-latest}"

EXPECTED_FEATURES=345
MIN_BYTES=$((8 * 1024 * 1024 / 10))   # 0.8 MB raw
MAX_BYTES=$((25 * 1024 * 1024 / 10))  # 2.5 MB raw
MIN_VERTS=40000
MAX_VERTS=120000

die() { echo "error: $*" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || die "docker required (GDAL image ${GDAL_IMAGE})"
[[ -f "$IN" ]] || die "missing $IN: copy/restore comunas_full.geojson to $IN (or export COMUNAS_FULL_SRC=...)"

build() {
  local tol="$1"
  echo "→ ogr2ogr -simplify ${tol} (GDAL ${GDAL_IMAGE})"
  rm -f "$MEDIUM_OUT" # GeoJSON driver has no DeleteLayer; overwrite would fail
  docker run --rm \
    -v "$OUT_DIR:/data" \
    -u "$(id -u):$(id -g)" \
    "$GDAL_IMAGE" \
    ogr2ogr -overwrite -f GeoJSON \
      -lco COORDINATE_PRECISION=5 \
      -simplify "$tol" \
      /data/comunas_medium.geojson \
      /data/comunas_full.geojson
}

# Prints stats line + band verdict; always exits 0 (bash decides retune).
check() {
  local tol="$1"
  python3 - "$tol" "$MEDIUM_OUT" <<'PY'
import json, os, sys

tol, path = sys.argv[1], sys.argv[2]
with open(path, encoding="utf-8") as f:
    gj = json.load(f)
n = len(gj["features"])

def rings(g):
    t = g["type"]
    if t == "Polygon":
        return g["coordinates"]
    if t == "MultiPolygon":
        return [r for poly in g["coordinates"] for r in poly]
    return []

verts = sum(len(r) for feat in gj["features"] for r in rings(feat["geometry"]))
size = os.path.getsize(path)
print(f"tolerance {tol}: {n} features, {size:,} bytes, {verts:,} verts")
if n != 345:
    print("band feature-count")
elif size < 800_000 or verts < 40_000:
    print("band too-small")
elif size > 2_500_000 or verts > 120_000:
    print("band too-big")
else:
    print("band ok")
PY
}

next_tolerance() {
  local tol="$1" next=""
  case "$tol" in
    # too-big ladder (coarser)
    0.001)  next="0.0015" ;;
    0.0015) next="0.002" ;;
    0.002)  next="0.0025" ;;
    0.0025) next="0.003" ;;
    0.003)  next="0.0035" ;;
    # too-small ladder (finer)
    0.0006) next="0.0004" ;;
  esac
  if [[ -z "$next" ]]; then
    die "out of band at ${tol} and no ladder step left; pass MEDIUM_SIMPLIFY explicitly"
  fi
  echo "$next"
}

echo "== Comunas medium build =="
echo "in:  $IN"
echo "out: $MEDIUM_OUT"
echo "gdal: $GDAL_IMAGE"
echo ""

tol="${MEDIUM_SIMPLIFY:-0.001}"
while :; do
  build "$tol"
  stats="$(check "$tol")"
  echo "$stats"
  band="$(printf '%s\n' "$stats" | awk '/^band /{print $2}')"
  case "$band" in
    ok)
      echo "OK: comunas_medium.geojson in target band (0.8–2.5 MB, 40k–120k verts)."
      exit 0
      ;;
    feature-count)
      die "expected ${EXPECTED_FEATURES} features"
      ;;
    too-big)
      echo "→ out of band (too coarse), retuning"
      tol="$(next_tolerance "$tol")"
      ;;
    too-small)
      echo "→ out of band (too fine), retuning"
      tol="$(next_tolerance "$tol")"
      ;;
    *)
      die "unexpected check output"
      ;;
  esac
done
