from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class AlertResponse(BaseModel):
    id: str
    level: Literal["amarillo", "naranja", "rojo"]
    hazard: str
    region: str | None = None
    comuna: str | None = None
    message: str
    issued_at: datetime
