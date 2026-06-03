"""Async LiteLLM / OpenAI-compatible client with streaming and tool_use support."""

import json
from typing import Any, AsyncIterator

import httpx

from app.config import get_settings


async def chat_completion_stream(
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]] | None = None,
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> AsyncIterator[dict[str, Any]]:
    """
    Call the LiteLLM / OpenAI-compatible chat completions endpoint with
    streaming enabled.  Yields parsed SSE data chunks.

    Each yielded dict is one parsed ``data: {...}`` line from the SSE stream.
    The caller is responsible for assembling the full response and detecting
    ``[DONE]``.
    """
    settings = get_settings()

    url = f"{settings.LITELLM_BASE_URL.rstrip('/')}/v1/chat/completions"

    headers: dict[str, str] = {
        "Content-Type": "application/json",
    }
    if settings.LITELLM_API_KEY:
        headers["Authorization"] = f"Bearer {settings.LITELLM_API_KEY}"

    payload: dict[str, Any] = {
        "model": settings.LITELLM_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"

    async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=10.0)) as client:
        async with client.stream("POST", url, json=payload, headers=headers) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line:
                    continue
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        yield {"done": True}
                        return
                    try:
                        yield json.loads(data_str)
                    except json.JSONDecodeError:
                        continue


async def chat_completion(
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]] | None = None,
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> dict[str, Any]:
    """
    Non-streaming chat completion call.  Returns the full response JSON.
    """
    settings = get_settings()

    url = f"{settings.LITELLM_BASE_URL.rstrip('/')}/v1/chat/completions"

    headers: dict[str, str] = {
        "Content-Type": "application/json",
    }
    if settings.LITELLM_API_KEY:
        headers["Authorization"] = f"Bearer {settings.LITELLM_API_KEY}"

    payload: dict[str, Any] = {
        "model": settings.LITELLM_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"

    async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=10.0)) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()
