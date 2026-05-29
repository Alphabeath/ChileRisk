import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.region import Region


DATA_DIR = Path(__file__).parent
REGIONS_FILE = DATA_DIR / "regional.geojson"


def _centroid_from_geometry(geom: dict) -> tuple[float, float] | None:
    """Very rough centroid for label positioning (not for precise GIS)."""
    coords = []
    if geom["type"] == "Polygon":
        coords = geom["coordinates"][0]
    elif geom["type"] == "MultiPolygon":
        for poly in geom["coordinates"]:
            coords.extend(poly[0])
    if not coords:
        return None
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    return (sum(lons) / len(lons), sum(lats) / len(lats))


async def seed_regions(session: AsyncSession) -> int:
    """Idempotent seed of Chile's 16 official regions from GeoJSON."""
    if (await session.scalar(select(Region).limit(1))) is not None:
        return 0  # already seeded

    data = json.loads(REGIONS_FILE.read_text(encoding="utf-8"))
    features = [f for f in data.get("features", []) if f["properties"].get("codregion", 0) != 0]

    regions: list[Region] = []
    for f in features:
        props = f["properties"]
        regions.append(
            Region(
                codregion=int(props["codregion"]),
                name=str(props.get("Region") or props.get("region") or f"Región {props['codregion']}"),
                area_km=float(props.get("area_km", 0.0)),
            )
        )

    session.add_all(regions)
    await session.commit()
    return len(regions)
