#!/usr/bin/env python3
"""Live spike: fetch DMC AAA JSON (+ optional coord JS) and print a summary.

Usage (from backend/ with deps):

    python -m scripts.spike_meteochile_aaa
    python -m scripts.spike_meteochile_aaa --coords
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

# Allow `python -m scripts.spike_meteochile_aaa` from backend/
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.meteochile_aaa_service import (  # noqa: E402
    fetch_aaa_feed,
    fetch_coordinate_catalog,
    normalize_feed,
)


async def main() -> None:
    parser = argparse.ArgumentParser(description="Spike MeteoChile AAA feed")
    parser.add_argument(
        "--coords",
        action="store_true",
        help="Also download zone/region JS and attach geometries",
    )
    args = parser.parse_args()

    feed = await fetch_aaa_feed()
    print(
        f"AAA {feed.fecha_actualizacion}: "
        f"{feed.avisos} avisos, {feed.alertas} alertas, {feed.alarmas} alarmas"
    )

    zone_geoms = region_geoms = None
    if args.coords:
        zone_geoms, region_geoms = await fetch_coordinate_catalog()
        print(f"coord catalogs: {len(zone_geoms)} zones, {len(region_geoms)} regions")

    for row in normalize_feed(
        feed, zone_geoms=zone_geoms, region_geoms=region_geoms
    ):
        print(
            f"- [{row['tipo']}] {row['codigo_meteo']}: {row['title'][:70]}"
            f" | zones={len(row['zone_ids'])}"
            f" regions_cut={row['region_codes']}"
            f" comunas_seed={len(row['comuna_codes'])}"
            f" geoms={len(row['geometries'])}"
        )


if __name__ == "__main__":
    asyncio.run(main())
