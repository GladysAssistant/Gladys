> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# B.5 Integration WebSocket

Extend `server/api/websockets/index.js` (same WSS, new `case` in the switch): message `AUTHENTICATION.INTEGRATION_REQUEST { token }` → integration JWT validation (signature + audience + `token_version`, see B.3) → `gladys.externalIntegration.integrationConnected(service, ws)`. Heartbeat: `ws.ping()` every 20 s + `isAlive` flag on `pong` + application-level `HEARTBEAT` message (updates `last_heartbeat`); 2 missed pings → DEGRADED. Reconnection handled by the SDK (backoff), a reconnection replaces the previous entry.

**Full protocol (types and payloads) specified in C.4.** Downstream messages (core→integration):
- **specific commands** (one type per action, no generic type): `DEVICE_SET_VALUE`, `DEVICE_POLL` — each carries a `message_id` and expects a `COMMAND_RESULT` ack (see B.6);
- `SCAN_REQUEST`: (re)discovery request triggered from the UI's Discovery tab — the integration responds by republishing via `POST /discovered_device`;
- `DEVICE_CREATED` / `DEVICE_UPDATED` / `DEVICE_DELETED { device }`: relayed by the proxy service's `postCreate`/`postUpdate`/`postDelete` hooks — the core already calls them on the owning service on every user gesture (verified: `server/lib/device/device.notify.js`). The integration thus knows immediately which devices to track or drop, without polling.
