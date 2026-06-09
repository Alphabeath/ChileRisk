#!/usr/bin/env python3
"""Convert wildfire shapefile (UTM 19S) to simplified GeoJSON (WGS84).

Usage:
    PYTHONPATH=/tmp/geo python3 scripts/convert-wildfire.py

Input:  frontend/data/wildfire/ocurr_1km_2025.shp
Output: frontend/public/data/wildfire/wildfire-occurrence.geojson
"""

import json
import os
import sys

import shapefile
from pyproj import Transformer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_SHP = os.path.join(ROOT, "frontend", "data", "wildfire", "ocurr_1km_2025")
OUTPUT_DIR = os.path.join(ROOT, "frontend", "public", "data", "wildfire")
OUTPUT_GEOJSON = os.path.join(OUTPUT_DIR, "wildfire-occurrence.geojson")

SIMPLIFY_TOLERANCE = 0.002  # ~200m in degrees
COORD_PRECISION = 5  # ~1m precision


def ring_area(coords):
    """Shoelace formula for signed area of a linear ring."""
    n = len(coords)
    if n < 3:
        return 0.0
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += coords[i][0] * coords[j][1]
        area -= coords[j][0] * coords[i][1]
    return area / 2.0


def simplify_ring(coords, tolerance):
    """Douglas-Peucker simplification for a ring of coordinates."""
    if len(coords) <= 4:
        return coords

    def perpendicular_distance(point, line_start, line_end):
        dx = line_end[0] - line_start[0]
        dy = line_end[1] - line_start[1]
        if dx == 0 and dy == 0:
            return ((point[0] - line_start[0]) ** 2 + (point[1] - line_start[1]) ** 2) ** 0.5
        t = ((point[0] - line_start[0]) * dx + (point[1] - line_start[1]) * dy) / (dx * dx + dy * dy)
        t = max(0, min(1, t))
        proj_x = line_start[0] + t * dx
        proj_y = line_start[1] + t * dy
        return ((point[0] - proj_x) ** 2 + (point[1] - proj_y) ** 2) ** 0.5

    max_dist = 0.0
    max_idx = 0
    for i in range(1, len(coords) - 1):
        d = perpendicular_distance(coords[i], coords[0], coords[-2])
        if d > max_dist:
            max_dist = d
            max_idx = i

    if max_dist > tolerance:
        left = simplify_ring(coords[: max_idx + 1], tolerance)
        right = simplify_ring(coords[max_idx:], tolerance)
        return left[:-1] + right
    else:
        return [coords[0], coords[-2]]


def close_ring(coords):
    """Ensure ring is closed (first == last)."""
    if coords[0] != coords[-1]:
        coords.append(coords[0])
    return coords


def simplify_ring(coords, tolerance):
    """Douglas-Peucker simplification for a ring of coordinates."""
    if len(coords) <= 4:
        return coords

    def perpendicular_distance(point, line_start, line_end):
        dx = line_end[0] - line_start[0]
        dy = line_end[1] - line_start[1]
        if dx == 0 and dy == 0:
            return ((point[0] - line_start[0]) ** 2 + (point[1] - line_start[1]) ** 2) ** 0.5
        t = ((point[0] - line_start[0]) * dx + (point[1] - line_start[1]) * dy) / (dx * dx + dy * dy)
        t = max(0, min(1, t))
        proj_x = line_start[0] + t * dx
        proj_y = line_start[1] + t * dy
        return ((point[0] - proj_x) ** 2 + (point[1] - proj_y) ** 2) ** 0.5

    max_dist = 0.0
    max_idx = 0
    for i in range(1, len(coords) - 1):
        d = perpendicular_distance(coords[i], coords[0], coords[-2])
        if d > max_dist:
            max_dist = d
            max_idx = i

    if max_dist > tolerance:
        left = simplify_ring(coords[: max_idx + 1], tolerance)
        right = simplify_ring(coords[max_idx:], tolerance)
        return left[:-1] + right
    else:
        return [coords[0], coords[-2]]


def main():
    print(f"Reading shapefile: {INPUT_SHP}.shp")
    sf = shapefile.Reader(INPUT_SHP)
    fields = [f[0] for f in sf.fields[1:]]
    print(f"Fields: {fields}")
    print(f"Records: {len(sf)}")

    transformer = Transformer.from_crs("EPSG:32719", "EPSG:4326", always_xy=True)

    features = []
    skipped = 0

    for shape_rec in sf.iterShapeRecords():
        shape = shape_rec.shape
        rec = shape_rec.record
        gridcode = int(rec["gridcode"])

        if shape.shapeType != 5:  # Polygon
            skipped += 1
            continue

        parts = list(shape.parts) + [len(shape.points)]
        rings = []
        for i in range(len(parts) - 1):
            ring_pts = shape.points[parts[i]:parts[i + 1]]
            projected = [transformer.transform(x, y) for x, y in ring_pts]
            projected = close_ring(projected)
            if len(projected) >= 4:
                simplified = simplify_ring(projected, SIMPLIFY_TOLERANCE)
                simplified = close_ring(simplified)
                if len(simplified) >= 4:
                    rings.append(simplified)

        # Round coordinates to reduce file size
        def round_coords(ring):
            return [[round(c[0], COORD_PRECISION), round(c[1], COORD_PRECISION)] for c in ring]

        rings = [round_coords(r) for r in rings]

        if not rings:
            skipped += 1
            continue

        # Shapefile convention: exterior CW (negative area), holes CCW (positive area)
        polygons = []
        current_exterior = None
        current_holes = []
        for ring in rings:
            area = ring_area(ring)
            if area < 0:
                # Exterior ring (CW in shapefile)
                if current_exterior is not None:
                    polygons.append([current_exterior] + current_holes)
                current_exterior = ring
                current_holes = []
            else:
                # Hole (CCW in shapefile)
                if current_exterior is not None:
                    current_holes.append(ring)

        if current_exterior is not None:
            polygons.append([current_exterior] + current_holes)

        if not polygons:
            skipped += 1
            continue

        if len(polygons) == 1:
            geometry = {"type": "Polygon", "coordinates": polygons[0]}
        else:
            geometry = {"type": "MultiPolygon", "coordinates": polygons}

        features.append({
            "type": "Feature",
            "properties": {"gridcode": gridcode},
            "geometry": geometry,
        })

    geojson = {"type": "FeatureCollection", "features": features}

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_GEOJSON, "w") as f:
        json.dump(geojson, f, separators=(",", ":"))

    size_mb = os.path.getsize(OUTPUT_GEOJSON) / (1024 * 1024)
    print(f"Output: {OUTPUT_GEOJSON}")
    print(f"Features: {len(features)} (skipped: {skipped})")
    print(f"Size: {size_mb:.2f} MB")


if __name__ == "__main__":
    main()
