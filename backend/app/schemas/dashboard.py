from datetime import datetime

from pydantic import BaseModel


class DashboardSummaryOut(BaseModel):
    summary: str
    generated_at: datetime
    cached: bool
    comuna_name: str | None = None
