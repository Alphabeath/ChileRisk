from pydantic import BaseModel, Field


class UserProfileOut(BaseModel):
    id: str
    email: str
    name: str | None = None
    home_comuna_code: int | None = None
    home_comuna_name: str | None = None


class UserProfileUpdate(BaseModel):
    home_comuna_code: int | None = Field(default=None, ge=1001, le=16305)
