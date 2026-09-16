> Part of the [external integrations living spec](README.md) — the section index, the editing rules and the cross-repo map are there.

# C. Interface specification (v1 contracts)

General conventions, aligned with the existing code:
- **REST**: JSON exclusively; errors in the standard Gladys format `{ "status": <HTTP code>, "code": "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "BAD_REQUEST" | "UNPROCESSABLE_ENTITY" | ..., "message": "..." }` (produced by `errorMiddleware`).
- **WebSocket**: existing envelope `{ "type": "<namespace.kebab-case>", "payload": { ... } }` (`formatWebsocketMessage`).
- **Dates**: ISO 8601 UTC. **External identifiers**: every integration `external_id` is prefixed `ext:<selector>:` (the server rejects everything else).
