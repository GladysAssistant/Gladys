# OpenJarvis + OmniRoute for Bobs Home

This bridge uses OpenJarvis's `OpenAICompatEngine` for inference. Bobs Home's
existing MCP tool loop executes device and scene actions with the current
user's permissions. OmniRoute selects a model from the provider accounts you
already connected to it.

1. Start OmniRoute and connect a provider in its dashboard. Copy the endpoint
   key from **Dashboard → Endpoints**. The provider must accept external
   OpenAI-compatible chat requests; OpenCode Free rejected requests outside
   OpenCode during validation of this integration.
2. Install Python 3.11+ and, from this directory, run
   `uv venv --python 3.11 .venv` and
   `uv pip install --python .venv/Scripts/python.exe -r requirements.txt`
   on Windows (use `.venv/bin/python` on Linux/macOS).
3. In this directory's ignored `.env`, set `OMNIROUTE_API_KEY` to that endpoint
   key, `OMNIROUTE_URL=http://127.0.0.1:20128/v1`, and
   `OMNIROUTE_MODEL=auto` (or a tested provider/model ID when `auto` selects an
   unsupported model). Set a separate private
   `BOBS_HOME_OPENJARVIS_KEY` for the bridge. Start it with
   `.venv/Scripts/python.exe -m uvicorn openjarvis_omniroute:app --host 127.0.0.1 --port 8788`.
4. In the Bobs Home server's ignored `.env`, set `BOBS_HOME_AI_PROVIDER=openjarvis`,
   `BOBS_HOME_OPENJARVIS_URL=http://127.0.0.1:8788`, and the same
   `BOBS_HOME_OPENJARVIS_KEY`. Restart the Bobs Home server.

For Docker, use service hostnames on a private network in both URLs. Keep keys
in environment or secret storage, never in the repository. The bridge only
handles non-streaming chat completions. Use an OmniRoute route whose model
supports tool calling; camera image analysis also requires vision support. If
OmniRoute rejects a request, the bridge returns an error rather than retrying
without tools.

Test the bridge with `GET /health`, then ask Bobs Home to read a device state
and change a device. Check the Bobs Home chat's tool trace to confirm the
action actually ran.
