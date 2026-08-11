from datetime import date as date_cls, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


DrillType = Literal[
    "sismo_tsunami_borde_costero",
    "sismo_tsunami_educacion",
    "erupcion_volcanica",
    "remocion_en_masa",
    "otro",
]

DrillSource = Literal["future", "recent", "archive"]

SimulacroBodyBlockKind = Literal[
    "heading",
    "paragraph",
    "steps",
    "link_list",
    "sae_notice",
    "callout",
]


class SimulacroBodyLink(BaseModel):
    label: str
    url: str


class SimulacroBodyBlock(BaseModel):
    kind: SimulacroBodyBlockKind
    title: str | None = None
    text: str | None = None
    items: list[str] = Field(default_factory=list)
    links: list[SimulacroBodyLink] = Field(default_factory=list)


class SimulacroOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    title: str
    drill_date: date_cls
    region_code: int | None = None
    region_name: str | None = None
    drill_type: DrillType = "otro"
    participating_comunas: list[str] = []
    summary: str | None = None
    detail_url: str
    mensaje_sae: bool = False
    source: DrillSource = "future"
    synced_at: datetime


class SimulacroDetailOut(SimulacroOut):
    headline: str | None = None
    schedule_note: str | None = None
    hero_image_url: str | None = None
    body_blocks: list[SimulacroBodyBlock] = Field(default_factory=list)


class SimulacroListResponse(BaseModel):
    items: list[SimulacroOut]
    total: int
    next_synced_at: datetime | None = None
