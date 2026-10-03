"""Local Bobs Home inference bridge backed by OpenJarvis and OmniRoute."""

import asyncio
import hmac
import os
import time
import uuid

from fastapi import FastAPI, Header, HTTPException
from openjarvis.core.types import Message, Role, ToolCall
from openjarvis.engine.openai_compat_engines import (
    OpenAICompatEngine,
    normalize_openai_base_url,
)


def build_app(engine=None):
    """Build the bridge with an injectable OpenJarvis engine for testing."""
    endpoint_key = os.environ.get("BOBS_HOME_OPENJARVIS_KEY", "")
    model = os.environ.get("OMNIROUTE_MODEL", "auto")
    if engine is None:
        omni_key = os.environ.get("OMNIROUTE_API_KEY", "")
        if not omni_key:
            raise RuntimeError("OMNIROUTE_API_KEY must be configured")
        engine = OpenAICompatEngine(
            host=normalize_openai_base_url(
                os.environ.get("OMNIROUTE_URL", "http://127.0.0.1:20128/v1")
            ),
            api_key=omni_key,
        )

    app = FastAPI(title="Bobs Home OpenJarvis bridge")

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.post("/v1/chat/completions")
    async def chat_completions(body: dict, authorization: str = Header(default="")):
        if endpoint_key and not hmac.compare_digest(authorization, f"Bearer {endpoint_key}"):
            raise HTTPException(status_code=401, detail="Invalid bridge key")
        raw_messages = body.get("messages")
        if not isinstance(raw_messages, list) or not raw_messages:
            raise HTTPException(status_code=400, detail="messages must be a nonempty list")
        if body.get("stream"):
            raise HTTPException(status_code=400, detail="streaming is not supported")

        messages = []
        for raw in raw_messages:
            if not isinstance(raw, dict) or raw.get("role") not in Role._value2member_map_:
                raise HTTPException(status_code=400, detail="Invalid message role")
            calls = raw.get("tool_calls") or []
            messages.append(
                Message(
                    role=Role(raw["role"]),
                    content=raw.get("content"),
                    name=raw.get("name"),
                    tool_call_id=raw.get("tool_call_id"),
                    tool_calls=[
                        ToolCall(
                            id=call.get("id", ""),
                            name=call.get("function", {}).get("name", ""),
                            arguments=call.get("function", {}).get("arguments", "{}"),
                        )
                        for call in calls
                    ] or None,
                )
            )

        kwargs = {}
        if body.get("tools"):
            kwargs["tools"] = body["tools"]
            kwargs["tool_choice"] = body.get("tool_choice", "auto")
        result = await asyncio.to_thread(
            engine.generate,
            messages,
            model=model,
            temperature=body.get("temperature", 0.7),
            max_tokens=body.get("max_tokens", 1024),
            **kwargs,
        )
        if kwargs.get("tool_choice") == "required" and not result.get("tool_calls"):
            raise HTTPException(status_code=502, detail="The selected model did not return a required tool call")
        tool_calls = [
            {
                "id": call.get("id", ""),
                "type": "function",
                "function": {
                    "name": call.get("name", ""),
                    "arguments": call.get("arguments", "{}"),
                },
            }
            for call in result.get("tool_calls", [])
        ]
        return {
            "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": result.get("model", model),
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": result.get("content", ""),
                        "tool_calls": tool_calls or None,
                    },
                    "finish_reason": result.get("finish_reason", "stop"),
                }
            ],
            "usage": result.get("usage", {}),
        }

    return app


app = build_app()
