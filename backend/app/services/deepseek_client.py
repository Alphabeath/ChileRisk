"""Shared DeepSeek (OpenAI-compatible) async client factory."""

from openai import AsyncOpenAI

from app.config import settings


def get_deepseek_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_base_url,
    )
