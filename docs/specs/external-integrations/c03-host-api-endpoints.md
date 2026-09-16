> Part of the [external integrations living spec](README.md) — the section index, the editing rules and the cross-repo map are there.

# C.3 Host API: endpoints

**`GET /api/integration/v1/status`** → `200`
```json
{ "gladys_version": "4.62.0", "service": { "id": "uuid", "selector": "ext-open-meteo-demo", "status": "RUNNING", "version": "1.2.0" } }
```

**`POST /api/integration/v1/heartbeat`** — body `{}` → `200 { "success": true }` (HTTP fallback of the WS heartbeat).

**`POST /api/integration/v1/connection_status`** — body `{ "connected": false, "message": { "en": "Token expired, please reconnect.", "fr": "Token expiré, reconnectez-vous." } }` (`message` optional, multi-language with `en` fallback) → `200 { "success": true }`. The integration's **application-level status** ("connected to Netatmo", "token expired"…), held in memory by the supervisor, exposed in the detail (C.5), displayed on the Configuration screen and pushed to the frontend (`connection-status-updated`, C.4). Distinct from the container state machine (B.2): a cloud integration can be `RUNNING` (healthy container, WS connected) and yet disconnected from its third-party service — without this channel, it would be silently broken. The `message` is rendered as escaped plain text with its line breaks preserved, like every free-form text published by an integration (see the actions section in C.1).

**`POST /api/integration/v1/discovered_device`** — publishes the **complete** list of discovered devices (replaces the previous one). Device object = standard Gladys format, without `service_id` or `selector` (forced server-side — a published `selector`, on the device or on a feature, is **dropped**):
```json
{
  "devices": [
    {
      "name": "Météo Paris",
      "external_id": "ext:open-meteo-demo:paris",
      "features": [
        {
          "name": "Température",
          "external_id": "ext:open-meteo-demo:paris:temperature",
          "category": "temperature-sensor",
          "type": "decimal",
          "unit": "celsius",
          "min": -50,
          "max": 60,
          "read_only": true,
          "has_feedback": false,
          "keep_history": true
        }
      ],
      "params": [{ "name": "CITY", "value": "paris" }]
    }
  ]
}
```
→ `200 { "success": true, "count": 1 }`. Rules: prefixed `external_id`s (device **and** features), `category`/`type`/`unit` within Gladys's standard lists (`DEVICE_FEATURE_CATEGORIES`/`TYPES`/`UNITS`), max 2000 devices (discovery is fleet-wide: a network integration publishes one entry per client on the network, ~1000 on a large setup), `400` otherwise. Optional device-level field **`poll_frequency`** (values from the existing `DEVICE_POLL_FREQUENCIES`: 1 s to 60 s) to receive `device.poll` from the core scheduler once the device is created. Optional feature-level field **`supported_options`** (`[{ value, label, sort_order }]`, integer or non-empty string values, a required non-empty `label`, no duplicate values — an integer and its string form count as duplicates —, `sort_order` defaulted to the array index — violations are `400`) declares, for an enum-like feature, the subset of values *this* device actually supports: the taxonomy defines the full generic value set and the integration narrows it per device, never the other way round (see `device-feature-categories.md`, rule 6). String values are only accepted on the `text`/`select` feature type (dynamic selects: installed TV apps, HDMI sources… — the state is the selected value, stored as a string, no history); a string option on any other feature is a `400`, enum-like features keep integer values. It travels untouched to the Discovery screen and then to `device.create`, which persists it; the frontend then offers only the declared options. Optional feature-level field **`step`** (finite number > 0, `400` otherwise), the resolution the **physical device** accepts for a setpoint — `0.5` for an air conditioner steppable by half a degree, which the dashboard's `+`/`-` buttons then honor. Absent or `null` means "nothing declared" and the UI keeps its per-category default: the step is the device's business, and no category default can be right for every unit of that category. On the **update** of an already-created feature, clearing a step that was declared before takes an explicit `step: null` — an absent key leaves the stored value untouched, as for every other optional column (`unit`, `min`, `max`): `instance.update()` only writes the keys it is given.

A feature may carry an optional **`supported_options`** array (`[{ "value": 1, "label": "Entrée", "sort_order": 0 }]`) — the labeled option list of enumerated features: camera presets and supported movements (`docs/specs/camera-ptz-control.md`), AC/fan modes… Validated at publish time (integer `value`s, unique, non-empty `label`s, `400` otherwise); the standard `POST /api/v1/device` then persists it in `t_device_feature_supported_option` when the user creates the device. On re-publish, the options of **already-created** devices are silently upserted like the `params` (they are the integration's technical data — e.g. a preset renamed on the camera): synced by feature `external_id` when the published feature carries a `supported_options` array, no user gesture, no device-updated echo back to the integration.

**Selector uniqueness is the core's job, `external_id` uniqueness is the integration's.** The `selector` of a device — and of a feature — is derived from its name at creation (`addSelector` hook) and the column is unique in DB: two devices sharing a name (a Spotify fleet where every device is named "MacBook Pro de …", a "Volume" feature on each speaker) used to make the second creation fail with a `409` that the user could not work around, the selector not being part of what the Discovery screen posts. Creation now resolves a **free** selector (`buildUniqueSelector`, `server/utils/addSelector.js`): the readable slug when it is available, then `-2`, `-3`… and random characters past twenty homonyms. Feature selectors are resolved one at a time within a device, so two features of the same batch cannot pick the same candidate. This is deliberately **not** delegated to the integration: the selector is unique across `t_device` as a whole, all integrations combined — a perimeter a container cannot see — and it is a core-owned, user-facing identifier (scenes, API, MQTT). The integration only guarantees the uniqueness of its `external_id`s, which it can (they are prefixed `ext:<selector>:`).

**Payload size**: the whole host API (`/api/integration/v1/*`) accepts a **20 MB** JSON body, against the 100 kB of the routes serving the frontend — the endpoints here are batch by construction and the device count, not the byte count, must be the binding limit. This endpoint in particular cannot be split: publishing **replaces** the previous list, so a second call would erase the first. A device with many features is heavy (a Shelly Pro 3EM exposes 24 features, ~8 kB serialized): under the frontend bound, discovery died around a dozen devices and the user simply saw nothing. Over the bound the core answers `413 PAYLOAD_TOO_LARGE` (never an opaque `500`), so the integration can say so instead of failing silently.

**Reserved `GLADYS_*` params**: `params` names prefixed `GLADYS_` are reserved for the semantics defined by this spec — any undefined `GLADYS_*` key → `400`. Defined in v1: **`GLADYS_TRANSPORT`** = `"local"` | `"cloud"` | `"unreachable"`, the device's **effective transport status**. It is the generic pattern of dual-channel integrations (Tuya cloud+LAN, Shelly, eWeLink/Sonoff, Somfy TaHoma, Netatmo cameras, Zendure local MQTT…): the transport can differ from one device to another and change over time, and without a visible indication the user cannot diagnose a slow or frozen device. The integration sets it at discovery and keeps it up to date (republication, or the dedicated `POST /device/transport` endpoint below); Gladys renders it as a **pill** on the devices (B.8). Purely declarative: **no routing semantics on the core side**, the cloud/local "kitchen" stays in the container.

Two more reserved keys cover the **degraded state** — the "it works, but not as intended" case, which the three transport values cannot express (field case: device detected by the local scan, but local sessions refused — rotated local key, another client holding the connection… — → falls back to cloud; the user sees a perfectly normal "cloud" pill and nothing invites them to investigate): **`GLADYS_TRANSPORT_DEGRADED`** (`"true"`, absent otherwise) and **`GLADYS_TRANSPORT_MESSAGE`** (multi-language object serialized as JSON, `en` required, ≤ 200 characters per language — the reason, e.g. "Local detected but sessions refused, falling back to cloud"). Degraded is deliberately **orthogonal to the transport** — not a 4th enum value: "which channel is used right now" and "is this the nominal state" are two pieces of information, and it is their combination ("cloud + degraded") that enables diagnosis.

**Republication of an already-created device** (same `external_id`): the `params` are the **integration's technical data** — the supervisor compares them with those in DB and **silently upserts** them (add/update by `name`): a LAN IP that changes under DHCP, a cloud→local switch after a scan, without deleting/recreating the device. The features' **`supported_options`** get the same treatment (matched by feature `external_id`, synced only when the published feature carries the array — e.g. a camera preset renamed on the camera, see `docs/specs/camera-ptz-control.md` A.3). The `name`, the room and the rest of the features remain untouched (the user's property), and there is **no `device-updated` echo** to the integration (it is its own publication — otherwise a loop). If the published **structure** differs (features added/modified), the Discovery screen offers "Update" (B.8): a user gesture, via the standard `POST /api/v1/device`.

**`keep_history` is a published default, then a user setting.** The integration publishes it because it is the only one that knows whether a feature is worth historizing at all, but as soon as the device exists the choice belongs to the user, like the device name and its room (field feedback, topic 10615: Zigbee2mqtt and the MQTT virtual devices already offer the per-feature toggle, external integrations did not). The **Devices** screen of the integration therefore exposes, per feature, the standard "Keep state history?" switch — the only editable part of a feature definition there, everything else (name, category, type, unit, bounds) stays the integration's — and saving goes through the standard `POST /api/v1/device`, which purges the stored history of a feature just switched off, exactly as for an internal service. Text features carry no switch: a string state is never historized. The setting **survives re-publication**: `getDiscoveredDevices` reinjects the `keep_history` stored in DB over the published value on every feature of an already-created device (matched by `external_id`), so the "Update" gesture applies the new structure without silently restoring the integration's default. It plays no part in `structure_changed` — the published signature ignores it, a `keep_history` flipped in a new integration version is not a structural change and must not push the user to update.

**Energy tracking is derived by the core, never by the integration.** A device publishing a **cumulative energy index** (`ENERGY_INDEX_FEATURE_TYPES`: `energy-sensor`/`index`, `energy-sensor`/`energy`, `switch`/`energy`, the `teleinformation` indexes) gets its **30-minutes consumption** feature and its **cost** feature added by the supervisor when the Discovery screen reads the list (`getDiscoveredDevices`), through the very same `addEnergyFeatures` helper Zigbee2mqtt and Tasmota already use. External ids are deterministic (`<index external_id>_consumption` and `_cost`), the consumption feature hangs off the index (`energy_parent_id`) and the cost off the consumption, and the index itself is attached to the **main electric meter** configured in the energy settings when the user has not attached it elsewhere. The whole energy-monitoring pipeline (30-minutes deltas, cost per contract, dashboard widgets, weekly digest) is service-agnostic, so it then works with no extra code in the container: **an integration declares its meter index and nothing else** — publishing the derived features itself is not the contract and duplicates nothing (they are matched on their `external_id`).

Consequences of this derivation:

- the derived features are **the core's, not the integration's**: they carry no state published over `POST /state` (the core computes them), the integration is free to ignore them entirely, and — like every published feature — their `selector` is resolved at creation by `buildUniqueSelector`, not by the container;
- an already-created device whose derived features are missing (created before this behavior existed, or index added later) shows as **`structure_changed`** in the Discovery screen: the user's "Update" gesture adds them, through the standard `POST /api/v1/device`, with no intervention from the integration;
- on republication, the derived features already in DB are reinjected with their **DB identity** before the derivation, so an "Update" updates those rows instead of duplicating them — including those an integration derived **itself** before the core did (found back through their `energy_parent_id`, reinjected under the deterministic name, so the "Update" renames the existing rows and their history survives the migration). A derived feature is dropped when its index feature **disappeared** from the publication or **stopped being an index** (type changed), and an integration still publishing them itself is never reinjected twice;
- the params holding the **cursors of the 30-minutes pipeline** (`ENERGY_INDEX_LAST_PROCESSED*`, `ENERGY_PRODUCTION_INDEX_LAST_PROCESSED*`) are reinjected the same way: they are the core's, the integration knows nothing about them, and `POST /api/v1/device` deletes the params missing from its payload — without this, an "Update" would restart the pipeline from scratch (skipped or rebuilt windows);
- the published in-memory list stays untouched — the derivation works on a copy, `POST /discovered_device` still round-trips exactly what the integration sent.

**`POST /api/integration/v1/device/transport`** — body `{ "transports": [ { "device_external_id": "ext:tuya-demo:plug1", "transport": "cloud", "degraded": true, "message": { "en": "Local session refused, falling back to cloud", "fr": "Session locale refusée, bascule cloud" } } ] }` (batch ≤ 100; `degraded` default `false`, `message` optional and only honored if `degraded`) → `200 { "success": true }`. Updates the affected devices' `GLADYS_TRANSPORT*` params **without republishing the discovered list** (the lightweight path for hot switches: the cloud link drops → `unreachable`, the LAN comes back → `local`) — an entry without `degraded` **clears** the degraded params (explicit return to nominal, no ghost orange state) — and pushes `device-transport-updated` to the frontend (real-time pills). Value outside `local|cloud|unreachable`, or `message` without `en` → `400`; an unknown `device_external_id` is silently ignored.

**`GET /api/integration/v1/device`** → `200 [ <device> ]` — the integration's devices **actually created by the user** (full standard format: `id`, `selector`, `features` with their `selector`/`last_value`, `params`).

**`GET /api/integration/v1/house`** → `200 [ { "id", "name", "selector", "latitude", "longitude" } ]` — the houses configured in Gladys, sorted by name (field need from the vigieau port, and generic to every geo-dependent integration: weather, air quality, pollen… the location is entered once in the core instead of being re-asked in each integration's config). **Requires `location: true` in the manifest** (shown on the install screen), `403 FORBIDDEN` otherwise — the home location is sensitive personal data, so access follows the same server-side-enforced authorization contract as the network captures. `latitude`/`longitude` are `null` when the user has not located the house, and several houses may exist: the integration handles both cases. Only these five fields are returned — never the alarm mode, code or delay. Coordinates change rarely: fetching at startup (and at reconnection) is the nominal pattern, there is no dedicated update event in v1.

**A `type: "weather"` integration needs neither this endpoint nor `location: true`**: the coordinates reach it in the `options` of every `weather.get` (B.18). The two patterns split on **who owns the use case**. When the *core* owns it, the core knows which house it is asking about and passes the coordinates in the request — scoped to that call, nothing to pull. `GET /house` is for the other direction: an integration that owns its own geo-dependent logic (water restrictions, pollen, air quality…), polls a third party at its own pace and publishes devices and states through the generic path — there is no core→integration call to carry the coordinates, so it pulls them itself. Growing a core capability per domain would not scale; that is precisely what the generic device/state path avoids.

**Known limit — the declaration is re-read at each update.** The gate reads the **stored** manifest, and an update replaces it wholesale (`externalIntegration.update.js`): an integration installed without `location` that adds `location: true` in a later version gains access as soon as the admin updates it, with no second disclosure. This is the same behavior as `network_discovery` and `webhooks`, and it differs from the hardware classes, whose grant is persisted apart from the manifest in `t_service.granted_devices` and therefore survives updates. Making consent survive updates for the declarative contracts (re-prompting when a new authorization request appears) is a design decision that spans all of them at once, not just this endpoint — it is left out of scope here and stated openly rather than implied away.

**`POST /api/integration/v1/state`** — batch of states, mapped onto `EVENTS.DEVICE.NEW_STATE` (same fields as `device.newStateEvent`):
```json
{
  "states": [
    { "device_feature_external_id": "ext:open-meteo-demo:paris:temperature", "state": 21.5 },
    { "device_feature_external_id": "ext:open-meteo-demo:cam:text", "text": "hello" },
    { "device_feature_external_id": "ext:open-meteo-demo:paris:temperature", "state": 19.2, "created_at": "2026-07-12T10:00:00.000Z" }
  ]
}
```
→ `200 { "success": true }`. Numeric `state` **or** string `text`; optional `created_at` for a past state. Max 100 states/request; **rate limit: 300 states/minute per integration**, `429 TOO_MANY_REQUESTS` beyond (SQLite/DuckDB anti-spam). The threshold is sized for **state changes**, not full snapshots: an integration polling a large fleet (e.g. 50 Tuya devices × 6 features) must **deduplicate** and only publish what changed — a best practice to write in the developer docs (B.12). An unknown `device_feature_external_id` is silently ignored (standard `newStateEvent` behavior: the user has not created that device).

**`POST /api/integration/v1/camera/image`** — body `{ "device_external_id": "ext:tuya-demo:cam", "image": "image/jpg;base64,/9j/4AAQ..." }` → `200 { "success": true }`. Publishes a **camera's new image**: a device of the integration carrying a `camera`/`image` feature (`DEVICE_FEATURE_CATEGORIES.CAMERA` + `DEVICE_FEATURE_TYPES.CAMERA.IMAGE`, declared like any feature in `discovered_device`), mapped onto `gladys.device.camera.setImage` — same format as the internal camera services (`image/jpg;base64,<data>`, see `rtsp-camera/lib/getImage.js:95`), the dashboard's camera widget updates in real time. Limits: **≤ 150 KB** (the core's bound, `camera.setImage.js`), **12 images/minute per device** (one every 5 s — continuous video streaming is not in the v1 scope, see `camera.start-streaming` phase 2), `404` if the device does not belong to the integration, `400` if it has no camera feature. Images **never** go through `POST /state`: a dedicated `saveStringState` path, outside the state history and outside the states rate limit.

**`GET /api/integration/v1/config`** → `200 { "config": { "latitude": 48.85, "unit": "celsius", "api_key": "s3cr3t" } }` — all values, secrets included (it is the integration, not the frontend).

**`POST /api/integration/v1/config`** — body `{ "config": { "<key>": <value> } }`, partial merge → `200 { "success": true }`. Keys present in the `config_schema` are validated against it; keys outside the schema are the integration's **free internal storage** (pairing state, third-party tokens…), never displayed in the UI.

**Sub-container lifecycle** — all these routes only know the `containers[]` entries of **this** integration's manifest (the JWT sets the perimeter, as everywhere): `404 NOT_FOUND` for any other `:name`. No route allows creating an undeclared container. None of these deliberate gestures increments `failure_count`.

**`GET /api/integration/v1/container`** → `200`
```json
{
  "containers": [
    { "name": "mqtt", "status": "running", "desired": "running", "started_at": "2026-07-13T08:00:00.000Z", "ports": [] },
    { "name": "frigate", "status": "stopped", "desired": "stopped", "started_at": null,
      "ports": [{ "container_port": 5000, "protocol": "tcp", "host_port": 42115, "label": { "en": "Frigate UI" }, "name": "frigate_ui", "browsable": true }],
      "devices": [{ "class": "coral-usb", "granted": true, "available": true }] }
  ]
}
```
— the declared sub-containers, their Docker state, the desired state (B.2), the assigned host ports and, per requested hardware class, the granted/available state (this is how the integration knows what to put in its config — e.g. `edgetpu` vs `cpu` detector for Frigate); empty list if the integration declares none.

**`POST /api/integration/v1/container/:name/start`** — body `{}` or `{ "env": { "MQTT_PASSWORD": "..." } }` → `200 { "success": true }`. Creates the container if it does not exist yet, then starts it; it enters the "running" desired state (restarted by the supervisor if it crashes). The provided `env` is merged **on top of** the manifest's `env` (`GLADYS_*` keys forbidden → `400`) — it is the channel for values computed at runtime; if the `env` differs from the existing container's, the supervisor **recreates** it (destroy + create, the `/data` volumes persist) before starting it.

**`POST /api/integration/v1/container/:name/stop`** — body `{}` → `200 { "success": true }`. Stops the container and removes it from the desired state: the supervisor will not restart it.

**`POST /api/integration/v1/container/:name/restart`** — body `{}` → `200 { "success": true }`. Typical use: the integration has rewritten one of the sub-container's config files via `/data` (see B.2) and restarts it to apply.

**`POST /api/integration/v1/network/wake`** — body `{ "mac": "64:e4:d5:b4:12:66", "address": "255.255.255.255", "port": 9, "sourcePort": 0 }` → `200 { "success": true }`. Sends a standard Wake-on-LAN magic packet from the Gladys core network namespace. **Requires `network_wake: true` in the manifest** (shown on the install screen); otherwise the core returns `403 FORBIDDEN`.
* mac is required. Accepted formats: 64:e4:d5:b4:12:66, 64-e4-d5-b4-12-66, or 64E4D5B41266.
* address is optional and defaults to 255.255.255.255.
* port is optional and defaults to UDP destination port 9.
* sourcePort is optional and defaults to 0 (ephemeral UDP source port chosen by the operating system).
* The core always builds the standard fixed 102-byte Wake-on-LAN magic packet (6 × 0xFF followed by the target MAC repeated 16 times). The integration cannot provide an arbitrary UDP payload, so this endpoint is not a general UDP proxy.
* The emission rate is bounded to 1 wake per 2 seconds per integration (`429 RATE_LIMIT_EXCEEDED` otherwise) — enough for the usual "retry until the device wakes up" loop, not enough to flood from the core's network namespace.
* A successful send returns 200 { "success": true }. This confirms that the packet was emitted by Gladys, not that the target device actually woke up.
