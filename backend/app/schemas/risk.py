from datetime import datetime

from pydantic import BaseModel, Field


class HazardScores(BaseModel):
    sismo: float = Field(ge=0, le=100)
    ola_calor: float = Field(ge=0, le=100)
    ola_frio: float = Field(ge=0, le=100)
    viento: float = Field(ge=0, le=100)
    inundacion: float = Field(ge=0, le=100)


class ComunaRiskResponse(BaseModel):
    cod_comuna: int
    name: str
    codregion: int
    sismo_score: float
    ola_calor_score: float
    ola_frio_score: float
    viento_score: float
    inundacion_score: float
    composite_score: float
    dominant_hazard: str
    severity: str
    computed_at: datetime
    temperature_c: float | None = None
    wind_speed_kmh: float | None = None


class RegionRiskResponse(BaseModel):
    codregion: int
    name: str
    sismo_score: float
    ola_calor_score: float
    ola_frio_score: float
    viento_score: float
    inundacion_score: float
    composite_score: float
    dominant_hazard: str
    severity: str
    comuna_count: int
    avg_temperature_c: float | None = None
    avg_wind_speed_kmh: float | None = None


class NationalRiskEntry(BaseModel):
    codregion: int
    name: str
    composite_score: float
    dominant_hazard: str
    severity: str
    comuna_count: int


class ComunaMapScore(BaseModel):
    cod_comuna: int
    composite_score: float
