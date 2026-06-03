from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


AlertLevel = Literal["preventiva", "amarilla", "naranja", "roja"]
AlertSource = Literal["senapred", "chilerisk"]


class ActiveAlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source: AlertSource
    level: AlertLevel
    category: str | None = None
    title: str
    content: str | None = None
    url_access: str | None = None
    external_url: str | None = None
    issued_at: datetime
    synced_at: datetime
    region_code: int | None = None
    region_name: str | None = None
    is_monitor: bool = False
    parent_id: str | None = None
    composite_score: float | None = None
    dominant_hazard: str | None = None
    severity: str | None = None
    risk_detail: str | None = None


SenapredAlertOut = ActiveAlertOut