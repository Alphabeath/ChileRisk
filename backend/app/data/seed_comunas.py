import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comuna import Comuna


DATA_DIR = Path(__file__).parent
COMUNAS_FILE = DATA_DIR / "comunas.geojson"


def _centroid_from_geometry(geom: dict) -> tuple[float, float] | None:
    """Approximate centroid from Polygon or MultiPolygon (sufficient for MVP distance calc)."""
    coords: list[list[float]] = []
    if geom["type"] == "Polygon":
        coords = geom["coordinates"][0]
    elif geom["type"] == "MultiPolygon":
        for poly in geom["coordinates"]:
            coords.extend(poly[0])
    if not coords:
        return None
    lons = [float(c[0]) for c in coords]
    lats = [float(c[1]) for c in coords]
    return (sum(lons) / len(lons), sum(lats) / len(lats))


async def seed_comunas(session: AsyncSession) -> int:
    """Idempotent seed of all ~346 Chilean comunas."""
    if (await session.scalar(select(Comuna).limit(1))) is not None:
        return 0

    data = json.loads(COMUNAS_FILE.read_text(encoding="utf-8"))
    features = data.get("features", [])

    comunas: list[Comuna] = []
    for f in features:
        props = f.get("properties", {})
        cod_comuna = props.get("cod_comuna")
        if not cod_comuna:
            continue

        centroid = _centroid_from_geometry(f.get("geometry", {}))
        lon, lat = (centroid[0], centroid[1]) if centroid else (None, None)

        comunas.append(
            Comuna(
                cod_comuna=int(cod_comuna),
                name=str(props.get("Comuna") or props.get("comuna") or "Sin nombre"),
                provincia=str(props.get("Provincia") or props.get("provincia") or "Sin provincia"),
                codregion=int(props.get("codregion", 0)),
                latitude=lat,
                longitude=lon,
                area_km=float(props.get("st_area_sh", 0.0)) / 1_000_000.0 if props.get("st_area_sh") else 0.0,
            )
        )

    # Batch insert
    session.add_all(comunas)
    await session.commit()
    return len(comunas)
