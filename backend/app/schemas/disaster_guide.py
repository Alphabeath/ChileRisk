from pydantic import BaseModel, Field


class DisasterGuideOut(BaseModel):
    slug: str
    title: str
    description: str
    antes: list[str] = Field(default_factory=list)
    durante: list[str] = Field(default_factory=list)
    despues: list[str] = Field(default_factory=list)
    app_path: str


class DisasterGuideListOut(BaseModel):
    items: list[DisasterGuideOut]
