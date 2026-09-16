> Part of the [external integrations living spec](README.md) — the section index, the editing rules and the cross-repo map are there.

# C.8 JS SDK: public API of `@gladysassistant/integration-sdk`

Complete example (the demo fits in ~40 lines):

```js
const { GladysIntegration } = require('@gladysassistant/integration-sdk');

// All options are read from the container's env vars (C.7) by default;
// they can be overridden for development outside Docker.
const gladys = new GladysIntegration();

gladys.onScanRequest(async () => {
  await gladys.publishDiscoveredDevices([
    {
      name: 'Virtual switch',
      external_id: gladys.externalId('switch'),
      features: [
        {
          name: 'On/Off',
          external_id: gladys.externalId('switch:binary'),
          category: 'switch',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true,
          keep_history: true
        }
      ]
    }
  ]);
});

gladys.onSetValue(async (device, feature, value) => {
  // resolving = ack success:true; throwing = ack success:false + message
  await gladys.publishState(feature.external_id, value);
});

gladys.onConfigUpdated(async (config) => {
  console.log('New config', config); // stdout → docker logs
});

await gladys.connect(); // resolves once authenticated
```

**Constructor** — `new GladysIntegration(options?)`: `hostApiUrl` (default `GLADYS_HOST_API_URL`), `token` (default `GLADYS_INTEGRATION_TOKEN`), `selector` (default `GLADYS_INTEGRATION_SELECTOR`). Throws immediately if a value is missing (neither option nor env var).

**Methods** (all return Promises; HTTP errors are thrown as `GladysApiError { status, code, message }`):

| Method | Contract |
|---|---|
| `connect()` | opens the WS, authenticates (`authenticate.integration-request`), **resynchronizes** (`GET /device` + `GET /config`, see C.4 reliability), then resolves. Automatic reconnection for life with backoff `min(1s·2^n, 60s)`; each reconnection redoes auth + resync |
| `disconnect()` | closes cleanly (no more reconnection) |
| `externalId(suffix)` | helper → `` `ext:${selector}:${suffix}` `` (the only documented way to build an `external_id`) |
| `publishDiscoveredDevices(devices)` | `POST /discovered_device` (complete list, replaces the previous one — max 2000 devices, 20 MB body, see C.3) |
| `getDevices()` | `GET /device` → devices created by the user; also updates `gladys.devices` |
| `getHouses()` | `GET /house` → houses with their coordinates (requires `location: true` in the manifest, see C.1/C.3; `latitude`/`longitude` nullable, several houses possible) |
| `publishState(featureExternalId, value)` | `POST /state` — `value` number, or `{ text }`, or `{ state, created_at }` for a past state |
| `publishStates(states)` | batch `POST /state` (max 100, see C.3) |
| `publishCameraImage(deviceExternalId, imageBase64)` | `POST /camera/image` — a camera's new image (format `image/jpg;base64,...`, ≤ 150 KB, see C.3) |
| `publishTransports(transports)` | batch `POST /device/transport` — `[{ external_id, transport: 'local' \| 'cloud' \| 'unreachable', degraded?, message? }]` (pills + degraded state, see C.3); the user preference arrives in `gladys.config.GLADYS_PREFER_LOCAL` |
| `getConfig()` / `setConfig(partialConfig)` | `GET` / `POST /config`; `getConfig` also updates `gladys.config` |
| `getStatus()` | `GET /status` |
| `setConnectionStatus(connected, message?)` | `POST /connection_status` — application-level status displayed in the UI (C.3); optional multi-language `message` |
| `getContainers()` | `GET /container` → declared sub-containers, state, desired state, assigned host ports (C.3) |
| `startContainer(name, { env }?)` | `POST /container/:name/start` — typically after generating its config files in `/data` (the Mosquitto pattern, see B.2); optional `env` for values computed at runtime |
| `stopContainer(name)` | `POST /container/:name/stop` — the supervisor will not restart it |
| `restartContainer(name)` | `POST /container/:name/restart` — after rewriting its config via `/data` (the Frigate pattern, see B.2) |

**Handlers** (registered before `connect()`; **automatic ack** for commands: the handler resolves → `command-result success:true` — and if the resolved value is not `undefined`, it goes into `data` (C.4) —, it throws → `success:false` with `error.message`, handler absent → `success:false "not implemented"`):

| Handler | Callback signature |
|---|---|
| `onSetValue(cb)` | `(device, deviceFeature, value) => Promise` |
| `onPoll(cb)` | `(device) => Promise` (respond by publishing the states via `publishState`) |
| `onGetImage(cb)` | `(device) => Promise<string>` — capture and resolve a fresh image (`image/jpg;base64,...`); it goes into `data.image` (C.4, 15 s delay) |
| `onScanRequest(cb)` | `() => Promise` (respond via `publishDiscoveredDevices`) |
| `onDeviceCreated(cb)` / `onDeviceUpdated(cb)` / `onDeviceDeleted(cb)` | `(device) => Promise` |
| `onConfigUpdated(cb)` | `(config) => Promise` (complete values, see C.4) |
| `onHardwareUpdated(cb)` | `(containers) => Promise` — the hardware grants changed (C.4): regenerate the affected configs then `startContainer`/`restartContainer` |
| `onOAuthAuthorizeUrl(cb)` | `(key, redirectUri) => Promise<string>` — build the authorization URL (client_id from the config, scopes, `state` generated and retained); the resolved string goes into `data.authorize_url` |
| `onOAuthCallback(cb)` | `(key, { code, state, redirectUri }) => Promise` — verify `state`, exchange the tokens, store them via `setConfig` (keys outside the schema), then `setConnectionStatus(true)` |
| `onAction(key, cb)` | `(fields) => Promise<string \| object>` — handler of a declared action (C.1), registered by `key`; the resolved value goes into `data.message` (the ack delay is the action's `timeout_seconds`) |
| `onWeatherGet(cb)` | `(options) => Promise<object>` — "weather" type only (B.18): `options = { latitude, longitude, language, units }`; resolve the pivot weather format (values in the requested unit system), it goes into `data.weather` (C.4, 15 s delay) |
| `onWeatherGetImage(cb)` | `(key) => Promise<string>` — "weather" type only (B.18 point 6): resolve the raw base64 (no data-URI prefix) of the declared image (PNG/JPEG, ≤ 500 KB decoded); it goes into `data.image` (C.4, 15 s delay) |
| `requestWeatherRefresh()` | fire-and-forget freshness nudge (C.4, B.18 point 5): asks the core to re-pull the weather now and re-evaluate the alert scene triggers; rate-limited core-side (1/min, silently dropped) |

**Local state held by the SDK** (refreshed on every (re)connection and by the `device-created/updated/deleted` and `config-updated` events): `gladys.devices` (array), `gladys.config` (object), `gladys.connected` (boolean). Observable lifecycle: `gladys.on('connected')`, `gladys.on('disconnected')` (the class extends `EventEmitter`) — useful to suspend a poll while Gladys is unreachable.

**Behavior guarantees**: answers protocol-level WS pings (native to the `ws` lib); logs nothing by default (stdout belongs to the integration) except with `DEBUG=gladys-integration-sdk`; no state persisted to disk by the SDK (everything resynchronizes, `/data` stays in the integration's hands); an unknown message type is silently ignored (forward compatibility, see C.4).
