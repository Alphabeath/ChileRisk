from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


AlertLevel = Literal["preventiva", "amarilla", "naranja", "roja", "informativa"]
AlertSource = Literal["senapred", "chilerisk", "sernageomin", "meteochile"]
RecordKind = Literal["alerta", "evento"]
HazardType = Literal[
    "sismo",
    "volcan",
    "incendio",
    "incendio_estructural",
    "remocion",
    "otros",
]
AffectedScope = Literal["region", "comuna", "unknown"]


class SenapredAlertBrief(BaseModel):
    id: str
    record_kind: RecordKind
    title: str
    level: AlertLevel
    external_url: str | None = None
    hazard_type: str | None = None


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
    affected_scope: AffectedScope = "unknown"
    comuna_codes: list[int] = []
    is_monitor: bool = False
    parent_id: str | None = None
    thread_root_id: str | None = None
    record_kind: RecordKind = "alerta"
    hazard_type: str | None = None
    composite_score: float | None = None
    dominant_hazard: str | None = None
    severity: str | None = None
    risk_detail: str | None = None


SenapredAlertOut = ActiveAlertOut