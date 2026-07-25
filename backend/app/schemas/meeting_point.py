from pydantic import BaseModel, Field


class MeetingPointOut(BaseModel):
    id: str
    hazard: str
    comuna: str
    provincia: str
    region: str
    sector: str
    lng: float
    lat: float
    distance_km: float | None = None


class MeetingPointNearestResponse(BaseModel):
    items: list[MeetingPointOut]
    origin_lat: float
    origin_lon: float
    hazard: str | None = None
    total_candidates: int = 0


class MeetingPointSeedResult(BaseModel):
    inserted: int
    total: int
