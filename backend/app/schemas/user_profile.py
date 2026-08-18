from pydantic import BaseModel, Field


class UserProfileOut(BaseModel):
    id: str
    email: str
    name: str | None = None
    home_comuna_code: int | None = None
    home_comuna_name: str | None = None
    notify_email_alerts: bool = True
    notify_email_simulacros: bool = True


class UserProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    home_comuna_code: int | None = Field(default=None, ge=1001, le=16305)
    notify_email_alerts: bool | None = None
    notify_email_simulacros: bool | None = None
