from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SyncRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: str
    started_at: datetime
    finished_at: datetime | None
    status: str
    items_written: int
    error_text: str | None = None
    partial: bool = False


class SyncStatusResponse(BaseModel):
    runs: list[SyncRunOut]


class HealthSyncSummary(BaseModel):
    job_id: str
    status: str
    finished_at: datetime | None = None
