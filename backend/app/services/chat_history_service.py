"""Persist and load assistant chat threads."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat_thread import ChatMessage, ChatThread
from app.schemas.chat import (
    ChatMessageOut,
    ChatThreadDetailOut,
    ChatThreadSummaryOut,
    ToolCallTrace,
)


def _title_from_message(content: str) -> str:
    cleaned = " ".join(content.strip().split())
    if len(cleaned) <= 72:
        return cleaned or "Nueva conversación"
    return cleaned[:69] + "…"


async def list_threads(session: AsyncSession, user_id: str) -> list[ChatThreadSummaryOut]:
    stmt = (
        select(
            ChatThread,
            func.count(ChatMessage.id).label("message_count"),
        )
        .outerjoin(ChatMessage, ChatMessage.thread_id == ChatThread.id)
        .where(ChatThread.user_id == user_id)
        .group_by(ChatThread.id)
        .order_by(ChatThread.updated_at.desc())
        .limit(50)
    )
    rows = (await session.execute(stmt)).all()
    out: list[ChatThreadSummaryOut] = []
    for thread, message_count in rows:
        out.append(
            ChatThreadSummaryOut(
                id=thread.id,
                title=thread.title,
                created_at=thread.created_at,
                updated_at=thread.updated_at,
                message_count=int(message_count or 0),
            )
        )
    return out


async def get_thread(
    session: AsyncSession, user_id: str, thread_id: str
) -> ChatThreadDetailOut | None:
    stmt = (
        select(ChatThread)
        .where(ChatThread.id == thread_id, ChatThread.user_id == user_id)
        .options(selectinload(ChatThread.messages))
    )
    thread = (await session.execute(stmt)).scalar_one_or_none()
    if thread is None:
        return None
    return ChatThreadDetailOut(
        id=thread.id,
        title=thread.title,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        messages=[
            ChatMessageOut(
                id=m.id,
                role=m.role,
                content=m.content,
                tool_trace=m.tool_trace,
                created_at=m.created_at,
            )
            for m in thread.messages
        ],
    )


async def ensure_thread(
    session: AsyncSession,
    *,
    user_id: str,
    thread_id: str | None,
    first_user_message: str,
) -> ChatThread:
    if thread_id:
        thread = await session.get(ChatThread, thread_id)
        if thread is not None and thread.user_id == user_id:
            return thread

    thread = ChatThread(
        user_id=user_id,
        title=_title_from_message(first_user_message),
        updated_at=datetime.now(timezone.utc),
    )
    session.add(thread)
    await session.flush()
    return thread


async def append_turn(
    session: AsyncSession,
    *,
    thread: ChatThread,
    user_content: str,
    assistant_content: str,
    tool_trace: list[ToolCallTrace],
) -> None:
    now = datetime.now(timezone.utc)
    session.add(
        ChatMessage(thread_id=thread.id, role="user", content=user_content, created_at=now)
    )
    session.add(
        ChatMessage(
            thread_id=thread.id,
            role="assistant",
            content=assistant_content,
            tool_trace=[t.model_dump() for t in tool_trace] or None,
            created_at=now,
        )
    )
    thread.updated_at = now
    await session.commit()
