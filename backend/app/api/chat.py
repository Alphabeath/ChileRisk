"""Citizen assistant chat endpoints (DeepSeek tool-calling agent)."""

from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.auth import CurrentUser, get_current_user
from app.core.limiter import limiter
from app.config import settings
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatThreadDetailOut,
    ChatThreadSummaryOut,
)
from app.services.chat_agent_service import run_chat_agent, stream_chat_agent
from app.services import chat_history_service
from app.services.user_profile_service import resolve_comuna_code

logger = logging.getLogger("chilerisk.chat")

router = APIRouter()

_UNAVAILABLE_DETAIL = (
    "El asistente no está disponible en este momento. Inténtalo de nuevo."
)


def _sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _last_user_message(body: ChatRequest) -> str:
    for msg in reversed(body.messages):
        if msg.role == "user":
            return msg.content
    return body.messages[-1].content


@router.post("", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat(
    request: Request,
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> ChatResponse:
    comuna = await resolve_comuna_code(
        db,
        user_id=user.id,
        explicit=body.comuna_code,
        lat=body.lat,
        lon=body.lon,
    )
    try:
        result = await run_chat_agent(
            db,
            user_id=user.id,
            messages=body.messages,
            comuna_code=comuna,
            region_code=body.region_code,
            lat=body.lat,
            lon=body.lon,
        )
    except Exception as exc:
        logger.exception("Chat agent failed for user %s", user.id)
        raise HTTPException(status_code=503, detail=_UNAVAILABLE_DETAIL) from exc

    thread_id = body.thread_id
    if settings.chat_history_enabled:
        thread = await chat_history_service.ensure_thread(
            db,
            user_id=user.id,
            thread_id=body.thread_id,
            first_user_message=_last_user_message(body),
        )
        await chat_history_service.append_turn(
            db,
            thread=thread,
            user_content=_last_user_message(body),
            assistant_content=result.reply,
            tool_trace=result.tool_calls_used,
        )
        thread_id = thread.id

    return ChatResponse(
        reply=result.reply,
        thread_id=thread_id,
        tool_calls_used=result.tool_calls_used,
        sources=result.sources,
    )


@router.post("/stream")
@limiter.limit("20/minute")
async def chat_stream(
    request: Request,
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    comuna = await resolve_comuna_code(
        db,
        user_id=user.id,
        explicit=body.comuna_code,
        lat=body.lat,
        lon=body.lon,
    )

    async def event_gen():
        final_payload = None
        try:
            async for chunk in stream_chat_agent(
                db,
                user_id=user.id,
                messages=body.messages,
                comuna_code=comuna,
                region_code=body.region_code,
                lat=body.lat,
                lon=body.lon,
            ):
                if chunk.startswith("event: done"):
                    # Patch thread_id after persistence
                    try:
                        data_line = chunk.strip().split("\ndata: ", 1)[1]
                        final_payload = json.loads(data_line)
                    except Exception:
                        final_payload = None
                    continue
                yield chunk
        except Exception:
            logger.exception("Chat stream failed for user %s", user.id)
            yield _sse("error", {"detail": _UNAVAILABLE_DETAIL})
            return

        thread_id = body.thread_id
        reply = (final_payload or {}).get("reply") or ""
        tool_calls = (final_payload or {}).get("tool_calls_used") or []
        sources = (final_payload or {}).get("sources") or []

        if settings.chat_history_enabled and reply:
            from app.schemas.chat import ToolCallTrace

            thread = await chat_history_service.ensure_thread(
                db,
                user_id=user.id,
                thread_id=body.thread_id,
                first_user_message=_last_user_message(body),
            )
            traces = [ToolCallTrace.model_validate(t) for t in tool_calls]
            await chat_history_service.append_turn(
                db,
                thread=thread,
                user_content=_last_user_message(body),
                assistant_content=reply,
                tool_trace=traces,
            )
            thread_id = thread.id

        done = {
            "reply": reply,
            "thread_id": thread_id,
            "tool_calls_used": tool_calls,
            "sources": sources,
        }
        yield f"event: done\ndata: {json.dumps(done, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")


@router.get("/threads", response_model=list[ChatThreadSummaryOut])
@limiter.limit("60/minute")
async def list_chat_threads(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> list[ChatThreadSummaryOut]:
    return await chat_history_service.list_threads(db, user.id)


@router.get("/threads/{thread_id}", response_model=ChatThreadDetailOut)
@limiter.limit("60/minute")
async def get_chat_thread(
    request: Request,
    thread_id: str,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> ChatThreadDetailOut:
    detail = await chat_history_service.get_thread(db, user.id, thread_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Thread not found")
    return detail
