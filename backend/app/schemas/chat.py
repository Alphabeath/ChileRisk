from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    messages: list[ChatMessageIn] = Field(min_length=1, max_length=40)
    thread_id: str | None = None
    comuna_code: int | None = Field(default=None, ge=1001, le=16305)
    region_code: int | None = Field(default=None, ge=1, le=16)
    lat: float | None = Field(default=None, ge=-56.0, le=-17.0)
    lon: float | None = Field(default=None, ge=-76.0, le=-66.0)
    stream: bool = False


class ToolCallTrace(BaseModel):
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)
    ok: bool = True
    summary: str = ""


class ChatResponse(BaseModel):
    reply: str
    thread_id: str | None = None
    tool_calls_used: list[ToolCallTrace] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list)


class ChatThreadSummaryOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    tool_trace: list[dict[str, Any]] | None = None
    created_at: datetime


class ChatThreadDetailOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageOut]
