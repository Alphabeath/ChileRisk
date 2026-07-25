"""Seed and query official evacuation meeting points."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meeting_point import MeetingPoint
from app.schemas.meeting_point import MeetingPointOut
from app.services.seismic_service import haversine_km

logger = logging.getLogger("chilerisk.meeting_points")

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "meeting_points.json"


def google_maps_place_url(*, lat: float, lng: float) -> str:
    return f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"


def google_maps_directions_url(
    *,
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> str:
    return (
        "https://www.google.com/maps/dir/?api=1"
        f"&origin={origin_lat},{origin_lng}"
        f"&destination={dest_lat},{dest_lng}"
    )


async def seed_meeting_points(session: AsyncSession) -> int:
    """Insert meeting points from bundled JSON if the table is empty."""
    count = (await session.execute(select(func.count()).select_from(MeetingPoint))).scalar_one()
    if count and count > 0:
        return 0
    if not _DATA_PATH.is_file():
        logger.warning("meeting_points.json missing at %s", _DATA_PATH)
        return 0

    raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    rows = [
        MeetingPoint(
            id=item["id"],
            hazard=item["hazard"],
            comuna=item.get("comuna") or "",
            provincia=item.get("provincia") or "",
            region=item.get("region") or "",
            sector=item.get("sector") or "",
            lng=float(item["lng"]),
            lat=float(item["lat"]),
            comuna_code=item.get("comuna_code"),
        )
        for item in raw
    ]
    session.add_all(rows)
    await session.commit()
    logger.info("Seeded %d meeting points", len(rows))
    return len(rows)


async def find_nearest_meeting_points(
    session: AsyncSession,
    *,
    lat: float,
    lon: float,
    hazard: str | None = None,
    limit: int = 5,
) -> tuple[list[MeetingPointOut], int]:
    stmt = select(MeetingPoint)
    if hazard:
        stmt = stmt.where(MeetingPoint.hazard == hazard)
    rows = (await session.execute(stmt)).scalars().all()
    ranked: list[MeetingPointOut] = []
    for row in rows:
        dist = haversine_km(lat, lon, row.lat, row.lng)
        ranked.append(
            MeetingPointOut(
                id=row.id,
                hazard=row.hazard,
                comuna=row.comuna,
                provincia=row.provincia,
                region=row.region,
                sector=row.sector,
                lng=row.lng,
                lat=row.lat,
                distance_km=round(dist, 3),
            )
        )
    ranked.sort(key=lambda p: p.distance_km or 0.0)
    return ranked[: max(1, min(limit, 20))], len(ranked)
