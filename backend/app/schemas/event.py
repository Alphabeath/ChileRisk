from datetime import datetime

from pydantic import BaseModel, Field


class SeismicEventResponse(BaseModel):
    id: int
    latitude: float
    longitude: float
    magnitude: float
    depth_km: float
    occurred_at: datetime
    source: str


class ComunaImpact(BaseModel):
    cod_comuna: int
    name: str
    codregion: int
    distance_km: float
    estimated_intensity: float
    risk_score: float


class SeismicImpactResponse(BaseModel):
    event: SeismicEventResponse
    affected_comunas: list[ComunaImpact]
    total_affected: int
