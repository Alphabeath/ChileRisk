from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


AirQualityLevel = Literal[
    "bueno",
    "regular",
    "alerta",
    "preemergencia",
    "emergencia",
]


class AirQualityZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    zone_slug: str
    condition_date: date
    level: AirQualityLevel
    forecast_date: date | None = None
    forecast_level: AirQualityLevel | None = None
    pm25_range_label: str | None = None
    zone_name: str
    region_code: int | None = None
    comuna_codes: list[int] = Field(default_factory=list)
    measures_current: list[str] = Field(default_factory=list)
    restrictions_permanent: list[str] = Field(default_factory=list)
    external_url: str
    synced_at: datetime


class AirQualityListResponse(BaseModel):
    items: list[AirQualityZoneOut]
    total: int
    condition_date: date
