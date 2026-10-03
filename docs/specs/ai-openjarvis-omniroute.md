# Bobs Home AI via OpenJarvis and OmniRoute

## Purpose and boundaries

The existing Bobs Home chat agent owns conversation history, tool selection,
execution, and the authenticated user's home permissions. OpenJarvis supplies
the inference engine; OmniRoute supplies the model and provider accounts. The
model never receives direct device credentials or a general-purpose shell.

## Configuration

`BOBS_HOME_AI_PROVIDER=openjarvis` selects the local inference path. The server
calls `BOBS_HOME_OPENJARVIS_URL` (default `http://127.0.0.1:8788`) with optional
`BOBS_HOME_OPENJARVIS_KEY`. The bridge requires `OMNIROUTE_API_KEY`, and accepts
`OMNIROUTE_URL` (default `http://127.0.0.1:20128/v1`) and `OMNIROUTE_MODEL`
(default `auto`). Keys are supplied through environment variables and must not
be committed. The bridge loads its own ignored `.env` file and listens on
loopback by default.

Without `BOBS_HOME_AI_PROVIDER=openjarvis`, the existing Gladys Gateway path
continues to work. With OpenJarvis selected, chat does not require a Gladys
Gateway subscription. The model selector exposes only Automatic because
OmniRoute owns model selection. Existing explicit Scaleway model choices are
ignored for the local provider.

The gateway status keeps its `configured` field specific to Gladys Plus and
adds `ai_chat_configured` for the text chat UI. Speech transcription and other
Gladys Plus features continue to depend on `configured`.

## Chat contract

The Bobs Home server sends OpenAI-compatible messages, tools and `tool_choice`
to the local bridge. It strips internal `purpose` and `categories` metadata;
the bridge chooses the configured OmniRoute model. The bridge converts tool
messages to OpenJarvis core messages, preserves multimodal content for
OpenAI-compatible upstreams, and returns an OpenAI chat completion with tool
calls. OpenJarvis's stock `/v1/chat/completions` schema cannot carry
`tool_choice` or multimodal content, so this integration invokes its
`OpenAICompatEngine` from a small dedicated bridge route.

Bobs Home keeps executing its own MCP home tools using the authenticated
user's context. A requested home action must produce a tool call before Bobs
Home can claim it was completed. OmniRoute must route to a model/provider that
supports the requested tool calling and, for camera images, vision. Network
errors surface as chat failures; they do not cause a hidden fallback to another
paid provider or a retry with the tool definitions removed. Pin a tested
tool-capable model when OmniRoute's automatic route selects an unsupported one.

## Deployment

Run OmniRoute with the user's connected provider accounts, then run the bridge
with its endpoint key. Point the Bobs Home server to the bridge and set the
same `BOBS_HOME_OPENJARVIS_KEY` on both sides of that connection. In containers,
use the bridge service hostname rather than `127.0.0.1`. Keep both services on a
trusted network; only the Bobs Home server needs access to the bridge.
