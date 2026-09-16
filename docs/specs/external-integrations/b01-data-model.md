> Part of the [external integrations living spec](README.md) — the section index, the editing rules and the cross-repo map are there.

# B.1 Data model: everything in `t_service`

**No dedicated table.** An external integration is a `t_service` row — it is conceptually the same thing as an internal service, and it avoids the dual identity to keep in sync (status, version, name in two tables). Verified in the code:
- `service.load.js:14` only iterates over the keys of `servicesFromFiles` → dynamically created rows are never touched/overwritten at boot;
- `service.startAll.js:20` iterates over the stateManager and calls `start()` → if the proxy service exposes `start()`/`stop()` delegating to the supervisor, external integrations slot into the existing lifecycle **for free** (including the "`STOPPED` = skipped at startup" rule, which replaces the `enabled` column initially considered);
- `t_service` already has `version`, `status`, and `pod_id` (aligned with the remote integrations mentioned by the RFC).

**`addColumn` migration on `t_service`** (`server/migrations/<timestamp>-add-external-integration-columns.js`, + update of `server/models/service.js`):

| Column | Type | Role |
|---|---|---|
| `type` | ENUM `('internal','external')`, default `'internal'` | ENUM rather than boolean: a future type (`'remote'` off-instance…) fits without a migration (TEXT under SQLite) |
| `docker_image` | STRING nullable | installed image:tag |
| `manifest` | JSON nullable | full manifest |
| `container_id` | STRING nullable | current Docker id |
| `failure_count` | INTEGER default 0 | backoff counter |
| `last_heartbeat` | DATE nullable | |
| `token_version` | INTEGER default 0 | integration JWT invalidation (see B.3) |
| `store_slug` | STRING nullable | link to the store index entry (`owner/repo`) for update detection; null for dev installs |
| `granted_devices` | JSON nullable | hardware access classes **granted by the user** (subset of the classes requested by the manifest, see B.2); null = none |

All nullable/defaulted for existing internal services. **Derivation of the `selector`** (and the `name`): `ext-` prefix to avoid any collision with a future native service (`service.load` looks up by `(pod_id: null, name)`), then — store or `repo_url` install: `ext-<owner>-<repo>` slugified, **unique by construction** (it is the `store_slug`); dev install by image: `ext-dev-<slugified manifest name>`, numeric suffix on collision.

- **Statuses**: reuse the existing `SERVICE_STATUS`, adding **a single value: `DEGRADED`**. Projection of the RFC state machine: Installed→`ENABLED`, Starting→`LOADING`, Running→`RUNNING`, Degraded→`DEGRADED`, Broken→`ERROR`, Stopped→`STOPPED`.
- **Logs: no table, no push.** The integration writes to stdout/stderr; Gladys reads the logs on demand via the Docker API (existing `system.getContainerLogs(container_id)`, equivalent to `docker logs`).
- **Constants** (`server/utils/constants.js`): `SERVICE_STATUS.DEGRADED`, `SERVICE_TYPES`, `EVENTS.EXTERNAL_INTEGRATION.*`, `WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.*` (frontend: `STATUS_CHANGED`, `DISCOVERED_DEVICES_UPDATED`, `CONNECTION_STATUS_UPDATED`, `DEVICE_TRANSPORT_UPDATED`; integration: `DEVICE_SET_VALUE`, `DEVICE_POLL`, `COMMAND_RESULT`, `SCAN_REQUEST`, `DEVICE_CREATED`, `DEVICE_UPDATED`, `DEVICE_DELETED`, `HEARTBEAT`, `CONFIG_UPDATED`, `HARDWARE_UPDATED`, `OAUTH_GET_AUTHORIZE_URL`, `OAUTH_CALLBACK`, `ACTION_RUN`, `CAMERA_GET_IMAGE`), `AUTHENTICATION.INTEGRATION_REQUEST`.
- **Discovered devices: no table.** The list of discovered devices published by each integration is held **in memory** in the supervisor (as internal service handlers do, e.g. philips-hue), lost on restart and republished by the integration on connection.
