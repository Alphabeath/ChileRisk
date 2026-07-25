#!/usr/bin/env python3
"""Spike: DeepSeek OpenAI-compatible tool calling (no ChileRisk DB).

Usage:
  DEEPSEEK_API_KEY=sk-... python scripts/spike_deepseek_tools.py

Validates that the model can request a tool and consume the tool result.
"""

from __future__ import annotations

import json
import os
import sys


def mock_get_weather(location: str) -> str:
    return json.dumps({"location": location, "temp_c": 18, "condition": "nublado"})


def main() -> int:
    api_key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if not api_key:
        print("SKIP: set DEEPSEEK_API_KEY to run the live spike", file=sys.stderr)
        return 0

    try:
        from openai import OpenAI
    except ImportError:
        print("Install openai package first: pip install openai", file=sys.stderr)
        return 1

    client = OpenAI(api_key=api_key, base_url=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com"))
    model = os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-flash")

    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get weather for a city",
                "parameters": {
                    "type": "object",
                    "properties": {"location": {"type": "string"}},
                    "required": ["location"],
                },
            },
        }
    ]

    messages: list[dict] = [
        {"role": "user", "content": "¿Cómo está el clima en Santiago de Chile?"}
    ]

    first = client.chat.completions.create(model=model, messages=messages, tools=tools)
    msg = first.choices[0].message
    print("assistant1:", msg.content)
    print("tool_calls:", msg.tool_calls)

    if not msg.tool_calls:
        print("FAIL: expected a tool call")
        return 1

    messages.append(msg.model_dump(exclude_none=True))
    for call in msg.tool_calls:
        args = json.loads(call.function.arguments or "{}")
        result = mock_get_weather(args.get("location", "unknown"))
        messages.append(
            {"role": "tool", "tool_call_id": call.id, "content": result}
        )

    second = client.chat.completions.create(model=model, messages=messages, tools=tools)
    final = second.choices[0].message.content
    print("assistant2:", final)
    print("OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
