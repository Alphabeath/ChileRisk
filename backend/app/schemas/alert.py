from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


AlertLevel = Literal["preventiva", "amarilla", "naranja", "roja"]


class SenapredAlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    level: AlertLevel
    category: str | None = None
    title: str
    content: str | None = None
    url_access: str | None = None
    senapred_url: str | None = None
    issued_at: datetime
    synced_at: datetime
    region_code: int | None = None
    region_name: str | None = None
    is_monitor: bool
    parent_id: str | None = None
