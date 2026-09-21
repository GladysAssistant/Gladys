> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# B.4 REST host API — `/api/integration/v1/`

Prefix outside the user-facing `/api/v1/`, versioned by URL. Controller `server/api/controllers/integrationHost.controller.js`, routes in `server/api/routes.js`. **Detailed contracts (request/response bodies) in C.2–C.3.**

**The host API allows neither device creation nor deletion.** The integration publishes its discovered devices; creation/edition/deletion remains a user gesture in the UI (via the standard `POST /api/v1/device`, as for internal integrations).

| Endpoint | Mapping |
|---|---|
| `POST /discovered_device` (batch, replaces the list) | stored in memory by the supervisor (`external_id`s forced to the `ext:<selector>:` prefix); frontend push `DISCOVERED_DEVICES_UPDATED`; the supervisor flags those already created in DB (match on `external_id`) and **silently upserts their `params` and their features' `supported_options`** (see C.3) |
| `GET /device` | **read only**: the integration's devices actually created by the user (`service_id` forced) — lets the integration know what to drive/poll at startup |
| `POST /state` (batch) | `EVENTS.DEVICE.NEW_STATE` (the native services' path); rate limit 300 states/min (see C.3) |
| `POST /camera/image` | `gladys.device.camera.setImage` — new image from one of the integration's cameras (≤ 150 KB, 12/min per device, see C.3) |
| `GET/POST /config` | `gladys.variable.getValue/setValue(key, service_id)` (config + secrets in core DB) |
| `POST /heartbeat`, `GET /status` | HTTP fallback + status at SDK boot |

**No logs endpoint**: the integration does not push its logs, it simply writes to stdout/stderr and Gladys reads them via the Docker API (existing `system.getContainerLogs(container_id)`, equivalent to `docker logs`). Much simpler, and it works in every language without an SDK.

Do **not** expose these routes through the Gladys Plus gateway (`setupGateway`).
