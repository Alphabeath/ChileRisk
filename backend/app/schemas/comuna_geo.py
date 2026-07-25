from pydantic import BaseModel, Field


class NearestComunaOut(BaseModel):
    cod_comuna: int = Field(ge=1001, le=16305)
    name: str
    codregion: int
    distance_km: float
    origin_lat: float
    origin_lon: float
