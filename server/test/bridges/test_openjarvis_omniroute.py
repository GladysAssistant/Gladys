"""Contract tests for the Bobs Home OpenJarvis bridge."""

import os
import sys
import unittest
import json
from pathlib import Path

os.environ.setdefault("OMNIROUTE_API_KEY", "test-only-key")
os.environ["BOBS_HOME_OPENJARVIS_KEY"] = "test-bridge-key"
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "bridges"))

from fastapi.testclient import TestClient  # noqa: E402
import httpx  # noqa: E402
from openjarvis.engine.openai_compat_engines import OpenAICompatEngine  # noqa: E402
from openjarvis_omniroute import build_app  # noqa: E402


class FakeEngine:
    def __init__(self, result):
        self.result = result
        self.calls = []

    def generate(self, messages, **kwargs):
        self.calls.append((messages, kwargs))
        return self.result


class BridgeTests(unittest.TestCase):
    def test_openjarvis_engine_forwards_tools_images_and_omniroute_key(self):
        captured = []

        def handle_request(request):
            captured.append((request, json.loads(request.content)))
            return httpx.Response(
                200,
                json={
                    "model": "auto",
                    "choices": [
                        {
                            "message": {
                                "content": None,
                                "tool_calls": [
                                    {
                                        "id": "call_1",
                                        "function": {"name": "device_turn_on", "arguments": "{}"},
                                    }
                                ],
                            },
                            "finish_reason": "tool_calls",
                        }
                    ],
                    "usage": {"prompt_tokens": 12, "completion_tokens": 3},
                },
            )

        engine = OpenAICompatEngine(host="http://omni.local", api_key="omni-test")
        engine._client.close()
        engine._client = httpx.Client(
            base_url="http://omni.local",
            headers={"Authorization": "Bearer omni-test"},
            transport=httpx.MockTransport(handle_request),
        )
        client = TestClient(build_app(engine))
        image_content = [
            {"type": "text", "text": "Turn on the light near this camera"},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,AAAA"}},
        ]
        response = client.post(
            "/v1/chat/completions",
            headers={"Authorization": "Bearer test-bridge-key"},
            json={
                "messages": [{"role": "user", "content": image_content}],
                "tools": [{"type": "function", "function": {"name": "device_turn_on"}}],
                "tool_choice": "required",
            },
        )
        engine.close()
        self.assertEqual(response.status_code, 200)
        request, payload = captured[0]
        self.assertEqual(str(request.url), "http://omni.local/v1/chat/completions")
        self.assertEqual(request.headers["authorization"], "Bearer omni-test")
        self.assertEqual(payload["model"], "auto")
        self.assertEqual(payload["tool_choice"], "required")
        self.assertEqual(payload["messages"][0]["content"], image_content)
        self.assertEqual(response.json()["choices"][0]["finish_reason"], "tool_calls")

    def test_preserves_tool_choice_and_multimodal_content(self):
        engine = FakeEngine(
            {
                "content": "",
                "tool_calls": [{"id": "call_1", "name": "device_turn_on", "arguments": "{}"}],
            }
        )
        client = TestClient(build_app(engine))
        content = [
            {"type": "text", "text": "What is this camera showing?"},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,AAAA"}},
        ]
        response = client.post(
            "/v1/chat/completions",
            headers={"Authorization": "Bearer test-bridge-key"},
            json={
                "messages": [{"role": "user", "content": content}],
                "tools": [{"type": "function", "function": {"name": "device_turn_on"}}],
                "tool_choice": "required",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(engine.calls[0][0][0].content, content)
        self.assertEqual(engine.calls[0][1]["tool_choice"], "required")
        self.assertEqual(
            response.json()["choices"][0]["message"]["tool_calls"][0]["function"]["name"],
            "device_turn_on",
        )

    def test_rejects_missing_key(self):
        client = TestClient(build_app(FakeEngine({"content": "hello"})))
        response = client.post(
            "/v1/chat/completions", json={"messages": [{"role": "user", "content": "hi"}]}
        )
        self.assertEqual(response.status_code, 401)

    def test_rejects_required_tool_call_that_model_ignored(self):
        client = TestClient(build_app(FakeEngine({"content": "Done"})))
        response = client.post(
            "/v1/chat/completions",
            headers={"Authorization": "Bearer test-bridge-key"},
            json={
                "messages": [{"role": "user", "content": "turn on light"}],
                "tools": [{"type": "function", "function": {"name": "device_turn_on"}}],
                "tool_choice": "required",
            },
        )
        self.assertEqual(response.status_code, 502)


if __name__ == "__main__":
    unittest.main()
